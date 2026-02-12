"""
Job description filtering utility using LLM.

This module provides intelligent filtering of job descriptions from raw text content,
removing navigation, sidebar, and other unwanted elements that DOM cleaning may miss.
"""

import logging
from typing import Optional

from app.services.llm_service import get_llm_service
from app.core.exceptions import OpenAIError

logger = logging.getLogger(__name__)


def filter_job_description_llm(raw_text: str) -> str:
    """
    Placeholder for job description filtering.
    
    Currently disabled due to Groq's 1MB request size limit.
    Returns the original text without LLM processing.
    
    Args:
        raw_text: Cleaned text from DOM filtering
        
    Returns:
        The original input text (DOM-cleaned)
        
    Raises:
        ValueError: If input text is too short or empty
    """
    if not raw_text or len(raw_text.strip()) < 100:
        raise ValueError("Text too short for filtering (minimum 100 characters)")
    
    # Return original text without LLM processing to avoid Groq's size limits
    logger.info(f"Job description filtering bypassed (length: {len(raw_text)} chars)")
    return raw_text
