import os
import shutil
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List
from ultralytics import YOLO

# Use absolute import logic or relative based on how Vercel runs it
try:
    from .tracker import ShuttlecockTracker
except ImportError:
    from tracker import ShuttlecockTracker

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "/tmp/uploads" # Use /tmp for Vercel functions
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Load YOLOv8 model
# Vercel will look in the api/ directory or root.
# We'll put it in api/ for clarity.
model_path = os.path.join(os.path.dirname(__file__), "yolov8n.pt")
model = YOLO(model_path)

class VideoAnalyzer:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.cap = cv2.VideoCapture(file_path)
        self.fps = self.cap.get(cv2.CAP_PROP_FPS)
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.tracker = ShuttlecockTracker(dt=1/self.fps if self.fps > 0 else 1/60)

    def get_calibration_scale(self) -> float:
        return 5.0 / self.height if self.height > 0 else 0.005

    def analyze(self) -> Dict:
        if not self.cap.isOpened():
            return {"error": "Could not open video file"}

        m_per_px = self.get_calibration_scale()
        velocities = []
        angles = []
        max_velocity = 0
        impact_frame = 0
        frame_idx = 0
        trajectory = []
        prev_pos = None

        while self.cap.isOpened():
            ret, frame = self.cap.read()
            if not ret:
                break
            
            # Optimization for Vercel: Skip frames to fit 10s limit
            # Only process every 2nd frame
            if frame_idx % 2 != 0:
                frame_idx += 1
                continue

            results = model.predict(frame, classes=[32], conf=0.15, verbose=False)
            
            best_detection = None
            for r in results:
                if len(r.boxes) > 0:
                    best_detection = r.boxes[0]
                    break
            
            if best_detection:
                x, y, w, h = best_detection.xywh[0].tolist()
                current_pos = self.tracker.update(x, y)
                if prev_pos:
                    dx = (current_pos[0] - prev_pos[0]) * m_per_px
                    dy = (current_pos[1] - prev_pos[1]) * m_per_px
                    instant_vel = np.sqrt(dx**2 + dy**2) * (self.fps / 2) # Adj for frame skip
                    kmh = instant_vel * 3.6
                    angle = np.degrees(np.arctan2(-dy, dx))
                    
                    if 10 < kmh < 450:
                        velocities.append(kmh)
                        angles.append(angle)
                        if kmh > max_velocity:
                            max_velocity = kmh
                            impact_frame = frame_idx
                prev_pos = current_pos
                trajectory.append({"frame": frame_idx, "x": round(float(current_pos[0]), 1), "y": round(float(current_pos[1]), 1), "v": round(float(max_velocity), 1)})
            else:
                self.tracker.predict()
            
            frame_idx += 1
            # Hard limit for Vercel execution time (process max 100 frames)
            if frame_idx > 100:
                break

        self.cap.release()
        
        avg_velocity = np.mean(velocities) if velocities else 0
        steepness = np.mean(angles) if angles else 0
        
        return {
            "metadata": {
                "fps": round(self.fps, 2),
                "resolution": f"{self.width}x{self.height}",
                "processed_frames": frame_idx,
                "note": "Optimized for serverless: every 2nd frame processed."
            },
            "results": {
                "peak_velocity": round(max_velocity, 1),
                "average_speed": round(avg_velocity, 1),
                "impact_angle": round(steepness, 1),
                "impact_frame_sec": round(impact_frame / self.fps, 3) if self.fps > 0 else 0
            },
            "trajectory": trajectory[::2]
        }

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/analyze")
async def analyze_video(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    analyzer = VideoAnalyzer(file_path)
    result = analyzer.analyze()
    return {"filename": file.filename, **result}
