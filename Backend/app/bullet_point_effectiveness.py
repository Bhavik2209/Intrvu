from openai_model import gen_model

def bullet_point_effectiveness(resume_text):
    """
    Updated bullet point effectiveness analysis based on V3 scoring system (20 points max).
    """
    prompt = f'''Given the resume text: {resume_text}

    Analyze bullet point effectiveness based on V3 scoring criteria. This is worth 20 points total.

    SCORING CRITERIA (20 points max):
    - Optimal Length (12-20 words or 85-120 characters): +1 point per bullet
    - Action-Task-Impact (or Action-Result-Task) Format: +1 point per bullet  
    - Poorly Structured (vague, long, no clear impact): -0.5 points per instance
    - Maximum 10 bullets evaluated for 20 points total

    Evaluation criteria:
    - Conciseness and clarity
    - Proper structure and format
    - Impact and specificity
    - Skim test readability

    JSON STRUCTURE:
    {{
        "score": {{
            "effectiveBulletPercentage": 0,
            "pointsAwarded": 0,
            "maxPoints": 20,
            "rating": "rating text",
            "ratingSymbol": "emoji"
        }},
        "analysis": {{
            "effectiveBullets": [
                {{
                    "bulletPoint": "text from resume",
                    "wordCount": 0,
                    "points": 2,
                    "status": "Effective",
                    "strengths": "what makes it effective",
                    "symbol": "✅"
                }}
            ],
            "ineffectiveBullets": [
                {{
                    "bulletPoint": "text from resume", 
                    "wordCount": 0,
                    "points": -0.5,
                    "status": "Ineffective",
                    "issues": "identified problems",
                    "suggestedRevision": "improved version",
                    "symbol": "❌"
                }}
            ],
            "suggestedImprovements": "summary of how to improve bullet points"
        }}
    }}

    RATING SCALE:
    - 18-20 points: "Excellent" (✅)
    - 14-17 points: "Good" (👍)
    - 10-13 points: "Fair" (⚠️)
    - 6-9 points: "Needs Improvement" (🛑)
    - Below 6 points: "Poor" (❌)
    '''
    
    response = gen_model(prompt)
    
    # Validate and cap points at 20
    if response.get('score', {}).get('pointsAwarded', 0) > 20:
        response['score']['pointsAwarded'] = 20
    
    return response