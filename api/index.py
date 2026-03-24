import os
import shutil
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List
import onnxruntime as ort

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

# Load ONNX model
model_path = os.path.join(os.path.dirname(__file__), "yolov8n.onnx")
session = ort.InferenceSession(model_path)
input_name = session.get_inputs()[0].name

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
            # Only process every 4th frame for faster serverless response
            if frame_idx % 4 != 0:
                frame_idx += 1
                continue

            # Standard Pre-processing for YOLOv8 ONNX
            img = cv2.resize(frame, (640, 640))
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            img = img.transpose(2, 0, 1) 
            img = np.expand_dims(img, axis=0).astype(np.float32) / 255.0

            # ONNX Inference
            outputs = session.run(None, {input_name: img})
            preds = outputs[0][0] # [84, 8400]
            
            # class 32 is 'sports ball'. index 4 + 32 = 36
            confs = preds[36, :]
            best_idx = np.argmax(confs)
            
            best_detection = None
            if confs[best_idx] > 0.2:
                # Get coords (normalized to 640x640)
                cx, cy, _, _ = preds[:4, best_idx]
                
                # Rescale to original resolution
                orig_x = (cx / 640.0) * self.width
                orig_y = (cy / 640.0) * self.height
                
                current_pos = self.tracker.update(orig_x, orig_y)
                if prev_pos:
                    dx = (current_pos[0] - prev_pos[0]) * m_per_px
                    dy = (current_pos[1] - prev_pos[1]) * m_per_px
                    # Adj for frame skip (fps / skip_factor)
                    instant_vel = np.sqrt(dx**2 + dy**2) * (self.fps / 4)
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
            # Hard limit for Vercel execution time (process max 180 frames)
            if frame_idx > 180:
                break

        self.cap.release()
        
        avg_velocity = np.mean(velocities) if velocities else 0
        steepness = np.mean(angles) if angles else 0
        
        return {
            "metadata": {
                "fps": round(self.fps, 2),
                "resolution": f"{self.width}x{self.height}",
                "processed_frames": frame_idx,
                "note": "Ultra-optimized for serverless: every 4th frame processed with ONNX Runtime."
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
@app.get("/health")
@app.get("/")
def health():
    return {"status": "ok", "mode": "onnx"}

@app.post("/api/analyze")
@app.post("/analyze")
@app.post("/")
async def analyze_video(request: Request, file: UploadFile = File(...)):
    # Create absolute path for Vercel
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    analyzer = VideoAnalyzer(file_path)
    result = analyzer.analyze()
    return {"filename": file.filename, **result}

# Removed catch_all debug route for production cleanliness
