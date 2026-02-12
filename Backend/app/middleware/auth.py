"""API key authentication middleware."""
from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# API key header
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    """
    Verify API key from request header.
    
    Args:
        api_key: API key from X-API-Key header
        
    Returns:
        The validated API key
        
    Raises:
        HTTPException: If API key is missing or invalid
    """
    # Skip authentication if not required
    if not settings.require_auth:
        return "auth_disabled"
    
    if not api_key:
        logger.warning("API request without API key")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Please provide X-API-Key header."
        )
    
    # Get valid API keys from settings (comma-separated)
    valid_keys = [k.strip() for k in settings.valid_api_keys.split(",") if k.strip()]
    
    if not valid_keys:
        logger.error("No valid API keys configured!")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication not properly configured"
        )
    
    if api_key not in valid_keys:
        logger.warning(f"Invalid API key attempt: {api_key[:8]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    logger.info(f"API key authenticated: {api_key[:8]}...")
    return api_key


def get_optional_api_key(api_key: str = Security(api_key_header)) -> str:
    """
    Optional API key verification (doesn't raise if auth is disabled).
    
    Args:
        api_key: API key from X-API-Key header
        
    Returns:
        The API key or None if auth is disabled
    """
    if not settings.require_auth:
        return None
    return api_key
