from sqlalchemy import Column, Integer, BigInteger, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
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
    travel_style: Column[str]              = Column(String, nullable=True)
    ai_recommendation: Column[str]        = Column(Text, nullable=True)
    local_food_recommendation: Column[str] = Column(Text, nullable=True)
    summary: Column[str]                   = Column(Text, nullable=True)
    created_at         = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    user_id            = Column(BigInteger, ForeignKey("users.id"), nullable=True)

    user = relationship("User", back_populates="trips")

