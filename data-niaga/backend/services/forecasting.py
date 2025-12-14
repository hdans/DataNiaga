"""
Forecasting Service - LightGBM Segregated Models (With Metrics)

Updates:
- Returns MAE and MAPE scores per Category/Island.
- Calculates in-sample error (Training Error) for evaluation.
- Returns structured dictionary: {'forecast_data': [...], 'model_metrics': [...]}
"""

import pandas as pd
import numpy as np
from datetime import timedelta
from typing import List, Dict, Any, Tuple
import warnings

# Library Machine Learning
from lightgbm import LGBMRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error

warnings.filterwarnings('ignore')

# ==========================================
# CONFIGURATION
# ==========================================
FORECAST_WEEKS = 10
LOOK_BACK = 4

def is_payday_week(date):
    day = date.day
    if day >= 25 or day <= 5: return 1
    return 0

def prepare_island_data(df: pd.DataFrame, pulau: str) -> pd.DataFrame:
    df_subset = df[df['PULAU'] == pulau].copy()
    if df_subset.empty:
        return pd.DataFrame()

    df_subset['InvoiceDate'] = pd.to_datetime(df_subset['InvoiceDate'])
    
    df_grouped = df_subset.groupby([
        pd.Grouper(key='InvoiceDate', freq='W'), 
        'PULAU', 
        'PRODUCT_CATEGORY'
    ])['Quantity'].sum().reset_index()

    df_pivot = df_grouped.pivot(index='InvoiceDate', columns=['PULAU', 'PRODUCT_CATEGORY'], values='Quantity')
    df_pivot = df_pivot.resample('W').asfreq().interpolate(method='linear').fillna(0)
    
    df_stacked = df_pivot.stack(level=['PULAU', 'PRODUCT_CATEGORY']).reset_index()
    df_stacked.columns = ['InvoiceDate', 'PULAU', 'PRODUCT_CATEGORY', 'Quantity']
    
    return df_stacked

def train_forecast_model(df: pd.DataFrame, pulau: str) -> Tuple[List[Dict], List[Dict]]:
    """
    Returns:
        (forecasts_list, metrics_list)
    """
    island_data = prepare_island_data(df, pulau)
    if island_data.empty:
        return [], []

    forecasts = []
    metrics = []
    
    X_train_all = []
    y_train_all = []
    meta_train = [] 
    
    cats_in_pulau = island_data['PRODUCT_CATEGORY'].unique()
    
    # --- A. BUILD TRAINING SET ---
    for category in cats_in_pulau:
        sub_cat = island_data[island_data['PRODUCT_CATEGORY'] == category].sort_values('InvoiceDate')
        series = sub_cat['Quantity'].values
        dates = sub_cat['InvoiceDate'].values
        
        # History Data untuk Output
        for d, val in zip(dates, series):
            forecasts.append({
                'pulau': pulau,
                'product_category': category,
                'week': pd.to_datetime(d),
                'actual': float(val),
                'predicted': float(val), # Default fit
                'is_forecast': 0
            })

        series_log = np.log1p(series)
        
        # Sliding Window
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

    if not X_train_all:
        # Not enough training samples to fit a model. Produce simple fallback
        # forecasts per category using a naive method (mean of last available values).
        future_start_date = island_data['InvoiceDate'].max() + timedelta(weeks=1)
        future_dates = pd.date_range(start=future_start_date, periods=FORECAST_WEEKS, freq='W')

        for category in cats_in_pulau:
            sub_cat = island_data[island_data['PRODUCT_CATEGORY'] == category].sort_values('InvoiceDate')
            series = sub_cat['Quantity'].values
            if len(series) == 0:
                # no data to base a forecast on
                continue

            # Use the mean of the last LOOK_BACK values if available, otherwise mean of all
            last_vals = series[-LOOK_BACK:] if len(series) >= 1 else series
            naive_pred = float(np.mean(last_vals)) if len(last_vals) > 0 else 0.0
            naive_pred = max(naive_pred, 0.0)

            for d in future_dates:
                forecasts.append({
                    'pulau': pulau,
                    'product_category': category,
                    'week': d,
                    'actual': None,
                    'predicted': round(float(naive_pred), 2),
                    'is_forecast': 1
                })

        return forecasts, metrics

    # --- B. TRAINING ---
    feat_cols = [f'Lag_{j}' for j in range(LOOK_BACK, 0, -1)] + ['Mean', 'Std', 'Is_Payday']
    X_df = pd.DataFrame(X_train_all, columns=feat_cols)
    X_df['CATEGORY'] = pd.Categorical(meta_train, categories=cats_in_pulau)
    y_arr = np.array(y_train_all)

    lgbm = LGBMRegressor(n_estimators=1000, learning_rate=0.05, num_leaves=20, n_jobs=1, verbose=-1)
    model = MultiOutputRegressor(lgbm)
    model.fit(X_df, y_arr)

    # --- C. CALCULATE METRICS (IN-SAMPLE) ---
    # Prediksi ulang data training untuk melihat seberapa baik model "belajar"
    y_pred_log_train = model.predict(X_df)
    y_pred_train = np.expm1(y_pred_log_train)
    y_true_train = np.expm1(y_arr)

    # Hitung error per kategori
    # Kita harus map balik index X_df ke kategori
    for cat in cats_in_pulau:
        # Ambil index baris yang sesuai kategori ini
        indices = [i for i, x in enumerate(meta_train) if x == cat]
        
        if not indices:
            continue
            
        y_true_cat = y_true_train[indices].flatten()
        y_pred_cat = y_pred_train[indices].flatten()
        
        # Hitung Metrics
        mae = mean_absolute_error(y_true_cat, y_pred_cat)
        
        # Safe MAPE (handle division by zero)
        mask = y_true_cat != 0
        if np.sum(mask) > 0:
            mape = np.mean(np.abs((y_true_cat[mask] - y_pred_cat[mask]) / y_true_cat[mask]))
        else:
            mape = 0.0
            
        metrics.append({
            'pulau': pulau,
            'product_category': cat,
            'mae': round(float(mae), 2),
            'mape': round(float(mape * 100), 2), # Dalam Persen
            'sample_size': len(indices)
        })

    # --- D. FORECASTING FUTURE ---
    future_start_date = island_data['InvoiceDate'].max() + timedelta(weeks=1)
    future_dates = pd.date_range(start=future_start_date, periods=FORECAST_WEEKS, freq='W')

    for category in cats_in_pulau:
        sub_cat = island_data[island_data['PRODUCT_CATEGORY'] == category].sort_values('InvoiceDate')
        last_series = sub_cat['Quantity'].values[-LOOK_BACK:]
        last_series_log = np.log1p(last_series)
        
        feat_mean = np.mean(last_series_log)
        feat_std = np.std(last_series_log)
        feat_payday = is_payday_week(future_dates[0])
        
        features = list(last_series_log) + [feat_mean, feat_std, feat_payday]
        
        input_row = pd.DataFrame([features], columns=feat_cols)
        input_row['CATEGORY'] = pd.Categorical([category], categories=cats_in_pulau)
        
        pred_log = model.predict(input_row)[0]
        pred_final = np.expm1(pred_log)
        pred_final = np.maximum(pred_final, 0)
        
        for d, val in zip(future_dates, pred_final):
            forecasts.append({
                'pulau': pulau,
                'product_category': category,
                'week': d,
                'actual': None,
                'predicted': round(float(val), 2),
                'is_forecast': 1
            })
            
    return forecasts, metrics

def run_all_forecasts(df: pd.DataFrame) -> Dict[str, List[Any]]:
    """
    Returns Dictionary:
    {
        'forecast_data': [...], # Data untuk grafik
        'model_metrics': [...]  # Data untuk tabel akurasi
    }
    """
    import traceback
    all_forecasts = []
    all_metrics = []
    
    try:
        if not pd.api.types.is_datetime64_any_dtype(df['InvoiceDate']):
            df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])
            
        islands = df['PULAU'].unique()
        print(f"Found {len(islands)} islands: {islands}")
        
        for pulau in islands:
            print(f"Training forecast model for: {pulau}")
            try:
                forecasts, metrics = train_forecast_model(df, pulau)
                all_forecasts.extend(forecasts)
                all_metrics.extend(metrics)
                print(f"  Generated {len(forecasts)} records & {len(metrics)} metrics")
            except Exception as e:
                print(f"  Error training {pulau}: {str(e)}")
                print(f"  Traceback: {traceback.format_exc()}")
                raise
    except Exception as e:
        print(f"Critical error in run_all_forecasts: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise
    
    return {
        "forecast_data": all_forecasts,
        "model_metrics": all_metrics
    }