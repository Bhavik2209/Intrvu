from fastapi import FastAPI
from app.main import app
import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# This is required for Vercel serverless deployment
handler = app