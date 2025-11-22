from openai_model import gen_model

def education_certifications(certifications, education, job_description):
    """
    Updated education & certifications analysis based on V3 scoring system (20 points max).
    """
    prompt = f'''Given the job description: {job_description}
    Education from resume: {education}
    Certifications from resume: {certifications}

    Analyze education and certifications match based on V3 scoring criteria. This is worth 20 points total.

    SCORING CRITERIA (20 points max):
    - Required Degree Present: +10 points
    - Relevant Certification: +3 points each
    - Missing Required Credential: -3 points each

    Consider:
    - Degree match includes field relevance if specified
    - Multiple certifications can be evaluated
    - Field alignment (e.g., "Bachelor's in Computer Science" vs "Bachelor's in Marketing")

    JSON STRUCTURE:
    {{
        "score": {{
            "matchPercentage": 0,
            "pointsAwarded": 0,
            "maxPoints": 20,
            "rating": "rating text",
            "ratingSymbol": "emoji"
        }},
        "analysis": {{
            "educationMatch": [
                {{
                    "requirement": "education requirement from job",
                    "present": "degree from resume",
                    "points": 10,
                    "status": "Found/Not Found",
                    "symbol": "🎓/❌"
                }}
            ],
            "certificationMatches": [
                {{
                    "certification": "certification name",
                    "points": 3,
                    "status": "Found/Not Found", 
                    "symbol": "🏆/❌"
                }}
            ],
            "missingCredentials": [
                {{
                    "credential": "missing credential name",
                    "points": -3,
                    "status": "Missing Required",
                    "symbol": "❌"
                }}
            ],
            "suggestedImprovements": "detailed improvement suggestions"
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