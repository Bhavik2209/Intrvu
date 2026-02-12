import logging
import hashlib
import time
from typing import Dict, Any

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import JsonOutputParser

from app.prompts.templates import EXTRACT_SYSTEM_TEMPLATE, EXTRACT_USER_TEMPLATE
from app.services.llm_service import get_llm_service
from app.core.config import settings
from app.core.exceptions import ResumeExtractionError, InvalidResumeContentError
from app.cache.redis_cache import redis_cache

logger = logging.getLogger(__name__)


def sanitize_input(text: str, max_length: int = 10000) -> str:
    """
    Sanitize and truncate input text to prevent excessive API calls.
    
    Args:
        text: Input text to sanitize
        max_length: Maximum allowed length
    
    Returns:
        Sanitized text
    """
    if not text:
        return ""
    
    return text[:max_length].strip()

def create_resume_extraction_chain():
    """
    Create a LangChain chain for resume information extraction.
    
    Returns:
        A LangChain chain for processing resume text
    """
    llm_service = get_llm_service()
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", EXTRACT_SYSTEM_TEMPLATE),
        ("user", EXTRACT_USER_TEMPLATE)
    ])
    
    json_parser = JsonOutputParser()
    
    chain = (
        {"resume_text": RunnablePassthrough()}
        | prompt
        | llm_service.provider._llm  # Access the internal LLM from provider
        | RunnableLambda(lambda x: x.content)
        | RunnableLambda(lambda x: x.replace("```json", "").replace("```", "").strip())
        | json_parser
    )
    
    return chain

# Create the extraction chain once
extraction_chain = create_resume_extraction_chain()

async def extract_components_openai(resume_text: str, use_cache: bool = True) -> Dict[str, Any]:
    """
    Extract structured information from resume text using LangChain with Redis caching.
    
    Args:
        resume_text: The text content of the resume
        use_cache: Whether to use caching for results
        
    Returns:
        Structured resume information
        
    Raises:
        InvalidResumeContentError: If resume text is too short or empty
        ResumeExtractionError: If extraction fails
    """
    # Input validation and sanitization
    resume_text = sanitize_input(resume_text)
    
    if not resume_text or len(resume_text.strip()) < 50:
        logger.warning("Resume text is too short")
        raise InvalidResumeContentError("Resume text is too short or empty (minimum 50 characters)")
    
    # Check Redis cache if enabled
    if use_cache:
        cache_key = redis_cache.generate_key("resume_extract", resume_text)
        cached_result = await redis_cache.get(cache_key)
        
        if cached_result:
            logger.info("Cache HIT - Using cached resume components from Redis")
            return cached_result
    
    # Cache miss - perform extraction
    logger.info("Cache MISS - Starting resume component extraction")
    start_time = time.time()
    
    try:
        result = extraction_chain.invoke(resume_text)
        
        # Validate result
        if not isinstance(result, dict):
            raise ValueError("Parsed result is not a dictionary")
        
        # Cache the result in Redis
        if use_cache:
            await redis_cache.set(cache_key, result, ttl=settings.cache_ttl_seconds)
            logger.info("Cached extraction result in Redis")
        
        # Log successful extraction
        elapsed = time.time() - start_time
        logger.info(f"Resume extraction completed in {elapsed:.2f} seconds")
        
        return result
        
    except Exception as e:
        logger.error(f"Resume extraction failed: {e}", exc_info=True)
        raise ResumeExtractionError(f"Failed to extract resume components: {str(e)}")
