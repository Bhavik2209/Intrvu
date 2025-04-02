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

# Simple rate limiting using a dictionary
rate_limit_data = defaultdict(list)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    now = datetime.now()
    
    # Remove old requests
    rate_limit_data[client_ip] = [
        req_time for req_time in rate_limit_data[client_ip]
        if now - req_time < timedelta(minutes=1)
    ]
    
    # Check rate limit (5 requests per minute)
    if len(rate_limit_data[client_ip]) >= 5:
        return JSONResponse(
            status_code=429,
            content={"error": True, "detail": "Too many requests. Please try again later."}
        )
    
    # Add current request
    rate_limit_data[client_ip].append(now)
    
    # Process the request
    response = await call_next(request)
    return response

# Global exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "detail": exc.detail
        }
    )

# Import all routes from app.main
from app.main import router
app.include_router(router)

# This is required for Vercel serverless deployment
handler = app