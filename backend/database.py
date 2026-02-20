import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from models import Base, Incident, Statistics
from datetime import datetime
import json

# Use SQLite database
DATABASE_PATH = os.path.join(os.path.dirname(__file__), "data", "database.db")
os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)

# Create engine with SQLite
engine = create_engine(
    f"sqlite:///{DATABASE_PATH}",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print(f"Database initialized at {DATABASE_PATH}")

def get_db() -> Session:
    """Get database session for dependency injection"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class IncidentDatabase:
    """Helper class for incident operations"""
    
    @staticmethod
    def log_incident(
        db: Session,
        violation_type: str,
        confidence: float,
        frame_width: int,
        frame_height: int,
        bbox: list = None,
        duration_seconds: float = 0.0
    ) -> Incident:
        """Log a violation incident to database"""
        incident = Incident(
            timestamp=datetime.utcnow(),
            violation_type=violation_type,
            confidence=confidence,
            frame_width=frame_width,
            frame_height=frame_height,
            bbox_data=json.dumps(bbox) if bbox else "[]",
            duration_seconds=duration_seconds,
            resolved="pending"
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)
        return incident
    
    @staticmethod
    def get_recent_incidents(db: Session, limit: int = 50, hours: int = 24) -> list:
        """Get recent incidents (last N hours)"""
        from datetime import timedelta
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        incidents = db.query(Incident).filter(
            Incident.timestamp >= cutoff_time
        ).order_by(Incident.timestamp.desc()).limit(limit).all()
        return incidents
    
    @staticmethod
    def get_statistics(db: Session, hours: int = 24) -> dict:
        """Get violation statistics for the last N hours"""
        from datetime import timedelta
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        incidents = db.query(Incident).filter(
            Incident.timestamp >= cutoff_time
        ).all()
        
        stats = {
            "total_violations": len(incidents),
            "by_type": {},
            "avg_confidence": 0.0
        }
        
        if incidents:
            total_confidence = 0
            for incident in incidents:
                vtype = incident.violation_type
                stats["by_type"][vtype] = stats["by_type"].get(vtype, 0) + 1
                total_confidence += incident.confidence
            
            stats["avg_confidence"] = total_confidence / len(incidents)
        
        return stats
    
    @staticmethod
    def mark_resolved(db: Session, incident_id: int) -> bool:
        """Mark incident as resolved"""
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if incident:
            incident.resolved = "resolved"
            db.commit()
            return True
        return False
    
    @staticmethod
    def clear_old_incidents(db: Session, hours: int = 72):
        """Clear incidents older than N hours (for storage cleanup)"""
        from datetime import timedelta
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        db.query(Incident).filter(Incident.timestamp < cutoff_time).delete()
        db.commit()
