import uvicorn
import os
import sys

# Add the api directory to path so it can find tracker.py
sys.path.append(os.path.join(os.getcwd(), 'api'))

if __name__ == "__main__":
    from api.index import app
    print("Starting local development server for AI Smash Analyzer...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
