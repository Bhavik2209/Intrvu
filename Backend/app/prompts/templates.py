# Prompt templates centralized here. Keep functions minimal to avoid side-effects.

# Extraction prompts for OpenAI chain in app.openai
EXTRACT_SYSTEM_TEMPLATE = (
    "You are a resume analysis specialist that extracts structured information from resumes and returns it as valid JSON. "
    "Only respond with valid JSON, no explanations or extra text."
)

EXTRACT_USER_TEMPLATE = (
    """Extract the following information from the resume text below and format it as a structured JSON:

1. Personal Information: Full name, email, phone number, and location
2. Website/Social Links: LinkedIn profile URL and any other relevant online profiles
3. Professional Summary: Create a concise, clear, and impactful summary (max 2-3 sentences)
4. Work Experience: For each position, extract company name, job title, dates, location, and key responsibilities/achievements
5. Education: For each degree, include institution name, degree title, field of study, and graduation date
6. Certifications: List all professional certifications with names, issuing organizations, and dates
7. Awards/Achievements: List all honors with titles, issuing organizations, and dates
8. Projects: Include project names, descriptions, your role, technologies used, and outcomes
9. Skills and Interests: List technical skills, soft skills, languages, and personal interests
10. Volunteering: Include organization names, roles, dates, and key contributions
11. Publications: Include titles, publication venues, dates, and co-authors if applicable

Return the information in valid JSON format and if any section is missing so please add that section with empty list like [].

Resume text: {resume_text}

Important: Return ONLY valid JSON without any additional text, explanations, or formatting."""
)

def education_certifications_prompt(certifications, education, job_description):
    return f'''Given the job description: {job_description}
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



def keyword_match_prompt(resume_text, job_description):
    return f"""Given the job description: {job_description}

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


def job_experience_prompt(resume_text, job_description):
    return f"""Given the job description: {job_description}

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


def measurable_results_prompt(resume_text, job_description):
    return f"""Given the resume text: {resume_text}

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
"""


def bullet_point_effectiveness_prompt(resume_text):
    return f"""Given the resume text: {resume_text}

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
"""


def action_words_prompt(resume_text, job_description):
    return f"""Given the resume text: {resume_text}

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
"""


def skills_tools_relevance_prompt(skills, job_description):
    prompt = f'''Given the job description: {job_description}
    Skills from resume: {skills}

    Analyze skills and tools relevance based on V3 scoring criteria. This is worth 15 points total.

    SCORING CRITERIA (15 points max):
    - Hard Skill Match: +1 point each
    - Soft Skill Match: +0.5 point each  
    - Missing Critical Skill/Tool: -1 point each

    DOUBLE-COUNTING PREVENTION:
    - If a skill appears in experience AND skills sections, apply 50% reduction here
    - Prioritize skills proven through past work experience

    Categories:
    - Hard Skills: Technical skills, programming languages, software, tools
    - Soft Skills: Communication, Leadership, Problem-solving, etc.
    - Domain-specific: Industry tools and methodologies

    JSON STRUCTURE:
    {{
        "score": {{
            "matchPercentage": 0,
            "pointsAwarded": 0,
            "maxPoints": 15,
            "rating": "rating text", 
            "ratingSymbol": "emoji"
        }},
        "analysis": {{
            "hardSkillMatches": [
                {{
                    "skill": "skill name",
                    "points": 1.0,
                    "status": "Found",
                    "symbol": "✅"
                }}
            ],
            "softSkillMatches": [
                {{
                    "skill": "skill name", 
                    "points": 0.5,
                    "status": "Found",
                    "symbol": "✅"
                }}
            ],
            "missingSkills": [
                {{
                    "skill": "skill name",
                    "points": -1,
                    "status": "Missing Critical",
                    "symbol": "❌"
                }}
            ],
            "doubleCountReductions": [
                {{
                    "skill": "skill name",
                    "originalPoints": 1.0,
                    "reducedPoints": 0.5,
                    "reason": "Also found in experience"
                }}
            ],
            "suggestedImprovements": "detailed improvement suggestions"
        }}
    }}

    RATING SCALE:
    - 13-15 points: "Excellent" (✅)
    - 10-12 points: "Good" (👍)
    - 7-9 points: "Fair" (⚠️) 
    - 4-6 points: "Needs Improvement" (🛑)
    - Below 4 points: "Poor" (❌)
    '''

    return prompt