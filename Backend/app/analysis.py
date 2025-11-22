import json
import os
import time
import logging
import hashlib
# Import LangChain components
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain.globals import set_debug
from langchain.cache import InMemoryCache
from langchain_core.runnables import RunnableParallel, RunnableLambda

from .action_words import action_words
from .keyword_match import keyword_match
from .job_experience import job_experience
from .education_and_certifications import education_certifications
from .resume_analysis import resume_structure
from .measurable_results import measurable_results
from .bullet_point_effectiveness import bullet_point_effectiveness
from openai_model import gen_model


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize environment variables
api_key = os.environ.get("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

# Set up LangChain caching for better performance
from langchain.globals import set_llm_cache
set_llm_cache(InMemoryCache())

# Create LLM instance with caching enabled
llm = ChatOpenAI(
    model="gpt-4o",  # Updated to latest model
    temperature=0.3,
    max_tokens=8000,
    api_key=api_key
)

# Create a memory cache for entire analysis results
from functools import lru_cache
import hashlib

# Create a cache with a maximum size of 100 items
_analysis_cache = {}
MAX_CACHE_SIZE = 100

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

def evaluate_resume_sections(resume_json):
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
    
    print(result)
    return result



def skills_tools_relevance(skills, job_description):
    """
    Updated skills & tools relevance analysis based on V3 scoring system (15 points max).
    Includes double-counting prevention logic.
    """
    prompt = f'''Given the job description: {job_description}
    Skills from resume: {skills}

    Analyze skills and tools relevance based on V3 scoring criteria. This is worth 15 points total.

    SCORING CRITERIA (15 points max):
    - Hard Skill Match: +1 point each
    - Soft Skill Match: +0.5 point each  
    - Missing Critical Skill/Tool: -1 point each

    DOUBLE-COUNTING PREVENTION:
    - If a skill appears in experience AND skills sections, apply 50% reduction here
    - Prioritize skills proven through past work experience

    Categories:
    - Hard Skills: Technical skills, programming languages, software, tools
    - Soft Skills: Communication, Leadership, Problem-solving, etc.
    - Domain-specific: Industry tools and methodologies

    JSON STRUCTURE:
    {{
        "score": {{
            "matchPercentage": 0,
            "pointsAwarded": 0,
            "maxPoints": 15,
            "rating": "rating text", 
            "ratingSymbol": "emoji"
        }},
        "analysis": {{
            "hardSkillMatches": [
                {{
                    "skill": "skill name",
                    "points": 1.0,
                    "status": "Found",
                    "symbol": "✅"
                }}
            ],
            "softSkillMatches": [
                {{
                    "skill": "skill name", 
                    "points": 0.5,
                    "status": "Found",
                    "symbol": "✅"
                }}
            ],
            "missingSkills": [
                {{
                    "skill": "skill name",
                    "points": -1,
                    "status": "Missing Critical",
                    "symbol": "❌"
                }}
            ],
            "doubleCountReductions": [
                {{
                    "skill": "skill name",
                    "originalPoints": 1.0,
                    "reducedPoints": 0.5,
                    "reason": "Also found in experience"
                }}
            ],
            "suggestedImprovements": "detailed improvement suggestions"
        }}
    }}

    RATING SCALE:
    - 13-15 points: "Excellent" (✅)
    - 10-12 points: "Good" (👍)
    - 7-9 points: "Fair" (⚠️) 
    - 4-6 points: "Needs Improvement" (🛑)
    - Below 4 points: "Poor" (❌)
    '''

    response = gen_model(prompt)
    
    # Validate and cap points at 15
    if response.get('score', {}).get('pointsAwarded', 0) > 15:
        response['score']['pointsAwarded'] = 15
    
    return response


def create_analysis_chain(analysis_function):
    """Create a chain that runs a specific analysis function"""
    return RunnableLambda(lambda inputs: analysis_function(**inputs))

def detail_resume_analysis(resume_text, job_description, use_cache=True, version="v3.0"):
    """
    Updated resume analysis using V3 scoring system with new 100-point structure.
    Job Fit Score: 100 points total
    Resume Quality Score: 100 points total (internal only, shown as tiered labels)
    """
    try:
        # Cache handling
        if use_cache:
            resume_str = json.dumps(resume_text, sort_keys=True)
            job_desc_normalized = job_description.strip().lower()
            combined_input = f"{resume_str}||{job_desc_normalized}||{version}"
            cache_key = hashlib.md5(combined_input.encode()).hexdigest()
            
            logger.info(f"Generated cache key: {cache_key[:8]}... for job desc length: {len(job_description)}")
            
            if cache_key in _analysis_cache:
                logger.info("Using cached analysis result")
                return _analysis_cache[cache_key]
                
        start_time = time.time()
        print("Starting V3 LangChain resume analysis...")
        
        # Get resume sections
        sections_resume = evaluate_resume_sections(resume_text)
        
        # Safe access to resume components
        work_experience = resume_text.get("Work Experience", {})
        certifications = resume_text.get("Certifications", [])
        education = resume_text.get("Education", {})
        skills = resume_text.get("Skills and Interests", [])
        
        # Create individual chains for V3 analysis components
        
        # JOB FIT COMPONENTS (100 points total)
        keyword_match_chain = RunnableLambda(lambda x: keyword_match(resume_text=resume_text, job_description=job_description))
        job_experience_chain = RunnableLambda(lambda x: job_experience(resume_text=work_experience, job_description=job_description))  
        education_certifications_chain = RunnableLambda(lambda x: education_certifications(certifications=certifications, education=education, job_description=job_description))
        skills_tools_chain = RunnableLambda(lambda x: skills_tools_relevance(skills=skills, job_description=job_description))
        
        # RESUME QUALITY COMPONENTS (100 points total)
        resume_structure_chain = RunnableLambda(lambda x: resume_structure(sections=sections_resume))
        action_words_chain = RunnableLambda(lambda x: action_words(resume_text=resume_text, job_description=job_description))
        measurable_results_chain = RunnableLambda(lambda x: measurable_results(resume_text=resume_text, job_description=job_description))
        bullet_point_effectiveness_chain = RunnableLambda(lambda x: bullet_point_effectiveness(resume_text=resume_text))
        
        # Create parallel runnable
        parallel_analysis = RunnableParallel(
            keyword_match=keyword_match_chain,
            job_experience=job_experience_chain,
            education_certifications=education_certifications_chain,
            skills_tools=skills_tools_chain,
            resume_structure=resume_structure_chain,
            action_words=action_words_chain,
            measurable_results=measurable_results_chain,
            bullet_point_effectiveness=bullet_point_effectiveness_chain
        )
        inputs = {}
        # Run all analyses in parallel
        results = parallel_analysis.invoke(inputs)
        
        # Extract results
        keyword_match_json = results["keyword_match"]
        job_experience_json = results["job_experience"]
        education_certifications_json = results["education_certifications"]
        skills_tools_json = results["skills_tools"]
        resume_structure_json = results["resume_structure"]
        action_words_json = results["action_words"]
        measurable_results_json = results["measurable_results"]
        bullet_point_effectiveness_json = results["bullet_point_effectiveness"]
        
        print(f"LangChain analysis completed in {time.time() - start_time:.2f} seconds")
        
        # Ensure all responses are properly parsed JSON objects
        def validate_json_response(response, component_name, default_points=0):
            if not isinstance(response, dict):
                print(f"Warning: {component_name} is not a dictionary")
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
            "resume_structure": resume_structure_json,
            "action_words": action_words_json,
            "measurable_results": measurable_results_json,
            "bullet_point_effectiveness": bullet_point_effectiveness_json
        }
        
        # Cache the result if caching is enabled
        if use_cache and cache_key:
            # If cache is full, remove oldest entry
            if len(_analysis_cache) >= MAX_CACHE_SIZE:
                oldest_key = next(iter(_analysis_cache))
                del _analysis_cache[oldest_key]
            
            # Add new result to cache
            _analysis_cache[cache_key] = result
        
        return result
    
    except Exception as e:
        print(f"Error in detail_resume_analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        
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