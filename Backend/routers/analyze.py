from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
import json
import time
import logging
from pybreaker import CircuitBreakerError

from pydantic import ValidationError

from app.utils.text_extraction import extract_text_from_pdf
from app.utils.openai_extraction import extract_components_openai
from app.resume_structure_analysis.resume_analysis_v4 import analyze_resume_v4
from app.core.exceptions import (
    ResumeExtractionError,
    InvalidResumeContentError, 
    PDFValidationError,
    OpenAIError
)
from app.core.config import settings
from schemas.analyze import AnalyzeResponse, JobData, FilterJobDescriptionRequest, FilterJobDescriptionResponse
from app.middleware.rate_limit import limiter
from app.middleware.auth import verify_api_key
from app.utils.sanitization import sanitize_job_data, sanitize_filename, validate_pdf_content
from fastapi import Depends

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Welcome to Resume Analysis API"}

@router.post("/api/analyze", response_model=AnalyzeResponse)
@limiter.limit("10/minute")  # 10 requests per minute per IP
@limiter.limit("50/hour")    # 50 requests per hour per IP
async def job_analysis(
    request: Request,  # Required for rate limiting
    resume: UploadFile = File(...),
    jobData: str = Form(...),
    api_key: str = Depends(verify_api_key)  # API key authentication
):
    logger.info("Received job analysis request (V4 scoring)")
    start_time = time.time()

    try:
        # Validate and parse job data
        try:
            job_data_dict = json.loads(jobData)
            # Sanitize job data before validation
            job_data_dict = sanitize_job_data(job_data_dict)
            validated_job_data = JobData(**job_data_dict)
        except (json.JSONDecodeError, ValidationError) as e:
            logger.error(f"Job data validation error: {str(e)}")
            error_details = []
            if isinstance(e, ValidationError):
                error_details = e.errors()
            else:
                error_details = [{
                    "loc": ["jobData"],
                    "msg": "Invalid JSON in 'jobData' field",
                    "type": "value_error.jsondecode"
                }]
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Invalid job data format",
                    "errors": error_details
                }
            )

        # Validate PDF file
        if (resume.content_type != 'application/pdf') or (not resume.filename.lower().endswith('.pdf')):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")

        resume_content = await resume.read()
        
        # Check file size
        max_size = settings.max_pdf_size_mb * 1024 * 1024
        if len(resume_content) > max_size:
            raise HTTPException(
                status_code=413,
                detail=f"File too large (max {settings.max_pdf_size_mb}MB)"
            )
        
        # Check PDF magic bytes
        if not resume_content.startswith(b'%PDF-'):
            raise HTTPException(status_code=400, detail="Invalid PDF file content")

        # Extract text from PDF
        try:
            resume_text = extract_text_from_pdf(resume_content)
            if not resume_text or len(resume_text.strip()) < 50:
                raise HTTPException(
                    status_code=400,
                    detail="Resume content is too short or empty (minimum 50 characters)"
                )
        except PDFValidationError as e:
            logger.error(f"PDF validation error: {e}")
            raise HTTPException(status_code=400, detail=str(e))

        # Extract components using OpenAI
        try:
            components = await extract_components_openai(resume_text)
        except InvalidResumeContentError as e:
            logger.error(f"Invalid resume content: {e}")
            raise HTTPException(status_code=400, detail=str(e))
        except ResumeExtractionError as e:
            logger.error(f"Resume extraction error: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to process resume. Please try again."
            )
        except OpenAIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise HTTPException(
                status_code=503,
                detail="AI service temporarily unavailable. Please try again later."
            )

        # Perform V4 analysis
        try:
            logger.info("Using V4 scoring system")
            analysis = await analyze_resume_v4(
                resume_data=components,
                job_description=validated_job_data.description
            )
            
            if not analysis or not isinstance(analysis, dict):
                raise ValueError("Analysis returned invalid data")
                
        except Exception as e:
            logger.error(f"Analysis error: {e}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail="Unable to complete resume analysis. Please try again."
            )

        process_time = time.time() - start_time
        logger.info(f"Successful resume analysis completed in {process_time:.2f} seconds")

        # Save response to output.json for inspection as requested by user
        try:
            response_to_save = {
                "job_context": {
                    "title": validated_job_data.jobTitle or "Job Position",
                    "company": validated_job_data.company or "Company",
                    "description_length": len(validated_job_data.description)
                },
                "analysis": analysis,
                "process_time_seconds": round(process_time, 2)
            }
            with open("output.json", "w") as f:
                json.dump(response_to_save, f, indent=4)
            logger.info("Saved response to output.json")
        except Exception as e:
            logger.warning(f"Failed to write output.json: {e}")

        return {
            "job_context": {
                "title": validated_job_data.jobTitle or "Job Position",
                "company": validated_job_data.company or "Company",
                "description_length": len(validated_job_data.description)
            },
            "analysis": analysis,
            "process_time_seconds": round(process_time, 2)
        }

    except HTTPException:
        raise
    except CircuitBreakerError:
        logger.error("Circuit breaker is open - OpenAI API is unavailable")
        raise HTTPException(
            status_code=503,
            detail="AI service temporarily unavailable. Please try again in a minute."
        )
    except Exception as e:
        logger.error(f"Unexpected error in analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/api/filter-job-description", response_model=FilterJobDescriptionResponse)
@limiter.limit("20/minute")  # 20 requests per minute per IP
async def filter_job_description(request: Request, request_data: FilterJobDescriptionRequest):
    """
    Filter job description text using LLM to extract only the core job posting.
    
    This endpoint uses an LLM to intelligently filter out navigation, sidebar,
    and other unwanted content from job description text.
    
    Args:
        request: FilterJobDescriptionRequest with 'text' field
        
    Returns:
        FilterJobDescriptionResponse with filtered text and statistics
        
    Raises:
        HTTPException: If validation fails or LLM processing fails
    """
    from app.utils.job_filter import filter_job_description_llm
    from app.core.exceptions import OpenAIError
    
    logger.info("Received job description filtering request")
    
    try:
        # Validate input is handled by Pydantic
        raw_text = request.text
        
        # Apply LLM filtering
        try:
            filtered_text = filter_job_description_llm(raw_text)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except OpenAIError as e:
            logger.error(f"OpenAI API error during filtering: {e}")
            raise HTTPException(
                status_code=503,
                detail="AI service temporarily unavailable. Please try again later."
            )
        
        # Return results
        logger.info(f"Successfully filtered job description: {len(raw_text)} → {len(filtered_text)} chars")
        
        # Debug: Log response data
        response_data = {
            "filtered_text": str(filtered_text),
            "original_length": int(len(raw_text)),
            "filtered_length": int(len(filtered_text)),
            "reduction_percent": float(round((1 - len(filtered_text) / len(raw_text)) * 100, 1) if len(raw_text) > 0 else 0.0)
        }
        logger.info(f"Response data types: {[(k, type(v).__name__) for k, v in response_data.items()]}")
        
        return FilterJobDescriptionResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in job description filtering: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

