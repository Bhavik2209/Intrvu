from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError
from typing import Optional
import json
import logging
import os
import time
from functools import lru_cache

# Import your custom modules
from .text_extraction import extract_text_from_pdf
from .openai import extract_components_openai
from .resume_analysis import detail_resume_analysis

# Configure logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create router instead of app
router = APIRouter()

# Enhanced Job Data Model with more validation
class JobData(BaseModel):
    jobTitle: Optional[str] = Field(default=None, max_length=100)
    company: Optional[str] = Field(default=None, max_length=100)
    description: str = Field(min_length=100)
    url: str = Field(max_length=500)

@router.get("/")
async def root():
    return {"message": "Welcome to Resume Analysis API"}

# We now use the internal caching in the openai.py module
# This is kept for backward compatibility
@lru_cache(maxsize=32)
def get_cached_components(resume_hash):
    """Legacy cache function - now using the enhanced caching in openai.py"""
    return None

@router.post("/api/analyze")
async def job_analysis(
    resume: UploadFile = File(...),
    jobData: str = Form(...)
):
    logger.info("Received job analysis request")
    start_time = time.time()
    
    try:
        # Validate job data using Pydantic
        try:
            job_data_dict = json.loads(jobData)
            validated_job_data = JobData(**job_data_dict)
        except (json.JSONDecodeError, ValidationError) as e:
            logger.error(f"Job data validation error: {str(e)}")
            raise HTTPException(
                status_code=400, 
                detail="Invalid job data format"
            )
        
        # Validate file type
        if not resume.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=400, 
                detail="Only PDF files are allowed"
            )
        
        # Extract text directly from file in memory
        resume_content = await resume.read()
        resume_text = extract_text_from_pdf(resume_content)
        
        # Validate resume text
        if not resume_text or len(resume_text.strip()) < 50:
            raise HTTPException(
                status_code=400, 
                detail="Resume content is too short or empty"
            )
        
        # Extract resume components using the enhanced LangChain implementation with built-in caching
        # Note: This only caches the resume component extraction, not the analysis which depends on job description
        logger.info("Extracting resume components with LangChain")
        components = extract_components_openai(resume_text, use_cache=True)
        
        # Log the job description length to help with debugging cache issues
        logger.info(f"Job description length: {len(validated_job_data.description)} characters")
        
        if not isinstance(components, dict):
            raise HTTPException(
                status_code=500, 
                detail="Failed to process resume components"
            )
        
        # Perform optimized resume analysis with caching that includes job description
        # This ensures different job descriptions get different analysis results
        logger.info("Starting resume analysis")
        analysis = detail_resume_analysis(
            components, 
            validated_job_data.description,
            use_cache=True  # Explicitly enable caching with job-aware keys
        )
        
        # Validate analysis results
        if not analysis.get("overall_score"):
            raise HTTPException(
                status_code=500, 
                detail="Unable to complete resume analysis"
            )
        
        # Log successful analysis
        process_time = time.time() - start_time
        logger.info(f"Successful resume analysis completed in {process_time:.2f} seconds")
        print(analysis)

        with open("output.json", "w") as f:
            json.dump({
                "job_context": {
                    "title": validated_job_data.jobTitle or "Job Position",
                    "company": validated_job_data.company or "Company",
                    "description_length": len(validated_job_data.description)
                },
                "analysis": analysis,
                "process_time_seconds": round(process_time, 2)
            }, f)
        return {
            "job_context": {
                "title": validated_job_data.jobTitle or "Job Position",
                "company": validated_job_data.company or "Company",
                "description_length": len(validated_job_data.description)
            },
            "analysis": analysis,
            "process_time_seconds": round(process_time, 2)
        }
    
    except HTTPException as http_error:
        # Re-raise HTTP exceptions
        raise http_error
    
    except Exception as e:
        # Log the full exception
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        
        # Catch any unexpected errors
        raise HTTPException(
            status_code=500, 
            detail="An unexpected error occurred"
        )

@router.get("/api/health")
async def health_check():
    return {
        "status": "ok", 
        "message": "API is running",
        "version": "1.1.0"  # Add version tracking
    }