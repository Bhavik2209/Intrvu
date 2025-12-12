from app.services.openai_model import gen_model
from app.prompts.templates import action_words_prompt

def action_words(resume_text, job_description):
    """
    Updated action words analysis based on V3 scoring system (25 points max).
    """
    prompt = action_words_prompt(resume_text, job_description)
    
    response = gen_model(prompt)
    
    # Validate and cap points at 25
    if response.get('score', {}).get('pointsAwarded', 0) > 25:
        response['score']['pointsAwarded'] = 25
    
    return response