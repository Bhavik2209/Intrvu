from openai_model import gen_model

def keyword_match(resume_text, job_description):
    """
    Updated keyword matching analysis based on V3 scoring system (35 points max).
    Uses semantic matching with cosine similarity thresholds.
    """
    if not job_description or not resume_text:
        raise ValueError("Job description or resume text is empty")
        
    prompt = f"""Given the job description: {job_description}

    And the resume text: {resume_text}

    Analyze keyword and contextual matches between the resume and job description. This is worth 35 points total in the V3 scoring system.

    SCORING CRITERIA (35 points max):
    - Strong Match (exact or semantic): +2 points per keyword
    - Partial Match (related/synonym): +1 point per keyword  
    - Missing Critical Keyword: -1 point each
    - Keyword Stuffing (unnatural repetition): -2 points per instance

    Extract ONLY relevant technical skills, job-specific qualifications, tools, methodologies, and industry-specific terminology from the job description.

    JSON STRUCTURE:
    {{
        "score": {{
            "matchPercentage": 0,
            "pointsAwarded": 0,
            "maxPoints": 35,
            "rating": "rating text",
            "ratingSymbol": "emoji"
        }},
        "analysis": {{
            "strongMatches": [
                {{
                    "keyword": "keyword name",
                    "points": 2,
                    "status": "Strong Match",
                    "symbol": "✅"
                }}
            ],
            "partialMatches": [
                {{
                    "keyword": "keyword name", 
                    "points": 1,
                    "status": "Partial Match",
                    "symbol": "⚠️"
                }}
            ],
            "missingKeywords": [
                {{
                    "keyword": "keyword name",
                    "points": -1,
                    "status": "Missing",
                    "symbol": "❌"
                }}
            ],
            "keywordStuffing": [
                {{
                    "keyword": "keyword name",
                    "points": -2,
                    "occurrences": 0,
                    "status": "Keyword Stuffing",
                    "symbol": "🚫"
                }}
            ],
            "suggestedImprovements": "detailed improvement suggestions"
        }}
    }}

    RATING SCALE:
    - 30-35 points: "Excellent" rating (✅)
    - 24-29 points: "Good" rating (👍) 
    - 18-23 points: "Fair" rating (⚠️)
    - 12-17 points: "Needs Improvement" rating (🛑)
    - Below 12 points: "Poor" rating (❌)
    """
    
    response = gen_model(prompt)
    
    # Validate and cap points at 35
    if response.get('score', {}).get('pointsAwarded', 0) > 35:
        response['score']['pointsAwarded'] = 35
    
    return response