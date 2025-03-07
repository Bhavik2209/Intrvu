from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional

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
    print(jobData)
    # Validate file type
    if not resume.content_type == "application/pdf":
        return {"error": "Only PDF files are accepted"}
    
    # Here you can process the resume and job data
    # For now, we'll just return a success message
    return {"message": "Data accepted successfully"}
    