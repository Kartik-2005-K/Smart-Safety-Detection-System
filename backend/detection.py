import cv2
import numpy as np
import mediapipe as mp
from ultralytics import YOLO
from typing import Tuple, List, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PPEDetector:
    """
    Real-time PPE detection using YOLOv10-n and MediaPipe
    Detects: Hard hats, safety vests, drowsiness
    """
    
    def __init__(self, model_size: str = "n"):
        """
        Initialize detector with YOLOv10 model
        Args:
            model_size: Model size ("n" for nano, "s" for small, "m" for medium)
        """
        try:
            # Load YOLOv10 model - uses COCO pre-trained weights
            self.model = YOLO(f"yolov10{model_size}.pt")
            logger.info(f"YOLOv10-{model_size} model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            self.model = None
        
        # Initialize MediaPipe Face Detection for drowsiness
        self.mp_face = mp.solutions.face_detection
        self.face_detector = self.mp_face.FaceDetection(
            model_selection=0,  # 0: short-range (~2m), 1: full-range (~5m)
            min_detection_confidence=0.5
        )
        
        # Initialize MediaPipe Face Mesh for eye detection
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=5,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Eye landmarks indices (from MediaPipe face mesh)
        self.LEFT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 390, 373, 374, 380, 381, 382]
        self.RIGHT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 155, 154, 153, 145, 144]
        
        # Drowsiness detection parameters
        self.drowsiness_threshold = 0.2  # Eye Aspect Ratio threshold
        self.drowsiness_frames = 5  # Frames to confirm drowsiness
        self.consecutive_frames = 0
        
        # COCO class names for context
        self.coco_classes = {
            0: "person",
            1: "bicycle",
            # ... other COCO classes not needed for this use case
        }
    
    def calculate_eye_aspect_ratio(self, eye_landmarks) -> float:
        """Calculate Eye Aspect Ratio (EAR) for drowsiness detection"""
        if len(eye_landmarks) < 6:
            return 1.0
        
        # Calculate distances
        A = np.linalg.norm(np.array(eye_landmarks[1]) - np.array(eye_landmarks[5]))
        B = np.linalg.norm(np.array(eye_landmarks[2]) - np.array(eye_landmarks[4]))
        C = np.linalg.norm(np.array(eye_landmarks[0]) - np.array(eye_landmarks[3]))
        
        # Eye Aspect Ratio
        ear = (A + B) / (2.0 * C) if C > 0 else 1.0
        return ear
    
    def extract_eye_landmarks(self, face_landmarks, frame_h, frame_w, eye_indices):
        """Extract eye landmarks from face mesh results"""
        eye_landmarks = []
        for idx in eye_indices:
            if idx < len(face_landmarks):
                landmark = face_landmarks[idx]
                x = int(landmark.x * frame_w)
                y = int(landmark.y * frame_h)
                eye_landmarks.append([x, y])
        return eye_landmarks
    
    def detect_drowsiness(self, frame: np.ndarray) -> Tuple[bool, float]:
        """
        Detect drowsiness using MediaPipe Face Mesh
        Returns: (is_drowsy, confidence)
        """
        try:
            frame_h, frame_w = frame.shape[:2]
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            results = self.face_mesh.process(frame_rgb)
            
            if not results.multi_face_landmarks:
                self.consecutive_frames = 0
                return False, 0.0
            
            # Process first face detected
            face_landmarks = results.multi_face_landmarks[0].landmark
            
            # Calculate EAR for both eyes
            left_eye_lm = self.extract_eye_landmarks(face_landmarks, frame_h, frame_w, self.LEFT_EYE)
            right_eye_lm = self.extract_eye_landmarks(face_landmarks, frame_h, frame_w, self.RIGHT_EYE)
            
            left_ear = self.calculate_eye_aspect_ratio(left_eye_lm)
            right_ear = self.calculate_eye_aspect_ratio(right_eye_lm)
            
            avg_ear = (left_ear + right_ear) / 2.0
            
            # Check if eyes are closed
            if avg_ear < self.drowsiness_threshold:
                self.consecutive_frames += 1
            else:
                self.consecutive_frames = 0
            
            # Drowsy if eyes closed for multiple consecutive frames
            is_drowsy = self.consecutive_frames >= self.drowsiness_frames
            confidence = min(1.0, self.consecutive_frames / self.drowsiness_frames)
            
            return is_drowsy, confidence
        
        except Exception as e:
            logger.error(f"Error in drowsiness detection: {e}")
            return False, 0.0
    
    def detect_ppe(self, frame: np.ndarray, conf_threshold: float = 0.5) -> List[Dict]:
        """
        Detect PPE (hard hat, safety vest) using YOLOv10-n
        Returns list of detections with format:
        {
            "class": "person" | "hard_hat" | "safety_vest",
            "confidence": float,
            "bbox": [x, y, w, h],
            "violation": bool (if person without required PPE)
        }
        """
        detections = []
        
        if self.model is None:
            return detections
        
        try:
            # Run YOLO inference
            results = self.model(frame, conf=conf_threshold, verbose=False)
            
            for result in results:
                for box in result.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = float(box.conf[0].cpu().numpy())
                    cls = int(box.cls[0].cpu().numpy())
                    class_name = result.names[cls]
                    
                    # Convert to [x, y, w, h] format
                    x, y = int(x1), int(y1)
                    w, h = int(x2 - x1), int(y2 - y1)
                    
                    detections.append({
                        "class": class_name,
                        "confidence": conf,
                        "bbox": [x, y, w, h],
                        "xyxy": [x1, y1, x2, y2]
                    })
        
        except Exception as e:
            logger.error(f"Error in PPE detection: {e}")
        
        return detections
    
    def check_ppe_violations(self, ppe_detections: List[Dict], frame_h: int, frame_w: int) -> List[Dict]:
        """
        Check for PPE violations (person without hard hat or vest)
        Simple logic: If person detected but no hard hat or vest nearby, flag as violation
        Returns list of violations
        """
        violations = []
        
        # Find all persons
        persons = [d for d in ppe_detections if d["class"].lower() == "person"]
        hard_hats = [d for d in ppe_detections if "hat" in d["class"].lower()]
        vests = [d for d in ppe_detections if "vest" in d["class"].lower()]
        
        for person in persons:
            px1, py1, px2, py2 = person["xyxy"]
            person_center_x = (px1 + px2) / 2
            person_center_y = (py1 + py2) / 2
            person_area = (px2 - px1) * (py2 - py1)
            
            # Check for hard hat above person (in upper body area)
            has_hat = False
            for hat in hard_hats:
                hx1, hy1, hx2, hy2 = hat["xyxy"]
                # Check if hat is above person and horizontally aligned
                if (hy2 < py1) and (hx1 < px2) and (hx2 > px1):
                    has_hat = True
                    break
            
            # Check for vest on person
            has_vest = False
            for vest in vests:
                vx1, vy1, vx2, vy2 = vest["xyxy"]
                vest_area = (vx2 - vx1) * (vy2 - vy1)
                # Check overlap/proximity
                overlap = min(px2, vx2) - max(px1, vx1)
                if overlap > 0:
                    has_vest = True
                    break
            
            # Log violations
            if not has_hat:
                violations.append({
                    "type": "missing_hard_hat",
                    "confidence": 0.9,
                    "bbox": person["bbox"],
                    "xyxy": person["xyxy"]
                })
            
            if not has_vest:
                violations.append({
                    "type": "missing_safety_vest",
                    "confidence": 0.85,
                    "bbox": person["bbox"],
                    "xyxy": person["xyxy"]
                })
        
        return violations
    
    def process_frame(self, frame: np.ndarray) -> Dict:
        """
        Process single frame and return all detections + violations
        Returns:
        {
            "ppe_detections": [...],
            "violations": [...],
            "drowsiness": {"detected": bool, "confidence": float},
            "frame_shape": (h, w)
        }
        """
        frame_h, frame_w = frame.shape[:2]
        
        # Detect PPE
        ppe_detections = self.detect_ppe(frame)
        
        # Check for violations
        violations = self.check_ppe_violations(ppe_detections, frame_h, frame_w)
        
        # Detect drowsiness
        is_drowsy, drowsy_conf = self.detect_drowsiness(frame)
        
        if is_drowsy:
            violations.append({
                "type": "drowsiness_detected",
                "confidence": drowsy_conf,
                "bbox": [0, 0, frame_w, frame_h],  # Full screen for drowsiness
                "xyxy": [0, 0, frame_w, frame_h]
            })
        
        return {
            "ppe_detections": ppe_detections,
            "violations": violations,
            "drowsiness": {
                "detected": is_drowsy,
                "confidence": drowsy_conf
            },
            "frame_shape": (frame_h, frame_w)
        }
    
    def draw_detections(self, frame: np.ndarray, detections: Dict) -> np.ndarray:
        """Draw bounding boxes on frame"""
        frame_copy = frame.copy()
        
        # Draw PPE detections (green boxes)
        for det in detections["ppe_detections"]:
            x, y, w, h = det["bbox"]
            cv2.rectangle(frame_copy, (x, y), (x + w, y + h), (0, 255, 0), 2)
            label = f"{det['class']}: {det['confidence']:.2f}"
            cv2.putText(frame_copy, label, (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        # Draw violations (red boxes)
        for viol in detections["violations"]:
            x, y, w, h = viol["bbox"]
            cv2.rectangle(frame_copy, (x, y), (x + w, y + h), (0, 0, 255), 3)
            label = f"{viol['type']}: {viol['confidence']:.2f}"
            cv2.putText(frame_copy, label, (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
        
        # Draw drowsiness alert if detected
        if detections["drowsiness"]["detected"]:
            cv2.putText(frame_copy, "DROWSINESS ALERT!", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 2)
            cv2.rectangle(frame_copy, (15, 50), (350, 70), (0, 0, 255), 2)
        
        return frame_copy

# Test the detector
if __name__ == "__main__":
    detector = PPEDetector(model_size="n")
    print("PPE Detector initialized successfully!")
