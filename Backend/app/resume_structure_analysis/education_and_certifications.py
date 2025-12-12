from app.services.openai_model import gen_model
from app.prompts.templates import education_certifications_prompt

def education_certifications(certifications, education, job_description):
    """
    Updated education & certifications analysis based on V3 scoring system (20 points max).
    """
    prompt = education_certifications_prompt(certifications, education, job_description)

    response = gen_model(prompt)
    
    # Validate and cap points at 20
    if response.get('score', {}).get('pointsAwarded', 0) > 20:
        response['score']['pointsAwarded'] = 20
    
    return response