"""Recommendation service generating DSS insights from forecast and MBA results"""

import pandas as pd
from typing import List, Dict, Any
from sqlalchemy.orm import Session


def to_title_case(text: str) -> str:
    """Convert text to title case with comma handling"""
    if not text:
        return ''
    parts = text.split(',')
    titled_parts = [' '.join(word.capitalize() for word in part.strip().lower().split()) for part in parts]
    return ', '.join(titled_parts)


def generate_recommendations(
    df: pd.DataFrame,
    forecasts: List[Dict[str, Any]],
    rules: List[Dict[str, Any]],
    db: Session = None
) -> List[Dict[str, Any]]:
    """Generate recommendations based on forecasts and MBA rules"""
    import traceback
    
    try:
        print("=== START RECOMMENDATIONS GENERATION PIPELINE ===")
        print(f"Input: {len(forecasts)} forecasts, {len(rules)} MBA rules")
        
        recommendations = []
        
        try:
            forecast_df = pd.DataFrame(forecasts)
            print(f"✓ Loaded {len(forecast_df)} forecast records")
        except Exception as e:
            print(f"❌ Error converting forecasts to DataFrame: {str(e)}")
            print(traceback.format_exc())
            return []
        
        if forecast_df.empty:
            print("⚠️ Warning: Empty forecast DataFrame")
            return recommendations
        
        # Filter future forecasts only
        try:
            future_forecasts = forecast_df[forecast_df['is_forecast'] == 1]
            print(f"✓ Filtered {len(future_forecasts)} future forecast records")
        except Exception as e:
            print(f"❌ Error filtering future forecasts: {str(e)}")
            print(traceback.format_exc())
            return recommendations
        
        if future_forecasts.empty:
            print("⚠️ Warning: No future forecasts found")
            return recommendations
        
        islands = future_forecasts['pulau'].unique()
        print(f"Processing {len(islands)} islands: {list(islands)}")
        
        for pulau in islands:
            try:
                print(f"\n  Processing pulau: {pulau}")
                pulau_forecasts = future_forecasts[future_forecasts['pulau'] == pulau]
                pulau_rules = [r for r in rules if r['pulau'] == pulau]
                print(f"    - {len(pulau_forecasts)} future forecasts, {len(pulau_rules)} rules")
                
                # Calculate average forecast per product
                try:
                    product_forecasts = pulau_forecasts.groupby('product_category')['predicted'].mean()
                    print(f"    - {len(product_forecasts)} unique products")
                except Exception as e:
                    print(f"    ❌ Error grouping forecasts: {str(e)}")
                    print(traceback.format_exc())
                    continue
                
                # Get historical average for comparison
                historical = forecast_df[
                    (forecast_df['pulau'] == pulau) & 
                    (forecast_df['is_forecast'] == 0)
                ]
                
                if not historical.empty:
                    historical_avg = historical.groupby('product_category')['actual'].mean()
                else:
                    historical_avg = product_forecasts * 0.9
                
                # === DERIVED DEMAND RECOMMENDATIONS ===
                # Products with increasing forecast
                for product in product_forecasts.index:
                    try:
                        forecast_val = product_forecasts.get(product, 0)
                        hist_val = historical_avg.get(product, forecast_val)
                        
                        if hist_val > 0:
                            growth_rate = (forecast_val - hist_val) / hist_val
                        else:
                            growth_rate = 0
                        
                        # If forecast is UP (growth > 10%), check MBA for related products
                        if growth_rate > 0.1:
                            for rule in pulau_rules:
                                if rule.get('antecedents') == product and rule.get('lift', 0) > 1.5:
                                    priority = 'high' if rule['lift'] > 2.0 else 'medium'
                                    # Calculate confidence from lift (normalized to 0-1)
                                    confidence = min(1.0, (rule['lift'] - 1.0) / 3.0 + 0.5)  # lift 1.0->0.5, lift 3.0->0.67, lift 5.0->1.0
                                    recommendations.append({
                                        'pulau': pulau,
                                        'type': 'derived_demand',
                                        'product': product,
                                        'related_product': rule['consequents'],
                                        'action': f"Tambah stok {to_title_case(rule['consequents'])} - "
                                                 f"sering dibeli bersama {to_title_case(product)} "
                                                 f"(lift: {rule['lift']:.2f})",
                                        'priority': priority,
                                        'confidence': confidence
                                    })
                    except Exception as e:
                        print(f"    ⚠️ Error processing product {product}: {str(e)}")
                        continue
                
                # === DEAD STOCK RECOMMENDATIONS ===
                # Products with low/declining forecast
                low_forecast_products = product_forecasts.nsmallest(5).index
                
                for product in low_forecast_products:
                    try:
                        forecast_val = product_forecasts.get(product, 0)
                        hist_val = historical_avg.get(product, forecast_val)
                        
                        if hist_val > 0:
                            decline_rate = (hist_val - forecast_val) / hist_val
                        else:
                            decline_rate = 0
                        
                        # If forecast is LOW or declining, suggest bundling
                        if forecast_val < product_forecasts.median() or decline_rate > 0.1:
                            for rule in pulau_rules:
                                if rule.get('consequents') == product and rule.get('confidence', 0) > 0.3:
                                    anchor = rule['antecedents']
                                    anchor_forecast = product_forecasts.get(anchor, 0)
                                    
                                    # Only suggest if anchor has good forecast
                                    if anchor_forecast > product_forecasts.median():
                                        # Use rule confidence directly if available
                                        confidence = rule.get('confidence', 0.75)
                                        recommendations.append({
                                            'pulau': pulau,
                                            'type': 'dead_stock',
                                            'product': product,
                                            'related_product': anchor,
                                            'action': f"Bundle {to_title_case(product)} dengan {to_title_case(anchor)} untuk penawaran - "
                                                     f"kepercayaan: {confidence:.0%}",
                                            'priority': 'medium' if decline_rate > 0.2 else 'low',
                                            'confidence': confidence
                                        })
                    except Exception as e:
                        print(f"    ⚠️ Error processing dead stock for {product}: {str(e)}")
                        continue
                
                print(f"    ✓ Generated {len([r for r in recommendations if r['pulau'] == pulau])} recommendations for {pulau}")
                
            except Exception as e:
                print(f"  ❌ Error processing island {pulau}: {str(e)}")
                print(traceback.format_exc())
                continue
        
        # Remove duplicates based on product + related_product
        try:
            seen = set()
            unique_recommendations = []
            for rec in recommendations:
                key = (rec['pulau'], rec['type'], rec['product'], rec.get('related_product'))
                if key not in seen:
                    seen.add(key)
                    unique_recommendations.append(rec)
            
            print(f"\n✓ Recommendations Generation complete: {len(unique_recommendations)} unique recommendations")
            return unique_recommendations
        except Exception as e:
            print(f"❌ Error removing duplicates: {str(e)}")
            print(traceback.format_exc())
            return recommendations
            
    except Exception as e:
        print(f"\n❌ FATAL ERROR in generate_recommendations: {str(e)}")
        print(traceback.format_exc())
        return []

def get_stockout_risks(forecasts: List[Dict[str, Any]], threshold: float = 0.8) -> int:
    """
    Hitung jumlah produk dengan risiko stockout tinggi.
    
    Args:
        forecasts: List hasil forecasting
        threshold: Threshold untuk menentukan risiko tinggi
    
    Returns:
        Jumlah produk dengan risiko stockout
    """
    forecast_df = pd.DataFrame(forecasts)
    
    if forecast_df.empty:
        return 0
    
    future = forecast_df[forecast_df['is_forecast'] == 1]
    historical = forecast_df[forecast_df['is_forecast'] == 0]
    
    if future.empty or historical.empty:
        return 0
    
    future_avg = future.groupby(['pulau', 'product_category'])['predicted'].mean()
    hist_avg = historical.groupby(['pulau', 'product_category'])['actual'].mean()
    
    # Products where forecast > historical * threshold
    risks = 0
    for idx in future_avg.index:
        if idx in hist_avg.index:
            if future_avg[idx] > hist_avg[idx] * (1 + threshold):
                risks += 1
    
    return risks


def get_bundling_opportunities(rules: List[Dict[str, Any]], min_lift: float = 1.5) -> int:
    """
    Hitung jumlah peluang bundling dari MBA rules.
    
    Args:
        rules: List MBA rules
        min_lift: Minimum lift untuk dianggap sebagai peluang
    
    Returns:
        Jumlah peluang bundling
    """
    return len([r for r in rules if r.get('lift', 0) >= min_lift])
