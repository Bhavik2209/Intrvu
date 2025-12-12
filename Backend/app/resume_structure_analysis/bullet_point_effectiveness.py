from app.services.openai_model import gen_model
from app.prompts.templates import bullet_point_effectiveness_prompt

def bullet_point_effectiveness(resume_text):
    """
    Updated bullet point effectiveness analysis based on V3 scoring system (20 points max).
    """
    prompt = bullet_point_effectiveness_prompt(resume_text)
    
    response = gen_model(prompt)
    
    # Validate and cap points at 20
    if response.get('score', {}).get('pointsAwarded', 0) > 20:
        response['score']['pointsAwarded'] = 20
    
    return response