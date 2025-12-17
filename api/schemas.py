from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class UserCreate(BaseModel):
    """Schema untuk membuat user baru."""
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., min_length=1, max_length=100)
    company: str = Field(..., min_length=1, max_length=200)


class UserResponse(BaseModel):
    """Schema response untuk user."""
    status: str
    user_id: int


class ForecastResponse(BaseModel):
    """Schema response untuk forecast data."""
    week: str
    actual: Optional[float]
    predicted: float
    is_forecast: bool


class MBARuleResponse(BaseModel):
    """Schema response untuk MBA rules."""
    antecedents: str
    consequents: str
    support: float
    confidence: float
    lift: float


class RecommendationResponse(BaseModel):
    """Schema response untuk rekomendasi."""
    type: str
    product: str
    related_product: Optional[str]
    action: str
    priority: str
    confidence: Optional[float] = 0.85  # Default 85% jika tidak tersedia


class DashboardSummary(BaseModel):
    """Schema untuk dashboard summary metrics."""
    total_products: int
    total_islands: int
    stockout_risks: int
    opportunities: int
    forecast_accuracy: float


class UploadResponse(BaseModel):
    """Schema response untuk upload data."""
    status: str
    message: str
    records: int


class TrainingMetadata(BaseModel):
    """Schema untuk informasi pelatihan model."""
    last_trained: Optional[datetime] = None
    total_records_trained: int = 0
    model_version: str = "LightGBM v4.0.0"
