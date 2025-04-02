from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import sys
import os
import time
from fastapi import HTTPException, Request

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Rate limiting middleware
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit=5, window=60):  # Reduce limit for production
        super().__init__(app)
        self.limit = limit
        self.window = window
        self.requests = {}

    async def dispatch(self, request: Request, call_next):
        # Get client IP (consider using X-Forwarded-For for proxy support)
        client_ip = request.client.host
        
        # Track request count for this IP
        current_time = time.time()
        if client_ip not in self.requests:
            self.requests[client_ip] = []
        
        # Remove old requests
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] 
            if current_time - t < self.window
        ]
        
        # Check rate limit
        if len(self.requests[client_ip]) >= self.limit:
            raise HTTPException(
                status_code=429, 
                detail="Too many requests. Please try again later."
            )
        
        # Add current request time
        self.requests[client_ip].append(current_time)
        
        response = await call_next(request)
        return response

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

# Add rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# Import all routes from app.main
from app.main import router
app.include_router(router)

# This is required for Vercel serverless deployment
handler = app