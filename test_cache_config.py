import asyncio
import sys
import os
from unittest.mock import MagicMock

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

async def test_cache():
    print("Testing RedisCache implementation...")
    
    # Mock settings to use Upstash if needed, or stick to local
    from app.core.config import settings
    from app.cache.redis_cache import redis_cache
    
    # Test 1: Connect
    try:
        await redis_cache.connect()
        print(f"Connected. Upstash mode: {redis_cache.is_upstash}")
        
        if not redis_cache.redis_client:
            print("Warning: Redis client not initialized (missing credentials?)")
            return
            
        # Test 2: Set
        test_key = "test_vercel_upstash"
        test_val = {"status": "success", "message": "hello from vercel setup"}
        await redis_cache.set(test_key, test_val, ttl=60)
        print(f"Set key: {test_key}")
        
        # Test 3: Get
        get_val = await redis_cache.get(test_key)
        print(f"Got value: {get_val}")
        
        if get_val == test_val:
            print("Verification SUCCESS: Get matches Set")
        else:
            print("Verification FAILED: Get does not match Set")
            
        # Test 4: Delete
        await redis_cache.delete(test_key)
        print(f"Deleted key: {test_key}")
        
        # Test 5: Verify deletion
        del_val = await redis_cache.get(test_key)
        if del_val is None:
            print("Verification SUCCESS: Key deleted")
        else:
            print(f"Verification FAILED: Key still exists: {del_val}")
            
    except Exception as e:
        print(f"Error during verification: {e}")
    finally:
        await redis_cache.disconnect()

if __name__ == "__main__":
    asyncio.run(test_cache())
