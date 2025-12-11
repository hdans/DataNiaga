"""
Market Basket Analysis Service - FP-Growth (Optimized)

Modul ini berisi logika untuk menjalankan Market Basket Analysis
menggunakan algoritma FP-Growth (via mlxtend) yang lebih efisien memori
dibandingkan Apriori.

Fitur Utama:
1. Preprocessing ketat (Hapus duplikat, spasi, validasi Invoice).
2. Optimasi Memori: Pruning item jarang (<5 transaksi) & Boolean Matrix.
3. FP-Growth Algorithm untuk performa cepat.
"""

import pandas as pd
import warnings
from typing import List, Dict, Any

# Library MBA
from mlxtend.frequent_patterns import fpgrowth, association_rules

warnings.filterwarnings('ignore')

def clean_data_for_mba(df: pd.DataFrame) -> pd.DataFrame:
    """
    Membersihkan data transaksi sebelum proses MBA.
    """
    df_clean = df.copy()
    
    # 1. Pastikan InvoiceNo string dan valid
    df_clean.dropna(axis=0, subset=['InvoiceNo'], inplace=True)
    df_clean['InvoiceNo'] = df_clean['InvoiceNo'].astype(str)
    
    # 2. Hapus transaksi return/negatif
    df_clean = df_clean[df_clean['Quantity'] > 0]
    
    # 3. Bersihkan spasi di nama produk
    df_clean['PRODUCT_CATEGORY'] = df_clean['PRODUCT_CATEGORY'].astype(str).str.strip()
    
    return df_clean

def run_market_basket_analysis(
    df: pd.DataFrame, 
    pulau: str, 
    min_support: float = 0.1,
    min_lift: float = 2.0,
    min_item_occurence: int = 5
) -> List[Dict[str, Any]]:
    """
    Menjalankan MBA untuk satu pulau menggunakan FP-Growth.
    
    Args:
        min_item_occurence: Barang yg muncul kurang dari x kali akan dibuang (Optimasi RAM).
    """
    print(f"\n🛒 Memproses Market Basket: {pulau}...")
    
    # A. Filter Data per Pulau
    island_data = df[df['PULAU'] == pulau].copy()
    
    if island_data.empty:
        print("   -> Data kosong.")
        return []

    # --- OPTIMASI MEMORI 1: PRUNING BARANG JARANG LAKU ---
    # Membuang item yang total kemunculannya sedikit sebelum masuk matriks
    item_counts = island_data['PRODUCT_CATEGORY'].value_counts()
    valid_items = item_counts[item_counts >= min_item_occurence].index
    island_data = island_data[island_data['PRODUCT_CATEGORY'].isin(valid_items)]

    if island_data.empty:
        print(f"   -> Data kosong setelah pruning item < {min_item_occurence} transaksi.")
        return []

    # B. Membuat Basket (Pivot Table)
    # Pivot table lebih stabil memorinya daripada groupby().unstack()
    basket = island_data.pivot_table(
        index='InvoiceNo', 
        columns='PRODUCT_CATEGORY', 
        values='Quantity', 
        aggfunc='sum'
    ).fillna(0)

    # --- OPTIMASI MEMORI 2: UBAH KE BOOLEAN ---
    # Mengubah angka menjadi True/False (1 bit) vs Int64/Float (64 bit)
    basket_sets = basket.applymap(lambda x: True if x > 0 else False)

    # Hapus item 'POSTAGE' jika ada (biasanya pengotor)
    if 'POSTAGE' in basket_sets.columns:
        basket_sets.drop('POSTAGE', inplace=True, axis=1)

    print(f"   -> Dimensi Matrix: {basket_sets.shape}")

    # C. Algoritma FP-GROWTH
    try:
        frequent_itemsets = fpgrowth(basket_sets, min_support=min_support, use_colnames=True)
    except MemoryError:
        print("   ❌ Memory Error saat FP-Growth. Coba naikkan min_support.")
        return []
    except Exception as e:
        print(f"   ❌ Error saat FP-Growth: {str(e)}")
        return []

    if frequent_itemsets.empty:
        print("   -> Tidak ada itemset yang memenuhi support.")
        return []

    # D. Generate Association Rules
    try:
        rules_df = association_rules(frequent_itemsets, metric="lift", min_threshold=min_lift)
    except ValueError:
        print("   -> Gagal generate rules (mungkin data terlalu sedikit).")
        return []

    if rules_df.empty:
        print("   -> Tidak ada rules yang memenuhi threshold lift.")
        return []

    # E. Formatting Output
    # Sort by Lift -> Confidence
    rules_df = rules_df.sort_values(['lift', 'confidence'], ascending=[False, False])
    
    # Konversi frozenset ke string clean
    rules_df['antecedents'] = rules_df['antecedents'].apply(lambda x: ', '.join(list(x)))
    rules_df['consequents'] = rules_df['consequents'].apply(lambda x: ', '.join(list(x)))

    # Convert to List of Dicts
    rules_list = []
    for _, row in rules_df.iterrows():
        rules_list.append({
            'pulau': pulau,
            'antecedents': row['antecedents'],
            'consequents': row['consequents'],
            'support': round(row['support'], 4),
            'confidence': round(row['confidence'], 4),
            'lift': round(row['lift'], 4)
        })

    print(f"   -> Ditemukan {len(rules_list)} rules.")
    return rules_list # Mengembalikan max 100 rules terbaik jika mau dibatasi: rules_list[:100]


def run_all_mba(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Menjalankan MBA untuk semua pulau dengan Data Preprocessing terpusat.
    """
    print("=== START MARKET BASKET ANALYSIS PIPELINE ===")
    
    # 1. Global Cleaning
    df_clean = clean_data_for_mba(df)
    print(f"Total Transaksi Bersih: {len(df_clean)}")
    
    all_rules = []
    islands = df_clean['PULAU'].unique()
    
    # Konfigurasi Threshold
    # Diset agak longgar agar dapat hasil dulu, nanti bisa difilter di dashboard
    MIN_SUPPORT = 0.1  # 10% Support (Sesuaikan dengan volume data)
    MIN_LIFT = 2.0
    
    for pulau in islands:
        rules = run_market_basket_analysis(
            df_clean, 
            pulau, 
            min_support=MIN_SUPPORT, 
            min_lift=MIN_LIFT
        )
        all_rules.extend(rules)
    
    # Global Summary
    if all_rules:
        df_res = pd.DataFrame(all_rules)
        print("\n=== TOP 10 RULES TERKUAT (GLOBAL) ===")
        print(df_res[['pulau', 'antecedents', 'consequents', 'confidence', 'lift']]
              .sort_values(by='lift', ascending=False)
              .head(10)
              .to_string(index=False))
    else:
        print("\n❌ Tidak ada rules ditemukan sama sekali.")
        
    return all_rules