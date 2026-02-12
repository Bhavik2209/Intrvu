from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
import logging

from routers.analyze import router as analyze_router
from app.core.config import settings, setup_logging
from app.cache.redis_cache import redis_cache
from app.middleware.rate_limit import limiter, rate_limit_exceeded_handler
from app.middleware.timeout_middleware import TimeoutMiddleware
from slowapi.errors import RateLimitExceeded

logger = logging.getLogger(__name__)

# Setup logging first
setup_logging()

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Create a new FastAPI instance
app = FastAPI(
    title="Resume Analysis API",
    description="Secure API for analyzing resumes against job descriptions",
    version="1.0.0"
)

# Add CORS middleware with environment-based configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins_list(),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Add timeout middleware
app.add_middleware(TimeoutMiddleware)

# Import new structured router
app.include_router(analyze_router)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("Starting up application...")
    await redis_cache.connect()
    logger.info("Application startup complete")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup services on shutdown."""
    logger.info("Shutting down application...")
    await redis_cache.disconnect()
    logger.info("Application shutdown complete")


@app.get("/ping")
async def ping():
    """Simple ping endpoint for basic health check."""
    return {"status": "ok", "message": "pong"}


@app.get("/health")
async def health_check():
    """
    Comprehensive health check endpoint.
    Checks Redis connection and overall system health.
    """
    health = {
        "status": "healthy",
        "checks": {}
    }
    
    # Check Redis connection
    try:
        if redis_cache.redis_client:
            await redis_cache.redis_client.ping()
            health["checks"]["redis"] = "healthy"
        else:
            health["checks"]["redis"] = "not_connected"
            health["status"] = "degraded"
    except Exception as e:
        health["checks"]["redis"] = f"unhealthy: {str(e)}"
        health["status"] = "unhealthy"
    
    # Add version info
    health["version"] = "1.0.0"
    
    return health