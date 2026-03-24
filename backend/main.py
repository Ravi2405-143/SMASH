import os
import shutil
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List
from ultralytics import YOLO
from tracker import ShuttlecockTracker

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Load YOLOv8 model (lightweight version)
# This will download yolov8n.pt if not present
model = YOLO("yolov8n.pt")

class VideoAnalyzer:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.cap = cv2.VideoCapture(file_path)
        self.fps = self.cap.get(cv2.CAP_PROP_FPS)
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.tracker = ShuttlecockTracker(dt=1/self.fps if self.fps > 0 else 1/60)

    def get_calibration_scale(self) -> float:
        """
        Determines the meters per pixel.
        In a real app, this would use detected court corners.
        Here we'll assume a standard side-view perspective:
        A typical frame height (e.g. 1080p) covers ~5 meters of vertical space.
        """
        # 5 meters / 1080 pixels = ~0.0046 m/px
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
            
            # Use YOLO detection
            results = model.predict(frame, classes=[32], conf=0.15, verbose=False)
            
            best_detection = None
            for r in results:
                if len(r.boxes) > 0:
                    best_detection = r.boxes[0]
                    break
            
            if best_detection:
                x, y, w, h = best_detection.xywh[0].tolist()
                current_pos = self.tracker.update(x, y)
                
                # Calculate physics
                if prev_pos:
                    dx = (current_pos[0] - prev_pos[0]) * m_per_px
                    dy = (current_pos[1] - prev_pos[1]) * m_per_px
                    
                    # Instantaneous velocity (m/s)
                    instant_vel = np.sqrt(dx**2 + dy**2) * self.fps
                    kmh = instant_vel * 3.6
                    
                    # Smash angle (degrees) - relative to horizontal
                    # In OpenCV, y increases downwards, so we negate dy to get Cartesian angle
                    angle = np.degrees(np.arctan2(-dy, dx))
                    
                    # Filter out noise (shuttlecocks don't move 1000km/h or backwards relative to hits)
                    if 10 < kmh < 450:
                        velocities.append(kmh)
                        angles.append(angle)
                        
                        if kmh > max_velocity:
                            max_velocity = kmh
                            impact_frame = frame_idx
                
                prev_pos = current_pos
                
                trajectory.append({
                    "frame": frame_idx,
                    "x": round(float(current_pos[0]), 1),
                    "y": round(float(current_pos[1]), 1),
                    "v": round(float(max_velocity), 1)
                })
            else:
                self.tracker.predict()
            
            frame_idx += 1
            # Process up to 10 seconds of video
            if frame_idx > self.fps * 10: 
                break

        self.cap.release()
        
        # Calculate final stats
        avg_velocity = np.mean(velocities) if velocities else 0
        
        # Determining "Steepness" by taking the angle at the point of max velocity (the smash impact)
        # Or peak angle if multiple hits. For simple analyzer, we'll take the mean of the top 5% speeds.
        steepness = np.mean(angles) if angles else 0
        
        return {
            "metadata": {
                "fps": round(self.fps, 2),
                "resolution": f"{self.width}x{self.height}",
                "processed_frames": frame_idx
            },
            "results": {
                "peak_velocity": round(max_velocity, 1),
                "average_speed": round(avg_velocity, 1),
                "impact_angle": round(steepness, 1),
                "impact_frame_sec": round(impact_frame / self.fps, 3) if self.fps > 0 else 0
            },
            "trajectory": trajectory[::3] # Subsample for charts
        }

@app.get("/")
async def root():
    return {"message": "Smash Analyzer API is running"}

@app.post("/analyze")
async def analyze_video(file: UploadFile = File(...)) -> Dict:
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    analyzer = VideoAnalyzer(file_path)
    result = analyzer.analyze()
    
    return {
        "filename": file.filename,
        **result
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
