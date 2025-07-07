from openai import OpenAI
import os
import json
import logging
import hashlib
from typing import Dict, Any, Union, Optional
from functools import lru_cache
from dotenv import load_dotenv

# LangChain imports
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.runnables import RunnableLambda
from langchain.cache import InMemoryCache
from langchain.globals import set_llm_cache

# Configure logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables securely
try:
    load_dotenv()
except Exception as e:
    logger.error(f"Error loading environment variables: {e}")
    raise

# Setup LangChain caching
set_llm_cache(InMemoryCache())

# Initialize component extraction cache
_component_cache = {}
MAX_CACHE_SIZE = 50  # Maximum number of cached results

def validate_api_key(api_key: str) -> None:
    """
    Validate OpenAI API key before usage
    
    Args:
        api_key (str): OpenAI API key
    
    Raises:
        ValueError: If API key is invalid or missing
    """
    if not api_key:
        logger.error("OpenAI API key is missing")
        raise ValueError("OpenAI API key must be provided")
    
    # Basic pattern validation (optional, adjust as needed)
    if len(api_key) < 20:
        logger.warning("API key seems unusually short")

# Secure API key retrieval
try:
    api_key = os.getenv("OPENAI_API_KEY")
    validate_api_key(api_key)
    
    # Initialize LangChain ChatOpenAI model
    llm = ChatOpenAI(
        model="gpt-3.5-turbo",
        temperature=0.1,
        max_tokens=4000,
        request_timeout=30.0
    )
    
    # Initialize JSON parser
    json_parser = JsonOutputParser()
    
except ValueError as ve:
    logger.error(f"API Key Validation Error: {ve}")
    raise
except Exception as e:
    logger.error(f"Error initializing LangChain components: {e}")
    raise

def sanitize_input(text: str, max_length: int = 10000) -> str:
    """
    Sanitize and truncate input text to prevent excessive API calls
    
    Args:
        text (str): Input text to sanitize
        max_length (int): Maximum allowed length
    
    Returns:
        str: Sanitized text
    """
    if not text:
        return ""
    
    # Truncate to prevent extremely long inputs
    return text[:max_length].strip()

def create_resume_extraction_chain():
    """
    Create a LangChain chain for resume information extraction
    
    Returns:
        Chain: A LangChain chain for processing resume text
    """
    # Define the system and user message templates
    system_template = """You are a resume analysis specialist that extracts structured information from resumes and returns it as valid JSON. 
Only respond with valid JSON, no explanations or extra text."""
    
    user_template = """Extract the following information from the resume text below and format it as a structured JSON:

1. Personal Information: Full name, email, phone number, and location
2. Website/Social Links: LinkedIn profile URL and any other relevant online profiles
3. Professional Summary: Create a concise, clear, and impactful summary (max 2-3 sentences)
4. Work Experience: For each position, extract company name, job title, dates, location, and key responsibilities/achievements
5. Education: For each degree, include institution name, degree title, field of study, and graduation date
6. Certifications: List all professional certifications with names, issuing organizations, and dates
7. Awards/Achievements: List all honors with titles, issuing organizations, and dates
8. Projects: Include project names, descriptions, your role, technologies used, and outcomes
9. Skills and Interests: List technical skills, soft skills, languages, and personal interests
10. Volunteering: Include organization names, roles, dates, and key contributions
11. Publications: Include titles, publication venues, dates, and co-authors if applicable

Return the information in valid JSON format and if any section is missing so please add that section with empty list like [].

Resume text: {resume_text}

Important: Return ONLY valid JSON without any additional text, explanations, or formatting."""
    
    # Create the prompt from templates
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_template),
        ("user", user_template)
    ])
    
    # Create the chain
    chain = (
        {"resume_text": RunnablePassthrough()}
        | prompt
        | llm
        | RunnableLambda(lambda x: x.content)
        | RunnableLambda(lambda x: x.replace("```json", "").replace("```", "").strip())
        | json_parser
    )
    
    return chain

# Create the extraction chain once
extraction_chain = create_resume_extraction_chain()

def extract_components_openai(resume_text: str, use_cache: bool = True) -> Dict[str, Any]:
    """
    Extract structured information from resume text using LangChain with caching.
    
    Args:
        resume_text (str): The text content of the resume
        use_cache (bool): Whether to use caching for results
        
    Returns:
        dict: Structured resume information or error message
    """
    try:
        # Input validation and sanitization
        resume_text = sanitize_input(resume_text)
        
        if not resume_text or len(resume_text.strip()) < 50:
            logger.warning("Resume text is too short")
            return {"error": "Resume text is too short or empty"}
        
        # Generate cache key if caching is enabled
        if use_cache:
            # Create a deterministic hash of the input
            cache_key = hashlib.md5(resume_text.encode()).hexdigest()
            
            # Check if we have a cached result
            if cache_key in _component_cache:
                logger.info("Using cached resume components")
                return _component_cache[cache_key]
        
        # Log start of extraction
        logger.info("Starting resume component extraction with LangChain")
        start_time = __import__("time").time()
        
        # Run the extraction chain
        try:
            result = extraction_chain.invoke(resume_text)
            
            # Additional validation of parsed JSON
            if not isinstance(result, dict):
                raise ValueError("Parsed result is not a dictionary")
            
            # Cache the result if caching is enabled
            if use_cache:
                # If cache is full, remove oldest entry
                if len(_component_cache) >= MAX_CACHE_SIZE:
                    oldest_key = next(iter(_component_cache))
                    del _component_cache[oldest_key]
                
                # Add new result to cache
                _component_cache[cache_key] = result
            
            # Log successful extraction
            end_time = __import__("time").time()
            logger.info(f"Resume extraction completed in {end_time - start_time:.2f} seconds")
            
            return result
            
        except Exception as chain_error:
            logger.error(f"Error in LangChain execution: {chain_error}")
            raise
    
    except Exception as e:
        # Comprehensive error logging
        logger.error(f"Resume analysis error: {e}", exc_info=True)
        return {
            "error": "An unexpected error occurred during resume analysis",
            "error_type": str(type(e)),
            "error_details": str(e)
        }

# def compare_desc_resume(job_data: Dict[str, Any], resume_json: Dict[str, Any]) -> Dict[str, Union[str, int]]:
#     """
#     Compare job description with resume data and provide a brief analysis.
    
#     Args:
#         job_data (dict): Job data including title, company, and description
#         resume_json (dict): Structured resume data extracted from PDF
        
#     Returns:
#         dict: Analysis results including match score and brief summary
#     """
#     try:
#         # Validate inputs
#         if not job_data or not resume_json:
#             logger.warning("Missing job data or resume information")
#             return {
#                 "error": "Incomplete input data",
#                 "match_score": 0,
#                 "analysis": "Unable to analyze due to missing information."
#             }
        
#         # Sanitize inputs
#         job_desc = sanitize_input(str(job_data))
#         resume_str = json.dumps(resume_json)
        
#         # Create a prompt for comparison
#         prompt = f"""
# Compare the following job description with the candidate's resume information and provide a brief analysis:
# Job Description: {job_desc}
# Resume Information: {resume_str}

# Provide a brief, precise assessment of the match between the candidate and the job, focusing on:
# 1. Skill alignment
# 2. Experience relevance
# 3. Potential fit

# Return a concise 50-word assessment.
# """
        
#         # Call OpenAI API with enhanced error handling
#         response = client.chat.completions.create(
#             model="gpt-3.5-turbo",
#             messages=[
#                 {"role": "system", "content": "You are a job matching specialist. Provide concise, honest assessments of how well a candidate matches a job description."},
#                 {"role": "user", "content": prompt}
#             ],
#             temperature=0.7,
#             max_tokens=100,
#             # Add timeout
#             timeout=30.0
#         )
        
#         # Extract and sanitize the response
#         analysis = response.choices[0].message.content.strip()
        
#         # Log successful analysis
#         logger.info("Successfully completed job-resume comparison")
        
#         return {
#             "analysis": analysis,
#             "match_score": 0  # Consider implementing a scoring mechanism
#         }
    
#     except Exception as e:
#         # Comprehensive error handling
#         logger.error(f"Job-resume comparison error: {e}", exc_info=True)
#         return {
#             "error": f"Failed to compare resume with job description: {e}",
#             "match_score": 0,
#             "analysis": "Unable to analyze the match due to an unexpected error."
#         }