import json
import os
from openai import OpenAI

# Initialize the client with API key from environment variable
api_key = os.environ.get("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

client = OpenAI(api_key=api_key)

# Sections with mandatory and optional indicators
resume_sections = [
    {"section": "Personal Information", "symbol": "🛑", "mandatory": True},
    {"section": "Website and Social Links", "symbol": "🛑", "mandatory": True},
    {"section": "Professional Summaries", "symbol": "🛑", "mandatory": True},
    {"section": "Work Experience", "symbol": "🛑", "mandatory": True},
    {"section": "Education", "symbol": "🛑", "mandatory": True},
    {"section": "Certification", "symbol": "💡", "mandatory": False},
    {"section": "Awards and Achievement", "symbol": "💡", "mandatory": False},
    {"section": "Projects", "symbol": "💡", "mandatory": False},
    {"section": "Skills and Interests", "symbol": "🛑", "mandatory": True},
    {"section": "Volunteering", "symbol": "💡", "mandatory": False},
    {"section": "Publication", "symbol": "💡", "mandatory": False}
]

def evaluate_resume_sections(resume_json):
    """
    Evaluate the presence of sections in a resume JSON against mandatory and optional indicators.

    Args:
        resume_json (dict): The resume data in JSON format.
        resume_sections (list): List of sections with mandatory and optional indicators.

    Returns:
        dict: Analysis of sections categorized as present or missing, and mandatory or optional.
    """
    # Initialize result dictionary
    result = {
        "present": [],
        "missing": {
            "mandatory": [],
            "optional": []
        }
    }

    # Iterate through defined resume sections
    for section in resume_sections:
        section_name = section["section"]
        mandatory = section["mandatory"]

        # Check if the section exists in the resume JSON
        if section_name in resume_json and resume_json[section_name]:
            result["present"].append(section_name)
        else:
            if mandatory:
                result["missing"]["mandatory"].append(section_name)
            else:
                result["missing"]["optional"].append(section_name)
    print(result)

    return result




def gen_model(prompt):
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo-16k",
            messages=[
                {"role": "system", "content": "You are a resume analysis specialist that extracts structured information from resumes and returns it as valid JSON. Only respond with valid JSON, no explanations or extra text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,  # Increase temperature for more variation
            max_tokens=4000
        )
        
        result = response.choices[0].message.content.strip()
        
        # Validate JSON structure
        parsed_result = json.loads(result)
        if not isinstance(parsed_result, dict):
            raise ValueError("Response is not a valid JSON object")
            
        return parsed_result
        
    except Exception as e:
        print(f"Error in gen_model: {str(e)}")
        print(f"Prompt: {prompt[:200]}...")  # Log truncated prompt
        raise  # Re-raise the exception instead of returning default


def keyword_match(resume_text, job_description):
    # Add validation
    if not job_description or not resume_text:
        raise ValueError("Job description or resume text is empty")
        
    prompt = f"""Given the job description: {job_description}

        And the resume text: {resume_text}

        Analyze how well the resume matches the job description. Generate a JSON response that includes a skills match score and detailed analysis. Follow these specifications:

        1. SCORING SYSTEM:
        - Calculate the percentage of job-related keywords found in the resume
        - Assign points and ratings based on match percentage:
            * 90%+ match: 20 points, "Excellent" rating (✅)
            * 70-89% match: 15 points, "Good" rating (👍)
            * 50-69% match: 10 points, "Fair" rating (⚠️)
            * 30-49% match: 5 points, "Needs Improvement" rating (🛑)
            * Below 30% match: 0 points, "Poor" rating (❌)

        2. JSON STRUCTURE:
        {{
            "score": {{
                "matchPercentage": 0,
                "pointsAwarded": 0,
                "rating": "rating text",
                "ratingSymbol": "emoji"
            }},
            "analysis": {{
                "matchedKeywords": [],
                "missingKeywords": [],
                "suggestedImprovements": "detailed improvement suggestions"
            }}
        }}

        3. DETAILED ANALYSIS REQUIREMENTS:
        - Extract all relevant skills and keywords from the job description
        - Compare with skills and keywords in the resume
        - For "matchedKeywords": List all job-related keywords found in the resume
        - For "missingKeywords": List all job-related keywords not found in the resume
        - For "suggestedImprovements": Provide actionable suggestions on how to incorporate missing keywords naturally in relevant resume sections"""
    
    response = gen_model(prompt)
    
    # Validate response
    if not response.get('score') or not response.get('analysis'):
        print(f"Invalid response structure: {response}")
        raise ValueError("Invalid response from model")
        
    return response

def job_experience(resume_text, job_description):
    prompt = f"""Given the job description: {job_description}

        And the resume text: {resume_text}

        Analyze how well the work experience in the resume aligns with the job responsibilities. Generate a JSON response that includes a job experience alignment score and detailed analysis. Follow these specifications:

        1. SCORING SYSTEM:
        - Calculate the percentage of job responsibilities covered in the resume's work experience
        - Assign points and ratings based on alignment percentage:
            * 80%+ match: 20 points, "Strong match" rating (✅)
            * 60-79% match: 15 points, "Good alignment" rating (👍)
            * 40-59% match: 10 points, "Partial match" rating (⚠️)
            * 20-39% match: 5 points, "Weak match" rating (🛑)
            * Below 20% match: 0 points, "No relevant experience" rating (❌)

        2. JSON STRUCTURE:
        {{
            "score": {{
                "alignmentPercentage": 0,
                "pointsAwarded": 0,
                "rating": "rating text",
                "ratingSymbol": "emoji"
            }},
            "analysis": {{
                "strongMatches": [
                    {{
                        "responsibility": "job responsibility",
                        "status": "Strong Match",
                        "notes": "specific experience from resume"
                    }}
                ],
                "partialMatches": [
                    {{
                        "responsibility": "job responsibility",
                        "status": "Partial Match",
                        "notes": "limited experience mentioned"
                    }}
                ],
                "missingExperience": [
                    {{
                        "responsibility": "job responsibility",
                        "status": "Missing",
                        "notes": "Not mentioned in resume"
                    }}
                ],
                "suggestedImprovements": "detailed improvement suggestions"
            }}
        }}"""

    response = gen_model(prompt)
    return response

def skills_certifications(resume_text, job_description):
    prompt = '''Given the job description: {job_description}

        And the resume text: {resume_text}

        Analyze how well the skills and certifications in the resume match the requirements in the job description. Generate a JSON response that includes a skills and certifications match score and detailed analysis. Follow these specifications:

        1. SCORING SYSTEM:
        - Calculate the percentage of required skills and certifications in the job description that are present in the resume
        - Assign points and ratings based on match percentage:
            * 90%+ match: 15 points, "Excellent" rating (✅)
            * 70-89% match: 12 points, "Good" rating (👍)
            * 50-69% match: 8 points, "Fair" rating (⚠️)
            * 30-49% match: 4 points, "Needs Improvement" rating (🛑)
            * Below 30% match: 0 points, "Poor" rating (❌)

        2. JSON STRUCTURE:
        {
            "score": {
            "matchPercentage": [percentage],
            "pointsAwarded": [points],
            "rating": "[rating text]",
            "ratingSymbol": "[emoji]"
            },
            "analysis": {
            "matchedSkills": [
                {
                "skill": "[skill name]",
                "status": "Found in Resume",
                "symbol": "✅"
                }
            ],
            "missingSkills": [
                {
                "skill": "[skill name]",
                "status": "Not Found",
                "symbol": "❌"
                }
            ],
            "certificationMatch": [
                {
                "certification": "[certification name]",
                "status": "Found/Not Found",
                "symbol": "🎓/❌"
                }
            ],
            "suggestedImprovements": "[detailed improvement suggestions]"
            }
        }

        3. DETAILED ANALYSIS REQUIREMENTS:
        - Extract all required technical skills, soft skills, and certifications from the job description
        - Compare with skills and certifications listed in the resume
        - For "matchedSkills": List all job-related skills present in the resume
        - For "missingSkills": Highlight skills required in the job description but missing from the resume
        - For "certificationMatch": Identify whether required certifications are listed in the resume
        - For "suggestedImprovements": Provide actionable suggestions on how to include missing skills and certifications in relevant resume sections'''
    

    response = gen_model(prompt)

    return response

def resume_structure(resume_text, sections):
    try:
        present_sections = list(resume_text.keys())
    except json.JSONDecodeError:
        raise ValueError("resume_text is not a valid JSON string")
    

    prompt = '''Given the resume text: {resume_text}

        These are the sections in the resume: {sections}

        Analyze the structure of the resume for ATS parsing and readability. Generate a JSON response that includes a resume structure score and detailed analysis. Follow these specifications:

        1. SCORING SYSTEM:
        - Evaluate the presence and completeness of the following "Must-Have" sections:
            * Personal Information (contact details)
            * Work Experience
            * Education
            * Skills
        - Use the provided present_sections list to determine which sections are included in the resume
        - Assign points based on completion:
            * All 4 Must-Have sections complete: 15 points (✅)
            * 3 out of 4 Must-Have sections complete: 12 points (👍)
            * 2 out of 4 Must-Have sections complete: 8 points (⚠️)
            * 1 out of 4 Must-Have sections complete: 4 points (🛑)
            * 0 Must-Have sections complete: 0 points (❌)

        2. JSON STRUCTURE:
        {
            "score": {
            "completedSections": [number of completed Must-Have sections],
            "totalMustHaveSections": 4,
            "pointsAwarded": [points],
            "ratingSymbol": "[emoji]"
            },
            "analysis": {
            "sectionStatus": [
                {
                "section": "Personal Information",
                "status": "Completed/Missing",
                "symbol": "✅/❌"
                },
                {
                "section": "LinkedIn URL",
                "status": "Completed/Missing",
                "symbol": "✅/❌"
                },
                {
                "section": "Work Experience",
                "status": "Completed/Missing",
                "symbol": "✅/❌"
                },
                {
                "section": "Education",
                "status": "Completed/Missing",
                "symbol": "✅/❌"
                },
                {
                "section": "Skills",
                "status": "Completed/Missing",
                "symbol": "✅/❌"
                },
                {
                "section": "Certifications",
                "status": "Completed/Missing",
                "symbol": "✅/❌"
                },
                {
                "section": "Awards & Achievements",
                "status": "Completed/Missing",
                "symbol": "✅/❌"
                }
            ],
            "suggestedImprovements": "[detailed improvement suggestions]"
            }
        }

        3. DETAILED ANALYSIS REQUIREMENTS:
        - Use the provided present_sections list to check which sections are included in the resume
        - Calculate absent_sections = [section for section in resume_sections if section not in present_sections]
        - For each section, mark as "Completed" if in present_sections list, otherwise mark as "Missing"
        - For "suggestedImprovements": Provide actionable suggestions on adding missing sections and enhancing existing ones for better ATS compatibility'''
    
    response = gen_model(prompt)

    return response

def action_words(resume_text, job_description):
    prompt = '''Given the resume text: {resume_text}

        Analyze the use of strong, impactful action verbs in the resume. Generate a JSON response that includes an action words usage score and detailed analysis. Follow these specifications:

        1. SCORING SYSTEM:
        - Calculate the percentage of bullet points or experience descriptions that begin with strong action verbs
        - Identify weak verbs that could be replaced with stronger alternatives
        - Assign points based on percentage of strong action verbs used:
            * 80%+ strong action words: 10 points (✅)
            * 60-79% strong action words: 8 points (👍)
            * 40-59% strong action words: 5 points (⚠️)
            * Below 40% strong action words: 2 points (🛑)

        2. JSON STRUCTURE:
        {
            "score": {
            "actionVerbPercentage": [percentage],
            "pointsAwarded": [points],
            "ratingSymbol": "[emoji]"
            },
            "analysis": {
            "strongActionVerbs": [
                {
                "bulletPoint": "[text from resume]",
                "status": "Strong Action Word",
                "actionVerb": "[identified action verb]",
                "symbol": "✅"
                }
            ],
            "weakActionVerbs": [
                {
                "bulletPoint": "[text from resume]",
                "status": "Weak Action Word",
                "actionVerb": "[identified weak verb]",
                "suggestedReplacement": "[stronger alternative]",
                "symbol": "⚠️"
                }
            ],
            "missingActionVerbs": [
                {
                "bulletPoint": "[text from resume]",
                "status": "No Action Word",
                "suggestedReplacement": "[suggested rewrite with action verb]",
                "symbol": "❌"
                }
            ],
            "suggestedImprovements": "[summary of recommended changes]"
            }
        }

        3. DETAILED ANALYSIS REQUIREMENTS:
        - Identify all bullet points and experience descriptions in the resume
        - For each item, determine if it starts with a strong action verb, a weak verb, or no action verb
        - For "strongActionVerbs": List all bullet points that begin with strong, impactful verbs
        - For "weakActionVerbs": Identify bullet points with mediocre verbs and suggest stronger alternatives
        - For "missingActionVerbs": Highlight phrases that lack action verbs and provide rewrites
        - For "suggestedImprovements": Provide a summary of how to improve the resume's impact through better verb usage'''
    
    response = gen_model(prompt)

    return response

def measurable_results(resume_text, job_description):
    prompt = '''Given the resume text: {resume_text}

        Analyze whether the resume includes quantifiable metrics and measurable results. Generate a JSON response that includes a measurable results score and detailed analysis. Follow these specifications:
        Example:

"Increased sales by 30%" : ✅ Yes

"Managed team operations" : ❌ No (Add measurable result)
        1. SCORING SYSTEM:
        - Count the number of instances where the resume includes specific, quantifiable metrics or measurable results
        - Assign points based on the number of measurable results:
            * 5+ measurable results: 10 points (✅)
            * 3-4 measurable results: 7 points (👍)
            * 1-2 measurable results: 4 points (⚠️)
            * 0 measurable results: 0 points (❌)

        2. JSON STRUCTURE:
        {
            "score": {
            "measurableResultsCount": [number],
            "pointsAwarded": [points],
            "ratingSymbol": "[emoji]"
            },
            "analysis": {
            "measurableResults": [
                {
                "bulletPoint": "[text from resume]",
                "metric": "[identified metric]",
                "symbol": "✅"
                }
            ],
            "opportunitiesForMetrics": [
                {
                "bulletPoint": "[text from resume]",
                "suggestion": "[how to add a metric]",
                "symbol": "❌"
                }
            ],
            "suggestedImprovements": "[summary of recommendations for adding metrics]"
            }
        }

        3. DETAILED ANALYSIS REQUIREMENTS:
        - Review all bullet points and experience descriptions in the resume
        - Identify statements that include specific numbers, percentages, dollar amounts, or other quantifiable achievements
        - For "measurableResults": List all instances where the resume includes clear metrics
        - For "opportunitiesForMetrics": Identify statements that could be enhanced with quantifiable results
        - For "suggestedImprovements": Provide actionable recommendations for adding metrics to strengthen the resume's impact'''
    
    response = gen_model(prompt)

    return response

def bullet_point_effectiveness(resume_text):
    prompt = '''Given the resume text: {resume_text}

        Analyze the effectiveness of bullet points in the resume: , evaluating their conciseness and impact. Generate a JSON response that includes a bullet point effectiveness score and detailed analysis. Follow these specifications:

        1. SCORING SYSTEM:
        - Evaluate each bullet point for:
            * Conciseness (ideally 8-15 words)
            * Specificity (clear, not vague)
            * Impact (demonstrates value or achievement)
            * Structure (begins with action verb)
        - Calculate the percentage of bullet points meeting effectiveness criteria
        - Assign points based on percentage of effective bullet points:
            * 90%+ bullets effective: 10 points (✅)
            * 70-89% bullets effective: 8 points (👍)
            * 50-69% bullets effective: 5 points (⚠️)
            * Below 50% bullets effective: 2 points (🛑)

        2. JSON STRUCTURE:
        {
            "score": {
            "effectiveBulletPercentage": [percentage],
            "pointsAwarded": [points],
            "ratingSymbol": "[emoji]"
            },
            "analysis": {
            "effectiveBullets": [
                {
                "bulletPoint": "[text from resume]",
                "wordCount": [number],
                "status": "Effective",
                "strengths": "[what makes it effective]",
                "symbol": "✅"
                }
            ],
            "ineffectiveBullets": [
                {
                "bulletPoint": "[text from resume]",
                "wordCount": [number],
                "status": "Ineffective",
                "issues": "[identified problems]",
                "suggestedRevision": "[improved version]",
                "symbol": "❌"
                }
            ],
            "suggestedImprovements": "[summary of how to improve bullet points]"
            }
        }

        3. DETAILED ANALYSIS REQUIREMENTS:
        - Identify all bullet points in the resume
        - Evaluate each bullet point based on the criteria listed above
        - For "effectiveBullets": List bullet points that meet the criteria with their strengths
        - For "ineffectiveBullets": Identify problematic bullet points, explain issues, and provide revised versions
        - For "suggestedImprovements": Provide actionable advice for improving the overall quality of bullet points'''
    
    response = gen_model(prompt)

    return response

def detail_resume_analysis(resume_text, job_description):
    # Perform the analysis and store the results
    try:

        sections = evaluate_resume_sections(resume_text)

        keyword_match_json = keyword_match(resume_text, job_description)
        job_experience_json = job_experience(resume_text, job_description)
        skills_certifications_json = skills_certifications(resume_text, job_description)
        resume_structure_json = resume_structure(resume_text,sections)
        action_words_json = action_words(resume_text, job_description)
        measurable_results_json = measurable_results(resume_text, job_description)
        bullet_point_effectiveness_json = bullet_point_effectiveness(resume_text)
        
        # Ensure all responses are properly parsed JSON objects
        if not isinstance(keyword_match_json, dict):
            print("Warning: keyword_match_json is not a dictionary")
            keyword_match_json = json.loads(keyword_match_json) if isinstance(keyword_match_json, str) else {"score": {"pointsAwarded": 0}}
        
        if not isinstance(job_experience_json, dict):
            print("Warning: job_experience_json is not a dictionary")
            job_experience_json = json.loads(job_experience_json) if isinstance(job_experience_json, str) else {"score": {"pointsAwarded": 0}}
        
        if not isinstance(skills_certifications_json, dict):
            print("Warning: skills_certifications_json is not a dictionary")
            skills_certifications_json = json.loads(skills_certifications_json) if isinstance(skills_certifications_json, str) else {"score": {"pointsAwarded": 0}}
        
        if not isinstance(resume_structure_json, dict):
            print("Warning: resume_structure_json is not a dictionary")
            resume_structure_json = json.loads(resume_structure_json) if isinstance(resume_structure_json, str) else {"score": {"pointsAwarded": 0}}
        
        if not isinstance(action_words_json, dict):
            print("Warning: action_words_json is not a dictionary")
            action_words_json = json.loads(action_words_json) if isinstance(action_words_json, str) else {"score": {"pointsAwarded": 0}}
        
        if not isinstance(measurable_results_json, dict):
            print("Warning: measurable_results_json is not a dictionary")
            measurable_results_json = json.loads(measurable_results_json) if isinstance(measurable_results_json, str) else {"score": {"pointsAwarded": 0}}
        
        if not isinstance(bullet_point_effectiveness_json, dict):
            print("Warning: bullet_point_effectiveness_json is not a dictionary")
            bullet_point_effectiveness_json = json.loads(bullet_point_effectiveness_json) if isinstance(bullet_point_effectiveness_json, str) else {"score": {"pointsAwarded": 0}}
        
        # Now calculate the overall score
        overall_resume_score = overall_score(
            keyword_match_json['score']['pointsAwarded'], 
            job_experience_json['score']['pointsAwarded'], 
            skills_certifications_json['score']['pointsAwarded'], 
            resume_structure_json['score']['pointsAwarded'], 
            action_words_json['score']['pointsAwarded'], 
            measurable_results_json['score']['pointsAwarded'], 
            bullet_point_effectiveness_json['score']['pointsAwarded']
        )
        
        # Combine all the JSON results into a single dictionary
        result = {
            "overall_score": overall_resume_score,
            "keyword_match": keyword_match_json,
            "job_experience": job_experience_json,
            "skills_certifications": skills_certifications_json,
            "resume_structure": resume_structure_json,
            "action_words": action_words_json,
            "measurable_results": measurable_results_json,
            "bullet_point_effectiveness": bullet_point_effectiveness_json
        }
        
        # After receiving responses from gen_model, normalize the data structure:
        def normalize_skills_list(skills_list):
            """Ensure skills list items are all objects with consistent structure"""
            normalized = []
            for skill in skills_list:
                if isinstance(skill, str):
                    normalized.append({"skill": skill, "status": "Found in Resume", "symbol": "✅"})
                else:
                    normalized.append(skill)
            return normalized

        # Apply this to skills_certifications_json
        if 'analysis' in skills_certifications_json and 'matchedSkills' in skills_certifications_json['analysis']:
            skills_certifications_json['analysis']['matchedSkills'] = normalize_skills_list(
                skills_certifications_json['analysis']['matchedSkills']
            )
        
        return result
    
    except Exception as e:
        print(f"Error in detail_resume_analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Return a minimal structure to prevent frontend errors
        return {
            "overall_score": 0,
            "keyword_match": {"score": {"pointsAwarded": 0, "matchPercentage": 0, "rating": "Error"}, "analysis": {"matchedKeywords": [], "missingKeywords": []}},
            "job_experience": {"score": {"pointsAwarded": 0, "alignmentPercentage": 0, "rating": "Error"}, "analysis": {"strongMatches": [], "partialMatches": [], "missingExperience": []}},
            "skills_certifications": {"score": {"pointsAwarded": 0, "matchPercentage": 0, "rating": "Error"}, "analysis": {"matchedSkills": [], "missingSkills": [], "certificationMatch": []}},
            "resume_structure": {"score": {"pointsAwarded": 0, "completedSections": 0, "totalMustHaveSections": 4}, "analysis": {"sectionStatus": []}},
            "action_words": {"score": {"pointsAwarded": 0, "actionVerbPercentage": 0}, "analysis": {"strongActionVerbs": [], "weakActionVerbs": []}},
            "measurable_results": {"score": {"pointsAwarded": 0, "measurableResultsCount": 0}, "analysis": {"measurableResults": [], "opportunitiesForMetrics": []}},
            "bullet_point_effectiveness": {"score": {"pointsAwarded": 0, "effectiveBulletPercentage": 0}, "analysis": {"effectiveBullets": [], "ineffectiveBullets": []}}
        }

def overall_score(score1, score2, score3, score4, score5, score6, score7):
    # Convert all scores to float or int, with default of 0
    try:
        s1 = float(score1) if score1 is not None else 0
        s2 = float(score2) if score2 is not None else 0
        s3 = float(score3) if score3 is not None else 0
        s4 = float(score4) if score4 is not None else 0
        s5 = float(score5) if score5 is not None else 0
        s6 = float(score6) if score6 is not None else 0
        s7 = float(score7) if score7 is not None else 0
        
        return ((s1/20)*20) + ((s2/20)*20) + ((s3/15)*15) + ((s4/15)*15) + ((s5/10)*10) + ((s6/10)*10) + ((s7/10)*10)
    except (ValueError, TypeError) as e:
        print(f"Error calculating overall score: {e}")
        print(f"Scores: {score1}, {score2}, {score3}, {score4}, {score5}, {score6}, {score7}")
        return 0