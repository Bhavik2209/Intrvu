from app.services.openai_model import gen_model
from app.prompts.templates import job_experience_prompt

def job_experience(resume_text, job_description):
    """
    Updated experience alignment analysis based on V3 scoring system (30 points max).
    """
    prompt = job_experience_prompt(resume_text, job_description)

    response = gen_model(prompt)
    
    # Validate and cap points at 30
    if response.get('score', {}).get('pointsAwarded', 0) > 30:
        response['score']['pointsAwarded'] = 30
    
    return response
