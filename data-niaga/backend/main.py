"""
DataNiaga FastAPI Backend
=========================

Main application file untuk Retail Decision Support System.
Endpoints untuk upload data, forecasting, MBA, dan recommendations.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, text
import pandas as pd
from io import BytesIO
from datetime import datetime
from typing import Optional, List

from database import engine, get_db, Base
from models import Forecast, MBARule, Recommendation, UserSession, ModelMetric
from schemas import (
    UserCreate, UserResponse, ForecastResponse, MBARuleResponse, 
    RecommendationResponse, DashboardSummary, UploadResponse
)
from services.forecasting import run_all_forecasts
from services.mba import run_all_mba
from services.recommendations import (
    generate_recommendations, 
    get_stockout_risks, 
    get_bundling_opportunities
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Ensure new columns exist (lightweight migration for SQLite)
with engine.connect() as conn:
    try:
        result = conn.execute(text("PRAGMA table_info('recommendations')"))
        cols = [row[1] for row in result]
        if 'confidence' not in cols:
            conn.execute(text("ALTER TABLE recommendations ADD COLUMN confidence FLOAT DEFAULT 0.85"))
            conn.commit()
    except Exception:
        # If pragma/alter fails, continue without crashing startup
        pass

# Initialize FastAPI app
app = FastAPI(
    title="DataNiaga API",
    description="Retail Decision Support System - AI-powered forecasting and recommendations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for React frontend - MUST be first middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"  # Allow all in development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Required columns for data validation
REQUIRED_COLUMNS = ['InvoiceNo', 'InvoiceDate', 'PULAU', 'PRODUCT_CATEGORY', 'Quantity']


def validate_dataframe(df: pd.DataFrame) -> None:
    """
    Validate that required columns exist in uploaded DataFrame.
    
    Args:
        df: Uploaded DataFrame
        
    Raises:
        HTTPException: If required columns are missing
    """
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400, 
            detail=f"Missing required columns: {', '.join(missing)}"
        )


# ============================================
# UPLOAD & PROCESSING ENDPOINTS
# ============================================

@app.post("/api/upload-data", response_model=UploadResponse)
async def upload_data(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    """
    Upload and process sales data file.
    
    Accepts CSV or Excel files with required columns:
    - InvoiceNo, InvoiceDate, PULAU, PRODUCT_CATEGORY, Quantity
    
    Triggers ML pipeline:
    1. Data validation
    2. Forecasting (LightGBM per island)
    3. Market Basket Analysis (FP-Growth)
    4. Recommendation generation
    """
    try:
        # Read uploaded file
        content = await file.read()
        
        try:
            if file.filename.endswith('.csv'):
                df = pd.read_csv(BytesIO(content))
            elif file.filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(BytesIO(content))
            else:
                raise HTTPException(
                    status_code=400, 
                    detail="File must be CSV (.csv) or Excel (.xlsx, .xls)"
                )
        except Exception as e:
            raise HTTPException(
                status_code=400, 
                detail=f"Error reading file: {str(e)}"
            )
        
        # Validate columns
        validate_dataframe(df)
        
        # Clear existing data
        try:
            db.query(Forecast).delete()
            db.query(MBARule).delete()
            db.query(Recommendation).delete()
            db.query(ModelMetric).delete()
            db.commit()
        except Exception as e:
            print(f"Warning: Error clearing existing data: {e}")
            db.rollback()
        
        # Run forecasting pipeline
        print("Starting forecasting pipeline...")
        try:
            forecast_result = run_all_forecasts(df)
            forecast_records = forecast_result.get('forecast_data', []) if isinstance(forecast_result, dict) else (forecast_result or [])
            model_metrics = forecast_result.get('model_metrics', []) if isinstance(forecast_result, dict) else []
        except Exception as e:
            print(f"Error in forecasting pipeline: {e}")
            raise HTTPException(status_code=500, detail=f"Forecasting pipeline failed: {str(e)}")

        # Persist forecasts (list of dicts)
        try:
            for f in forecast_records:
                try:
                    if isinstance(f.get('week'), str):
                        f['week'] = datetime.fromisoformat(f['week'])
                except Exception:
                    pass
                db.add(Forecast(**f))
            print(f"Added {len(forecast_records)} forecast records")
        except Exception as e:
            print(f"Error persisting forecasts: {e}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Error saving forecast data: {str(e)}")

        # Persist model metrics into DB (if any)
        persisted_metrics = []
        try:
            for m in model_metrics:
                try:
                    pulau_norm = str(m.get('pulau') or '').strip().lower()
                    product_norm = str(m.get('product_category') or '').strip().lower()

                    metric_row = ModelMetric(
                        pulau=pulau_norm,
                        product_category=product_norm,
                        mae=float(m.get('mae') or 0.0),
                        mape=float(m.get('mape') or 0.0),
                        sample_size=int(m.get('sample_size') or 0)
                    )
                    db.add(metric_row)
                    persisted_metrics.append(metric_row)
                except Exception as e:
                    print(f"Warning: Error persisting metric: {e}")
                    continue
            print(f"Added {len(persisted_metrics)} metric entries")
        except Exception as e:
            print(f"Error in metrics persistence: {e}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Error saving model metrics: {str(e)}")
        
        # Run MBA pipeline
        print("Starting MBA pipeline...")
        try:
            rules = run_all_mba(df)
            for r in rules:
                db.add(MBARule(**r))
            print(f"Added {len(rules)} MBA rules")
        except Exception as e:
            print(f"Error in MBA pipeline: {e}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"MBA pipeline failed: {str(e)}")
        
        # Generate recommendations
        print("Generating recommendations...")
        try:
            recommendations = generate_recommendations(df, forecast_records, rules)
            for rec in recommendations:
                db.add(Recommendation(**rec))
            print(f"Added {len(recommendations)} recommendations")
        except Exception as e:
            print(f"Error generating recommendations: {e}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")
        
        # Final commit
        try:
            db.commit()
            print("Data processing completed successfully")
        except Exception as e:
            print(f"Error committing transaction: {e}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database commit failed: {str(e)}")
        
        return UploadResponse(
            status="success",
            message="Data processed successfully",
            records=len(df)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Unexpected error in upload_data: {str(e)}")
        print(f"Traceback: {error_trace}")
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Processing failed: {str(e)} - Check backend logs for details"
        )


# ============================================
# USER ENDPOINTS
# ============================================

@app.post("/api/user", response_model=UserResponse)
async def create_user(
    user: UserCreate, 
    db: Session = Depends(get_db)
):
    """Save user session information."""
    db_user = UserSession(
        name=user.name,
        role=user.role,
        company=user.company,
        created_at=datetime.now()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserResponse(status="success", user_id=db_user.id)


# ============================================
# DASHBOARD ENDPOINTS
# ============================================

@app.get("/api/dashboard/summary", response_model=DashboardSummary)
async def get_dashboard_summary(db: Session = Depends(get_db)):
    """Get dashboard summary metrics."""
    all_forecasts = db.query(Forecast).all()
    future_forecasts = db.query(Forecast).filter(Forecast.is_forecast == 1).all()
    recommendations = db.query(Recommendation).all()
    rules = db.query(MBARule).all()
    
    # Calculate total products and islands from future forecasts
    total_products = len(set(f.product_category for f in future_forecasts)) if future_forecasts else 0
    total_islands = len(set(f.pulau for f in future_forecasts)) if future_forecasts else 0
    
    # Stockout risks: count products with low forecast (predicted < 20% of historical average)
    stockout_risks = 0
    if all_forecasts:
        historical = [f for f in all_forecasts if f.is_forecast == 0]
        future = [f for f in all_forecasts if f.is_forecast == 1]
        
        if historical:
            # Group historical by product for average
            hist_avg = {}
            for h in historical:
                key = (h.product_category, h.pulau)
                if key not in hist_avg:
                    hist_avg[key] = []
                if h.actual:
                    hist_avg[key].append(h.actual)
            
            # Count future forecasts below threshold
            for f in future:
                key = (f.product_category, f.pulau)
                if key in hist_avg:
                    avg = sum(hist_avg[key]) / len(hist_avg[key])
                    if f.predicted and avg > 0 and f.predicted < avg * 0.2:
                        stockout_risks += 1
    
    # Opportunities: count dead_stock recommendations or low-moving products
    opportunities = len([r for r in recommendations if r.type == 'dead_stock'])
    
    # Calculate forecast accuracy (simplified MAPE)
    historical = [f for f in all_forecasts if f.is_forecast == 0]
    if historical:
        errors = []
        for h in historical:
            if h.actual and h.actual > 0 and h.predicted:
                error = abs(h.actual - h.predicted) / h.actual
                errors.append(error)
        mape = sum(errors) / len(errors) if errors else 0
        accuracy = max(0, min(100, (1 - mape) * 100))
    else:
        accuracy = 87.5  # Default
    
    return DashboardSummary(
        total_products=total_products,
        total_islands=total_islands,
        stockout_risks=stockout_risks,
        opportunities=opportunities,
        forecast_accuracy=round(accuracy, 1)
    )


@app.get("/api/training-metadata")
async def get_training_metadata(db: Session = Depends(get_db)):
    """Get model training metadata."""
    try:
        # Count total forecast records (as proxy for training volume)
        total_trained = db.query(Forecast).filter(Forecast.is_forecast == 0).count()
        
        return {
            "last_trained": datetime.now().isoformat(),
            "total_records_trained": total_trained,
            "model_version": "LightGBM v4.0.0"
        }
    except Exception as e:
        print(f"Error in get_training_metadata: {e}")
        return {
            "last_trained": datetime.now().isoformat(),
            "total_records_trained": 0,
            "model_version": "LightGBM v4.0.0"
        }


# ============================================
# FORECAST ENDPOINTS
# ============================================

@app.get("/api/forecast")
async def get_forecast(
    pulau: Optional[str] = Query(None, description="Filter by island name"),
    product: Optional[str] = Query(None, description="Filter by product category"),
    db: Session = Depends(get_db)
):
    """Get forecast data for charting.

    Returns a dict with keys:
      - forecast_data: list of forecast rows
      - model_metrics: list of metrics (mae/mape) per pulau/product_category

    Backwards-compatible: clients expecting a flat list should still be able to
    consume `forecast_data` property (the frontend handles both shapes).
    """
    query = db.query(Forecast)

    # Case-insensitive filtering: normalize incoming params and compare with lower(column)
    if pulau:
        pulau_norm = pulau.strip().lower()
        query = query.filter(func.lower(Forecast.pulau) == pulau_norm)
    if product:
        product_norm = product.strip().lower()
        query = query.filter(func.lower(Forecast.product_category) == product_norm)

    forecasts = query.order_by(Forecast.week).all()

    forecast_list = [
        {
            'week': f.week.strftime('%Y-%m-%d') if f.week else None,
            'actual': f.actual,
            'predicted': f.predicted,
            'is_forecast': bool(f.is_forecast),
            'pulau': f.pulau,
            'product_category': f.product_category,
        }
        for f in forecasts
    ]

    # If no forecast rows were found for the requested pulau+product combination,
    # try a product-only fallback using case-insensitive LIKE so product
    # variants still return useful forecast rows (e.g. 'kacang tanah').
    if product and not forecast_list:
        alt_query = db.query(Forecast)
        alt_query = alt_query.filter(func.lower(Forecast.product_category).like(f"%{product_norm}%"))
        alt_forecasts = alt_query.order_by(Forecast.week).all()
        if alt_forecasts:
            forecast_list = [
                {
                    'week': f.week.strftime('%Y-%m-%d') if f.week else None,
                    'actual': f.actual,
                    'predicted': f.predicted,
                    'is_forecast': bool(f.is_forecast),
                    'pulau': f.pulau,
                    'product_category': f.product_category,
                }
                for f in alt_forecasts
            ]

    # Get metrics from ModelMetric table (case-insensitive match)
    metric_query = db.query(ModelMetric)
    if pulau:
        metric_query = metric_query.filter(func.lower(ModelMetric.pulau) == pulau_norm)
    if product:
        # Allow partial/variant matches for product names (case-insensitive LIKE)
        metric_query = metric_query.filter(func.lower(ModelMetric.product_category).like(f"%{product_norm}%"))

    metrics = metric_query.all()
    metrics_list = [
        {
            'pulau': m.pulau,
            'product_category': m.product_category,
            'mae': m.mae,
            'mape': m.mape,
            'sample_size': m.sample_size,
        }
        for m in metrics
    ]

    # Fallback: if caller requested a specific product but no metrics were found
    # for the provided pulau, try a product-only match so aggregated pulau
    # values like "jawa, bali, & nt" still surface the metric.
    if product and not metrics_list:
        alt_metrics = (
            db.query(ModelMetric)
            .filter(func.lower(ModelMetric.product_category).like(f"%{product_norm}%"))
            .order_by(ModelMetric.pulau, ModelMetric.product_category)
            .all()
        )
        if alt_metrics:
            metrics_list = [
                {
                    'pulau': m.pulau,
                    'product_category': m.product_category,
                    'mae': m.mae,
                    'mape': m.mape,
                    'sample_size': m.sample_size,
                }
                for m in alt_metrics
            ]

    return {
        'forecast_data': forecast_list,
        'model_metrics': metrics_list,
    }


@app.get("/api/forecast/metrics")
async def get_forecast_metrics(
    pulau: Optional[str] = Query(None, description="Filter by island name"),
    product: Optional[str] = Query(None, description="Filter by product category"),
    db: Session = Depends(get_db)
):
    """Return stored model metrics for debugging.

    Example response:
      [
        {"pulau": "Bali", "product_category": "Roti", "mae": 15.5, "mape": 12.5, "sample_size": 40},
        ...
      ]
    """
    metric_query = db.query(ModelMetric)
    if pulau:
        pulau_norm = pulau.strip().lower()
        metric_query = metric_query.filter(func.lower(ModelMetric.pulau) == pulau_norm)
    if product:
        product_norm = product.strip().lower()
        # Allow partial/variant matches for product names when querying stored metrics
        metric_query = metric_query.filter(func.lower(ModelMetric.product_category).like(f"%{product_norm}%"))

    metrics = metric_query.order_by(ModelMetric.pulau, ModelMetric.product_category).all()

    if metrics:
        return [
            {
                'pulau': m.pulau,
                'product_category': m.product_category,
                'mae': m.mae,
                'mape': m.mape,
                'sample_size': m.sample_size,
            }
            for m in metrics
        ]

    # If product was requested but no metrics found for the given pulau,
    # try returning any metrics that match the product across all pulau values.
    if product:
        alt_metrics = (
            db.query(ModelMetric)
            .filter(func.lower(ModelMetric.product_category).like(f"%{product_norm}%"))
            .order_by(ModelMetric.pulau, ModelMetric.product_category)
            .all()
        )
        if alt_metrics:
            return [
                {
                    'pulau': m.pulau,
                    'product_category': m.product_category,
                    'mae': m.mae,
                    'mape': m.mape,
                    'sample_size': m.sample_size,
                }
                for m in alt_metrics
            ]

    # Fallback: compute metrics on-the-fly from historical Forecast rows
    # This ensures the endpoint returns useful data even when persisted metrics are not available.
    hist_query = db.query(Forecast).filter(Forecast.is_forecast == 0)
    if pulau:
        pulau_norm = pulau.strip().lower()
        hist_query = hist_query.filter(func.lower(Forecast.pulau) == pulau_norm)
    if product:
        product_norm = product.strip().lower()
        # Use LIKE to include partial matches from stored product_category values
        hist_query = hist_query.filter(func.lower(Forecast.product_category).like(f"%{product_norm}%"))

    historical = hist_query.all()
    if not historical:
        return []

    # Aggregate per (pulau, product_category)
    agg = {}
    for h in historical:
        key = (h.pulau, h.product_category)
        if key not in agg:
            agg[key] = {
                'errors': [],
                'mape_vals': [],
                'count': 0,
            }
        if h.actual is not None and h.predicted is not None:
            err = abs((h.actual or 0) - (h.predicted or 0))
            agg[key]['errors'].append(err)
            if h.actual and h.actual != 0:
                agg[key]['mape_vals'].append(abs((h.actual - h.predicted) / h.actual) * 100)
        agg[key]['count'] += 1

    results = []
    for (pul, prod), v in agg.items():
        mae = float(sum(v['errors']) / len(v['errors'])) if v['errors'] else 0.0
        mape = float(sum(v['mape_vals']) / len(v['mape_vals'])) if v['mape_vals'] else 0.0
        results.append({
            'pulau': pul,
            'product_category': prod,
            'mae': round(mae, 2),
            'mape': round(mape, 2),
            'sample_size': v['count'],
        })

    return results


# ============================================
# MBA ENDPOINTS
# ============================================

@app.get("/api/mba-rules", response_model=List[MBARuleResponse])
async def get_mba_rules(
    pulau: Optional[str] = Query(None, description="Filter by island name"),
    min_lift: float = Query(1.0, description="Minimum lift threshold"),
    limit: int = Query(50, description="Maximum number of rules to return"),
    db: Session = Depends(get_db)
):
    """Get Market Basket Analysis rules."""
    query = db.query(MBARule)
    
    if pulau:
        query = query.filter(MBARule.pulau == pulau)
    
    query = query.filter(MBARule.lift >= min_lift)
    rules = query.order_by(MBARule.lift.desc()).limit(limit).all()
    
    return [
        MBARuleResponse(
            antecedents=r.antecedents,
            consequents=r.consequents,
            support=r.support,
            confidence=r.confidence,
            lift=r.lift
        ) 
        for r in rules
    ]


# ============================================
# RECOMMENDATION ENDPOINTS
# ============================================

@app.get("/api/recommendations", response_model=List[RecommendationResponse])
async def get_recommendations(
    pulau: Optional[str] = Query(None, description="Filter by island name"),
    type: Optional[str] = Query(None, description="Filter by type: derived_demand or dead_stock"),
    priority: Optional[str] = Query(None, description="Filter by priority: high, medium, low"),
    db: Session = Depends(get_db)
):
    """Get DSS recommendations."""
    query = db.query(Recommendation)
    
    if pulau:
        query = query.filter(Recommendation.pulau == pulau)
    if type:
        query = query.filter(Recommendation.type == type)
    if priority:
        query = query.filter(Recommendation.priority == priority)
    
    recs = query.all()
    
    return [
        RecommendationResponse(
            type=r.type,
            product=r.product,
            related_product=r.related_product,
            action=r.action,
            priority=r.priority,
            confidence=r.confidence or 0.85
        ) 
        for r in recs
    ]


# ============================================
# UTILITY ENDPOINTS
# ============================================

@app.get("/api/islands", response_model=List[str])
async def get_islands(db: Session = Depends(get_db)):
    """Get list of available islands/regions."""
    islands = db.query(Forecast.pulau).distinct().all()
    return [i[0] for i in islands if i[0]]


@app.get("/api/products", response_model=List[str])
async def get_products(
    pulau: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get list of available product categories."""
    query = db.query(Forecast.product_category).distinct()
    
    if pulau:
        query = query.filter(Forecast.pulau == pulau)
    
    products = query.all()
    return [p[0] for p in products if p[0]]


@app.get("/")
async def root():
    """Root endpoint to verify backend is running."""
    return {"message": "DataNiaga API is running", "version": "1.0.0"}


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/api/debug/products")
async def debug_products(pulau: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Return distinct product_category values present in forecasts (for debugging).

    Helps detect casing/whitespace mismatches (returns raw stored strings).
    """
    query = db.query(Forecast.product_category).distinct()
    if pulau:
        query = query.filter(func.lower(Forecast.pulau) == pulau.strip().lower())
    rows = query.all()
    return [r[0] for r in rows if r[0]]


# ============================================
# MAIN ENTRY POINT
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
