"""Data schemas for API requests and responses"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class UserCreate(BaseModel):
    """Create user schema"""
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., min_length=1, max_length=100)
    company: str = Field(..., min_length=1, max_length=200)


class UserResponse(BaseModel):
    """User response schema"""
    status: str
    user_id: int


class ForecastResponse(BaseModel):
    """Forecast data response schema"""
    week: str
    actual: Optional[float]
    predicted: float
    is_forecast: bool


class MBARuleResponse(BaseModel):
    """Market Basket Analysis rule response schema"""
    antecedents: str
    consequents: str
    support: float
    confidence: float
    lift: float


class RecommendationResponse(BaseModel):
    """Recommendation response schema"""
    type: str
    product: str
    related_product: Optional[str]
    action: str
    priority: str
    confidence: Optional[float] = 0.85


class DashboardSummary(BaseModel):
    """Dashboard summary metrics schema"""
    total_products: int
    total_islands: int
    stockout_risks: int
    opportunities: int
    forecast_accuracy: float


class UploadResponse(BaseModel):
    """Data upload response schema"""
    status: str
    message: str
    records: int


class TrainingMetadata(BaseModel):
    """Model training metadata schema"""
    last_trained: Optional[datetime] = None
    total_records_trained: int = 0
    model_version: str = "LightGBM v4.0.0"
