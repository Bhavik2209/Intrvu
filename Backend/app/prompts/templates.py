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

def education_requirement_prompt(education, job_description):
    """V4: Binary eligibility gate for Bachelor's degree (0 or 20 points)"""
    return f'''Given the job description: {job_description}
    Education from resume: {education}

    Analyze education requirement based on V4 scoring criteria. This is a BINARY GATE worth 0 or 20 points.

    SCORING CRITERIA (V4 - Binary Gate):
    - Bachelor's degree or equivalent present: 20 points
    - No Bachelor's degree or equivalent: 0 points
    - NO PARTIAL SCORING - this is an eligibility gate

    ACCEPTED BACHELOR'S EQUIVALENTS:
    - Bachelor's Degree (BA, BS, BEng, BCom, BBA)
    - Undergraduate Degree
    - Licence (EU)
    - 4-year Diploma (India, select regions)
    - Honours Bachelor (UK, Canada)
    - Any internationally recognized 4-year undergraduate degree

    IMPORTANT:
    - Field of study is IGNORED unless explicitly required by the job
    - Master's or PhD degrees count as having a Bachelor's (20 points)
    - Associate degrees, diplomas, certificates do NOT count (0 points)

    JSON STRUCTURE:
    {{
        "score": {{
            "pointsAwarded": 0,  // MUST be exactly 0 or 20
            "maxPoints": 20,
            "passed": false,  // true if Bachelor's found, false otherwise
            "rating": "rating text",
            "ratingSymbol": "emoji"
        }},
        "analysis": {{
            "degreeFound": "exact degree from resume or 'None'",
            "degreeType": "Bachelor's/Master's/PhD/Associate/None",
            "fieldOfStudy": "field of study if present",
            "status": "Pass/Fail",
            "symbol": "✅/❌",
            "suggestedImprovements": "detailed improvement suggestions if failed"
        }}
    }}

    RATING SCALE:
    - 20 points: "Requirement Met" (✅)
    - 0 points: "Requirement Not Met" (❌)
    '''


# Backward compatibility alias for V3 code
def education_certifications_prompt(certifications, education, job_description):
    """
    DEPRECATED: Use education_requirement_prompt() for V4.
    This is a compatibility wrapper for V3 code.
    """
    # For V3 compatibility, return the old combined format
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
    """V4: Keyword & Contextual Match (0-35 points)"""
    return f"""Given the job description: {job_description}

And the resume text: {resume_text}

Analyze keyword and contextual matches between the resume and job description. This is worth 35 points total in the V4 scoring system.

SCORING CRITERIA (V4 - 35 points max):
- Strong Match (cosine similarity ≥ 0.80): +2 points per keyword
- Partial Match (cosine similarity 0.65-0.80): +1 point per keyword  
- Missing Critical Keyword: -1 point each
- Keyword Stuffing (frequency > 3 per 100 words): -2 points per instance

GUARDRAILS:
- Positive points capped at 35
- Penalties applied AFTER capping positive points
- Negative adjustments capped at 40% of max points (14 points)
- Final score floored at 0

EXTRACTION RULES:
- Extract ONLY relevant technical skills, job-specific qualifications, tools, methodologies, and industry-specific terminology
- Ignore common words, general job functions, and non-specific terminology
- Use semantic matching to identify synonyms and related terms

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
                "similarity": 0.85,
                "status": "Strong Match",
                "symbol": "✅"
            }}
        ],
        "partialMatches": [
            {{
                "keyword": "keyword name", 
                "points": 1,
                "similarity": 0.70,
                "status": "Partial Match",
                "symbol": "⚠️"
            }}
        ],
        "missingKeywords": [
            {{
                "keyword": "keyword name",
                "points": -1,
                "status": "Missing Critical",
                "symbol": "❌"
            }}
        ],
        "keywordStuffing": [
            {{
                "keyword": "keyword name",
                "points": -2,
                "occurrences": 0,
                "frequency": "per 100 words",
                "status": "Keyword Stuffing",
                "symbol": "🚫"
            }}
        ],
        "suggestedImprovements": "detailed improvement suggestions"
    }}
}}

RATING SCALE:
- 30-35 points: "Excellent" (✅)
- 24-29 points: "Good" (👍) 
- 18-23 points: "Fair" (⚠️)
- 12-17 points: "Needs Improvement" (🛑)
- Below 12 points: "Poor" (❌)
"""


def job_experience_prompt(resume_text, job_description):
    """V4: Experience Alignment (0-30 points with normalization)"""
    return f"""Given the job description: {job_description}

And the job experience from the resume: {resume_text}

Analyze experience alignment based on V4 scoring criteria. This is worth 30 points total.

SCORING CRITERIA (V4 - 30 points max):
- Strong Match (title, function, industry, level, scope): +3 points per role
- Partial Match (similar role or transferable function): +1.5 points per role
- Misaligned/Irrelevant emphasis: -1 point per role that doesn't relate to target job

NORMALIZATION FORMULA:
1. Calculate raw score by evaluating each role
2. Calculate expected_max = min(number_of_relevant_roles × 3, 12)
3. Final score = min((raw_score / expected_max) × 30, 30)

This ensures experience contributes proportionally without over- or under-weighting resume length.

CONSIDERATIONS:
- Seniority match (e.g., manager role with team lead background = partial match)
- Domain/function alignment (B2B vs B2C, operations vs product)
- Industry relevance and transferable skills
- Career progression and growth trajectory

JSON STRUCTURE:
{{
    "score": {{
        "alignmentPercentage": 0,
        "pointsAwarded": 0,
        "maxPoints": 30,
        "rawScore": 0,
        "expectedMax": 0,
        "numberOfRelevantRoles": 0,
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
    """V4: Measurable Results (0-25 points)"""
    return f'''Given the resume text: {resume_text}

Analyze measurable results based on V4 scoring criteria. This is worth 25 points total.

SCORING CRITERIA (V4 - 25 points max):
- Quantified Outcome: +2.5 points each
- Ideal: 10 quantified achievements for full 25 points
- Outcome language without metrics: partial credit (up to +1 point)
- No quantification: 0 points

WHAT COUNTS AS MEASURABLE:
- Percentages ("increased sales by 30%")
- Dollar amounts ("saved $50K annually")
- Timeframes ("reduced processing time from 5 days to 2 days")
- KPIs and metrics ("improved NPS score from 7.2 to 8.5")
- Growth figures ("grew user base from 10K to 50K")
- Specific numbers ("managed team of 15", "processed 500+ requests daily")

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


def bullet_point_effectiveness_prompt(resume_text):
    """V4: Bullet Point Effectiveness (0-20 points)"""
    return f'''Given the resume text: {resume_text}

Analyze bullet point effectiveness based on V4 scoring criteria. This is worth 20 points total.

SCORING CRITERIA (V4 - 20 points max):
- Optimal Length (12-20 words OR 85-120 characters): +2 points per bullet
- Action-Task-Impact (or Action-Result-Task) Format: included in +2 scoring
- Poorly Structured (vague, too long, no clear impact): -0.5 points per instance
- Maximum 10 bullets evaluated for 20 points total

EVALUATION CRITERIA:
- Conciseness: 12-20 words is ideal
- Clarity: Easy to understand at a glance
- Structure: Begins with action verb, describes task/context, shows impact
- Impact: Demonstrates value or achievement
- Skim test: Can reader quickly grasp key points?

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
                "characterCount": 0,
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
                "characterCount": 0,
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


def action_words_prompt(resume_text, job_description):
    """V4: Action Words Usage (0-25 points)"""
    return f'''Given the resume text: {resume_text}

Analyze action words usage based on V4 scoring criteria. This is worth 25 points total.

SCORING CRITERIA (V4 - 25 points max):
- Strong Action Verbs: +1 point each (capped at 25 total)
- Weak Verbs: -0.5 points each
- Clichés/Buzzwords: -1 point per instance

STRONG ACTION VERBS (Appendix A - Non-Exhaustive):
led, launched, designed, implemented, optimized, scaled, automated, improved, drove, delivered, owned, architected, executed, increased, reduced, accelerated, built, created, developed, established, managed, spearheaded, transformed

WEAK/LOW-SIGNAL VERBS:
assisted, helped, worked on, responsible for, supported, participated in, contributed to, involved in

CLICHÉS/BUZZWORDS TO AVOID:
team player, results-driven, self-starter, go-getter, dynamic professional, detail-oriented, fast-paced environment, think outside the box, synergy, leverage

FOCUS ON:
- Variety and strength of action verbs
- Avoiding repetition of the same verb
- Professional language without clichés
- Impact-oriented language

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
                "points": 1,
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


def skills_tools_relevance_prompt(skills, job_description):
    """V4: Skills & Tools Match (0-15 points with de-duplication)"""
    prompt = f'''Given the job description: {job_description}
    Skills from resume: {skills}

    Analyze skills and tools relevance based on V4 scoring criteria. This is worth 15 points total.

    SCORING CRITERIA (V4 - 15 points max):
    - Hard Skill Match: +1 point each
    - Soft Skill Match: +0.5 point each  
    - Missing Critical Skill/Tool: -1 point each

    DE-DUPLICATION RULE (CRITICAL):
    - If a skill is credited under Experience Alignment:
      * Full value applies to Experience component
      * Skills category applies 50% value (0.5 for hard, 0.25 for soft)
    - This prevents double-counting skills shown in work experience

    SKILL CATEGORIES:
    - Hard Skills: Technical skills, programming languages, software, tools, methodologies
    - Soft Skills: Communication, Leadership, Problem-solving, Teamwork, etc.
    - Domain-specific: Industry tools and specialized knowledge

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
                    "deduplicationApplied": false,
                    "status": "Found",
                    "symbol": "✅"
                }}
            ],
            "softSkillMatches": [
                {{
                    "skill": "skill name", 
                    "points": 0.5,
                    "deduplicationApplied": false,
                    "status": "Found",
                    "symbol": "✅"
                }}
            ],
            "missingSkills": [
                {{
                    "skill": "skill name",
                    "points": -1,
                    "skillType": "hard/soft",
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