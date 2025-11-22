from openai_model import gen_model

def action_words(resume_text, job_description):
    """
    Updated action words analysis based on V3 scoring system (25 points max).
    """
    prompt = f'''Given the resume text: {resume_text}

    Analyze action words usage based on V3 scoring criteria. This is worth 25 points total.

    SCORING CRITERIA (25 points max):
    - Strong Action Verbs (led, launched, improved): +0.5 points each (up to 25 pts)
    - Weak Verbs (helped, worked on): -0.5 points each
    - Clichés/Buzzwords (team player, go-getter): -1 point per instance

    Focus on:
    - Variety and strength of action verbs
    - Avoiding repetition
    - Professional language without clichés

    JSON STRUCTURE:
    {{
        "score": {{
            "actionVerbPercentage": 0,
            "pointsAwarded": 0,
            "maxPoints": 25,
            "rating": "rating text",
            "ratingSymbol": "emoji"
        }},
        "analysis": {{
            "strongActionVerbs": [
                {{
                    "bulletPoint": "text from resume",
                    "actionVerb": "identified verb",
                    "points": 0.5,
                    "status": "Strong Action Word", 
                    "symbol": "✅"
                }}
            ],
            "weakActionVerbs": [
                {{
                    "bulletPoint": "text from resume",
                    "actionVerb": "weak verb",
                    "points": -0.5,
                    "suggestedReplacement": "stronger alternative",
                    "status": "Weak Action Word",
                    "symbol": "⚠️"
                }}
            ],
            "clichesAndBuzzwords": [
                {{
                    "phrase": "cliché phrase",
                    "points": -1,
                    "status": "Cliché/Buzzword",
                    "suggestedReplacement": "professional alternative",
                    "symbol": "🚫"
                }}
            ],
            "suggestedImprovements": "summary of recommended changes"
        }}
    }}

    RATING SCALE:
    - 20-25 points: "Excellent" (✅)
    - 15-19 points: "Good" (👍)  
    - 10-14 points: "Fair" (⚠️)
    - 5-9 points: "Needs Improvement" (🛑)
    - Below 5 points: "Poor" (❌)
    '''
    
    response = gen_model(prompt)
    
    # Validate and cap points at 25
    if response.get('score', {}).get('pointsAwarded', 0) > 25:
        response['score']['pointsAwarded'] = 25
    
    return response