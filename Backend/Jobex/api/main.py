from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import your app
from app.main import app

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # During development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Resume Analysis API"}
# This is required for Vercel serverless deployment
handler = app