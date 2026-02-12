"""OpenAI model interface using centralized LLM service with resilience patterns."""
import logging
import asyncio
from typing import Dict, Any, List, Callable
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.services.llm_service import get_llm_service
from app.core.exceptions import OpenAIError
from app.resilience.circuit_breaker import openai_breaker

logger = logging.getLogger(__name__)


@retry(
    stop=stop_after_attempt(3),  # Retry up to 3 times
    wait=wait_exponential(multiplier=1, min=2, max=10),  # Exponential backoff: 2s, 4s, 8s
    retry=retry_if_exception_type(OpenAIError),  # Only retry on OpenAI errors
    reraise=True
)
@openai_breaker  # Circuit breaker wrapper
def gen_model(prompt: str) -> Dict[str, Any]:
    """
    Generate a response using the centralized LLM service with resilience patterns.
    
    Features:
    - Circuit breaker: Fails fast if OpenAI API is down (5 failures = 60s cooldown)
    - Retry logic: Retries up to 3 times with exponential backoff
    
    Args:
        prompt: The prompt to send to the LLM
        
    Returns:
        Dict containing the parsed JSON response
        
    Raises:
        OpenAIError: If the generation fails after retries
        CircuitBreakerError: If circuit is open (too many failures)
    """
    try:
        llm_service = get_llm_service()
        result = llm_service.generate_json(prompt)
        logger.info("LLM generation completed successfully")
        return result
        
    except Exception as e:
        logger.error(f"Error in gen_model: {str(e)}")
        logger.debug(f"Prompt preview: {prompt[:200]}...")
        raise OpenAIError(f"Failed to generate model response: {str(e)}")


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(OpenAIError),
    reraise=True
)
@openai_breaker
async def gen_model_async(prompt: str) -> Dict[str, Any]:
    """
    Generate a response using the centralized LLM service asynchronously.
    
    Features:
    - Circuit breaker: Fails fast if OpenAI API is down
    - Retry logic: Retries up to 3 times with exponential backoff
    - Async: Non-blocking for concurrent operations
    
    Args:
        prompt: The prompt to send to the LLM
        
    Returns:
        Dict containing the parsed JSON response
        
    Raises:
        OpenAIError: If the generation fails after retries
        CircuitBreakerError: If circuit is open
    """
    try:
        llm_service = get_llm_service()
        result = await llm_service.generate_json_async(prompt)
        logger.info("Async LLM generation completed successfully")
        return result
        
    except Exception as e:
        logger.error(f"Error in gen_model_async: {str(e)}")
        logger.debug(f"Prompt preview: {prompt[:200]}...")
        raise OpenAIError(f"Failed to generate model response: {str(e)}")


async def batch_gen_model(prompts: List[str], max_concurrent: int = 5) -> List[Dict[str, Any]]:
    """
    Process multiple prompts concurrently with controlled concurrency.
    
    Args:
        prompts: List of prompts to process
        max_concurrent: Maximum number of concurrent API calls (default: 5)
        
    Returns:
        List of results in the same order as input prompts
        
    Raises:
        OpenAIError: If any generation fails
    """
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def process_with_semaphore(prompt: str) -> Dict[str, Any]:
        async with semaphore:
            return await gen_model_async(prompt)
    
    # Process all prompts concurrently with controlled concurrency
    results = await asyncio.gather(
        *[process_with_semaphore(prompt) for prompt in prompts],
        return_exceptions=False
    )
    
    return results

