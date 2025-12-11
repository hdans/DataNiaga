"""
Forecasting Service - LightGBM Segregated Models per Island (Production Ready)

Modul ini berisi logika untuk training dan prediksi forecast
menggunakan LightGBM (MultiOutputRegressor) dengan strategi:
1. Resampling & Interpolasi data mingguan (mengisi minggu kosong).
2. Log Transform untuk menstabilkan variansi.
3. Feature Engineering: Lags, Rolling Stats, Payday, & Category Embedding.
4. Forecasting horizon 10 minggu sekaligus.
"""

import pandas as pd
import numpy as np
from datetime import timedelta
from typing import List, Dict, Any
import warnings

# Library Machine Learning
from lightgbm import LGBMRegressor
from sklearn.multioutput import MultiOutputRegressor

warnings.filterwarnings('ignore')

# ==========================================
# CONFIGURATION
# ==========================================
FORECAST_WEEKS = 10  # Prediksi 10 minggu ke depan
LOOK_BACK = 4        # Input 4 minggu ke belakang

def is_payday_week(date):
    """Cek apakah tanggal berada di minggu gajian (tgl 25 - 5)."""
    day = date.day
    if day >= 25 or day <= 5: return 1
    return 0

def prepare_island_data(df: pd.DataFrame, pulau: str) -> pd.DataFrame:
    """
    Membersihkan data per pulau:
    Aggregasi Mingguan -> Pivot -> Resample (isi minggu bolong) -> Interpolate -> Stack
    """
    df_subset = df[df['PULAU'] == pulau].copy()
    if df_subset.empty:
        return pd.DataFrame()

    df_subset['InvoiceDate'] = pd.to_datetime(df_subset['InvoiceDate'])
    
    # Aggregasi Mingguan (Sum)
    df_grouped = df_subset.groupby([
        pd.Grouper(key='InvoiceDate', freq='W'), 
        'PULAU', 
        'PRODUCT_CATEGORY'
    ])['Quantity'].sum().reset_index()

    # Pivot -> Resample -> Interpolate -> Stack
    # Ini memastikan tidak ada minggu yang hilang (filled with 0 atau interpolasi)
    df_pivot = df_grouped.pivot(index='InvoiceDate', columns=['PULAU', 'PRODUCT_CATEGORY'], values='Quantity')
    df_pivot = df_pivot.resample('W').asfreq().interpolate(method='linear').fillna(0)
    
    df_stacked = df_pivot.stack(level=['PULAU', 'PRODUCT_CATEGORY']).reset_index()
    df_stacked.columns = ['InvoiceDate', 'PULAU', 'PRODUCT_CATEGORY', 'Quantity']
    
    return df_stacked

def train_forecast_model(df: pd.DataFrame, pulau: str) -> List[Dict[str, Any]]:
    """
    Training model forecast untuk satu pulau menggunakan LightGBM MultiOutput.
    
    Returns:
        List of forecast dictionaries (History + Future)
    """
    # 1. Preprocess Data
    island_data = prepare_island_data(df, pulau)
    if island_data.empty:
        return []

    forecasts = []
    
    # Feature Engineering Containers
    X_train_all = []
    y_train_all = []
    meta_train = [] # Untuk menyimpan kategori
    
    cats_in_pulau = island_data['PRODUCT_CATEGORY'].unique()
    
    # --- A. BUILD TRAINING SET (Windowing) ---
    for category in cats_in_pulau:
        sub_cat = island_data[island_data['PRODUCT_CATEGORY'] == category].sort_values('InvoiceDate')
        series = sub_cat['Quantity'].values
        
        # Log Transform (log1p)
        series_log = np.log1p(series)
        dates = sub_cat['InvoiceDate'].values
        
        # Masukkan data history (Actuals) ke output list
        # Kita masukkan data yang sudah di-clean (interpolated)
        for d, val in zip(dates, series):
            forecasts.append({
                'pulau': pulau,
                'product_category': category,
                'week': pd.to_datetime(d),
                'actual': float(val),
                'predicted': float(val), # Di history, predicted = actual (fitted)
                'is_forecast': 0
            })

        # Sliding Window untuk Training Data
        for i in range(LOOK_BACK, len(series_log) - FORECAST_WEEKS + 1):
            past_window = series_log[i-LOOK_BACK : i]
            future_window = series_log[i : i+FORECAST_WEEKS]
            
            if len(future_window) < FORECAST_WEEKS: continue
            
            feat_mean = np.mean(past_window)
            feat_std = np.std(past_window)
            
            target_date = pd.to_datetime(dates[i])
            feat_payday = is_payday_week(target_date)
            
            features = list(past_window) + [feat_mean, feat_std, feat_payday]
            
            X_train_all.append(features)
            y_train_all.append(future_window)
            meta_train.append(category)

    # Jika data terlalu sedikit untuk training
    if not X_train_all:
        return forecasts

    # Convert ke DataFrame untuk Training
    feat_cols = [f'Lag_{j}' for j in range(LOOK_BACK, 0, -1)] + ['Mean', 'Std', 'Is_Payday']
    X_df = pd.DataFrame(X_train_all, columns=feat_cols)
    
    # Handle Category Feature
    X_df['CATEGORY'] = pd.Categorical(meta_train, categories=cats_in_pulau)
    y_arr = np.array(y_train_all)

    # --- B. TRAINING MODEL ---
    # Menggunakan LGBMRegressor dibungkus MultiOutputRegressor
    # n_jobs=1 agar aman jika dijalankan parallel per pulau di luar
    lgbm = LGBMRegressor(n_estimators=1000, learning_rate=0.05, num_leaves=20, n_jobs=1, verbose=-1)
    model = MultiOutputRegressor(lgbm)
    model.fit(X_df, y_arr)

    # --- C. FORECASTING FUTURE ---
    future_start_date = island_data['InvoiceDate'].max() + timedelta(weeks=1)
    future_dates = pd.date_range(start=future_start_date, periods=FORECAST_WEEKS, freq='W')

    for category in cats_in_pulau:
        # Ambil window terakhir untuk prediksi
        sub_cat = island_data[island_data['PRODUCT_CATEGORY'] == category].sort_values('InvoiceDate')
        last_series = sub_cat['Quantity'].values[-LOOK_BACK:]
        last_series_log = np.log1p(last_series)
        
        # Buat fitur prediksi
        feat_mean = np.mean(last_series_log)
        feat_std = np.std(last_series_log)
        feat_payday = is_payday_week(future_dates[0]) # Payday status minggu depan pertama
        
        features = list(last_series_log) + [feat_mean, feat_std, feat_payday]
        
        # Siapkan input row
        input_row = pd.DataFrame([features], columns=feat_cols)
        input_row['CATEGORY'] = pd.Categorical([category], categories=cats_in_pulau)
        
        # Predict
        pred_log = model.predict(input_row)[0]
        pred_final = np.expm1(pred_log) # Inverse Log
        pred_final = np.maximum(pred_final, 0) # Pastikan tidak negatif
        
        # Append Future ke output list
        for d, val in zip(future_dates, pred_final):
            forecasts.append({
                'pulau': pulau,
                'product_category': category,
                'week': d,
                'actual': None,
                'predicted': round(float(val), 2),
                'is_forecast': 1
            })
            
    return forecasts

def run_all_forecasts(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Menjalankan forecasting untuk semua pulau.
    
    Args:
        df: DataFrame dengan data transaksi lengkap
    
    Returns:
        List of all forecast dictionaries
    """
    all_forecasts = []
    
    # Pastikan InvoiceDate datetime
    if not pd.api.types.is_datetime64_any_dtype(df['InvoiceDate']):
        df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])
        
    islands = df['PULAU'].unique()
    
    for pulau in islands:
        print(f"Training forecast model for: {pulau}")
        try:
            forecasts = train_forecast_model(df, pulau)
            all_forecasts.extend(forecasts)
            print(f"  Generated {len(forecasts)} records (History + Forecast)")
        except Exception as e:
            print(f"  Error training {pulau}: {str(e)}")
    
    return all_forecasts