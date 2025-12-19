"""Market Basket Analysis using FP-Growth algorithm with memory optimization"""

import pandas as pd
import warnings
from typing import List, Dict, Any

from mlxtend.frequent_patterns import fpgrowth, association_rules

warnings.filterwarnings('ignore')


def clean_data_for_mba(df: pd.DataFrame) -> pd.DataFrame:
    """Clean transaction data for MBA processing"""
    df_clean = df.copy()
    
    df_clean.dropna(axis=0, subset=['InvoiceNo'], inplace=True)
    df_clean['InvoiceNo'] = df_clean['InvoiceNo'].astype(str)
    
    df_clean = df_clean[df_clean['Quantity'] > 0]
    
    df_clean['PRODUCT_CATEGORY'] = df_clean['PRODUCT_CATEGORY'].astype(str).str.strip()
    
    return df_clean

def run_market_basket_analysis(
    df: pd.DataFrame, 
    pulau: str, 
    min_support: float = 0.1,
    min_lift: float = 2.0,
    min_item_occurence: int = 5
) -> List[Dict[str, Any]]:
    """Run FP-Growth MBA for single island"""
    print(f"\nProcessing Market Basket: {pulau}...")
    
    island_data = df[df['PULAU'] == pulau].copy()
    
    if island_data.empty:
        print("   -> No data found.")
        return []

    item_counts = island_data['PRODUCT_CATEGORY'].value_counts()
    valid_items = item_counts[item_counts >= min_item_occurence].index
    island_data = island_data[island_data['PRODUCT_CATEGORY'].isin(valid_items)]

    if island_data.empty:
        print(f"   -> No data after pruning items with < {min_item_occurence} transactions.")
        return []

    basket = island_data.pivot_table(
        index='InvoiceNo', 
        columns='PRODUCT_CATEGORY', 
        values='Quantity', 
        aggfunc='sum'
    ).fillna(0)

    basket_sets = basket.applymap(lambda x: True if x > 0 else False)

    if 'POSTAGE' in basket_sets.columns:
        basket_sets.drop('POSTAGE', inplace=True, axis=1)

    print(f"   -> Matrix shape: {basket_sets.shape}")

    try:
        frequent_itemsets = fpgrowth(basket_sets, min_support=min_support, use_colnames=True)
    except MemoryError:
        print("   Error: Memory overflow in FP-Growth. Increase min_support.")
        return []
    except Exception as e:
        print(f"   Error in FP-Growth: {str(e)}")
        return []

    if frequent_itemsets.empty:
        print("   -> No itemsets meet support threshold.")
        return []

    try:
        rules_df = association_rules(frequent_itemsets, metric="lift", min_threshold=min_lift)
    except ValueError:
        print("   -> Failed to generate rules.")
        return []

    if rules_df.empty:
        print("   -> No rules meet lift threshold.")
        return []

    rules_df = rules_df.sort_values(['lift', 'confidence'], ascending=[False, False])
    
    rules_df['antecedents'] = rules_df['antecedents'].apply(lambda x: ', '.join(list(x)))
    rules_df['consequents'] = rules_df['consequents'].apply(lambda x: ', '.join(list(x)))

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

    print(f"   -> Found {len(rules_list)} rules.")
    return rules_list


def run_all_mba(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Run MBA for all islands with centralized data preprocessing"""
    import traceback
    
    try:
        print("=== START MARKET BASKET ANALYSIS PIPELINE ===")
        
        try:
            df_clean = clean_data_for_mba(df)
            print(f"Total Clean Transactions: {len(df_clean)}")
        except Exception as e:
            print(f"Error during data cleaning: {str(e)}")
            print(traceback.format_exc())
            raise
        
        all_rules = []
        islands = df_clean['PULAU'].unique()
        print(f"Processing {len(islands)} islands: {list(islands)}")
        
        MIN_SUPPORT = 0.1
        MIN_LIFT = 2.0
        
        for pulau in islands:
            try:
                print(f"\nProcessing island: {pulau}")
                rules = run_market_basket_analysis(
                    df_clean, 
                    pulau, 
                    min_support=MIN_SUPPORT, 
                    min_lift=MIN_LIFT
                )
                print(f"  Generated {len(rules)} rules for {pulau}")
                all_rules.extend(rules)
            except Exception as e:
                print(f"Error processing island {pulau}: {str(e)}")
                print(traceback.format_exc())
                raise
        
        if all_rules:
            df_res = pd.DataFrame(all_rules)
            print("\n=== TOP 10 RULES (GLOBAL) ===")
            print(df_res[['pulau', 'antecedents', 'consequents', 'confidence', 'lift']]
                  .sort_values(by='lift', ascending=False)
                  .head(10)
                  .to_string(index=False))
            print(f"\nMBA Pipeline complete: {len(all_rules)} total rules generated")
        else:
            print("\nWarning: No rules generated from any island")
            
        return all_rules
        
    except Exception as e:
        print(f"\nFATAL ERROR in run_all_mba: {str(e)}")
        print(traceback.format_exc())
        raise