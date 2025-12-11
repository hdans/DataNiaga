"""
Recommendation Service - DSS Logic

Modul ini berisi logika Decision Support System untuk menghasilkan
rekomendasi berdasarkan hasil forecast dan MBA rules.
"""

import pandas as pd
from typing import List, Dict, Any
from sqlalchemy.orm import Session


def generate_recommendations(
    df: pd.DataFrame,
    forecasts: List[Dict[str, Any]],
    rules: List[Dict[str, Any]],
    db: Session = None
) -> List[Dict[str, Any]]:
    """
    Generate DSS recommendations berdasarkan forecast + MBA.
    
    Logika:
    1. Derived Demand: Jika produk A (Anchor) forecast naik, 
       cek MBA rules, sarankan stok produk B (Complement)
    2. Dead Stock: Jika produk X forecast turun,
       cek MBA rules, sarankan bundling dengan anchor kuat
    
    Args:
        df: DataFrame dengan data transaksi original
        forecasts: List hasil forecasting
        rules: List MBA rules
        db: Database session (optional)
    
    Returns:
        List of recommendation dictionaries
    """
    recommendations = []
    forecast_df = pd.DataFrame(forecasts)
    
    if forecast_df.empty:
        return recommendations
    
    # Filter future forecasts only
    future_forecasts = forecast_df[forecast_df['is_forecast'] == 1]
    
    if future_forecasts.empty:
        return recommendations
    
    islands = future_forecasts['pulau'].unique()
    
    for pulau in islands:
        pulau_forecasts = future_forecasts[future_forecasts['pulau'] == pulau]
        pulau_rules = [r for r in rules if r['pulau'] == pulau]
        
        # Calculate average forecast per product
        product_forecasts = pulau_forecasts.groupby('product_category')['predicted'].mean()
        
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
            forecast_val = product_forecasts.get(product, 0)
            hist_val = historical_avg.get(product, forecast_val)
            
            if hist_val > 0:
                growth_rate = (forecast_val - hist_val) / hist_val
            else:
                growth_rate = 0
            
            # If forecast is UP (growth > 10%), check MBA for related products
            if growth_rate > 0.1:
                for rule in pulau_rules:
                    if rule['antecedents'] == product and rule['lift'] > 1.5:
                        priority = 'high' if rule['lift'] > 2.0 else 'medium'
                        recommendations.append({
                            'pulau': pulau,
                            'type': 'derived_demand',
                            'product': product,
                            'related_product': rule['consequents'],
                            'action': f"Increase stock of {rule['consequents']} - "
                                     f"frequently bought with {product} "
                                     f"(lift: {rule['lift']:.2f})",
                            'priority': priority
                        })
        
        # === DEAD STOCK RECOMMENDATIONS ===
        # Products with low/declining forecast
        low_forecast_products = product_forecasts.nsmallest(5).index
        
        for product in low_forecast_products:
            forecast_val = product_forecasts.get(product, 0)
            hist_val = historical_avg.get(product, forecast_val)
            
            if hist_val > 0:
                decline_rate = (hist_val - forecast_val) / hist_val
            else:
                decline_rate = 0
            
            # If forecast is LOW or declining, suggest bundling
            if forecast_val < product_forecasts.median() or decline_rate > 0.1:
                for rule in pulau_rules:
                    if rule['consequents'] == product and rule['confidence'] > 0.3:
                        anchor = rule['antecedents']
                        anchor_forecast = product_forecasts.get(anchor, 0)
                        
                        # Only suggest if anchor has good forecast
                        if anchor_forecast > product_forecasts.median():
                            recommendations.append({
                                'pulau': pulau,
                                'type': 'dead_stock',
                                'product': product,
                                'related_product': anchor,
                                'action': f"Bundle {product} with {anchor} for clearance - "
                                         f"confidence: {rule['confidence']:.0%}",
                                'priority': 'medium' if decline_rate > 0.2 else 'low'
                            })
    
    # Remove duplicates based on product + related_product
    seen = set()
    unique_recommendations = []
    for rec in recommendations:
        key = (rec['pulau'], rec['type'], rec['product'], rec.get('related_product'))
        if key not in seen:
            seen.add(key)
            unique_recommendations.append(rec)
    
    return unique_recommendations


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
