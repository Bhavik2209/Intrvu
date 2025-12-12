from app.services.openai_model import gen_model
from app.prompts.templates import measurable_results_prompt


def measurable_results(resume_text, job_description):
    """
    Updated measurable results analysis based on V3 scoring system (25 points max).
    """
    prompt = measurable_results_prompt(resume_text, job_description)
            
    response = gen_model(prompt)
    
    # Validate and cap points at 25
    if response.get('score', {}).get('pointsAwarded', 0) > 25:
        response['score']['pointsAwarded'] = 25
    
    return response