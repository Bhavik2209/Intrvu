"""Timeout middleware to prevent hanging requests."""
import asyncio
import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings

logger = logging.getLogger(__name__)


class TimeoutMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce request timeout limits."""
    
    async def dispatch(self, request: Request, call_next):
        """
        Process request with timeout enforcement.
        
        Args:
            request: The incoming request
            call_next: The next middleware/handler
            
        Returns:
            Response or timeout error
        """
        try:
            # Apply timeout to request processing
            response = await asyncio.wait_for(
                call_next(request),
                timeout=settings.request_timeout
            )
            return response
            
        except asyncio.TimeoutError:
            logger.error(
                f"Request timeout after {settings.request_timeout}s: "
                f"{request.method} {request.url.path}"
            )
            return JSONResponse(
                status_code=504,
                content={
                    "error": "Request timeout",
                    "message": f"Request took longer than {settings.request_timeout} seconds to process",
                    "suggestion": "The analysis is taking longer than expected. Please try again or contact support."
                }
            )
