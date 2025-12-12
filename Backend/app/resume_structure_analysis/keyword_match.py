from app.services.openai_model import gen_model
from app.prompts.templates import keyword_match_prompt

def keyword_match(resume_text, job_description):
    """
    Updated keyword matching analysis based on V3 scoring system (35 points max).
    Uses semantic matching with cosine similarity thresholds.
    """
    if not job_description or not resume_text:
        raise ValueError("Job description or resume text is empty")
        
    prompt = keyword_match_prompt(resume_text, job_description)
    
    response = gen_model(prompt)
    
    # Validate and cap points at 35
    if response.get('score', {}).get('pointsAwarded', 0) > 35:
        response['score']['pointsAwarded'] = 35
    
    return response