from openai_model import gen_model

def job_experience(resume_text, job_description):
    """
    Updated experience alignment analysis based on V3 scoring system (30 points max).
    """
    prompt = f"""Given the job description: {job_description}

    And the job experience from the resume: {resume_text}

    Analyze experience alignment based on V3 scoring criteria. This is worth 30 points total.

    SCORING CRITERIA (30 points max):
    - Strong Match (title, function, industry, level, scope): +3 points per role
    - Partial Match (similar role or transferable function): +1.5 points per role
    - Misaligned/Irrelevant emphasis: -1 point per role that doesn't relate to target job

    Consider:
    - Seniority match (e.g., manager role with team lead background = partial match)
    - Domain/function alignment (B2B vs B2C, operations vs product)
    - Industry relevance and transferable skills

    JSON STRUCTURE:
    {{
        "score": {{
            "alignmentPercentage": 0,
            "pointsAwarded": 0,
            "maxPoints": 30,
            "rating": "rating text",
            "ratingSymbol": "emoji"
        }},
        "analysis": {{
            "strongMatches": [
                {{
                    "role": "role title",
                    "points": 3,
                    "status": "Strong Match",
                    "notes": "specific alignment details",
                    "symbol": "✅"
                }}
            ],
            "partialMatches": [
                {{
                    "role": "role title",
                    "points": 1.5,
                    "status": "Partial Match", 
                    "notes": "transferable skills mentioned",
                    "symbol": "⚠️"
                }}
            ],
            "misalignedRoles": [
                {{
                    "role": "role title",
                    "points": -1,
                    "status": "Misaligned",
                    "notes": "not relevant to target job",
                    "symbol": "❌"
                }}
            ],
            "suggestedImprovements": "detailed improvement suggestions"
        }}
    }}

    RATING SCALE:
    - 24-30 points: "Strong Match" (✅)
    - 18-23 points: "Good Alignment" (👍)
    - 12-17 points: "Partial Match" (⚠️)
    - 6-11 points: "Weak Match" (🛑)
    - Below 6 points: "No Relevant Experience" (❌)
    """

    response = gen_model(prompt)
    
    # Validate and cap points at 30
    if response.get('score', {}).get('pointsAwarded', 0) > 30:
        response['score']['pointsAwarded'] = 30
    
    return response
