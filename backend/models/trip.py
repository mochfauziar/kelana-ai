from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class Trip(Base):
    __tablename__ = "trips"

    id: Column[int]           = Column(Integer, primary_key=True)
    destination: Column[str]  = Column(String, nullable=False)
    days: Column[int]         = Column(Integer, nullable=False)
    budget: Column[float]     = Column(Float, nullable=False)
    category: Column[str]     = Column(String, nullable=False)
    daily_budget: Column[float] = Column(Float, nullable=False)
    ai_recommendation: Column[str]        = Column(Text, nullable=True)
    local_food_recommendation: Column[str] = Column(Text, nullable=True)