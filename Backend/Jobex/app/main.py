from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
import json
from .text_extraction import extract_text_from_pdf
from .openai import extract_components_openai
# from .analysis import ResumeAnalyzer
from .resume_analysis import detail_resume_analysis
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only - restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        job_data_dict = json.loads(jobData)
        
        # Add validation for job description
        if not job_data_dict.get("description"):
            return {"error": "Job description is required"}
            
        if len(job_data_dict["description"]) < 100:
            return {"error": "Job description is too short"}
            
        # Extract and validate resume text
        resume_text = extract_text_from_pdf(resume.file)
        if not resume_text or len(resume_text.strip()) < 50:
            return {"error": "Failed to extract text from PDF or content is too short"}
            
        # Log inputs for debugging
        print(f"Job Description (first 100 chars): {job_data_dict['description'][:100]}")
        print(f"Resume Text (first 100 chars): {resume_text[:100]}")
        
        components = extract_components_openai(resume_text)
        if not isinstance(components, dict):
            return {"error": "Invalid resume components structure"}
            
        analysis = detail_resume_analysis(components, job_data_dict["description"])
        
        # Validate analysis results
        if not analysis.get("overall_score"):
            return {"error": "Invalid analysis results"}
            
        return {
            "job_context": {
                "title": job_data_dict.get("jobTitle", "Job Position"),
                "company": job_data_dict.get("company", "Company"),
                "description_length": len(job_data_dict["description"])
            },
            "analysis": analysis
        }
        
    except Exception as e:
        print(f"Error in job_analysis: {str(e)}")
        return {"error": f"Analysis failed: {str(e)}"}


# def format_analysis_results(analysis):
#     """Format the analysis results for better display in the frontend"""
    
#     # Calculate match level based on overall score
#     match_level = "Excellent Match" if analysis['overall_score'] >= 85 else \
#                  "Strong Match" if analysis['overall_score'] >= 70 else \
#                  "Good Match" if analysis['overall_score'] >= 55 else \
#                  "Fair Match" if analysis['overall_score'] >= 40 else \
#                  "Poor Match"
    
#     # Create a markdown formatted string of the analysis
#     formatted = {
#         "summary": {
#             "match_level": match_level,
#             "overall_score": analysis['overall_score']
#         },
#         "category_scores": {
#             "keyword_match": {
#                 "score": analysis['category_scores']['keyword_match'],
#                 "max": 20,
#                 "icon": "🎯"
#             },
#             "job_experience": {
#                 "score": analysis['category_scores']['job_experience'],
#                 "max": 20,
#                 "icon": "💼"
#             },
#             "skills_certifications": {
#                 "score": analysis['category_scores']['skills_certifications'],
#                 "max": 15,
#                 "icon": "📚"
#             },
#             "resume_structure": {
#                 "score": analysis['category_scores']['resume_structure'],
#                 "max": 15,
#                 "icon": "📝"
#             },
#             "action_words": {
#                 "score": analysis['category_scores']['action_words'],
#                 "max": 10,
#                 "icon": "💪"
#             },
#             "measurable_results": {
#                 "score": analysis['category_scores']['measurable_results'],
#                 "max": 10,
#                 "icon": "📊"
#             },
#             "bullet_effectiveness": {
#                 "score": analysis['category_scores']['bullet_effectiveness'],
#                 "max": 10,
#                 "icon": "✍️"
#             }
#         },
#         "detailed_analysis": {
#             "keyword_match": analysis['detailed_analysis']['keyword_match'],
#             "job_experience": analysis['detailed_analysis']['job_experience'],
#             "skills_certifications": analysis['detailed_analysis']['skills_certifications'],
#             "resume_structure": analysis['detailed_analysis']['resume_structure'],
#             "action_words": analysis['detailed_analysis']['action_words'],
#             "measurable_results": analysis['detailed_analysis']['measurable_results'],
#             "bullet_effectiveness": analysis['detailed_analysis']['bullet_effectiveness']
#         },
#         "job_requirements": analysis.get('job_requirements', {
#             "keywords": [],
#             "experience": "Not specified",
#             "skills": []
#         }),
#         "matches_found": analysis.get('matches_found', {
#             "keywords": [],
#             "experience": [],
#             "metrics": []
#         }),
#         "missing_elements": analysis.get('missing_elements', {
#             "keywords": [],
#             "experience": [],
#             "skills": [],
#             "sections": []
#         }),
#         "recommendations": []
#     }

#     # Process AI-generated recommendations
#     for rec in analysis['recommendations']:
#         # Check if recommendation is in the new AI format
#         if '[' in rec and ']' in rec:
#             # Already formatted by AI
#             formatted["recommendations"].append({
#                 "priority": rec[1:rec.index(']')].lower(),
#                 "content": rec[rec.index(']')+2:]
#             })
#         else:
#             # Legacy format or fallback recommendation
#             formatted["recommendations"].append({
#                 "priority": "medium",
#                 "content": rec
#             })

#     return formatted