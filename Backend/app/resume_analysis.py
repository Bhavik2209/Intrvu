import json
import os
import time

# Import LangChain components
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain.globals import set_debug
from langchain.cache import InMemoryCache
from langchain_core.runnables import RunnableParallel, RunnableLambda

# Initialize environment variables
api_key = os.environ.get("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

# Set up LangChain caching for better performance
from langchain.globals import set_llm_cache
set_llm_cache(InMemoryCache())

# Create LLM instance with caching enabled
llm = ChatOpenAI(
    model="gpt-4.1",
    temperature=0.3,
    max_tokens=8000,  # Increased token limit for more detailed responses
    api_key=api_key
)

# Create a memory cache for entire analysis results
# This will dramatically improve performance for repeat analyses
from functools import lru_cache
import hashlib

# Create a cache with a maximum size of 100 items
_analysis_cache = {}
MAX_CACHE_SIZE = 100

# Sections with mandatory and optional indicators
resume_sections = [
    {"section": "Personal Information", "symbol": "🛑", "mandatory": True},
    {"section": "Website/Social Links", "symbol": "🛑", "mandatory": True},
    {"section": "Professional Summary", "symbol": "🛑", "mandatory": True},
    {"section": "Work Experience", "symbol": "🛑", "mandatory": True},
    {"section": "Education", "symbol": "🛑", "mandatory": True},
    {"section": "Certifications", "symbol": "💡", "mandatory": False},
    {"section": "Awards/Achievements", "symbol": "💡", "mandatory": False},
    {"section": "Projects", "symbol": "💡", "mandatory": False},
    {"section": "Skills and Interests", "symbol": "🛑", "mandatory": True},
    {"section": "Volunteering", "symbol": "💡", "mandatory": False},
    {"section": "Publications", "symbol": "💡", "mandatory": False}
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
    # print(resume_json)
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
    """Generate a response using LangChain for better performance"""
    try:
        start_time = time.time()
        
        # Create a prompt template with system and user messages
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", "You are a resume analysis specialist that extracts structured information from resumes and returns it as valid JSON. Only respond with valid JSON, no explanations or extra text."),
            ("user", "{input}")
        ])
        
        # Create a parser to ensure we get valid JSON
        parser = JsonOutputParser()
        
        # Create the chain: prompt -> LLM -> parser
        chain = prompt_template | llm | parser
        
        # Run the chain
        result = chain.invoke({"input": prompt})
        
        print(f"LangChain API call completed in {time.time() - start_time:.2f} seconds")
        
        # Validate result is a dictionary
        if not isinstance(result, dict):
            raise ValueError("Response is not a valid JSON object")
            
        return result
        
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
   - First identify and extract only relevant technical skills, job-specific qualifications, tools, methodologies, and industry-specific terminology from the job description
   - Calculate the percentage of these meaningful job-related keywords found in the resume
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
   - Extract ONLY relevant technical skills, qualifications, and job-specific keywords from the job description:
     * Technical skills (programming languages, software, tools, platforms)
     * Domain knowledge (industry-specific terminology)
     * Methodologies (project management frameworks, development approaches)
     * Specialized certifications or qualifications
     * Required years of experience in specific areas
   - Ignore common words, general job functions, and non-specific terminology
   - For technical jobs: focus on technical skills, tools, programming languages, frameworks, methodologies
   - For non-technical jobs: focus on domain expertise, methodologies, certifications, specialized knowledge
   - For "matchedKeywords": List only significant technical and job-related keywords found in the resume
   - For "missingKeywords": List only significant technical and job-related keywords not found in the resume
   - For "suggestedImprovements": Provide specific, actionable suggestions on how to incorporate missing keywords naturally into relevant resume sections based on the candidate's actual experience
"""
    
    response = gen_model(prompt)
    
    # Validate response
    if not response.get('score') or not response.get('analysis'):
        print(f"Invalid response structure: {response}")
        raise ValueError("Invalid response from model")
        
    return response

def job_experience(resume_text, job_description):
    prompt = f"""Given the job description: {job_description}

        And the job experience from the resume: {resume_text}
        NOTE : if there is no job experience give the suggestions about what kind of job experience should be there in the resume according to the job desciption, 
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

def skills_certifications(certifications,skills, job_description):
    prompt = f'''Given the job description: {job_description}, these are the certifications: {certifications} and these are skills present in the resume: {skills}.

Analyze how well the skills and certifications in the resume match the requirements in the job description. Generate a JSON response that includes a skills and certifications match score and detailed analysis. Follow these specifications:

NOTE: In the matched skills section, ONLY include skills that are EXPLICITLY listed in the resume skills list or have direct semantic equivalents. Do NOT include any skill in "matchedSkills" unless it is definitely in the resume skills list.

1. SKILLS EXTRACTION PROCESS:
   - First, carefully extract only legitimate technical skills, tools, technologies, methodologies, and relevant qualifications from the job description
   - Focus on keywords that represent actual competencies employers seek (programming languages, tools, methodologies, domain knowledge)
   - Do NOT include random phrases, job responsibilities, or generic terms as skills
   - For technical positions: Focus on specific technologies, programming languages, frameworks, and technical methodologies
   - For non-technical positions: Focus on relevant domain-specific skills, methodologies, and tools

2. STRICT MATCHING PROCEDURE:
   - Create an array of all skills mentioned in the job description
   - For each skill in this array, check if it EXACTLY appears in the resume skills list
   - Only mark a skill as "matched" if:
     * It exists verbatim in the resume skills list, OR
     * A direct semantic equivalent exists (e.g., "Python programming" matches "Python")
   - Be extremely conservative - when in doubt, mark as "not matched"
   - Double-check all matches to ensure no false positives

3. SCORING SYSTEM:
   - Calculate the percentage of required skills and certifications in the job description that are present in the resume
   - Check for semantic matches (e.g., "Python programming" in job description matches "Python" in resume)
   - Assign points and ratings based on match percentage:
      * 90%+ match: 15 points, "Excellent" rating (✅)
      * 70-89% match: 12 points, "Good" rating (👍)
      * 50-69% match: 8 points, "Fair" rating (⚠️)
      * 30-49% match: 4 points, "Needs Improvement" rating (🛑)
      * Below 30% match: 0 points, "Poor" rating (❌)
      
        4. JSON STRUCTURE:
        {{
            "score": {{
            "matchPercentage": [percentage],
            "pointsAwarded": [points],
            "rating": "[rating text]",
            "ratingSymbol": "[emoji]"
            }},
            "analysis": {{
            "matchedSkills": [
                {{
                "skill": "[skill name]",
                "status": "Found in Resume",
                "symbol": "✅"
                }}
            ],
            "missingSkills": [
                {{
                "skill": "[skill name which are not present in resume skills]",
                "status": "Not Found",
                "symbol": "❌"
                }}
            ],
            "certificationMatch": [
                {{
                "certification": "[certification name that should be there and that is there (present and not present both)]",
                "status": "Found/Not Found",
                "symbol": "🎓/❌"
                }}
            ],
            "suggestedImprovements": "[detailed improvement suggestions]"
            }}
        }}

        5. DETAILED ANALYSIS REQUIREMENTS:
   - Extract ONLY legitimate technical skills, methodologies, and qualifications from the job description
   - Compare with skills and certifications listed in the resume using both exact and semantic matching
   - For "matchedSkills": List ONLY skills that are DEFINITELY present in the resume skills list
   - For "missingSkills": Include ONLY skills specifically mentioned as requirements in the job description but missing from the resume
   - For "certificationMatch": Identify whether required certifications are listed in the resume
   - For "suggestedImprovements": Provide actionable suggestions for incorporating missing critical skills and certifications
'''
    

    response = gen_model(prompt)

    return response


def resume_structure(sections):
    try:
        present_sections = list(sections["present"])
        missing_sections = list(sections["missing"]["mandatory"])
    except (KeyError, json.JSONDecodeError) as e:
        raise ValueError("Invalid sections format or not a valid JSON string")
    
    # Define all must-have sections
    must_have_sections = ['Personal Information', 'Website/Social Links', 'Professional Summary', 
                         'Work Experience', 'Education', 'Skills and Interests']
    
    # Count completed must-have sections
    completed_sections = sum(1 for section in must_have_sections if section in present_sections)
    
    # Determine score
    if completed_sections == 6:
        points = 15
        rating_symbol = "✅"
    elif completed_sections == 5:
        points = 12
        rating_symbol = "👍"
    elif completed_sections == 4:
        points = 8
        rating_symbol = "⚠️"
    elif completed_sections == 3:
        points = 4
        rating_symbol = "🛑"
    else:
        points = 0
        rating_symbol = "❌"
    
    # Create the section status list
    sections_to_check = [
        "Personal Information",
        "Website/Social Links",
        "Work Experience",
        "Education",
        "Skills and Interests",
        "Certifications",
        "Awards & Achievements"
    ]
    
    section_status = []
    for section in sections_to_check:
        if section in present_sections:
            status = "Completed"
            symbol = "✅"
        else:
            status = "Missing"
            symbol = "❌"
        
        section_status.append({
            "section": section,
            "status": status,
            "symbol": symbol
        })
    
    # Generate improvement suggestions
    suggested_improvements = ""
    if missing_sections:
        suggested_improvements = "Consider adding these missing sections to improve your resume: "
        suggested_improvements += ", ".join(missing_sections)
        suggested_improvements += ". These sections are important for ATS compatibility."
    else:
        suggested_improvements = "Your resume has all mandatory sections. Consider enhancing existing sections with more specific details for better ATS compatibility."
    
    # Create the final JSON structure
    result = {
        "score": {
            "completedSections": completed_sections,
            "totalMustHaveSections": 6,
            "pointsAwarded": points,
            "ratingSymbol": rating_symbol
        },
        "analysis": {
            "sectionStatus": section_status,
            "suggestedImprovements": suggested_improvements
        }
    }
    
    return result

def action_words(resume_text, job_description):
    prompt = f'''Given the resume text: {resume_text}

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
        {{
            "score": {{
            "actionVerbPercentage": [percentage],
            "pointsAwarded": [points],
            "ratingSymbol": "[emoji]"
            }},
            "analysis": {{
            "strongActionVerbs": [
                {{
                "bulletPoint": "[text from resume]",
                "status": "Strong Action Word",
                "actionVerb": "[identified action verb]",
                "symbol": "✅"
                }}
            ],
            "weakActionVerbs": [
                {{
                "bulletPoint": "[text from resume]",
                "status": "Weak Action Word",
                "actionVerb": "[identified weak verb]",
                "suggestedReplacement": "[stronger alternative]",
                "symbol": "⚠️"
                }}
            ],
            "missingActionVerbs": [
                {{
                "bulletPoint": "[text from resume]",
                "status": "No Action Word",
                "suggestedReplacement": "[suggested rewrite with action verb]",
                "symbol": "❌"
                }}
            ],
            "suggestedImprovements": "[summary of recommended changes]"
            }}
        }}

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
    prompt = f'''Given the resume text: {resume_text}

Analyze whether the resume includes quantifiable metrics and measurable results. Generate a JSON response that identifies existing measurable results and provides suggestions for adding more. Follow these specifications:

Example of a MEASURABLE result:  
"Increased sales by 30%" : ✅ Yes (Contains specific metric)

Example of a NON-MEASURABLE result:
"Managed team operations" : ❌ No (Add specific metric, e.g., "Managed team operations for 15-person department, increasing efficiency by 25%")

1. SCORING SYSTEM:
   - ONLY count instances where the resume explicitly includes specific, quantifiable metrics (percentages, numbers, time periods, dollar amounts) **FOUND WITHIN THE PROVIDED {resume_text}**
   - DO NOT count vague statements or achievements without specific measurements
   - Assign points based on the number of measurable results:
      * 5+ measurable results: 10 points (✅)
      * 3-4 measurable results: 7 points (👍)
      * 1-2 measurable results: 4 points (⚠️)
      * 0 measurable results: 0 points (❌)

2. JSON STRUCTURE:
   {{
      "score": {{
         "measurableResultsCount": [number],
         "pointsAwarded": [points],
         "ratingSymbol": "[emoji]"
      }},
      "analysis": {{
         "measurableResults": [
            {{
               "bulletPoint": "[exact text from resume]",
               "metric": "[identified specific metric]",
               "symbol": "✅"
            }}
         ],
         "opportunitiesForMetrics": [
            {{
               "bulletPoint": "[exact text from resume]",
               "suggestion": "[how to add a specific metric]",
               "symbol": "❌"
            }}
         ],
         "suggestedImprovements": "[summary of recommendations for adding specific metrics]"
      }}
   }}

3. DETAILED ANALYSIS REQUIREMENTS:
   - Find any measurable results that already exist **IN THE PROVIDED resume_text **
   - Provide specific suggestions for adding measurable results to statements that lack them **WITHIN THE PROVIDED  resume_text **
   - For "measurableResults": List only instances where the resume already includes clear, quantifiable metrics **FROM THE PROVIDED  resume_text **
   - For "opportunitiesForMetrics": Identify statements that need specific quantifiable results and suggest exactly what metrics to add **FROM THE PROVIDED  resume_text **
   - For "suggestedImprovements": Provide actionable recommendations for adding metrics to strengthen the resume's impact **BASED ON THE ANALYSIS OF THE PROVIDED  resume_text **'''
            
    response = gen_model(prompt)

    return response

def bullet_point_effectiveness(resume_text):
    prompt = f'''Given the resume text: {resume_text}

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
        {{
            "score": {{
            "effectiveBulletPercentage": [percentage],
            "pointsAwarded": [points],
            "ratingSymbol": "[emoji]"
            }},
            "analysis": {{
            "effectiveBullets": [
                {{
                "bulletPoint": "[take text from resume]",
                "wordCount": [number],
                "status": "Effective",
                "strengths": "[what makes it effective]",
                "symbol": "✅"
                }}
            ],
            "ineffectiveBullets": [
                {{
                "bulletPoint": "[take text from resume]",
                "wordCount": [number],
                "status": "Ineffective",
                "issues": "[identified problems]",
                "suggestedRevision": "[improved version]",
                "symbol": "❌"
                }}
            ],
            "suggestedImprovements": "[summary of how to improve bullet points]"
            }}
        }}

        3. DETAILED ANALYSIS REQUIREMENTS:
        - Identify all bullet points in the resume
        - Evaluate each bullet point based on the criteria listed above
        - For "effectiveBullets": List bullet points that meet the criteria with their strengths
        - For "ineffectiveBullets": Identify problematic bullet points, explain issues, and provide revised versions
        - For "suggestedImprovements": Provide actionable advice for improving the overall quality of bullet points'''
    
    response = gen_model(prompt)

    return response

def batch_analyze_resume(resume_text, job_description):
    """Analyze all resume components in a single LLM call for maximum performance"""
    try:
        start_time = time.time()
        
        # Use direct chat completion for maximum control over the response
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        # Create a comprehensive system prompt with detailed instructions
        system_prompt = """You are a resume analysis specialist that performs comprehensive analysis of resumes against job descriptions. 
        Return a detailed JSON response with thorough analysis for each component. Include specific examples and detailed feedback in each section."""
        
        # Create a detailed user prompt with expected JSON structure
        user_prompt = f"""Analyze the following resume against the job description. Provide a DETAILED and COMPREHENSIVE analysis with specific examples from both documents.
        
        RESUME: {json.dumps(resume_text)}

JOB DESCRIPTION: {job_description}


        
        Your response MUST follow this exact JSON structure and include DETAILED analysis in each section:
        {{
          "keyword_match": {{
            "score": {{
              "pointsAwarded": <number>,
              "matchPercentage": <number>,
              "rating": <string>
            }},
            "analysis": {{
              "matchedKeywords": [<detailed list with explanations>],
              "missingKeywords": [<detailed list with explanations>],
              "suggestedImprovements": "<detailed paragraph with specific suggestions>"
            }}
          }},
          "job_experience": {{
            "score": {{
              "pointsAwarded": <number>,
              "alignmentPercentage": <number>,
              "rating": <string>
            }},
            "analysis": {{
              "strongMatches": [<detailed list with explanations>],
              "partialMatches": [<detailed list with explanations>],
              "missingExperience": [<detailed list with explanations>]
            }}
          }},
          "skills_certifications": {{
            "score": {{
              "pointsAwarded": <number>,
              "matchPercentage": <number>,
              "rating": <string>
            }},
            "analysis": {{
              "matchedSkills": [<detailed objects with skill name and explanation>],
              "missingSkills": [<detailed objects with skill name and importance>],
              "certificationMatch": [<detailed certification analysis>]
            }}
          }},
          "resume_structure": {{
            "score": {{
              "pointsAwarded": <number>,
              "completedSections": <number>,
              "totalMustHaveSections": <number>
            }},
            "analysis": {{
              "sectionStatus": [<detailed section status with feedback>]
            }}
          }},
          "action_words": {{
            "score": {{
              "pointsAwarded": <number>,
              "actionVerbPercentage": <number>
            }},
            "analysis": {{
              "strongActionVerbs": [<detailed list with context>],
              "weakActionVerbs": [<detailed list with suggested improvements>]
            }}
          }},
          "measurable_results": {{
            "score": {{
              "pointsAwarded": <number>,
              "measurableResultsCount": <number>
            }},
            "analysis": {{
              "measurableResults": [<detailed list with impact analysis>],
              "opportunitiesForMetrics": [<detailed list with suggestions>]
            }}
          }},
          "bullet_point_effectiveness": {{
            "score": {{
              "pointsAwarded": <number>,
              "effectiveBulletPercentage": <number>
            }},
            "analysis": {{
              "effectiveBullets": [<detailed list with explanations>],
              "ineffectiveBullets": [<detailed list with improvement suggestions>]
            }}
          }}
        }}

IMPORTANT: Provide DETAILED analysis in each section with specific examples and actionable feedback."""
        
        # Make the API call with increased tokens and temperature for more detailed responses
        response = client.chat.completions.create(
            model="gpt-4",  # Using the most capable model
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.5,  # Slightly higher temperature for more detailed responses
            max_tokens=8000,  # High token limit for detailed analysis
            response_format={"type": "json_object"}  # Ensure JSON response
        )
        
        # Extract and parse the JSON response
        result_json = json.loads(response.choices[0].message.content)
        
        print(f"Batch analysis completed in {time.time() - start_time:.2f} seconds")
        return result_json
    except Exception as e:
        print(f"Error in batch analysis: {str(e)}")
        return None

def create_analysis_chain(analysis_function):
    """Create a chain that runs a specific analysis function"""
    # The lambda should directly pass the inputs to the function without any nested dictionaries
    return RunnableLambda(lambda inputs: analysis_function(**inputs))

def detail_resume_analysis(resume_text, job_description, use_cache=True):
    """Perform resume analysis using LangChain's optimized processing with caching"""
    try:
        # Generate a cache key based on resume and job description
        if use_cache:
            # Create a deterministic hash of the inputs
            resume_str = json.dumps(resume_text, sort_keys=True)
            combined_input = f"{resume_str}||{job_description}"
            cache_key = hashlib.md5(combined_input.encode()).hexdigest()
            
            # Check if we have a cached result
            if cache_key in _analysis_cache:
                print("Using cached analysis result")
                return _analysis_cache[cache_key]
        
        # No cache hit, perform the analysis
        start_time = time.time()
        print("Starting LangChain resume analysis...")
        
        # First try batch analysis (single API call)
        batch_result = batch_analyze_resume(resume_text, job_description)
        
        # Log the batch result structure to help with debugging
        print(f"Batch result keys: {batch_result.keys() if batch_result else 'None'}")
        
        if batch_result and all(k in batch_result for k in [
            "keyword_match", "job_experience", "skills_certifications", 
            "resume_structure", "action_words", "measurable_results", 
            "bullet_point_effectiveness"]):
            # Batch analysis succeeded
            print("Using batch analysis results (single API call)")
            keyword_match_json = batch_result["keyword_match"]
            job_experience_json = batch_result["job_experience"]
            skills_certifications_json = batch_result["skills_certifications"]
            resume_structure_json = batch_result["resume_structure"]
            action_words_json = batch_result["action_words"]
            measurable_results_json = batch_result["measurable_results"]
            bullet_point_effectiveness_json = batch_result["bullet_point_effectiveness"]
        else:
            # Fall back to parallel analysis
            print("Falling back to parallel analysis")
            
            # Get resume sections
            sections_resume = evaluate_resume_sections(resume_text)
            
            # Safe access to nested dictionaries
            work_experience = resume_text.get("Work Experience", {})
            certifications = resume_text.get("Certifications", [])
            skills = resume_text.get("Skills and Interests", [])
            
            # Create individual chains for each analysis component
            keyword_match_chain = RunnableLambda(lambda x: keyword_match(resume_text=resume_text, job_description=job_description))
            job_experience_chain = RunnableLambda(lambda x: job_experience(resume_text=work_experience, job_description=job_description))
            skills_certifications_chain = RunnableLambda(lambda x: skills_certifications(certifications=certifications, skills=skills, job_description=job_description))
            resume_structure_chain = RunnableLambda(lambda x: resume_structure(sections=sections_resume))
            action_words_chain = RunnableLambda(lambda x: action_words(resume_text=resume_text, job_description=job_description))
            measurable_results_chain = RunnableLambda(lambda x: measurable_results(resume_text=resume_text, job_description=job_description))
            bullet_point_effectiveness_chain = RunnableLambda(lambda x: bullet_point_effectiveness(resume_text=resume_text))
            
            # Create a parallel runnable that doesn't use nested dictionaries
            parallel_analysis = RunnableParallel(
                keyword_match=keyword_match_chain,
                job_experience=job_experience_chain,
                skills_certifications=skills_certifications_chain,
                resume_structure=resume_structure_chain,
                action_words=action_words_chain,
                measurable_results=measurable_results_chain,
                bullet_point_effectiveness=bullet_point_effectiveness_chain
            )
            
            # Use an empty input since all parameters are already captured in the lambda functions
            inputs = {}
            
            # Run all analyses in parallel
            results = parallel_analysis.invoke(inputs)
            
            # Extract results
            keyword_match_json = results["keyword_match"]
            job_experience_json = results["job_experience"]
            skills_certifications_json = results["skills_certifications"]
            resume_structure_json = results["resume_structure"]
            action_words_json = results["action_words"]
            measurable_results_json = results["measurable_results"]
            bullet_point_effectiveness_json = results["bullet_point_effectiveness"]
        
        print(f"LangChain analysis completed in {time.time() - start_time:.2f} seconds")
        
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
            try:
                skills_certifications_json['analysis']['matchedSkills'] = normalize_skills_list(
                    skills_certifications_json['analysis']['matchedSkills']
                )
            except Exception as e:
                print(f"Error normalizing skills_certifications_json: {str(e)}")
                skills_certifications_json = {"score": {"pointsAwarded": 0, "matchPercentage": 0, "rating": "Error"}, "analysis": {"matchedSkills": [], "missingSkills": [], "certificationMatch": []}}
        
        # Cache the result if caching is enabled
        if use_cache and cache_key:
            # If cache is full, remove oldest entry
            if len(_analysis_cache) >= MAX_CACHE_SIZE:
                oldest_key = next(iter(_analysis_cache))
                del _analysis_cache[oldest_key]
            
            # Add new result to cache
            _analysis_cache[cache_key] = result
        
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