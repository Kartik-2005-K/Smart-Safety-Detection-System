from sqlalchemy import Column, Integer, String, Float, DateTime, Text, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    violation_type = Column(String(50), index=True)  # "missing_hard_hat", "missing_vest", "drowsiness"
    confidence = Column(Float)  # Detection confidence score 0-1
    frame_width = Column(Integer)
    frame_height = Column(Integer)
    bbox_data = Column(Text)  # JSON string of bounding box coordinates
    duration_seconds = Column(Float, default=0.0)  # How long violation persisted
    resolved = Column(String(20), default="pending")  # "pending", "resolved", "false_alarm"
    
    def __repr__(self):
        return f"<Incident(id={self.id}, type={self.violation_type}, confidence={self.confidence})>"

class Statistics(Base):
    __tablename__ = "statistics"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow, index=True)
    violation_type = Column(String(50), index=True)
    count = Column(Integer, default=1)
    avg_confidence = Column(Float, default=0.0)
    
    def __repr__(self):
        return f"<Statistics(date={self.date}, type={self.violation_type}, count={self.count})>"

# Pydantic schemas for API responses
from pydantic import BaseModel
from typing import Optional

class IncidentResponse(BaseModel):
    id: int
    timestamp: datetime
    violation_type: str
    confidence: float
    frame_width: int
    frame_height: int
    bbox_data: str
    duration_seconds: float
    resolved: str
    
    class Config:
        from_attributes = True

class StatisticsResponse(BaseModel):
    id: int
    date: datetime
    violation_type: str
    count: int
    avg_confidence: float
    
    class Config:
        from_attributes = True

class ViolationAlert(BaseModel):
    violation_type: str
    confidence: float
    bbox: list  # [x, y, w, h]
    timestamp: datetime
    frame_width: int
    frame_height: int
