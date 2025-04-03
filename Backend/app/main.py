from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError
from typing import Optional
import json
import logging
import os
import time

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
    description: str = Field(min_length=100, max_length=5000)
    url: str = Field(max_length=500)

@router.get("/")
async def root():
    return {"message": "Welcome to Resume Analysis API"}

@router.post("/api/analyze")
async def job_analysis(
    resume: UploadFile = File(...),
    jobData: str = Form(...)
):
    logger.info("Received job analysis request")
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
        resume_text = extract_text_from_pdf(resume.file)
        
        # Validate resume text
        if not resume_text or len(resume_text.strip()) < 50:
            raise HTTPException(
                status_code=400, 
                detail="Resume content is too short or empty"
            )
        
        # Extract resume components
        components = extract_components_openai(resume_text)
        if not isinstance(components, dict):
            raise HTTPException(
                status_code=500, 
                detail="Failed to process resume components"
            )
        
        # Perform resume analysis
        analysis = detail_resume_analysis(
            components, 
            validated_job_data.description
        )
        
        # Validate analysis results
        if not analysis.get("overall_score"):
            raise HTTPException(
                status_code=500, 
                detail="Unable to complete resume analysis"
            )
        
        # Log successful analysis
        logger.info(f"Successful resume analysis for job: {validated_job_data.jobTitle}")
        
        logger.info("Successfully processed request")
        return {
            "job_context": {
                "title": validated_job_data.jobTitle or "Job Position",
                "company": validated_job_data.company or "Company",
                "description_length": len(validated_job_data.description)
            },
            "analysis": analysis
        }
    
    except HTTPException as http_error:
        # Re-raise HTTP exceptions
        raise http_error
    
    except Exception as e:
        # Catch any unexpected errors
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="An unexpected error occurred"
        )

@router.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "API is running"}