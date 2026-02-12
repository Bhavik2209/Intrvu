"""Optimized async analysis functions for faster parallel processing."""
import asyncio
import logging
from typing import Dict, Any
from app.services.openai_model import gen_model_async
from app.prompts.templates import (
    keyword_match_prompt,
    job_experience_prompt,
    education_certifications_prompt,
    action_words_prompt,
    measurable_results_prompt,
    bullet_point_effectiveness_prompt
)

logger = logging.getLogger(__name__)


async def keyword_match_async(resume_text: Dict[str, Any], job_description: str) -> Dict[str, Any]:
    """Async version of keyword matching analysis."""
    if not job_description or not resume_text:
        raise ValueError("Job description or resume text is empty")
    
    prompt = keyword_match_prompt(resume_text, job_description)
    response = await gen_model_async(prompt)
    
    # Validate and cap points at 35
    if response.get('score', {}).get('pointsAwarded', 0) > 35:
        response['score']['pointsAwarded'] = 35
    
    return response


async def job_experience_async(resume_text: Dict[str, Any], job_description: str) -> Dict[str, Any]:
    """Async version of job experience analysis."""
    if not job_description or not resume_text:
        raise ValueError("Job description or resume text is empty")
    
    prompt = job_experience_prompt(resume_text, job_description)
    response = await gen_model_async(prompt)
    
    # Validate and cap points at 30
    if response.get('score', {}).get('pointsAwarded', 0) > 30:
        response['score']['pointsAwarded'] = 30
    
    return response


async def education_certifications_async(certifications: list, education: Dict[str, Any], job_description: str) -> Dict[str, Any]:
    """Async version of education and certifications analysis."""
    if not job_description:
        raise ValueError("Job description is empty")
    
    prompt = education_certifications_prompt(certifications, education, job_description)
    response = await gen_model_async(prompt)
    
    # Validate and cap points at 20
    if response.get('score', {}).get('pointsAwarded', 0) > 20:
        response['score']['pointsAwarded'] = 20
    
    return response


async def action_words_async(resume_text: Dict[str, Any], job_description: str) -> Dict[str, Any]:
    """Async version of action words analysis."""
    if not job_description or not resume_text:
        raise ValueError("Job description or resume text is empty")
    
    prompt = action_words_prompt(resume_text, job_description)
    response = await gen_model_async(prompt)
    
    # Validate and cap points at 25
    if response.get('score', {}).get('pointsAwarded', 0) > 25:
        response['score']['pointsAwarded'] = 25
    
    return response


async def measurable_results_async(resume_text: Dict[str, Any], job_description: str) -> Dict[str, Any]:
    """Async version of measurable results analysis."""
    if not job_description or not resume_text:
        raise ValueError("Job description or resume text is empty")
    
    prompt = measurable_results_prompt(resume_text, job_description)
    response = await gen_model_async(prompt)
    
    # Validate and cap points at 25
    if response.get('score', {}).get('pointsAwarded', 0) > 25:
        response['score']['pointsAwarded'] = 25
    
    return response


async def bullet_point_effectiveness_async(resume_text: Dict[str, Any]) -> Dict[str, Any]:
    """Async version of bullet point effectiveness analysis."""
    if not resume_text:
        raise ValueError("Resume text is empty")
    
    prompt = bullet_point_effectiveness_prompt(resume_text)
    response = await gen_model_async(prompt)
    
    # Validate and cap points at 20
    if response.get('score', {}).get('pointsAwarded', 0) > 20:
        response['score']['pointsAwarded'] = 20
    
    return response
