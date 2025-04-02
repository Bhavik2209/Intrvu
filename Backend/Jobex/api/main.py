from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
import time
from datetime import datetime, timedelta
from collections import defaultdict

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

# Import all routes from app.main
from app.main import router
app.include_router(router)

# This is the correct way to export the app for Vercel serverless
# Do NOT set handler = app directly