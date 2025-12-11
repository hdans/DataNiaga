"""
DataNiaga FastAPI Backend
=========================

Main application file untuk Retail Decision Support System.
Endpoints untuk upload data, forecasting, MBA, dan recommendations.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import pandas as pd
from io import BytesIO
from datetime import datetime
from typing import Optional, List

from database import engine, get_db, Base
from models import Forecast, MBARule, Recommendation, UserSession
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

# Initialize FastAPI app
app = FastAPI(
    title="DataNiaga API",
    description="Retail Decision Support System - AI-powered forecasting and recommendations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev server
        "http://localhost:8080",
        "*"  # Allow all origins in development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    db.query(Forecast).delete()
    db.query(MBARule).delete()
    db.query(Recommendation).delete()
    
    # Run forecasting pipeline
    print("Starting forecasting pipeline...")
    forecasts = run_all_forecasts(df)
    for f in forecasts:
        db.add(Forecast(**f))
    print(f"Generated {len(forecasts)} forecast records")
    
    # Run MBA pipeline
    print("Starting MBA pipeline...")
    rules = run_all_mba(df)
    for r in rules:
        db.add(MBARule(**r))
    print(f"Generated {len(rules)} MBA rules")
    
    # Generate recommendations
    print("Generating recommendations...")
    recommendations = generate_recommendations(df, forecasts, rules)
    for rec in recommendations:
        db.add(Recommendation(**rec))
    print(f"Generated {len(recommendations)} recommendations")
    
    db.commit()
    
    return UploadResponse(
        status="success",
        message="Data processed successfully",
        records=len(df)
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
    forecasts = db.query(Forecast).filter(Forecast.is_forecast == 1).all()
    recommendations = db.query(Recommendation).all()
    rules = db.query(MBARule).all()
    
    # Calculate metrics
    forecast_list = [{'predicted': f.predicted, 'actual': f.actual, 'is_forecast': f.is_forecast} 
                     for f in db.query(Forecast).all()]
    rule_list = [{'lift': r.lift} for r in rules]
    
    stockout_risks = len([r for r in recommendations 
                          if r.type == 'derived_demand' and r.priority == 'high'])
    opportunities = len([r for r in recommendations if r.type == 'dead_stock'])
    
    # Calculate forecast accuracy (simplified MAPE)
    historical = db.query(Forecast).filter(Forecast.is_forecast == 0).all()
    if historical:
        errors = []
        for h in historical:
            if h.actual and h.actual > 0:
                error = abs(h.actual - h.predicted) / h.actual
                errors.append(error)
        mape = sum(errors) / len(errors) if errors else 0
        accuracy = max(0, min(100, (1 - mape) * 100))
    else:
        accuracy = 87.5  # Default
    
    return DashboardSummary(
        total_products=len(set(f.product_category for f in forecasts)),
        total_islands=len(set(f.pulau for f in forecasts)),
        stockout_risks=stockout_risks,
        opportunities=opportunities,
        forecast_accuracy=round(accuracy, 1)
    )


# ============================================
# FORECAST ENDPOINTS
# ============================================

@app.get("/api/forecast", response_model=List[ForecastResponse])
async def get_forecast(
    pulau: Optional[str] = Query(None, description="Filter by island name"),
    product: Optional[str] = Query(None, description="Filter by product category"),
    db: Session = Depends(get_db)
):
    """Get forecast data for charting."""
    query = db.query(Forecast)
    
    if pulau:
        query = query.filter(Forecast.pulau == pulau)
    if product:
        query = query.filter(Forecast.product_category == product)
    
    forecasts = query.order_by(Forecast.week).all()
    
    return [
        ForecastResponse(
            week=f.week.strftime('%Y-%m-%d'),
            actual=f.actual,
            predicted=f.predicted,
            is_forecast=bool(f.is_forecast)
        ) 
        for f in forecasts
    ]


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
            priority=r.priority
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


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


# ============================================
# MAIN ENTRY POINT
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
