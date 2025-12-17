"""
DataNiaga FastAPI Backend for Vercel Serverless
================================================

Main application file untuk Retail Decision Support System.
Adapted for Vercel Python Serverless (ASGI) – no Mangum needed.

Endpoints untuk upload data, forecasting, MBA, dan recommendations.
Uses in-memory storage (no database) for single-session analysis workflow.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
import os
import sys

# Add parent directories to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from backend.schemas import (
        UserCreate, UserResponse, ForecastResponse, MBARuleResponse,
        RecommendationResponse, DashboardSummary, UploadResponse,
    )
except ImportError:
    from schemas import (
        UserCreate, UserResponse, ForecastResponse, MBARuleResponse,
        RecommendationResponse, DashboardSummary, UploadResponse,
    )

# ============================================
# IN-MEMORY DATA STORE
# ============================================
# All data stored in-memory for single session.
# Data persists until function restart (within Vercel execution context).
data_store: Dict[str, Any] = {
    "transactions": None,        # pd.DataFrame - raw uploaded data
    "forecasts": [],            # list of forecast dicts
    "mba_rules": [],            # list of MBA rule dicts
    "recommendations": [],      # list of recommendation dicts
    "model_metrics": [],        # list of metric dicts
    "user": None,               # user session info dict
    "metadata": {
        "last_updated": None,
        "upload_timestamp": None,
    }
}

# Initialize FastAPI app
logger = logging.getLogger(__name__)

app = FastAPI(
    title="DataNiaga API",
    description="Retail Decision Support System - AI-powered forecasting and recommendations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS configuration for React frontend
# Vercel domains, localhost for dev, and wildcard for flexibility
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://*.vercel.app",
    "*",
]

logger.info("FastAPI app initialized")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Required columns for data validation
REQUIRED_COLUMNS = ['InvoiceNo', 'InvoiceDate', 'PULAU', 'PRODUCT_CATEGORY', 'Quantity']


def validate_dataframe(df) -> None:
    """
    Validate that required columns exist in uploaded DataFrame.
    
    Args:
        df: Uploaded DataFrame (pandas DataFrame)
        
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

@app.post("/upload-data", response_model=UploadResponse)
async def upload_data(file: UploadFile = File(...)):
    """
    Upload and process sales data file.
    
    Accepts CSV or Excel files with required columns:
    - InvoiceNo, InvoiceDate, PULAU, PRODUCT_CATEGORY, Quantity
    
    Triggers ML pipeline:
    1. Data validation
    2. Forecasting (LightGBM per island)
    3. Market Basket Analysis (FP-Growth)
    4. Recommendation generation
    
    Data stored in-memory for session duration.
    """
    try:
        # Lazy imports of heavy libs (speed up cold start / health checks)
        import pandas as pd

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
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=400, 
                detail=f"Error reading file: {str(e)}"
            )
        
        # Validate columns
        validate_dataframe(df)
        
        # Clear existing in-memory data
        data_store["transactions"] = df.copy()
        data_store["forecasts"] = []
        data_store["mba_rules"] = []
        data_store["recommendations"] = []
        data_store["model_metrics"] = []
        data_store["metadata"]["upload_timestamp"] = datetime.now().isoformat()
        
        # Lazy import services only when needed
        try:
            try:
                from backend.services.forecasting import run_all_forecasts
                from backend.services.mba import run_all_mba
                from backend.services.recommendations import (
                    generate_recommendations,
                    get_stockout_risks,
                    get_bundling_opportunities,
                )
            except ImportError:
                from services.forecasting import run_all_forecasts
                from services.mba import run_all_mba
                from services.recommendations import (
                    generate_recommendations,
                    get_stockout_risks,
                    get_bundling_opportunities,
                )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Service import failed: {str(e)}")

        # Run forecasting pipeline
        print("Starting forecasting pipeline...")
        try:
            forecast_result = run_all_forecasts(df)
            forecast_records = forecast_result.get('forecast_data', []) if isinstance(forecast_result, dict) else (forecast_result or [])
            model_metrics = forecast_result.get('model_metrics', []) if isinstance(forecast_result, dict) else []
        except Exception as e:
            print(f"Error in forecasting pipeline: {e}")
            raise HTTPException(status_code=500, detail=f"Forecasting pipeline failed: {str(e)}")

        # Store forecasts in memory
        try:
            for f in forecast_records:
                data_store["forecasts"].append(f)
            print(f"Stored {len(forecast_records)} forecast records in memory")
        except Exception as e:
            print(f"Error storing forecasts: {e}")
            raise HTTPException(status_code=500, detail=f"Error storing forecast data: {str(e)}")

        # Store model metrics in memory
        try:
            for m in model_metrics:
                data_store["model_metrics"].append(m)
            print(f"Stored {len(model_metrics)} metric entries in memory")
        except Exception as e:
            print(f"Error storing metrics: {e}")
            raise HTTPException(status_code=500, detail=f"Error storing model metrics: {str(e)}")
        
        # Run MBA pipeline
        print("Starting MBA pipeline...")
        try:
            rules = run_all_mba(df)
            for r in rules:
                data_store["mba_rules"].append(r)
            print(f"Stored {len(rules)} MBA rules in memory")
        except Exception as e:
            print(f"Error in MBA pipeline: {e}")
            raise HTTPException(status_code=500, detail=f"MBA pipeline failed: {str(e)}")
        
        # Generate recommendations
        print("Generating recommendations...")
        try:
            recommendations = generate_recommendations(df, forecast_records, rules)
            for rec in recommendations:
                data_store["recommendations"].append(rec)
            print(f"Stored {len(recommendations)} recommendations in memory")
        except Exception as e:
            print(f"Error generating recommendations: {e}")
            raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")
        
        data_store["metadata"]["last_updated"] = datetime.now().isoformat()
        print("Data processing completed successfully")
        
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
        raise HTTPException(
            status_code=500, 
            detail=f"Processing failed: {str(e)} - Check backend logs for details"
        )


# ============================================
# USER ENDPOINTS
# ============================================

@app.post("/user", response_model=UserResponse)
async def create_user(user: UserCreate):
    """Save user session information to memory."""
    data_store["user"] = {
        "name": user.name,
        "role": user.role,
        "company": user.company,
        "created_at": datetime.now().isoformat()
    }
    # Generate simple user_id based on timestamp
    user_id = int(datetime.now().timestamp() * 1000) % 1000000
    
    return UserResponse(status="success", user_id=user_id)


# ============================================
# DASHBOARD ENDPOINTS
# ============================================

@app.get("/dashboard/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    pulau: Optional[str] = Query(None, description="Filter by island name for per-region summary")
):
    """Get dashboard summary metrics derived from in-memory data, optionally per pulau."""
    forecasts = data_store["forecasts"]
    recommendations = data_store["recommendations"]
    rules = data_store["mba_rules"]
    metrics = data_store["model_metrics"]

    # Filter by pulau if provided
    if pulau:
        pulau_norm = pulau.strip().lower()
        forecasts = [f for f in forecasts if (str(f.get('pulau', '')).strip().lower() == pulau_norm)]
        recommendations = [r for r in recommendations if (str(r.get('pulau', '')).strip().lower() == pulau_norm)]
        rules = [r for r in rules if (str(r.get('pulau', '')).strip().lower() == pulau_norm)]
        metrics = [m for m in metrics if (str(m.get('pulau', '')).strip().lower() == pulau_norm)]

    # Total Products → distinct product_category from forecasts
    total_products = len({f.get('product_category') for f in forecasts}) if forecasts else 0
    
    # Total Islands → global count when not filtered; if filtered, 1 (or 0 when empty)
    if pulau:
        total_islands = 1 if forecasts else 0
    else:
        total_islands = len({f.get('pulau') for f in forecasts}) if forecasts else 0

    # Stockout Risk → demand decreasing: next forecast < current forecast per (product_category, pulau)
    stockout_risks = 0
    if forecasts:
        from collections import defaultdict
        series = defaultdict(list)
        for f in forecasts:
            if f.get('is_forecast'):
                series[(f.get('product_category'), f.get('pulau'))].append(f)
        for (_, _), rows in series.items():
            rows.sort(key=lambda r: r.get('week') or '')
            if len(rows) >= 2:
                cur = rows[-2]
                nxt = rows[-1]
                if (nxt.get('predicted') or 0) < (cur.get('predicted') or 0):
                    stockout_risks += 1

    # Bundling Opportunities → from MBA rules produced by the model
    bundling_opportunities = len([r for r in rules if r.get('lift') is not None and r.get('lift', 0) >= 1.0])

    # Model Accuracy → from ModelMetric (direct MAPE value); fallback to calculated if metrics absent
    if metrics:
        mape_vals = [m.get('mape') for m in metrics if m.get('mape') is not None]
        accuracy = (sum(mape_vals) / len(mape_vals)) if mape_vals else 0.0
    else:
        historical = [f for f in forecasts if not f.get('is_forecast')]
        if historical:
            errs = []
            for h in historical:
                actual = h.get('actual')
                predicted = h.get('predicted')
                if actual and actual > 0 and predicted:
                    errs.append(abs(actual - predicted) / actual)
            accuracy = (sum(errs) / len(errs) * 100.0) if errs else 0.0
        else:
            accuracy = 0.0

    return DashboardSummary(
        total_products=total_products,
        total_islands=total_islands,
        stockout_risks=stockout_risks,
        opportunities=bundling_opportunities,
        forecast_accuracy=round(accuracy, 1)
    )


@app.get("/training-metadata")
async def get_training_metadata():
    """Get model training metadata."""
    try:
        # Count historical forecast records (as proxy for training volume)
        forecasts = data_store["forecasts"]
        total_trained = len([f for f in forecasts if not f.get('is_forecast')])
        
        return {
            "last_trained": data_store["metadata"].get("last_updated") or datetime.now().isoformat(),
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

@app.get("/forecast")
async def get_forecast(
    pulau: Optional[str] = Query(None, description="Filter by island name"),
    product: Optional[str] = Query(None, description="Filter by product category")
):
    """Get forecast data for charting."""
    forecasts = data_store["forecasts"]
    metrics = data_store["model_metrics"]

    # Case-insensitive filtering
    forecast_list = forecasts
    
    if pulau:
        pulau_norm = pulau.strip().lower()
        forecast_list = [f for f in forecast_list if str(f.get('pulau', '')).strip().lower() == pulau_norm]
    
    if product:
        product_norm = product.strip().lower()
        forecast_list = [f for f in forecast_list if product_norm in str(f.get('product_category', '')).strip().lower()]
    
    # Sort by week
    forecast_list = sorted(forecast_list, key=lambda f: f.get('week', ''))

    # If no forecast rows were found for the requested pulau+product combination,
    # try a product-only fallback
    if product and not forecast_list:
        product_norm = product.strip().lower()
        forecast_list = [f for f in data_store["forecasts"] if product_norm in str(f.get('product_category', '')).strip().lower()]
        forecast_list = sorted(forecast_list, key=lambda f: f.get('week', ''))

    # Format forecast list
    formatted_forecasts = [
        {
            'week': f.get('week'),
            'actual': f.get('actual'),
            'predicted': f.get('predicted'),
            'is_forecast': bool(f.get('is_forecast')),
            'pulau': f.get('pulau'),
            'product_category': f.get('product_category'),
        }
        for f in forecast_list
    ]

    # Get metrics (case-insensitive match)
    metrics_list = metrics
    
    if pulau:
        pulau_norm = pulau.strip().lower()
        metrics_list = [m for m in metrics_list if str(m.get('pulau', '')).strip().lower() == pulau_norm]
    
    if product:
        product_norm = product.strip().lower()
        metrics_list = [m for m in metrics_list if product_norm in str(m.get('product_category', '')).strip().lower()]

    # Fallback: if caller requested a specific product but no metrics were found,
    # try a product-only match
    if product and not metrics_list:
        product_norm = product.strip().lower()
        metrics_list = [m for m in data_store["model_metrics"] if product_norm in str(m.get('product_category', '')).strip().lower()]

    formatted_metrics = [
        {
            'pulau': m.get('pulau'),
            'product_category': m.get('product_category'),
            'mae': m.get('mae'),
            'mape': m.get('mape'),
            'sample_size': m.get('sample_size'),
        }
        for m in metrics_list
    ]

    return {
        'forecast_data': formatted_forecasts,
        'model_metrics': formatted_metrics,
    }


@app.get("/forecast/metrics")
async def get_forecast_metrics(
    pulau: Optional[str] = Query(None, description="Filter by island name"),
    product: Optional[str] = Query(None, description="Filter by product category")
):
    """Return stored model metrics for debugging."""
    metrics = data_store["model_metrics"]

    # Filter by pulau and product
    if pulau:
        pulau_norm = pulau.strip().lower()
        metrics = [m for m in metrics if str(m.get('pulau', '')).strip().lower() == pulau_norm]
    
    if product:
        product_norm = product.strip().lower()
        metrics = [m for m in metrics if product_norm in str(m.get('product_category', '')).strip().lower()]

    if metrics:
        return [
            {
                'pulau': m.get('pulau'),
                'product_category': m.get('product_category'),
                'mae': m.get('mae'),
                'mape': m.get('mape'),
                'sample_size': m.get('sample_size'),
            }
            for m in sorted(metrics, key=lambda m: (m.get('pulau', ''), m.get('product_category', '')))
        ]

    # If product was requested but no metrics found for the given pulau,
    # try returning any metrics that match the product across all pulau values.
    if product:
        product_norm = product.strip().lower()
        alt_metrics = [m for m in data_store["model_metrics"] if product_norm in str(m.get('product_category', '')).strip().lower()]
        if alt_metrics:
            return [
                {
                    'pulau': m.get('pulau'),
                    'product_category': m.get('product_category'),
                    'mae': m.get('mae'),
                    'mape': m.get('mape'),
                    'sample_size': m.get('sample_size'),
                }
                for m in sorted(alt_metrics, key=lambda m: (m.get('pulau', ''), m.get('product_category', '')))
            ]

    # Fallback: compute metrics on-the-fly from historical Forecast rows
    historical = [f for f in data_store["forecasts"] if not f.get('is_forecast')]
    
    if pulau:
        pulau_norm = pulau.strip().lower()
        historical = [f for f in historical if str(f.get('pulau', '')).strip().lower() == pulau_norm]
    
    if product:
        product_norm = product.strip().lower()
        historical = [f for f in historical if product_norm in str(f.get('product_category', '')).strip().lower()]

    if not historical:
        return []

    # Aggregate per (pulau, product_category)
    agg = {}
    for h in historical:
        key = (h.get('pulau'), h.get('product_category'))
        if key not in agg:
            agg[key] = {
                'errors': [],
                'mape_vals': [],
                'count': 0,
            }
        actual = h.get('actual')
        predicted = h.get('predicted')
        if actual is not None and predicted is not None:
            err = abs((actual or 0) - (predicted or 0))
            agg[key]['errors'].append(err)
            if actual and actual != 0:
                agg[key]['mape_vals'].append(abs((actual - predicted) / actual) * 100)
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

@app.get("/mba-rules", response_model=List[MBARuleResponse])
async def get_mba_rules(
    pulau: Optional[str] = Query(None, description="Filter by island name"),
    min_lift: float = Query(1.0, description="Minimum lift threshold"),
    limit: int = Query(50, description="Maximum number of rules to return")
):
    """Get Market Basket Analysis rules."""
    rules = data_store["mba_rules"]
    
    if pulau:
        rules = [r for r in rules if str(r.get('pulau', '')).strip() == pulau.strip()]
    
    rules = [r for r in rules if r.get('lift', 0) >= min_lift]
    rules = sorted(rules, key=lambda r: r.get('lift', 0), reverse=True)[:limit]
    
    return [
        MBARuleResponse(
            antecedents=r.get('antecedents', ''),
            consequents=r.get('consequents', ''),
            support=r.get('support', 0.0),
            confidence=r.get('confidence', 0.0),
            lift=r.get('lift', 0.0)
        ) 
        for r in rules
    ]


# ============================================
# RECOMMENDATION ENDPOINTS
# ============================================

@app.get("/recommendations", response_model=List[RecommendationResponse])
async def get_recommendations(
    pulau: Optional[str] = Query(None, description="Filter by island name"),
    type: Optional[str] = Query(None, description="Filter by type: derived_demand or dead_stock"),
    priority: Optional[str] = Query(None, description="Filter by priority: high, medium, low")
):
    """Get DSS recommendations."""
    recs = data_store["recommendations"]
    
    if pulau:
        recs = [r for r in recs if str(r.get('pulau', '')).strip() == pulau.strip()]
    if type:
        recs = [r for r in recs if str(r.get('type', '')).strip() == type.strip()]
    if priority:
        recs = [r for r in recs if str(r.get('priority', '')).strip() == priority.strip()]
    
    return [
        RecommendationResponse(
            type=r.get('type', ''),
            product=r.get('product', ''),
            related_product=r.get('related_product'),
            action=r.get('action', ''),
            priority=r.get('priority', 'medium'),
            confidence=r.get('confidence', 0.85)
        ) 
        for r in recs
    ]


# ============================================
# UTILITY ENDPOINTS
# ============================================

@app.get("/islands", response_model=List[str])
async def get_islands():
    """Get list of available islands/regions."""
    forecasts = data_store["forecasts"]
    islands = list(set(f.get('pulau') for f in forecasts if f.get('pulau')))
    return sorted([i for i in islands if i])


@app.get("/products", response_model=List[str])
async def get_products(pulau: Optional[str] = Query(None)):
    """Get list of available product categories."""
    forecasts = data_store["forecasts"]
    
    if pulau:
        forecasts = [f for f in forecasts if f.get('pulau') == pulau]
    
    products = list(set(f.get('product_category') for f in forecasts if f.get('product_category')))
    return sorted([p for p in products if p])


@app.get("/")
async def root():
    """Root endpoint to verify backend is running."""
    return {"message": "DataNiaga API is running", "version": "1.0.0"}


@app.get("/ping")
async def ping():
    """Lightweight ping for health checks without loading heavy deps."""
    return {"status": "ok"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/api/debug/products")
async def debug_products(pulau: Optional[str] = Query(None)):
    """Return distinct product_category values present in forecasts (for debugging)."""
    forecasts = data_store["forecasts"]
    
    if pulau:
        pulau_norm = pulau.strip().lower()
        forecasts = [f for f in forecasts if str(f.get('pulau', '')).strip().lower() == pulau_norm]
    
    products = list(set(f.get('product_category') for f in forecasts if f.get('product_category')))
    return [p for p in products if p]


handler = app  # Explicit handler alias for Vercel Python runtime
