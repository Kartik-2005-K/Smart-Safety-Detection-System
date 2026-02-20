from fastapi import FastAPI, WebSocket, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import cv2
import numpy as np
import base64
import json
import asyncio
import logging
from datetime import datetime
from typing import List

from detection import PPEDetector
from database import init_db, get_db, SessionLocal, IncidentDatabase
from models import IncidentResponse, StatisticsResponse, ViolationAlert

# Setup logging with detailed format
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Smart Safety Detection API",
    version="1.0.0",
    description="Real-time PPE detection and safety monitoring system"
)

# Add CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global detector instance
detector = None
active_connections: List[WebSocket] = []

# Violation tracking for deduplication (avoid logging same violation multiple times)
violation_buffer = {}

@app.on_event("startup")
async def startup_event():
    """Initialize database and detector on app startup"""
    global detector
    
    logger.info("=" * 60)
    logger.info("🚀 Starting Safety Detection Backend")
    logger.info("=" * 60)
    
    # Initialize database
    try:
        init_db()
        logger.info("✓ Database initialized successfully")
    except Exception as e:
        logger.error(f"✗ Database initialization failed: {e}")
        raise
    
    # Initialize detector
    try:
        logger.info("Loading YOLOv10-n model (this may take 1-2 minutes on first run)...")
        detector = PPEDetector(model_size="n")
        logger.info("✓ PPE Detector loaded successfully")
        logger.info(f"✓ Model: YOLOv10-n (nano)")
        logger.info(f"✓ Detection classes: Hard Hat, Safety Vest, Person")
        logger.info(f"✓ Drowsiness detection: Enabled (MediaPipe)")
    except Exception as e:
        logger.error(f"✗ Failed to load detector: {e}")
        raise
    
    logger.info("=" * 60)
    logger.info("✓ Backend initialization complete")
    logger.info(f"✓ API running on http://0.0.0.0:8000")
    logger.info(f"✓ WebSocket available at ws://localhost:8000/ws")
    logger.info(f"✓ API Documentation: http://localhost:8000/docs")
    logger.info("=" * 60)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "detector": "loaded" if detector else "not_loaded",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time frame processing
    Receives base64-encoded frames from frontend
    Sends back detections with bounding boxes
    """
    await websocket.accept()
    active_connections.append(websocket)
    db = SessionLocal()
    
    try:
        while True:
            # Receive frame data from client
            data = await websocket.receive_text()
            frame_data = json.loads(data)
            
            # Decode base64 frame
            frame_bytes = base64.b64decode(frame_data["frame"])
            nparr = np.frombuffer(frame_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is None:
                continue
            
            # Process frame
            detections = detector.process_frame(frame)
            frame_h, frame_w = detections["frame_shape"]
            
            # Draw detections on frame for visualization
            annotated_frame = detector.draw_detections(frame, detections)
            
            # Encode annotated frame back to base64
            _, buffer = cv2.imencode('.jpg', annotated_frame)
            encoded_frame = base64.b64encode(buffer).decode('utf-8')
            
            # Prepare response
            response = {
                "frame": encoded_frame,
                "detections": detections["ppe_detections"],
                "violations": [],
                "drowsiness": detections["drowsiness"]
            }
            
            # Log violations and prepare alert messages
            for violation in detections["violations"]:
                violation_type = violation["type"]
                confidence = violation["confidence"]
                bbox = violation["bbox"]
                
                # Create violation key for deduplication
                violation_key = f"{violation_type}_{bbox[0]}_{bbox[1]}"
                
                # Log unique violations (not duplicates)
                if violation_key not in violation_buffer:
                    # Log to database
                    IncidentDatabase.log_incident(
                        db=db,
                        violation_type=violation_type,
                        confidence=confidence,
                        frame_width=frame_w,
                        frame_height=frame_h,
                        bbox=bbox,
                        duration_seconds=0.033  # One frame at 30 FPS
                    )
                    
                    # Track in buffer
                    violation_buffer[violation_key] = datetime.utcnow()
                    
                    response["violations"].append({
                        "type": violation_type,
                        "confidence": confidence,
                        "bbox": bbox,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                else:
                    # Check if violation is still fresh
                    time_diff = (datetime.utcnow() - violation_buffer[violation_key]).total_seconds()
                    if time_diff < 2.0:  # Keep tracking for 2 seconds
                        response["violations"].append({
                            "type": violation_type,
                            "confidence": confidence,
                            "bbox": bbox,
                            "timestamp": datetime.utcnow().isoformat()
                        })
                    else:
                        # Remove stale violation
                        del violation_buffer[violation_key]
            
            # Send response to client
            await websocket.send_json(response)
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    
    finally:
        active_connections.remove(websocket)
        db.close()

@app.get("/api/incidents", response_model=List[IncidentResponse])
async def get_incidents(hours: int = 24, limit: int = 50, db: Session = Depends(get_db)):
    """Get recent incidents from database"""
    incidents = IncidentDatabase.get_recent_incidents(db, limit=limit, hours=hours)
    return incidents

@app.get("/api/incidents/{incident_id}")
async def get_incident(incident_id: int, db: Session = Depends(get_db)):
    """Get specific incident details"""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@app.put("/api/incidents/{incident_id}/resolve")
async def resolve_incident(incident_id: int, db: Session = Depends(get_db)):
    """Mark incident as resolved"""
    success = IncidentDatabase.mark_resolved(db, incident_id)
    if not success:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"status": "resolved", "incident_id": incident_id}

@app.get("/api/statistics")
async def get_statistics(hours: int = 24, db: Session = Depends(get_db)):
    """Get violation statistics"""
    stats = IncidentDatabase.get_statistics(db, hours=hours)
    return {
        **stats,
        "period_hours": hours,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/cleanup")
async def cleanup_old_incidents(hours: int = 72, db: Session = Depends(get_db)):
    """Clean up old incident records (maintenance endpoint)"""
    try:
        IncidentDatabase.clear_old_incidents(db, hours=hours)
        return {"status": "success", "message": f"Cleaned incidents older than {hours} hours"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/config")
async def get_config():
    """Get detector configuration"""
    return {
        "model": "YOLOv10-n",
        "fps_target": 30,
        "detection_confidence_threshold": 0.5,
        "drowsiness_threshold": 0.2,
        "drowsiness_frames": 5,
        "supported_violations": [
            "missing_hard_hat",
            "missing_safety_vest",
            "drowsiness_detected"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
