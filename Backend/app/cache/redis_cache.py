"""Redis-based distributed cache for multi-worker environments."""
import redis.asyncio as redis
from typing import Optional, Any
import json
import hashlib
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisCache:
    """Async Redis cache wrapper with error handling."""
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
    
    async def connect(self):
        """Initialize Redis connection with connection pooling."""
        try:
            self.redis_client = await redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
                max_connections=settings.redis_max_connections,
                socket_keepalive=True,
                socket_connect_timeout=5,
                retry_on_timeout=True
            )
            # Test connection
            await self.redis_client.ping()
            logger.info("Redis cache connected successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            # Don't raise - allow app to start without Redis
            self.redis_client = None
    
    async def disconnect(self):
        """Close Redis connection gracefully."""
        if self.redis_client:
            try:
                await self.redis_client.close()
                logger.info("Redis cache disconnected")
            except Exception as e:
                logger.error(f"Error disconnecting from Redis: {e}")
    
    async def get(self, key: str) -> Optional[dict]:
        """
        Get cached value by key.
        
        Args:
            key: Cache key
            
        Returns:
            Cached dict value or None if not found/error
        """
        if not self.redis_client:
            logger.warning("Redis client not available")
            return None
        
        try:
            data = await self.redis_client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Redis get error for key '{key}': {e}")
            return None
    
    async def set(self, key: str, value: dict, ttl: int = 3600):
        """
        Set cached value with TTL.
        
        Args:
            key: Cache key
            value: Dict value to cache
            ttl: Time to live in seconds (default: 1 hour)
        """
        if not self.redis_client:
            logger.warning("Redis client not available")
            return
        
        try:
            await self.redis_client.setex(
                key,
                ttl,
                json.dumps(value)
            )
        except Exception as e:
            logger.error(f"Redis set error for key '{key}': {e}")
    
    async def delete(self, key: str):
        """
        Delete cached value by key.
        
        Args:
            key: Cache key to delete
        """
        if not self.redis_client:
            return
        
        try:
            await self.redis_client.delete(key)
        except Exception as e:
            logger.error(f"Redis delete error for key '{key}': {e}")
    
    def generate_key(self, prefix: str, *args) -> str:
        """
        Generate consistent cache key from arguments.
        
        Args:
            prefix: Key prefix (e.g., 'resume_extract', 'analysis')
            *args: Variable arguments to include in key
            
        Returns:
            Cache key in format: prefix:hash
        """
        combined = "|".join(str(arg) for arg in args)
        hash_key = hashlib.sha256(combined.encode()).hexdigest()
        return f"{prefix}:{hash_key}"


# Global singleton instance
redis_cache = RedisCache()
