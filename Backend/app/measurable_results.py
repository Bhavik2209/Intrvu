from openai_model import gen_model


def measurable_results(resume_text, job_description):
    """
    Updated measurable results analysis based on V3 scoring system (25 points max).
    """
    prompt = f'''Given the resume text: {resume_text}

    Analyze measurable results based on V3 scoring criteria. This is worth 25 points total.

    SCORING CRITERIA (25 points max):
    - Each bullet/line with measurable impact (%, $, KPIs): +2.5 points each (up to 25 pts)
    - Ideal resumes have at least 10 quantified achievements for full points
    - No quantification: 0 points

    Look for:
    - Percentages, dollar amounts, timeframes
    - KPIs, metrics, growth figures
    - Specific numbers that demonstrate impact

    JSON STRUCTURE:
    {{
        "score": {{
            "measurableResultsCount": 0,
            "pointsAwarded": 0,
            "maxPoints": 25,
            "rating": "rating text",
            "ratingSymbol": "emoji"
        }},
        "analysis": {{
            "measurableResults": [
                {{
                    "bulletPoint": "exact text from resume",
                    "metric": "identified specific metric",
                    "points": 2.5,
                    "symbol": "✅"
                }}
            ],
            "opportunitiesForMetrics": [
                {{
                    "bulletPoint": "exact text from resume", 
                    "suggestion": "how to add specific metric",
                    "symbol": "❌"
                }}
            ],
            "suggestedImprovements": "recommendations for adding metrics"
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