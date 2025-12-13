from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from database import Base


class Forecast(Base):
    """Model untuk menyimpan hasil forecasting."""
    __tablename__ = "forecasts"
    
    id = Column(Integer, primary_key=True, index=True)
    pulau = Column(String, index=True)
    product_category = Column(String)
    week = Column(DateTime)
    actual = Column(Float, nullable=True)
    predicted = Column(Float)
    is_forecast = Column(Integer, default=0)


class MBARule(Base):
    """Model untuk menyimpan hasil Market Basket Analysis."""
    __tablename__ = "mba_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    pulau = Column(String, index=True)
    antecedents = Column(Text)
    consequents = Column(Text)
    support = Column(Float)
    confidence = Column(Float)
    lift = Column(Float)


class Recommendation(Base):
    """Model untuk menyimpan rekomendasi DSS."""
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    pulau = Column(String, index=True)
    type = Column(String)  # 'derived_demand' atau 'dead_stock'
    product = Column(String)
    related_product = Column(String, nullable=True)
    action = Column(String)
    priority = Column(String)


class UserSession(Base):
    """Model untuk menyimpan informasi user."""
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    role = Column(String)
    company = Column(String)
    created_at = Column(DateTime)


class ModelMetric(Base):
    """Model untuk menyimpan metrik evaluasi model per pulau & kategori."""
    __tablename__ = "model_metrics"

    id = Column(Integer, primary_key=True, index=True)
    pulau = Column(String, index=True)
    product_category = Column(String, index=True)
    mae = Column(Float)
    mape = Column(Float)
    sample_size = Column(Integer)
