import sys
import subprocess
import os

print(f"Python executable: {sys.executable}")
print(f"Python version: {sys.version}")
print(f"CWD: {os.getcwd()}")
print("--- sys.path ---")
for p in sys.path:
    print(p)

print("\n--- trying imports ---")
try:
    import ultralytics
    print("ultralytics: SUCCESS")
    print(f"ultralytics path: {ultralytics.__file__}")
except ImportError as e:
    print(f"ultralytics: FAILED ({e})")

try:
    import filterpy
    print("filterpy: SUCCESS")
except ImportError as e:
    print(f"filterpy: FAILED ({e})")

print("\n--- pip check ---")
try:
    result = subprocess.run([sys.executable, "-m", "pip", "show", "ultralytics"], capture_output=True, text=True)
    print(result.stdout)
except Exception as e:
    print(f"Pip check failed: {e}")
