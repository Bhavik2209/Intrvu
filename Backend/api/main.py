from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
import time
from datetime import datetime, timedelta
from collections import defaultdict
from routers.analyze import router as analyze_router

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Create a new FastAPI instance
app = FastAPI(
    title="Resume Analysis API",
    description="Secure API for analyzing resumes against job descriptions",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # During development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import new structured router
app.include_router(analyze_router)

@app.get("/ping")
def ping():
    return {"status": "alive"}