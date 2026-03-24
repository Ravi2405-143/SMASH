from ultralytics import YOLO
import os

# Load the PyTorch model
model = YOLO("api/yolov8n.pt")

# Export to ONNX
# format='onnx' exports to ONNX
# imgsz is the input size (default 640)
print("Exporting model to ONNX...")
model.export(format="onnx", imgsz=640)

# Check if the file exists
if os.path.exists("api/yolov8n.onnx"):
    print("SUCCESS: api/yolov8n.onnx created.")
else:
    # Ultralytics might export to the same folder as the input
    if os.path.exists("api/yolov8n_onnx/yolov8n.onnx"):
        import shutil
        shutil.move("api/yolov8n_onnx/yolov8n.onnx", "api/yolov8n.onnx")
        print("SUCCESS: api/yolov8n.onnx moved to api/")
