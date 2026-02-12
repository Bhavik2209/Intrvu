"""
Resume Analysis V4 - IntrvuFit Resume Optimizer

This module implements the V4 scoring system with two independent dimensions:
1. Job Fit Score (0-100) - exposed to user
2. Resume Quality Score (0-100) - converted to tier label

All scoring follows the V4 specification exactly.
"""

import logging
import json
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from app.services.openai_model import gen_model_async
from app.prompts.templates import (
    education_requirement_prompt,
    keyword_match_prompt,
    job_experience_prompt,
    skills_tools_relevance_prompt,
    action_words_prompt,
    measurable_results_prompt,
    bullet_point_effectiveness_prompt
)
from app.utils.score_validator import (
    validate_numeric,
    validate_range,
    safe_divide,
    round_to_precision,
    validate_and_sanitize_response,
    get_job_fit_label,
    get_resume_quality_tier
)
from app.utils.context_analyzer import analyze_context
from app.cache.redis_cache import redis_cache

logger = logging.getLogger(__name__)


async def analyze_education_requirement_v4(education: Any, job_description: str) -> Dict[str, Any]:
    """
    V4: Education Requirement - Binary gate (0 or 20 points)
    
    Args:
        education: Education data from resume
        job_description: Job description text
        
    Returns:
        Dict with score and analysis
    """
    try:
        prompt = education_requirement_prompt(education, job_description)
        result = await gen_model_async(prompt)
        
        # Validate and ensure binary scoring
        points = validate_numeric(result['score']['pointsAwarded'], 'education.pointsAwarded')
        
        # Force binary: must be exactly 0 or 20
        if points > 10:
            points = 20.0
        else:
            points = 0.0
        
        result['score']['pointsAwarded'] = points
        result['score']['maxPoints'] = 20
        result['score']['passed'] = (points == 20)
        
        return result
        
    except Exception as e:
        logger.error(f"Error in education requirement analysis: {e}")
        return {
            "score": {
                "pointsAwarded": 0.0,
                "maxPoints": 20,
                "passed": False,
                "rating": "Requirement Not Met",
                "ratingSymbol": "❌"
            },
            "analysis": {
                "degreeFound": "None",
                "degreeType": "None",
                "status": "Fail",
                "symbol": "❌",
                "suggestedImprovements": "Unable to analyze education. Please ensure Bachelor's degree or equivalent is listed."
            }
        }


async def analyze_keyword_match_v4(resume_text: Any, job_description: str) -> Dict[str, Any]:
    """
    V4: Keyword & Contextual Match (0-35 points)
    
    Implements semantic matching with guardrails:
    - Strong match (≥0.80 similarity): +2
    - Partial match (0.65-0.80): +1
    - Missing critical: -1
    - Keyword stuffing: -2
    - Penalties capped at 40% (14 points)
    
    Args:
        resume_text: Resume text or dict
        job_description: Job description text
        
    Returns:
        Dict with score and analysis
    """
    try:
        prompt = keyword_match_prompt(resume_text, job_description)
        result = await gen_model_async(prompt)
        
        # Validate score
        points = validate_numeric(result['score']['pointsAwarded'], 'keyword.pointsAwarded')
        points = validate_range(points, 0, 35, 'keyword.pointsAwarded')
        
        result['score']['pointsAwarded'] = round_to_precision(points, 1)
        result['score']['maxPoints'] = 35
        
        return result
        
    except Exception as e:
        logger.error(f"Error in keyword match analysis: {e}")
        return {
            "score": {
                "pointsAwarded": 0.0,
                "maxPoints": 35,
                "matchPercentage": 0.0,
                "rating": "Poor",
                "ratingSymbol": "❌"
            },
            "analysis": {
                "strongMatches": [],
                "partialMatches": [],
                "missingKeywords": [],
                "keywordStuffing": [],
                "suggestedImprovements": "Unable to analyze keywords. Please try again."
            }
        }


async def analyze_experience_alignment_v4(resume_text: Any, job_description: str) -> Dict[str, Any]:
    """
    V4: Experience Alignment (0-30 points with normalization)
    
    Scoring per role:
    - Strong match: +3
    - Partial match: +1.5
    - Misaligned: -1
    
    Normalization:
    - expected_max = min(num_relevant_roles × 3, 12)
    - final_score = min((raw_score / expected_max) × 30, 30)
    
    Args:
        resume_text: Work experience data
        job_description: Job description text
        
    Returns:
        Dict with score and analysis
    """
    try:
        prompt = job_experience_prompt(resume_text, job_description)
        result = await gen_model_async(prompt)
        
        # Extract raw score and calculate normalization
        raw_score = result['score'].get('rawScore', result['score']['pointsAwarded'])
        num_relevant_roles = result['score'].get('numberOfRelevantRoles', 1)
        
        # Calculate expected max
        expected_max = min(num_relevant_roles * 3, 12)
        expected_max = max(expected_max, 1)  # Prevent division by zero
        
        # Apply normalization formula
        normalized_score = safe_divide(raw_score, expected_max, 0.0) * 30
        final_score = min(normalized_score, 30.0)
        
        result['score']['pointsAwarded'] = round_to_precision(final_score, 1)
        result['score']['maxPoints'] = 30
        result['score']['rawScore'] = round_to_precision(raw_score, 1)
        result['score']['expectedMax'] = expected_max
        
        return result
        
    except Exception as e:
        logger.error(f"Error in experience alignment analysis: {e}")
        return {
            "score": {
                "pointsAwarded": 0.0,
                "maxPoints": 30,
                "rawScore": 0.0,
                "expectedMax": 12,
                "numberOfRelevantRoles": 0,
                "alignmentPercentage": 0.0,
                "rating": "No Relevant Experience",
                "ratingSymbol": "❌"
            },
            "analysis": {
                "strongMatches": [],
                "partialMatches": [],
                "misalignedRoles": [],
                "suggestedImprovements": "Unable to analyze experience. Please try again."
            }
        }


async def analyze_skills_tools_v4(skills: Any, job_description: str) -> Dict[str, Any]:
    """
    V4: Skills & Tools Match (0-15 points with de-duplication)
    
    Scoring:
    - Hard skill: +1
    - Soft skill: +0.5
    - Missing critical: -1
    - De-duplication: 50% if in experience
    
    Args:
        skills: Skills data from resume
        job_description: Job description text
        
    Returns:
        Dict with score and analysis
    """
    try:
        prompt = skills_tools_relevance_prompt(skills, job_description)
        result = await gen_model_async(prompt)
        
        # Validate score
        points = validate_numeric(result['score']['pointsAwarded'], 'skills.pointsAwarded')
        points = validate_range(points, 0, 15, 'skills.pointsAwarded')
        
        result['score']['pointsAwarded'] = round_to_precision(points, 1)
        result['score']['maxPoints'] = 15
        
        return result
        
    except Exception as e:
        logger.error(f"Error in skills/tools analysis: {e}")
        return {
            "score": {
                "pointsAwarded": 0.0,
                "maxPoints": 15,
                "matchPercentage": 0.0,
                "rating": "Poor",
                "ratingSymbol": "❌"
            },
            "analysis": {
                "hardSkillMatches": [],
                "softSkillMatches": [],
                "missingSkills": [],
                "doubleCountReductions": [],
                "suggestedImprovements": "Unable to analyze skills. Please try again."
            }
        }


async def analyze_resume_structure_v4(resume_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    V4: Resume Structure (0-30 points)
    
    Required sections:
    - Personal Information
    - Website/Social Links
    - Work Experience
    - Education
    
    Penalties:
    - ATS-unfriendly formatting: -1 per issue
    
    Args:
        resume_data: Full resume data dictionary
        
    Returns:
        Dict with score and analysis
    """
    try:
        required_sections = [
            'Personal Information',
            'Website/Social Links',
            'Work Experience',
            'Education'
        ]
        
        present_sections = []
        missing_sections = []
        
        for section in required_sections:
            if section in resume_data and resume_data[section]:
                present_sections.append(section)
            else:
                missing_sections.append(section)
        
        # Base score: 7.5 points per required section
        base_score = len(present_sections) * 7.5
        
        # TODO: Add ATS formatting checks (would require parsing resume format)
        # For now, assume no ATS penalties
        ats_penalties = 0
        
        final_score = max(0, base_score - ats_penalties)
        
        # Create section status
        section_status = []
        for section in required_sections:
            status = "Completed" if section in present_sections else "Missing"
            symbol = "✅" if section in present_sections else "❌"
            section_status.append({
                "section": section,
                "status": status,
                "symbol": symbol
            })
        
        # Determine rating
        if final_score >= 27:
            rating = "Excellent"
            symbol = "✅"
        elif final_score >= 22.5:
            rating = "Good"
            symbol = "👍"
        elif final_score >= 15:
            rating = "Fair"
            symbol = "⚠️"
        else:
            rating = "Needs Improvement"
            symbol = "🛑"
        
        return {
            "score": {
                "pointsAwarded": round_to_precision(final_score, 1),
                "maxPoints": 30,
                "completedSections": len(present_sections),
                "totalRequiredSections": len(required_sections),
                "rating": rating,
                "ratingSymbol": symbol
            },
            "analysis": {
                "sectionStatus": section_status,
                "missingRequiredSections": missing_sections,
                "atsIssues": [],
                "suggestedImprovements": f"Add missing sections: {', '.join(missing_sections)}" if missing_sections else "All required sections present. Ensure ATS-friendly formatting."
            }
        }
        
    except Exception as e:
        logger.error(f"Error in resume structure analysis: {e}")
        return {
            "score": {
                "pointsAwarded": 0.0,
                "maxPoints": 30,
                "completedSections": 0,
                "totalRequiredSections": 4,
                "rating": "Poor",
                "ratingSymbol": "❌"
            },
            "analysis": {
                "sectionStatus": [],
                "missingRequiredSections": [],
                "atsIssues": [],
                "suggestedImprovements": "Unable to analyze structure. Please try again."
            }
        }


async def analyze_action_words_v4(resume_text: Any, job_description: str) -> Dict[str, Any]:
    """
    V4: Action Words Usage (0-25 points)
    
    Scoring:
    - Strong verb: +1 (capped at 25)
    - Weak verb: -0.5
    - Cliché/buzzword: -1
    
    Args:
        resume_text: Resume text
        job_description: Job description (for context)
        
    Returns:
        Dict with score and analysis
    """
    try:
        prompt = action_words_prompt(resume_text, job_description)
        result = await gen_model_async(prompt)
        
        # Validate score
        points = validate_numeric(result['score']['pointsAwarded'], 'actionWords.pointsAwarded')
        points = validate_range(points, 0, 25, 'actionWords.pointsAwarded')
        
        result['score']['pointsAwarded'] = round_to_precision(points, 1)
        result['score']['maxPoints'] = 25
        
        return result
        
    except Exception as e:
        logger.error(f"Error in action words analysis: {e}")
        return {
            "score": {
                "pointsAwarded": 0.0,
                "maxPoints": 25,
                "actionVerbPercentage": 0.0,
                "rating": "Poor",
                "ratingSymbol": "❌"
            },
            "analysis": {
                "strongActionVerbs": [],
                "weakActionVerbs": [],
                "clichesAndBuzzwords": [],
                "suggestedImprovements": "Unable to analyze action words. Please try again."
            }
        }


async def analyze_measurable_results_v4(resume_text: Any, job_description: str) -> Dict[str, Any]:
    """
    V4: Measurable Results (0-25 points)
    
    Scoring:
    - Quantified outcome: +2.5
    - Ideal: 10 quantified achievements for full 25 points
    - Partial credit for outcome language without metrics
    
    Args:
        resume_text: Resume text
        job_description: Job description (for context)
        
    Returns:
        Dict with score and analysis
    """
    try:
        prompt = measurable_results_prompt(resume_text, job_description)
        result = await gen_model_async(prompt)
        
        # Validate score
        points = validate_numeric(result['score']['pointsAwarded'], 'measurableResults.pointsAwarded')
        points = validate_range(points, 0, 25, 'measurableResults.pointsAwarded')
        
        result['score']['pointsAwarded'] = round_to_precision(points, 1)
        result['score']['maxPoints'] = 25
        
        return result
        
    except Exception as e:
        logger.error(f"Error in measurable results analysis: {e}")
        return {
            "score": {
                "pointsAwarded": 0.0,
                "maxPoints": 25,
                "measurableResultsCount": 0,
                "rating": "Poor",
                "ratingSymbol": "❌"
            },
            "analysis": {
                "measurableResults": [],
                "opportunitiesForMetrics": [],
                "suggestedImprovements": "Unable to analyze measurable results. Please try again."
            }
        }


async def analyze_bullet_effectiveness_v4(resume_text: Any) -> Dict[str, Any]:
    """
    V4: Bullet Point Effectiveness (0-20 points)
    
    Scoring:
    - Optimal length + format: +2 per bullet
    - Poorly structured: -0.5
    - Max 10 bullets evaluated
    
    Args:
        resume_text: Resume text
        
    Returns:
        Dict with score and analysis
    """
    try:
        prompt = bullet_point_effectiveness_prompt(resume_text)
        result = await gen_model_async(prompt)
        
        # Validate score
        points = validate_numeric(result['score']['pointsAwarded'], 'bulletEffectiveness.pointsAwarded')
        points = validate_range(points, 0, 20, 'bulletEffectiveness.pointsAwarded')
        
        result['score']['pointsAwarded'] = round_to_precision(points, 1)
        result['score']['maxPoints'] = 20
        
        return result
        
    except Exception as e:
        logger.error(f"Error in bullet effectiveness analysis: {e}")
        return {
            "score": {
                "pointsAwarded": 0.0,
                "maxPoints": 20,
                "effectiveBulletPercentage": 0.0,
                "rating": "Poor",
                "ratingSymbol": "❌"
            },
            "analysis": {
                "effectiveBullets": [],
                "ineffectiveBullets": [],
                "suggestedImprovements": "Unable to analyze bullet points. Please try again."
            }
        }


async def calculate_job_fit_score_v4(components: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate Job Fit Score from components.
    
    Components (100 points total):
    - Keyword & Contextual Match: 35 points
    - Experience Alignment: 30 points
    - Education Requirement: 20 points
    - Skills & Tools Match: 15 points
    
    Args:
        components: Dict with all job fit component results
        
    Returns:
        Dict with overall job fit score and label
    """
    try:
        keyword_score = components.get('keywordMatch', {}).get('score', {}).get('pointsAwarded', 0)
        experience_score = components.get('experienceAlignment', {}).get('score', {}).get('pointsAwarded', 0)
        education_score = components.get('educationRequirement', {}).get('score', {}).get('pointsAwarded', 0)
        skills_score = components.get('skillsToolsMatch', {}).get('score', {}).get('pointsAwarded', 0)
        
        # Validate all scores
        keyword_score = validate_range(validate_numeric(keyword_score, 'keyword'), 0, 35, 'keyword')
        experience_score = validate_range(validate_numeric(experience_score, 'experience'), 0, 30, 'experience')
        education_score = validate_range(validate_numeric(education_score, 'education'), 0, 20, 'education')
        skills_score = validate_range(validate_numeric(skills_score, 'skills'), 0, 15, 'skills')
        
        # Calculate total
        total_score = keyword_score + experience_score + education_score + skills_score
        total_score = min(total_score, 100.0)  # Cap at 100
        total_score = round_to_precision(total_score, 1)
        
        # Get label
        label = get_job_fit_label(total_score)
        
        return {
            "score": total_score,
            "label": label,
            "components": components
        }
        
    except Exception as e:
        logger.error(f"Error calculating job fit score: {e}")
        return {
            "score": 0.0,
            "label": "Low Fit",
            "components": components
        }


async def calculate_resume_quality_score_v4(components: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate Resume Quality Score from components.
    
    Components (100 points total):
    - Resume Structure: 30 points
    - Action Words Usage: 25 points
    - Measurable Results: 25 points
    - Bullet Effectiveness: 20 points
    
    Args:
        components: Dict with all resume quality component results
        
    Returns:
        Dict with overall quality score and tier label
    """
    try:
        structure_score = components.get('structure', {}).get('score', {}).get('pointsAwarded', 0)
        action_words_score = components.get('actionWords', {}).get('score', {}).get('pointsAwarded', 0)
        measurable_score = components.get('measurableResults', {}).get('score', {}).get('pointsAwarded', 0)
        bullet_score = components.get('bulletEffectiveness', {}).get('score', {}).get('pointsAwarded', 0)
        
        # Validate all scores
        structure_score = validate_range(validate_numeric(structure_score, 'structure'), 0, 30, 'structure')
        action_words_score = validate_range(validate_numeric(action_words_score, 'actionWords'), 0, 25, 'actionWords')
        measurable_score = validate_range(validate_numeric(measurable_score, 'measurable'), 0, 25, 'measurable')
        bullet_score = validate_range(validate_numeric(bullet_score, 'bullet'), 0, 20, 'bullet')
        
        # Calculate total
        total_score = structure_score + action_words_score + measurable_score + bullet_score
        total_score = min(total_score, 100.0)  # Cap at 100
        total_score = round_to_precision(total_score, 1)
        
        # Get tier label
        tier = get_resume_quality_tier(total_score)
        
        return {
            "score": total_score,
            "tier": tier,
            "components": components
        }
        
    except Exception as e:
        logger.error(f"Error calculating resume quality score: {e}")
        return {
            "score": 0.0,
            "tier": "Refine for Impact",
            "components": components
        }


async def analyze_resume_v4(resume_data: Dict[str, Any], job_description: str, use_cache: bool = True) -> Dict[str, Any]:
    """
    Main entry point for V4 resume analysis.
    
    Performs complete analysis with two independent dimensions:
    1. Job Fit Score (0-100) - exposed to user
    2. Resume Quality Score (0-100) - converted to tier label
    
    Args:
        resume_data: Complete resume data dictionary
        job_description: Job description text
        use_cache: Whether to use Redis caching (default: True)
        
    Returns:
        Dict with complete V4 analysis results
    """
    try:
        # Check Redis cache if enabled
        if use_cache:
            # Create a deterministic hash of the inputs
            resume_str = json.dumps(resume_data, sort_keys=True)
            
            # Normalize the job description to ensure consistent caching
            job_desc_normalized = job_description.strip().lower()
            
            # Generate Redis cache key
            cache_key = redis_cache.generate_key("analysis_v4", resume_str, job_desc_normalized, "v4.0")
            
            # Add logging to debug cache key generation
            logger.info(f"Generated V4 cache key: {cache_key[:16]}... for job desc length: {len(job_description)}")
            
            # Check Redis cache
            cached_result = await redis_cache.get(cache_key)
            if cached_result:
                logger.info("Cache HIT - Using cached V4 analysis result from Redis")
                return cached_result
        
        # Cache miss - perform the analysis
        logger.info("Cache MISS - Starting V4 resume analysis...")
        
        # Analyze context
        context = analyze_context(resume_data, job_description)
        
        # Extract data
        work_experience = resume_data.get('Work Experience', {})
        education = resume_data.get('Education', [])
        skills = resume_data.get('Skills and Interests', [])
        
        # Run all analyses in parallel
        import asyncio
        
        keyword_task = analyze_keyword_match_v4(resume_data, job_description)
        experience_task = analyze_experience_alignment_v4(work_experience, job_description)
        education_task = analyze_education_requirement_v4(education, job_description)
        skills_task = analyze_skills_tools_v4(skills, job_description)
        structure_task = analyze_resume_structure_v4(resume_data)
        action_words_task = analyze_action_words_v4(resume_data, job_description)
        measurable_task = analyze_measurable_results_v4(resume_data, job_description)
        bullet_task = analyze_bullet_effectiveness_v4(resume_data)
        
        # Await all results
        results = await asyncio.gather(
            keyword_task,
            experience_task,
            education_task,
            skills_task,
            structure_task,
            action_words_task,
            measurable_task,
            bullet_task,
            return_exceptions=True
        )
        
        # Unpack results
        keyword_result, experience_result, education_result, skills_result, \
        structure_result, action_words_result, measurable_result, bullet_result = results
        
        # Build Job Fit components
        job_fit_components = {
            'keywordMatch': keyword_result,
            'experienceAlignment': experience_result,
            'educationRequirement': education_result,
            'skillsToolsMatch': skills_result
        }
        
        # Build Resume Quality components
        resume_quality_components = {
            'structure': structure_result,
            'actionWords': action_words_result,
            'measurableResults': measurable_result,
            'bulletEffectiveness': bullet_result
        }
        
        # Calculate overall scores
        job_fit = await calculate_job_fit_score_v4(job_fit_components)
        resume_quality = await calculate_resume_quality_score_v4(resume_quality_components)
        
        # Build final response
        response = {
            "version": "v4.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "jobFitScore": job_fit,
            "resumeQualityScore": resume_quality,
            "context": context,
            
            # Backward compatibility with V3
            "overall_score": job_fit['score'],  # Use job fit score for backward compatibility
            "keyword_match": keyword_result,
            "job_experience": experience_result,
            "skills_certifications": skills_result,  # Map to skills for V3 compatibility
            "resume_structure": structure_result,
            "action_words": action_words_result,
            "measurable_results": measurable_result,
            "bullet_point_effectiveness": bullet_result
        }
        
        # Validate and sanitize
        response = validate_and_sanitize_response(response)
        
        logger.info(f"V4 analysis complete. Job Fit: {job_fit['score']}, Quality: {resume_quality['score']}")
        
        # Cache the result if caching is enabled
        if use_cache:
            await redis_cache.set(cache_key, response, ttl=3600)  # Cache for 1 hour
            logger.info(f"Cached V4 analysis result with key: {cache_key[:16]}...")
        
        return response
        
    except Exception as e:
        logger.error(f"Critical error in V4 analysis: {e}")
        import traceback
        traceback.print_exc()
        
        # Return safe default
        return {
            "version": "v4.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "jobFitScore": {
                "score": 0.0,
                "label": "Low Fit",
                "components": {}
            },
            "resumeQualityScore": {
                "score": 0.0,
                "tier": "Refine for Impact",
                "components": {}
            },
            "context": {
                "careerStage": "Unknown",
                "industry": "Unknown",
                "yearsOfExperience": 0
            },
            "error": str(e),
            "overall_score": 0.0
        }
