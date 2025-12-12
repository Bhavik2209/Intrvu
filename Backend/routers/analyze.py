from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import json
import os
import time
import logging

from pydantic import ValidationError

from app.utils.text_extraction import extract_text_from_pdf
from app.utils.openai_extraction import extract_components_openai
from app.resume_structure_analysis.analysis import detail_resume_analysis
from schemas.analyze import AnalyzeResponse, JobData

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Welcome to Resume Analysis API"}

@router.post("/api/analyze", response_model=AnalyzeResponse)
async def job_analysis(
    resume: UploadFile = File(...),
    jobData: str = Form(...)
):
    logger.info("Received job analysis request")
    start_time = time.time()

    try:
        try:
            job_data_dict = json.loads(jobData)
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

        if (resume.content_type != 'application/pdf') or (not resume.filename.lower().endswith('.pdf')):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")

        resume_content = await resume.read()
        if not resume_content.startswith(b'%PDF-'):
            raise HTTPException(status_code=400, detail="Invalid PDF file content")

        resume_text = extract_text_from_pdf(resume_content)
        if not resume_text or len(resume_text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Resume content is too short or empty")

        components = extract_components_openai(resume_text)

        analysis = detail_resume_analysis(resume_text=components, job_description=validated_job_data.description)
        if not analysis:
            raise HTTPException(status_code=500, detail="Unable to complete resume analysis")

        process_time = time.time() - start_time
        logger.info(f"Successful resume analysis completed in {process_time:.2f} seconds")

        if os.getenv("DEBUG_WRITE_OUTPUT", "false").lower() in ("1", "true", "yes"):
            try:
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
            except Exception as e:
                logger.warning(f"Failed to write debug output.json: {e}")

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
    except Exception as e:
        logger.error(f"Unexpected error in analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
