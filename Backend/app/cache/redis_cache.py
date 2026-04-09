"""In-memory cache used as a local fallback when Redis is disabled."""
import asyncio
from typing import Optional, Dict, Tuple
import hashlib
import logging
import time
from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisCache:
    """Async cache wrapper backed by local process memory."""
    
    def __init__(self):
        self.redis_client = None
        self._store: Dict[str, Tuple[float, dict]] = {}
    
    async def connect(self):
        """Initialize local cache store."""
        await asyncio.sleep(0)
        self._store = {}
        self.redis_client = self._store
        logger.info("Using in-memory local cache (Redis disabled)")
    
    async def disconnect(self):
        """Clear local cache on shutdown."""
        await asyncio.sleep(0)
        self._store.clear()
        self.redis_client = None
        logger.info("Local cache cleared")

    def _is_expired(self, expires_at: float) -> bool:
        return time.time() >= expires_at
    
    async def get(self, key: str) -> Optional[dict]:
        """Get cached value by key."""
        await asyncio.sleep(0)
        if key not in self._store:
            return None

        expires_at, data = self._store[key]
        if self._is_expired(expires_at):
            self._store.pop(key, None)
            return None

        return data
    
    async def set(self, key: str, value: dict, ttl: int = 3600):
        """Set cached value with TTL."""
        await asyncio.sleep(0)
        expires_at = time.time() + max(ttl, 1)
        self._store[key] = (expires_at, value)
    
    async def delete(self, key: str):
        """Delete cached value by key."""
        await asyncio.sleep(0)
        self._store.pop(key, None)
    
    def generate_key(self, prefix: str, *args) -> str:
        """Generate consistent cache key from arguments."""
        combined = "|".join(str(arg) for arg in args)
        hash_key = hashlib.sha256(combined.encode()).hexdigest()
        return f"{prefix}:{hash_key}"


# Global singleton instance
redis_cache = RedisCache()
