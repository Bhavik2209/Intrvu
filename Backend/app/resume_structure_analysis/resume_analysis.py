import json
import os
import time
import logging
import hashlib
# Import LangChain components
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.globals import set_debug
from langchain_core.caches import InMemoryCache
from langchain_core.runnables import RunnableParallel, RunnableLambda

from dotenv import load_dotenv
from app.services.llm_service import get_llm_service
from app.cache.redis_cache import redis_cache

load_dotenv()   
# Configure logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Set up LangChain caching for better performance
from langchain_core.globals import set_llm_cache
set_llm_cache(InMemoryCache())

# Sections with mandatory and optional indicators
resume_sections = [
    {"section": "Personal Information", "symbol": "🛑", "mandatory": True},
    {"section": "Website/Social Links", "symbol": "🛑", "mandatory": True},
    {"section": "Professional Summary", "symbol": "🛑", "mandatory": True},
    {"section": "Work Experience", "symbol": "🛑", "mandatory": True},
    {"section": "Education", "symbol": "🛑", "mandatory": True},
    {"section": "Certifications", "symbol": "💡", "mandatory": False},
    {"section": "Awards/Achievements", "symbol": "💡", "mandatory": False},
    {"section": "Projects", "symbol": "💡", "mandatory": False},
    {"section": "Skills and Interests", "symbol": "🛑", "mandatory": True},
    {"section": "Volunteering", "symbol": "💡", "mandatory": False},
    {"section": "Publications", "symbol": "💡", "mandatory": False}
]

def evaluate_resume_sections(resume_json):
    """
    Evaluate the presence of sections in a resume JSON against mandatory and optional indicators.

    Args:
        resume_json (dict): The resume data in JSON format.
        resume_sections (list): List of sections with mandatory and optional indicators.

    Returns:
        dict: Analysis of sections categorized as present or missing, and mandatory or optional.
    """
    # print(resume_json)
    # Initialize result dictionary
    result = {
        "present": [],
        "missing": {
            "mandatory": [],
            "optional": []
        }
    }

    # Iterate through defined resume sections
    for section in resume_sections:
        section_name = section["section"]
        mandatory = section["mandatory"]

        # Check if the section exists in the resume JSON
        if section_name in resume_json and resume_json[section_name]:
            result["present"].append(section_name)
        else:
            if mandatory:
                result["missing"]["mandatory"].append(section_name)
            else:
                result["missing"]["optional"].append(section_name)
    print(result)

    return result




def gen_model(prompt):
    """Generate a response using LangChain for better performance"""
    try:
        start_time = time.time()
        
        # Create a prompt template with system and user messages
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", "You are a resume analysis specialist that extracts structured information from resumes and returns it as valid JSON. Only respond with valid JSON, no explanations or extra text."),
            ("user", "{input}")
        ])
        
        # Create a parser to ensure we get valid JSON
        parser = JsonOutputParser()
        
        # Create the chain: prompt -> LLM -> parser
        # Create the chain: prompt -> LLM -> clean -> parser
        from langchain_core.runnables import RunnableLambda
        clean_json = RunnableLambda(lambda x: x.content.replace("```json", "").replace("```", "").strip())
        
        chain = prompt_template | get_llm_service().provider._llm | clean_json | parser
        
        # Run the chain
        result = chain.invoke({"input": prompt})
        
        print(f"LangChain API call completed in {time.time() - start_time:.2f} seconds")
        
        # Validate result is a dictionary
        if not isinstance(result, dict):
            raise ValueError("Response is not a valid JSON object")
            
        return result
        
    except Exception as e:
        print(f"Error in gen_model: {str(e)}")
        print(f"Prompt: {prompt[:200]}...")  # Log truncated prompt
        raise  # Re-raise the exception instead of returning default


def truncate_text(text, max_chars=15000):
    """Truncate text to fit within Groq's request size limits"""
    if isinstance(text, dict):
        text = json.dumps(text)
    if isinstance(text, str) and len(text) > max_chars:
        return text[:max_chars] + "... [truncated]"
    return text


def keyword_match(resume_text, job_description):
    # Truncate inputs to prevent exceeding Groq's 1MB limit
    resume_text_truncated = truncate_text(resume_text, 8000)
    job_description_truncated = truncate_text(job_description, 5000)
    
    # Add validation
    if not job_description or not resume_text:
        raise ValueError("Job description or resume text is empty")
        
    prompt = f"""Given the job description: {job_description_truncated}

        And the resume text: {resume_text_truncated}

        Analyze how well the resume matches the job description. Generate a JSON response that includes a skills match score and detailed analysis. Follow these specifications:

        1. SCORING SYSTEM:
   - First identify and extract only relevant technical skills, job-specific qualifications, tools, methodologies, and industry-specific terminology from the job description
   - Calculate the percentage of these meaningful job-related keywords found in the resume
   - Assign points and ratings based on match percentage:
       * 90%+ match: 21 points, "Excellent" rating (✅)
       * 70-89% match: 16 points, "Good" rating (👍)
       * 50-69% match: 11 points, "Fair" rating (⚠️)
       * 30-49% match: 6 points, "Needs Improvement" rating (🛑)
       * Below 30% match: 0 points, "Poor" rating (❌)

        2. JSON STRUCTURE:
        {{
            "score": {{
                "matchPercentage": 0,
                "pointsAwarded": 0,
                "rating": "rating text",
                "ratingSymbol": "emoji"
            }},
            "analysis": {{
                "matchedKeywords": [],
                "missingKeywords": [],
                "suggestedImprovements": "detailed improvement suggestions"
            }}
        }}

    3. DETAILED ANALYSIS REQUIREMENTS:
   - Extract ONLY relevant technical skills, qualifications, and job-specific keywords from the job description:
     * Technical skills (programming languages, software, tools, platforms)
     * Domain knowledge (industry-specific terminology)
     * Methodologies (project management frameworks, development approaches)
     * Specialized certifications or qualifications
     * Required years of experience in specific areas
   - Ignore common words, general job functions, and non-specific terminology
   - For technical jobs: focus on technical skills, tools, programming languages, frameworks, methodologies
   - For non-technical jobs: focus on domain expertise, methodologies, certifications, specialized knowledge
   - For "matchedKeywords": List only significant technical and job-related keywords found in the resume
   - For "missingKeywords": List only significant technical and job-related keywords not found in the resume
   - For "suggestedImprovements": Provide specific, actionable suggestions on how to incorporate missing keywords naturally into relevant resume sections based on the candidate's actual experience
"""
    
    response = gen_model(prompt)
    
    # Validate response
    if not response.get('score') or not response.get('analysis'):
        print(f"Invalid response structure: {response}")
        raise ValueError("Invalid response from model")
        
    return response

def job_experience(resume_text, job_description):
    # Truncate inputs
    resume_text_truncated = truncate_text(resume_text, 8000)
    job_description_truncated = truncate_text(job_description, 5000)
    
    prompt = f"""Given the job description: {job_description_truncated}

        And the job experience from the resume: {resume_text_truncated}
        NOTE : if there is no job experience give the suggestions about what kind of job experience should be there in the resume according to the job desciption, 
        Analyze how well the work experience in the resume aligns with the job responsibilities. Generate a JSON response that includes a job experience alignment score and detailed analysis. Follow these specifications:

        1. SCORING SYSTEM:
        - Calculate the percentage of job responsibilities covered in the resume's work experience
        - Assign points and ratings based on alignment percentage:
            * 80%+ match: 18 points, "Strong match" rating (✅)
            * 60-79% match: 14 points, "Good alignment" rating (👍)
            * 40-59% match: 9 points, "Partial match" rating (⚠️)
            * 20-39% match: 5 points, "Weak match" rating (🛑)
            * Below 20% match: 0 points, "No relevant experience" rating (❌)

        2. JSON STRUCTURE:
        {{
            "score": {{
                "alignmentPercentage": 0,
                "pointsAwarded": 0,
                "rating": "rating text",
                "ratingSymbol": "emoji"
            }},
            "analysis": {{
                "strongMatches": [
                    {{
                        "responsibility": "job responsibility",
                        "status": "Strong Match",
                        "notes": "specific experience from resume"
                    }}
                ],
                "partialMatches": [
                    {{
                        "responsibility": "job responsibility",
                        "status": "Partial Match",
                        "notes": "limited experience mentioned"
                    }}
                ],
                "missingExperience": [
                    {{
                        "responsibility": "job responsibility",
                        "status": "Missing",
                        "notes": "Not mentioned in resume"
                    }}
                ],
                "suggestedImprovements": "detailed improvement suggestions"
            }}
        }}"""

    response = gen_model(prompt)
    return response

def skills_certifications(certifications,skills, job_description):
    # Truncate inputs
    certifications_truncated = truncate_text(certifications, 2000)
    skills_truncated = truncate_text(skills, 2000)
    job_description_truncated = truncate_text(job_description, 5000)
    
    prompt = f'''Given the job description: {job_description_truncated}, these are the certifications: {certifications_truncated} and these are skills present in the resume: {skills_truncated}.

Analyze how well the skills, education, and certifications in the resume match the requirements in the job description. Generate a JSON response that includes a comprehensive match score and detailed analysis. Follow these specifications:

NOTE: This analysis should cover BOTH education/certifications AND technical/soft skills components, which together account for 35% of the Job Fit Score (21 points total).

1. SKILLS & EDUCATION EXTRACTION PROCESS:
   - First, carefully extract from the job description:
     * Required technical skills, tools, technologies, and methodologies
     * Required education level and field of study
     * Required certifications and qualifications
     * Domain-specific knowledge requirements
   - Focus on keywords that represent actual competencies employers seek
   - Do NOT include random phrases, job responsibilities, or generic terms

2. STRICT MATCHING PROCEDURE:
   - Create separate arrays for required skills, education, and certifications
   - For each item, check if it EXACTLY appears in the resume or has a direct semantic equivalent
   - Only mark an item as "matched" if it definitely exists in the resume
   - Be extremely conservative - when in doubt, mark as "not matched"
   - Double-check all matches to ensure no false positives

3. SCORING SYSTEM (21 POINTS TOTAL):
   - Education & Certifications (12 points):
     * 90%+ match: 12 points, "Excellent" rating (✅)
     * 70-89% match: 9 points, "Good" rating (👍)
     * 50-69% match: 6 points, "Fair" rating (⚠️)
     * 30-49% match: 3 points, "Needs Improvement" rating (🛑)
     * Below 30% match: 0 points, "Poor" rating (❌)
   - Skills & Tools Relevance (9 points):
     * 90%+ match: 9 points, "Excellent" rating (✅)
     * 70-89% match: 7 points, "Good" rating (👍)
     * 50-69% match: 5 points, "Fair" rating (⚠️)
     * 30-49% match: 2 points, "Needs Improvement" rating (🛑)
     * Below 30% match: 0 points, "Poor" rating (❌)
      
        4. JSON STRUCTURE:
        {{
            "score": {{
            "matchPercentage": [percentage],         // Original field for backward compatibility
            "educationMatchPercentage": [percentage],  // For education & certifications
            "educationPointsAwarded": [points],       // Out of 12 points
            "educationRating": "[rating text]",
            "educationRatingSymbol": "[emoji]",
            "skillsMatchPercentage": [percentage],    // For skills & tools
            "skillsPointsAwarded": [points],         // Out of 9 points
            "skillsRating": "[rating text]",
            "skillsRatingSymbol": "[emoji]",
            "totalPointsAwarded": [points],          // Combined total (max 21)
            "totalMatchPercentage": [percentage],    // Overall match percentage
            "pointsAwarded": [points],              // Keep this for backward compatibility
            "rating": "[overall rating text]",
            "ratingSymbol": "[overall emoji]"
            }},
            "analysis": {{
            "matchedSkills": [
                {{
                "skill": "[skill name]",
                "status": "Found in Resume",
                "symbol": "✅"
                }}
            ],
            "missingSkills": [
                {{
                "skill": "[skill name which are not present in resume skills]",
                "status": "Not Found",
                "symbol": "❌"
                }}
            ],
            "educationMatch": [
                {{
                "requirement": "[education requirement from job]",
                "status": "Found/Not Found",
                "symbol": "🎓/❌"
                }}
            ],
            "certificationMatch": [
                {{
                "certification": "[certification name that should be there and that is there (present and not present both)]",
                "status": "Found/Not Found",
                "symbol": "🎓/❌"
                }}
            ],
            "suggestedImprovements": "[detailed improvement suggestions]"
            }}
        }}

        5. DETAILED ANALYSIS REQUIREMENTS:
   - Extract ONLY legitimate technical skills, methodologies, education requirements, and qualifications from the job description
   - Compare with skills, education, and certifications listed in the resume using both exact and semantic matching
   - For "matchedSkills": List ONLY skills that are DEFINITELY present in the resume skills list
   - For "missingSkills": Include ONLY skills specifically mentioned as requirements in the job description but missing from the resume
   - For "educationMatch": Identify whether required education levels and fields of study are met in the resume
   - For "certificationMatch": Identify whether required certifications are listed in the resume
   - For "suggestedImprovements": Provide actionable suggestions for incorporating missing critical skills, education requirements, and certifications
'''
    

    response = gen_model(prompt)

    return response


def resume_structure(sections):
    try:
        present_sections = list(sections["present"])
        missing_sections = list(sections["missing"]["mandatory"])
    except (KeyError, json.JSONDecodeError) as e:
        raise ValueError("Invalid sections format or not a valid JSON string")
    
    # Define all must-have sections
    must_have_sections = ['Personal Information', 'Website/Social Links', 'Professional Summary', 
                         'Work Experience', 'Education', 'Skills and Interests']
    
    # Count completed must-have sections
    completed_sections = sum(1 for section in must_have_sections if section in present_sections)
    
    # Determine score
    if completed_sections == 6:
        points = 12
        rating_symbol = "✅"
    elif completed_sections == 5:
        points = 9
        rating_symbol = "👍"
    elif completed_sections == 4:
        points = 6
        rating_symbol = "⚠️"
    elif completed_sections == 3:
        points = 3
        rating_symbol = "🛑"
    else:
        points = 0
        rating_symbol = "❌"
    
    # Create the section status list
    sections_to_check = [
        "Personal Information",
        "Website/Social Links",
        "Work Experience",
        "Education",
        "Skills and Interests",
        "Certifications",
        "Awards & Achievements"
    ]
    
    section_status = []
    for section in sections_to_check:
        if section in present_sections:
            status = "Completed"
            symbol = "✅"
        else:
            status = "Missing"
            symbol = "❌"
        
        section_status.append({
            "section": section,
            "status": status,
            "symbol": symbol
        })
    
    # Generate improvement suggestions
    suggested_improvements = ""
    if missing_sections:
        suggested_improvements = "Consider adding these missing sections to improve your resume: "
        suggested_improvements += ", ".join(missing_sections)
        suggested_improvements += ". These sections are important for ATS compatibility."
    else:
        suggested_improvements = "Your resume has all mandatory sections. Consider enhancing existing sections with more specific details for better ATS compatibility."
    
    # Create the final JSON structure
    result = {
        "score": {
            "completedSections": completed_sections,
            "totalMustHaveSections": 6,
            "pointsAwarded": points,
            "ratingSymbol": rating_symbol
        },
        "analysis": {
            "sectionStatus": section_status,
            "suggestedImprovements": suggested_improvements
        }
    }
    
    return result

def action_words(resume_text, job_description):
    # Truncate inputs
    resume_text_truncated = truncate_text(resume_text, 10000)
    
    prompt = f'''Given the resume text: {resume_text_truncated}

        Analyze the use of strong, impactful action verbs in the resume. Generate a JSON response that includes an action words usage score and detailed analysis. Follow these specifications:

        1. SCORING SYSTEM:
        - Calculate the percentage of bullet points or experience descriptions that begin with strong action verbs
        - Identify weak verbs that could be replaced with stronger alternatives
        - Assign points based on percentage of strong action verbs used:
            * 80%+ strong action words: 10 points (✅)
            * 60-79% strong action words: 7 points (👍)
            * 40-59% strong action words: 4 points (⚠️)
            * Below 40% strong action words: 2 points (🛑)

        2. JSON STRUCTURE:
        {{
            "score": {{
            "actionVerbPercentage": [percentage],
            "pointsAwarded": [points],
            "ratingSymbol": "[emoji]"
            }},
            "analysis": {{
            "strongActionVerbs": [
                {{
                "bulletPoint": "[text from resume]",
                "status": "Strong Action Word",
                "actionVerb": "[identified action verb]",
                "symbol": "✅"
                }}
            ],
            "weakActionVerbs": [
                {{
                "bulletPoint": "[text from resume]",
                "status": "Weak Action Word",
                "actionVerb": "[identified weak verb]",
                "suggestedReplacement": "[stronger alternative]",
                "symbol": "⚠️"
                }}
            ],
            "missingActionVerbs": [
                {{
                "bulletPoint": "[text from resume]",
                "status": "No Action Word",
                "suggestedReplacement": "[suggested rewrite with action verb]",
                "symbol": "❌"
                }}
            ],
            "suggestedImprovements": "[summary of recommended changes]"
            }}
        }}

        3. DETAILED ANALYSIS REQUIREMENTS:
        - Identify all bullet points and experience descriptions in the resume
        - For each item, determine if it starts with a strong action verb, a weak verb, or no action verb
        - For "strongActionVerbs": List all bullet points that begin with strong, impactful verbs
        - For "weakActionVerbs": Identify bullet points with mediocre verbs and suggest stronger alternatives
        - For "missingActionVerbs": Highlight phrases that lack action verbs and provide rewrites
        - For "suggestedImprovements": Provide a summary of how to improve the resume's impact through better verb usage'''
    
    response = gen_model(prompt)

    return response

def measurable_results(resume_text, job_description):
    # Truncate inputs
    resume_text_truncated = truncate_text(resume_text, 10000)
    
    prompt = f'''Given the resume text: {resume_text_truncated}

Analyze whether the resume includes quantifiable metrics and measurable results. Generate a JSON response that identifies existing measurable results and provides suggestions for adding more. Follow these specifications:

Example of a MEASURABLE result:  
"Increased sales by 30%" : ✅ Yes (Contains specific metric)

Example of a NON-MEASURABLE result:
"Managed team operations" : ❌ No (Add specific metric, e.g., "Managed team operations for 15-person department, increasing efficiency by 25%")

1. SCORING SYSTEM:
   - ONLY count instances where the resume explicitly includes specific, quantifiable metrics (percentages, numbers, time periods, dollar amounts) **FOUND WITHIN THE PROVIDED {resume_text}**
   - DO NOT count vague statements or achievements without specific measurements
   - Assign points based on the number of measurable results:
      * 5+ measurable results: 10 points (✅)
      * 3-4 measurable results: 7 points (👍)
      * 1-2 measurable results: 4 points (⚠️)
      * 0 measurable results: 0 points (❌)

2. JSON STRUCTURE:
   {{
      "score": {{
         "measurableResultsCount": [number],
         "pointsAwarded": [points],
         "ratingSymbol": "[emoji]"
      }},
      "analysis": {{
         "measurableResults": [
            {{
               "bulletPoint": "[exact text from resume]",
               "metric": "[identified specific metric]",
               "symbol": "✅"
            }}
         ],
         "opportunitiesForMetrics": [
            {{
               "bulletPoint": "[exact text from resume]",
               "suggestion": "[how to add a specific metric]",
               "symbol": "❌"
            }}
         ],
         "suggestedImprovements": "[summary of recommendations for adding specific metrics]"
      }}
   }}

3. DETAILED ANALYSIS REQUIREMENTS:
   - Find any measurable results that already exist **IN THE PROVIDED resume_text **
   - Provide specific suggestions for adding measurable results to statements that lack them **WITHIN THE PROVIDED  resume_text **
   - For "measurableResults": List only instances where the resume already includes clear, quantifiable metrics **FROM THE PROVIDED  resume_text **
   - For "opportunitiesForMetrics": Identify statements that need specific quantifiable results and suggest exactly what metrics to add **FROM THE PROVIDED  resume_text **
   - For "suggestedImprovements": Provide actionable recommendations for adding metrics to strengthen the resume's impact **BASED ON THE ANALYSIS OF THE PROVIDED  resume_text **'''
            
    response = gen_model(prompt)

    return response

def bullet_point_effectiveness(resume_text):
    # Truncate inputs
    resume_text_truncated = truncate_text(resume_text, 10000)
    
    prompt = f'''Given the resume text: {resume_text_truncated}

        Analyze the effectiveness of bullet points in the resume: , evaluating their conciseness and impact. Generate a JSON response that includes a bullet point effectiveness score and detailed analysis. Follow these specifications:

        1. SCORING SYSTEM:
        - Evaluate each bullet point for:
            * Conciseness (ideally 8-15 words)
            * Specificity (clear, not vague)
            * Impact (demonstrates value or achievement)
            * Structure (begins with action verb)
        - Calculate the percentage of bullet points meeting effectiveness criteria
        - Assign points based on percentage of effective bullet points:
            * 90%+ bullets effective: 8 points (✅)
            * 70-89% bullets effective: 6 points (👍)
            * 50-69% bullets effective: 4 points (⚠️)
            * Below 50% bullets effective: 2 points (🛑)

        2. JSON STRUCTURE:
        {{
            "score": {{
            "effectiveBulletPercentage": [percentage],
            "pointsAwarded": [points],
            "ratingSymbol": "[emoji]"
            }},
            "analysis": {{
            "effectiveBullets": [
                {{
                "bulletPoint": "[take text from resume]",
                "wordCount": [number],
                "status": "Effective",
                "strengths": "[what makes it effective]",
                "symbol": "✅"
                }}
            ],
            "ineffectiveBullets": [
                {{
                "bulletPoint": "[take text from resume]",
                "wordCount": [number],
                "status": "Ineffective",
                "issues": "[identified problems]",
                "suggestedRevision": "[improved version]",
                "symbol": "❌"
                }}
            ],
            "suggestedImprovements": "[summary of how to improve bullet points]"
            }}
        }}

        3. DETAILED ANALYSIS REQUIREMENTS:
        - Identify all bullet points in the resume
        - Evaluate each bullet point based on the criteria listed above
        - For "effectiveBullets": List bullet points that meet the criteria with their strengths
        - For "ineffectiveBullets": Identify problematic bullet points, explain issues, and provide revised versions
        - For "suggestedImprovements": Provide actionable advice for improving the overall quality of bullet points'''
    
    response = gen_model(prompt)

    return response

# Batch analysis function has been removed as it was not providing optimal results
# The parallel analysis approach is faster and more accurate

def create_analysis_chain(analysis_function):
    """Create a chain that runs a specific analysis function"""
    # The lambda should directly pass the inputs to the function without any nested dictionaries
    return RunnableLambda(lambda inputs: analysis_function(**inputs))

async def detail_resume_analysis(resume_text, job_description, use_cache=True, version="v3.0"):  # Made async, updated version
    """Perform resume analysis using LangChain's optimized processing with Redis caching"""
    try:
        # Check Redis cache if enabled
        if use_cache:
            # Create a deterministic hash of the inputs including version for cache busting
            resume_str = json.dumps(resume_text, sort_keys=True)
            
            # Normalize the job description to ensure consistent caching
            job_desc_normalized = job_description.strip().lower()
            
            # Generate Redis cache key
            cache_key = redis_cache.generate_key("analysis_v3", resume_str, job_desc_normalized, version)
            
            # Add logging to debug cache key generation
            logger.info(f"Generated cache key: {cache_key[:16]}... for job desc length: {len(job_description)}")
            
            # Check Redis cache
            cached_result = await redis_cache.get(cache_key)
            if cached_result:
                logger.info("Cache HIT - Using cached analysis result from Redis")
                return cached_result
                
        # Cache miss - perform the analysis
        logger.info("Cache MISS - Starting V3 resume analysis...")
        start_time = time.time()
        print("Starting LangChain resume analysis...")
        
        # Use parallel analysis (faster and more accurate)
        print("Using parallel analysis for better results")
        
        # Get resume sections
        sections_resume = evaluate_resume_sections(resume_text)
        
        # Safe access to nested dictionaries
        work_experience = resume_text.get("Work Experience", {})
        certifications = resume_text.get("Certifications", [])
        skills = resume_text.get("Skills and Interests", [])
        
        # Create individual chains for each analysis component
        keyword_match_chain = RunnableLambda(lambda x: keyword_match(resume_text=resume_text, job_description=job_description))
        job_experience_chain = RunnableLambda(lambda x: job_experience(resume_text=work_experience, job_description=job_description))
        skills_certifications_chain = RunnableLambda(lambda x: skills_certifications(certifications=certifications, skills=skills, job_description=job_description))
        resume_structure_chain = RunnableLambda(lambda x: resume_structure(sections=sections_resume))
        action_words_chain = RunnableLambda(lambda x: action_words(resume_text=resume_text, job_description=job_description))
        measurable_results_chain = RunnableLambda(lambda x: measurable_results(resume_text=resume_text, job_description=job_description))
        bullet_point_effectiveness_chain = RunnableLambda(lambda x: bullet_point_effectiveness(resume_text=resume_text))
        
        # Create a parallel runnable that doesn't use nested dictionaries
        parallel_analysis = RunnableParallel(
            keyword_match=keyword_match_chain,
            job_experience=job_experience_chain,
            skills_certifications=skills_certifications_chain,
            resume_structure=resume_structure_chain,
            action_words=action_words_chain,
            measurable_results=measurable_results_chain,
            bullet_point_effectiveness=bullet_point_effectiveness_chain
        )
        
        # Use an empty input since all parameters are already captured in the lambda functions
        inputs = {}
        
        # Run all analyses in parallel
        results = parallel_analysis.invoke(inputs)
        
        # Extract results
        keyword_match_json = results["keyword_match"]
        job_experience_json = results["job_experience"]
        skills_certifications_json = results["skills_certifications"]
        resume_structure_json = results["resume_structure"]
        action_words_json = results["action_words"]
        measurable_results_json = results["measurable_results"]
        bullet_point_effectiveness_json = results["bullet_point_effectiveness"]
        
        print(f"LangChain analysis completed in {time.time() - start_time:.2f} seconds")
        
        # Ensure all responses are properly parsed JSON objects
        if not isinstance(keyword_match_json, dict):
            print("Warning: keyword_match_json is not a dictionary")
            keyword_match_json = json.loads(keyword_match_json) if isinstance(keyword_match_json, str) else {"score": {"pointsAwarded": 0}}
        
        if not isinstance(job_experience_json, dict):
            print("Warning: job_experience_json is not a dictionary")
            job_experience_json = json.loads(job_experience_json) if isinstance(job_experience_json, str) else {"score": {"pointsAwarded": 0}}
        
        if not isinstance(skills_certifications_json, dict):
            print("Warning: skills_certifications_json is not a dictionary")
            skills_certifications_json = json.loads(skills_certifications_json) if isinstance(skills_certifications_json, str) else {"score": {"pointsAwarded": 0}}
        
        if not isinstance(resume_structure_json, dict):
            print("Warning: resume_structure_json is not a dictionary")
            resume_structure_json = json.loads(resume_structure_json) if isinstance(resume_structure_json, str) else {"score": {"pointsAwarded": 0}}
        
        if not isinstance(action_words_json, dict):
            print("Warning: action_words_json is not a dictionary")
            action_words_json = json.loads(action_words_json) if isinstance(action_words_json, str) else {"score": {"pointsAwarded": 0}}
        
        if not isinstance(measurable_results_json, dict):
            print("Warning: measurable_results_json is not a dictionary")
            measurable_results_json = json.loads(measurable_results_json) if isinstance(measurable_results_json, str) else {"score": {"pointsAwarded": 0}}
        
        if not isinstance(bullet_point_effectiveness_json, dict):
            print("Warning: bullet_point_effectiveness_json is not a dictionary")
            bullet_point_effectiveness_json = json.loads(bullet_point_effectiveness_json) if isinstance(bullet_point_effectiveness_json, str) else {"score": {"pointsAwarded": 0}}
        
        # Now calculate the overall score
        overall_resume_score = overall_score(
            keyword_match_json['score']['pointsAwarded'], 
            job_experience_json['score']['pointsAwarded'], 
            skills_certifications_json['score']['pointsAwarded'], 
            resume_structure_json['score']['pointsAwarded'], 
            action_words_json['score']['pointsAwarded'], 
            measurable_results_json['score']['pointsAwarded'], 
            bullet_point_effectiveness_json['score']['pointsAwarded']
        )
        
        # Round all scores in the individual components
        for component in [keyword_match_json, job_experience_json, skills_certifications_json, 
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
        
        # Combine all the JSON results into a single dictionary
        result = {
            "overall_score": round(overall_resume_score),
            "keyword_match": keyword_match_json,
            "job_experience": job_experience_json,
            "skills_certifications": skills_certifications_json,
            "resume_structure": resume_structure_json,
            "action_words": action_words_json,
            "measurable_results": measurable_results_json,
            "bullet_point_effectiveness": bullet_point_effectiveness_json
        }
        
        # After receiving responses from gen_model, normalize the data structure:
        def normalize_skills_list(skills_list):
            """Ensure skills list items are all objects with consistent structure"""
            normalized = []
            for skill in skills_list:
                if isinstance(skill, str):
                    normalized.append({"skill": skill, "status": "Found in Resume", "symbol": "✅"})
                else:
                    normalized.append(skill)
            return normalized

        # Apply this to skills_certifications_json
        if 'analysis' in skills_certifications_json and 'matchedSkills' in skills_certifications_json['analysis']:
            try:
                skills_certifications_json['analysis']['matchedSkills'] = normalize_skills_list(
                    skills_certifications_json['analysis']['matchedSkills']
                )
            except Exception as e:
                print(f"Error normalizing skills_certifications_json: {str(e)}")
                skills_certifications_json = {"score": {"pointsAwarded": 0, "matchPercentage": 0, "rating": "Error"}, "analysis": {"matchedSkills": [], "missingSkills": [], "certificationMatch": []}}
        
        # Ensure backward compatibility for skills_certifications_json
        if 'score' in skills_certifications_json:
            # Make sure matchPercentage exists for backward compatibility
            if 'matchPercentage' not in skills_certifications_json['score']:
                # If we have skillsMatchPercentage, use that
                if 'skillsMatchPercentage' in skills_certifications_json['score']:
                    skills_certifications_json['score']['matchPercentage'] = skills_certifications_json['score']['skillsMatchPercentage']
                # Otherwise use totalMatchPercentage or a default
                elif 'totalMatchPercentage' in skills_certifications_json['score']:
                    skills_certifications_json['score']['matchPercentage'] = skills_certifications_json['score']['totalMatchPercentage']
                else:
                    # Calculate a default percentage based on points awarded
                    points = skills_certifications_json['score'].get('pointsAwarded', 0)
                    skills_certifications_json['score']['matchPercentage'] = (points / 12) * 100 if points > 0 else 0
        
        # Cache the result in Redis if caching is enabled
        if use_cache:
            from app.core.config import settings
            await redis_cache.set(cache_key, result, ttl=settings.cache_ttl_seconds)
            logger.info("Cached analysis result in Redis")
        
        return result
    
    except Exception as e:
        print(f"Error in detail_resume_analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Return a minimal structure to prevent frontend errors
        return {
            "overall_score": 0,
            "keyword_match": {"score": {"pointsAwarded": 0, "matchPercentage": 0, "rating": "Error"}, "analysis": {"matchedKeywords": [], "missingKeywords": []}},
            "job_experience": {"score": {"pointsAwarded": 0, "alignmentPercentage": 0, "rating": "Error"}, "analysis": {"strongMatches": [], "partialMatches": [], "missingExperience": []}},
            "skills_certifications": {"score": {"pointsAwarded": 0, "matchPercentage": 0, "rating": "Error"}, "analysis": {"matchedSkills": [], "missingSkills": [], "certificationMatch": []}},
            "resume_structure": {"score": {"pointsAwarded": 0, "completedSections": 0, "totalMustHaveSections": 4}, "analysis": {"sectionStatus": []}},
            "action_words": {"score": {"pointsAwarded": 0, "actionVerbPercentage": 0}, "analysis": {"strongActionVerbs": [], "weakActionVerbs": []}},
            "measurable_results": {"score": {"pointsAwarded": 0, "measurableResultsCount": 0}, "analysis": {"measurableResults": [], "opportunitiesForMetrics": []}},
            "bullet_point_effectiveness": {"score": {"pointsAwarded": 0, "effectiveBulletPercentage": 0}, "analysis": {"effectiveBullets": [], "ineffectiveBullets": []}}
        }

def overall_score(score1, score2, score3, score4, score5, score6, score7):
    # Convert all scores to float or int, with default of 0
    try:
        # Define the correct maximum points for each component
        max_keyword_points = 21       # Keyword & Contextual Match (35% of Job Fit = 21 pts)
        max_experience_points = 18     # Experience Alignment (30% of Job Fit = 18 pts)
        max_skills_cert_points = 21    # Combined Skills & Certifications (21 pts total)
        max_structure_points = 12      # Resume Structure (30% of Resume Quality = 12 pts)
        max_action_words_points = 10   # Action Words Usage (25% of Resume Quality = 10 pts)
        max_measurable_results_points = 10  # Measurable Results (25% of Resume Quality = 10 pts)
        max_bullet_points_points = 8   # Bullet Point Effectiveness (20% of Resume Quality = 8 pts)
        
        # Job Fit Score components (60% of total)
        s1 = float(score1) if score1 is not None else 0  # Keyword & Contextual Match
        s2 = float(score2) if score2 is not None else 0  # Experience Alignment
        s3 = float(score3) if score3 is not None else 0  # Skills & Certifications component from API
        
        # Resume Quality Score components (40% of total)
        s4 = float(score4) if score4 is not None else 0  # Resume Structure
        s5 = float(score5) if score5 is not None else 0  # Action Words Usage
        s6 = float(score6) if score6 is not None else 0  # Measurable Results
        s7 = float(score7) if score7 is not None else 0  # Bullet Point Effectiveness
        
        # Calculate Job Fit Score (60% of total)
        # For the Skills & Certifications component (s3), we need to split it into:
        # - Education & Certifications (20% of Job Fit = 12 pts)
        # - Skills & Tools Relevance (15% of Job Fit = 9 pts)
        
        # We'll use the s3 score proportionally for both education and skills components
        education_score = (s3/max_skills_cert_points) * 12  # Education & Certifications (12 pts)
        skills_score = (s3/max_skills_cert_points) * 9      # Skills & Tools Relevance (9 pts)
        
        # Calculate total Job Fit Score (60 pts)
        job_fit_score = s1 + s2 + education_score + skills_score
        
        # Calculate Resume Quality Score (40% of total)
        resume_quality_score = s4 + s5 + s6 + s7
        
        # Return combined score rounded to the nearest integer
        return round(job_fit_score + resume_quality_score)
    except (ValueError, TypeError) as e:
        print(f"Error calculating overall score: {e}")
        print(f"Scores: {score1}, {score2}, {score3}, {score4}, {score5}, {score6}, {score7}")
        return 0