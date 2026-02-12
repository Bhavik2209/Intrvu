import json
import time
import logging
import asyncio
import hashlib
from typing import Dict, Any

from .action_words import action_words
from .keyword_match import keyword_match
from .job_experience import job_experience
from .education_and_certifications import education_certifications
from .measurable_results import measurable_results
from .bullet_point_effectiveness import bullet_point_effectiveness
from app.services.openai_model import gen_model
from app.prompts.templates import skills_tools_relevance_prompt
from .resume_analysis import resume_structure
from app.core.config import settings
from app.cache.redis_cache import redis_cache
from .async_analysis import (
    keyword_match_async,
    job_experience_async,
    education_certifications_async,
    action_words_async,
    measurable_results_async,
    bullet_point_effectiveness_async
)

logger = logging.getLogger(__name__)

# Updated resume sections based on V3 specifications
resume_sections = [
    {"section": "Personal Information", "symbol": "🛑", "mandatory": True},
    {"section": "Website/Social Links", "symbol": "🛑", "mandatory": True},
    {"section": "Professional Summary", "symbol": "🛑", "mandatory": True},
    {"section": "Work Experience", "symbol": "🛑", "mandatory": True},
    {"section": "Education", "symbol": "🛑", "mandatory": True},
    {"section": "Skills and Interests", "symbol": "🛑", "mandatory": True},
    {"section": "Certifications", "symbol": "💡", "mandatory": False},
    {"section": "Awards/Achievements", "symbol": "💡", "mandatory": False},
    {"section": "Projects", "symbol": "💡", "mandatory": False},
    {"section": "Volunteering", "symbol": "💡", "mandatory": False},
    {"section": "Publications", "symbol": "💡", "mandatory": False}
]

def evaluate_resume_sections(resume_json: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluate the presence of sections in a resume JSON against mandatory and optional indicators.
    Updated for V3 scoring system.
    """
    result = {
        "present": [],
        "missing": {
            "mandatory": [],
            "optional": []
        }
    }

    for section in resume_sections:
        section_name = section["section"]
        mandatory = section["mandatory"]

        if section_name in resume_json and resume_json[section_name]:
            result["present"].append(section_name)
        else:
            if mandatory:
                result["missing"]["mandatory"].append(section_name)
            else:
                result["missing"]["optional"].append(section_name)
    
    logger.debug(f"Resume sections evaluation: {result}")
    return result



def skills_tools_relevance(skills: Any, job_description: str) -> Dict[str, Any]:
    """
    Updated skills & tools relevance analysis based on V3 scoring system (15 points max).
    Includes double-counting prevention logic.
    """
    prompt = skills_tools_relevance_prompt(skills, job_description)
    response = gen_model(prompt)
    
    # Validate and cap points at 15
    if response.get('score', {}).get('pointsAwarded', 0) > 15:
        response['score']['pointsAwarded'] = 15
    
    return response


def create_analysis_chain(analysis_function):
    """Create a chain that runs a specific analysis function"""
    return RunnableLambda(lambda inputs: analysis_function(**inputs))

async def detail_resume_analysis(resume_text, job_description, use_cache=True, version="v3.0"):
    """
    Updated resume analysis using V3 scoring system with new 100-point structure and Redis caching.
    Job Fit Score: 100 points total
    Resume Quality Score: 100 points total (internal only, shown as tiered labels)
    """
    try:
        # Check Redis cache if enabled
        if use_cache:
            resume_str = json.dumps(resume_text, sort_keys=True)
            job_desc_normalized = job_description.strip().lower()
            cache_key = redis_cache.generate_key("analysis_v3", resume_str, job_desc_normalized, version)
            
            logger.info(f"Generated cache key: {cache_key[:16]}... for job desc length: {len(job_description)}")
            
            # Check Redis cache
            cached_result = await redis_cache.get(cache_key)
            if cached_result:
                logger.info("Cache HIT - Using cached analysis result from Redis")
                return cached_result
                
        # Cache miss - perform analysis
        logger.info("Cache MISS - Starting V3 resume analysis...")
        start_time = time.time()
        
        # Get resume sections
        sections_resume = evaluate_resume_sections(resume_text)
        
        # Safe access to resume components
        work_experience = resume_text.get("Work Experience", {})
        certifications = resume_text.get("Certifications", [])
        education = resume_text.get("Education", {})
        skills = resume_text.get("Skills and Interests", [])
        
        # Run all LLM-based analyses concurrently using asyncio.gather
        # This is much faster than sequential or LangChain's RunnableParallel
        logger.info("Starting concurrent analysis with asyncio.gather...")
        
        (
            keyword_match_json,
            job_experience_json,
            education_certifications_json,
            action_words_json,
            measurable_results_json,
            bullet_point_effectiveness_json
        ) = await asyncio.gather(
            keyword_match_async(resume_text=resume_text, job_description=job_description),
            job_experience_async(resume_text=work_experience, job_description=job_description),
            education_certifications_async(certifications=certifications, education=education, job_description=job_description),
            action_words_async(resume_text=resume_text, job_description=job_description),
            measurable_results_async(resume_text=resume_text, job_description=job_description),
            bullet_point_effectiveness_async(resume_text=resume_text)
        )
        
        # Skills/tools and resume structure don't need async (they're fast)
        skills_tools_json = skills_tools_relevance(skills=skills, job_description=job_description)
        resume_structure_json = resume_structure(sections=sections_resume)
        
        logger.info(f"Analysis completed in {time.time() - start_time:.2f} seconds")
        
        # Ensure all responses are properly parsed JSON objects
        def validate_json_response(response, component_name, default_points=0):
            if not isinstance(response, dict):
                logger.warning(f"{component_name} is not a dictionary")
                if isinstance(response, str):
                    try:
                        response = json.loads(response)
                    except:
                        response = {"score": {"pointsAwarded": default_points, "rating": "Error"}, "analysis": {}}
                else:
                    response = {"score": {"pointsAwarded": default_points, "rating": "Error"}, "analysis": {}}
            return response
        
        # Validate all components
        keyword_match_json = validate_json_response(keyword_match_json, "keyword_match_json")
        job_experience_json = validate_json_response(job_experience_json, "job_experience_json")
        education_certifications_json = validate_json_response(education_certifications_json, "education_certifications_json")
        skills_tools_json = validate_json_response(skills_tools_json, "skills_tools_json")
        resume_structure_json = validate_json_response(resume_structure_json, "resume_structure_json")
        action_words_json = validate_json_response(action_words_json, "action_words_json")
        measurable_results_json = validate_json_response(measurable_results_json, "measurable_results_json")
        bullet_point_effectiveness_json = validate_json_response(bullet_point_effectiveness_json, "bullet_point_effectiveness_json")

        # Normalize skills_tools_json to ensure required fields exist
        try:
            st_score = skills_tools_json.setdefault('score', {})
            # Coerce numeric fields
            pts = float(st_score.get('pointsAwarded') or 0)
            max_pts = float(st_score.get('maxPoints') or 15)
            # Ensure matchPercentage present and numeric
            mp = st_score.get('matchPercentage')
            if not isinstance(mp, (int, float)):
                st_score['matchPercentage'] = round((pts / max_pts) * 100) if max_pts > 0 else 0
            # Ensure rating and ratingSymbol present
            if not st_score.get('rating'):
                if pts >= 13:
                    st_score['rating'] = 'Excellent'
                    st_score.setdefault('ratingSymbol', '✅')
                elif pts >= 10:
                    st_score['rating'] = 'Good'
                    st_score.setdefault('ratingSymbol', '👍')
                elif pts >= 7:
                    st_score['rating'] = 'Fair'
                    st_score.setdefault('ratingSymbol', '⚠️')
                elif pts >= 4:
                    st_score['rating'] = 'Needs Improvement'
                    st_score.setdefault('ratingSymbol', '🛑')
                else:
                    st_score['rating'] = 'Poor'
                    st_score.setdefault('ratingSymbol', '❌')

            # Ensure analysis arrays exist and have expected keys
            st_analysis = skills_tools_json.setdefault('analysis', {})
            hard = st_analysis.get('hardSkillMatches')
            soft = st_analysis.get('softSkillMatches')
            missing = st_analysis.get('missingSkills')

            # Some models may return matchedSkills instead of hardSkillMatches
            if (not isinstance(hard, list) or len(hard) == 0) and isinstance(st_analysis.get('matchedSkills'), list):
                st_analysis['hardSkillMatches'] = [
                    s if isinstance(s, dict) else {
                        'skill': str(s), 'points': 1.0, 'status': 'Found', 'symbol': '✅'
                    } for s in st_analysis['matchedSkills']
                ]
            if not isinstance(st_analysis.get('hardSkillMatches'), list):
                st_analysis['hardSkillMatches'] = []
            if not isinstance(soft, list):
                st_analysis['softSkillMatches'] = []
            if not isinstance(missing, list):
                st_analysis['missingSkills'] = []
            if not isinstance(st_analysis.get('doubleCountReductions'), list):
                st_analysis['doubleCountReductions'] = []
        except Exception as e:
            logger.error(f"Normalization error for skills_tools_json: {e}")
        
        # Calculate Job Fit Score (100 points) and Resume Quality Score (100 points)
        job_fit_scores = calculate_job_fit_score(
            keyword_match_json['score']['pointsAwarded'], 
            job_experience_json['score']['pointsAwarded'], 
            education_certifications_json['score']['pointsAwarded'],
            skills_tools_json['score']['pointsAwarded']
        )
        
        resume_quality_scores = calculate_resume_quality_score(
            resume_structure_json['score']['pointsAwarded'], 
            action_words_json['score']['pointsAwarded'], 
            measurable_results_json['score']['pointsAwarded'], 
            bullet_point_effectiveness_json['score']['pointsAwarded']
        )
        
        # Round all scores in the individual components
        for component in [keyword_match_json, job_experience_json, education_certifications_json, skills_tools_json,
                          resume_structure_json, action_words_json, measurable_results_json, 
                          bullet_point_effectiveness_json]:
            if 'score' in component and 'pointsAwarded' in component['score']:
                component['score']['pointsAwarded'] = round(float(component['score']['pointsAwarded']))
            
            # Round percentage values if they exist
            if 'score' in component:
                for key in component['score']:
                    if 'percentage' in key.lower() or key.lower().endswith('count'):
                        if component['score'][key] is not None and isinstance(component['score'][key], (int, float)):
                            component['score'][key] = round(float(component['score'][key]))
        
        # Combine all the JSON results into a single dictionary with V3 structure
        result = {
            "version": "v3.0",
            "job_fit_score": {
                "total_points": job_fit_scores['total_points'],
                "percentage": job_fit_scores['percentage'],
                "label": job_fit_scores['label'],
                "symbol": job_fit_scores['symbol']
            },
            "resume_quality_score": {
                "total_points": resume_quality_scores['total_points'],
                "label": resume_quality_scores['label'],
                "symbol": resume_quality_scores['symbol']
            },
            "detailed_analysis": {
                "keyword_match": keyword_match_json,
                "job_experience": job_experience_json,
                "education_certifications": education_certifications_json,
                "skills_tools": skills_tools_json,
                "resume_structure": resume_structure_json,
                "action_words": action_words_json,
                "measurable_results": measurable_results_json,
                "bullet_point_effectiveness": bullet_point_effectiveness_json
            },
            # Keep backward compatibility
            "overall_score": job_fit_scores['percentage'],  # For backward compatibility
            "keyword_match": keyword_match_json,
            "job_experience": job_experience_json,
            "skills_certifications": education_certifications_json,  # Keep old naming for compatibility
            "skills_tools": skills_tools_json,  # V3 - Skills & Tools as separate field
            "resume_structure": resume_structure_json,
            "action_words": action_words_json,
            "measurable_results": measurable_results_json,
            "bullet_point_effectiveness": bullet_point_effectiveness_json
        }
        
        # Cache the result in Redis if caching is enabled
        if use_cache:
            await redis_cache.set(cache_key, result, ttl=settings.cache_ttl_seconds)
            logger.info("Cached analysis result in Redis")
        
        return result
    
    except Exception as e:
        logger.error(f"Error in detail_resume_analysis: {str(e)}", exc_info=True)
        
        # Return a minimal structure to prevent frontend errors
        return {
            "version": "v3.0",
            "job_fit_score": {
                "total_points": 0,
                "percentage": 0,
                "label": "🔄 Low Fit",
                "symbol": "🔄"
            },
            "resume_quality_score": {
                "total_points": 0,
                "label": "🛠 Refine for Impact",
                "symbol": "🛠"
            },
            "overall_score": 0,
            "keyword_match": {"score": {"pointsAwarded": 0, "matchPercentage": 0, "rating": "Error"}, "analysis": {"strongMatches": [], "partialMatches": [], "missingKeywords": []}},
            "job_experience": {"score": {"pointsAwarded": 0, "alignmentPercentage": 0, "rating": "Error"}, "analysis": {"strongMatches": [], "partialMatches": [], "misalignedRoles": []}},
            "skills_certifications": {"score": {"pointsAwarded": 0, "matchPercentage": 0, "rating": "Error"}, "analysis": {"educationMatch": [], "certificationMatches": [], "missingCredentials": []}},
            "skills_tools": {"score": {"pointsAwarded": 0, "matchPercentage": 0, "rating": "Error"}, "analysis": {"hardSkillMatches": [], "softSkillMatches": [], "missingSkills": []}},
            "resume_structure": {"score": {"pointsAwarded": 0, "completedMustHave": 0, "totalMustHave": 6}, "analysis": {"sectionStatus": []}},
            "action_words": {"score": {"pointsAwarded": 0, "actionVerbPercentage": 0}, "analysis": {"strongActionVerbs": [], "weakActionVerbs": []}},
            "measurable_results": {"score": {"pointsAwarded": 0, "measurableResultsCount": 0}, "analysis": {"measurableResults": [], "opportunitiesForMetrics": []}},
            "bullet_point_effectiveness": {"score": {"pointsAwarded": 0, "effectiveBulletPercentage": 0}, "analysis": {"effectiveBullets": [], "ineffectiveBullets": []}}
        }

def calculate_job_fit_score(keyword_points, experience_points, education_points, skills_points):
    """
    Calculate Job Fit Score based on V3 specifications (100 points total)
    - Keyword & Contextual Match: 35 points
    - Experience Alignment: 30 points  
    - Education & Certifications: 20 points
    - Skills & Tools Relevance: 15 points
    """
    # Ensure points don't exceed their maximums
    keyword_points = min(float(keyword_points or 0), 35)
    experience_points = min(float(experience_points or 0), 30)
    education_points = min(float(education_points or 0), 20)
    skills_points = min(float(skills_points or 0), 15)
    
    total_points = keyword_points + experience_points + education_points + skills_points
    percentage = round(total_points)  # Since max is 100, percentage = total points
    
    # Determine label and symbol based on percentage
    if percentage >= 90:
        label = "✅ Great Match"
        symbol = "✅"
    elif percentage >= 75:
        label = "👍 Good Match" 
        symbol = "👍"
    elif percentage >= 60:
        label = "⚠ Moderate Match"
        symbol = "⚠"
    else:
        label = "🔄 Low Fit"
        symbol = "🔄"
    
    return {
        "total_points": round(total_points),
        "percentage": percentage,
        "label": label,
        "symbol": symbol
    }

def calculate_resume_quality_score(structure_points, action_words_points, measurable_points, bullet_points):
    """
    Calculate Resume Quality Score based on V3 specifications (100 points total)
    - Resume Structure: 30 points (30%)
    - Action Words Usage: 25 points (25%)
    - Measurable Results: 25 points (25%)
    - Bullet Point Effectiveness: 20 points (20%)
    """
    # Ensure points don't exceed their maximums
    structure_points = min(float(structure_points or 0), 30)
    action_words_points = min(float(action_words_points or 0), 25)
    measurable_points = min(float(measurable_points or 0), 25)
    bullet_points = min(float(bullet_points or 0), 20)
    
    total_points = structure_points + action_words_points + measurable_points + bullet_points
    
    # Determine label and symbol based on total points (not shown to user as numeric)
    if total_points >= 90:
        label = "✅ Ready to Impress"
        symbol = "✅"
    elif total_points >= 70:
        label = "⚠ Needs Polish"
        symbol = "⚠"
    else:
        label = "🛠 Refine for Impact"
        symbol = "🛠"
    
    return {
        "total_points": round(total_points),
        "label": label,
        "symbol": symbol
    }

def overall_score(score1, score2, score3, score4, score5, score6, score7):
    """
    Legacy function for backward compatibility
    This now delegates to the new V3 scoring system
    """
    try:
        # Map old parameters to new V3 structure
        # score1 = keyword_match (35 pts max)
        # score2 = job_experience (30 pts max)  
        # score3 = skills_certifications (combined education + skills, need to split)
        # score4 = resume_structure (30 pts max)
        # score5 = action_words (25 pts max)
        # score6 = measurable_results (25 pts max)
        # score7 = bullet_point_effectiveness (20 pts max)
        
        s1 = float(score1) if score1 is not None else 0
        s2 = float(score2) if score2 is not None else 0
        s3 = float(score3) if score3 is not None else 0
        
        # Split score3 proportionally between education (20 pts) and skills (15 pts)
        total_education_skills = 35  # 20 + 15
        if s3 > 0:
            education_score = (s3 / total_education_skills) * 20
            skills_score = (s3 / total_education_skills) * 15
        else:
            education_score = 0
            skills_score = 0
        
        # Calculate job fit score using new function
        job_fit_scores = calculate_job_fit_score(s1, s2, education_score, skills_score)
        
        return job_fit_scores['percentage']
        
    except (ValueError, TypeError) as e:
        print(f"Error calculating overall score: {e}")
        print(f"Scores: {score1}, {score2}, {score3}, {score4}, {score5}, {score6}, {score7}")
        return 0