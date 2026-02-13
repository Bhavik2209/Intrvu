"""Redis-based distributed cache for multi-worker environments with Upstash support."""
import redis.asyncio as redis
from upstash_redis import Redis as UpstashRedis
from typing import Optional, Any, Union
import json
import hashlib
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisCache:
    """Async Redis cache wrapper with error handling and Upstash HTTP support."""
    
    def __init__(self):
        self.redis_client: Optional[Union[redis.Redis, UpstashRedis]] = None
        self.is_upstash = False
    
    async def connect(self):
        """Initialize Redis connection. Uses Upstash HTTP if credentials present."""
        try:
            if settings.upstash_redis_rest_url and settings.upstash_redis_rest_token:
                # Use Upstash REST client for serverless compatibility
                logger.info("Initializing Upstash REST Redis client")
                self.redis_client = UpstashRedis(
                    url=settings.upstash_redis_rest_url,
                    token=settings.upstash_redis_rest_token
                )
                self.is_upstash = True
                # Test connection (Upstash client is synchronous-style but uses HTTP)
                # In upstash-redis, the client itself handles requests via HTTP
                if self.redis_client.ping():
                    logger.info("Upstash Redis connected successfully")
                else:
                    logger.warning("Upstash Redis ping failed")
            else:
                # Use standard redis-py for local development or traditional Redis
                logger.info(f"Initializing standard Redis client: {settings.redis_url}")
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
                logger.info("Standard Redis cache connected successfully")
                self.is_upstash = False
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None
    
    async def disconnect(self):
        """Close Redis connection gracefully."""
        if not self.is_upstash and self.redis_client:
            try:
                await self.redis_client.close()
                logger.info("Redis cache disconnected")
            except Exception as e:
                logger.error(f"Error disconnecting from Redis: {e}")
    
    async def get(self, key: str) -> Optional[dict]:
        """Get cached value by key."""
        if not self.redis_client:
            return None
        
        try:
            if self.is_upstash:
                # Upstash client methods are synchronous as they use HTTP
                data = self.redis_client.get(key)
            else:
                data = await self.redis_client.get(key)
                
            if data:
                if isinstance(data, str):
                    return json.loads(data)
                return data # Upstash might return dict directly if configured
            return None
        except Exception as e:
            logger.error(f"Redis get error for key '{key}': {e}")
            return None
    
    async def set(self, key: str, value: dict, ttl: int = 3600):
        """Set cached value with TTL."""
        if not self.redis_client:
            return
        
        try:
            if self.is_upstash:
                self.redis_client.setex(
                    key,
                    ttl,
                    json.dumps(value)
                )
            else:
                await self.redis_client.setex(
                    key,
                    ttl,
                    json.dumps(value)
                )
        except Exception as e:
            logger.error(f"Redis set error for key '{key}': {e}")
    
    async def delete(self, key: str):
        """Delete cached value by key."""
        if not self.redis_client:
            return
        
        try:
            if self.is_upstash:
                self.redis_client.delete(key)
            else:
                await self.redis_client.delete(key)
        except Exception as e:
            logger.error(f"Redis delete error for key '{key}': {e}")
    
    def generate_key(self, prefix: str, *args) -> str:
        """Generate consistent cache key from arguments."""
        combined = "|".join(str(arg) for arg in args)
        hash_key = hashlib.sha256(combined.encode()).hexdigest()
        return f"{prefix}:{hash_key}"


# Global singleton instance
redis_cache = RedisCache()
