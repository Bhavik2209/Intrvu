from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from .text_extraction import extract_text_from_pdf
from .openai import extract_components_openai

app = FastAPI()

class JobData(BaseModel):
    jobTitle: Optional[str] = None
    company: Optional[str] = None
    description: str
    url: str

@app.post("/")
async def job_analysis(
    resume: UploadFile = File(...),
    jobData: str = Form(...)
):
    try:
        # Validate file type
        if not resume.content_type == "application/pdf":
            return {"error": "Only PDF files are accepted"}
            
        # Extraction of text from the resume PDF file
        resume_text = extract_text_from_pdf(resume.file)
        
        if not resume_text or len(resume_text.strip()) < 50:
            return {"error": "Failed to extract text from PDF or content is too short"}
            
        components = extract_components_openai(resume_text)
        print(components)
        # Check if there was an error in extraction
        if "error" in components:
            return components
        
        # Process the job data and components
        
        return {
            "message": "Data processed successfully",
            "resume_components": components
        }
    except Exception as e:
        import traceback
        return {"error": f"Process failed: {str(e)}", "traceback": traceback.format_exc()}