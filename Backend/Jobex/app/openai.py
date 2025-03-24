from openai import OpenAI
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize the client with API key from environment variable
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)


def extract_components_openai(resume_text):
    """
    Extract structured information from resume text using OpenAI API.
    
    Args:
        resume_text (str): The text content of the resume
        
    Returns:
        dict: Structured resume information or error message
    """
    try:
        # Check if resume text is empty
        if not resume_text or len(resume_text.strip()) < 50:
            return {"error": "Resume text is too short or empty"}
            
        prompt = '''Extract the following information from the resume text below and format it as a structured JSON:

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

Return the information in valid JSON format and if any section is missing so please do not include that empty section in the json.

Resume text: {resume_text}

Important: Return ONLY valid JSON without any additional text, explanations, or formatting.
'''
        # Call the OpenAI API without the response_format parameter
        response = client.chat.completions.create(
            model="gpt-3.5-turbo-16k",  # Using 16k model for longer context
            messages=[
                {"role": "system", "content": "You are a resume analysis specialist that extracts structured information from resumes and returns it as valid JSON. Only respond with valid JSON, no explanations or extra text."},
                {"role": "user", "content": prompt.format(resume_text=resume_text)}
            ],
            temperature=0.1,  # Lower temperature for more consistent output
            max_tokens=4000   # Increased token limit for comprehensive analysis
            # Removed response_format parameter since it's not supported
        )
        
        # Extract the assistant's response
        result = response.choices[0].message.content
        
        # Clean the result in case there are any leading/trailing characters
        result = result.strip()
        
        # Remove any markdown code block formatting if present
        if result.startswith("```json"):
            result = result[7:]
        if result.startswith("```"):
            result = result[3:]
        if result.endswith("```"):
            result = result[:-3]
            
        result = result.strip()
        
        # Validate JSON
        try:
            parsed_json = json.loads(result)
            return parsed_json
        except json.JSONDecodeError as e:
            # More detailed error for debugging
            return {
                "error": f"Failed to parse OpenAI response as JSON: {str(e)}",
                "raw_response": result[:1000]  # Include part of the raw response for debugging
            }
            
    except Exception as e:
        # Include more context in the error message
        return {"error": f"An error occurred during resume analysis: {str(e)}", "trace": str(type(e))}
    

def compare_desc_resume(job_data, resume_json):
    """
    Compare job description with resume data and provide a brief analysis.
    
    Args:
        job_data (dict): Job data including title, company, and description
        resume_json (dict): Structured resume data extracted from PDF
        
    Returns:
        dict: Analysis results including match score and brief summary
    """
    try:
        
        # Create a prompt for comparison
        prompt = f"""
Compare the following job description with the candidate's resume information and provide a brief analysis (maximum 50 words):
job description : {job_data}, 
resume information : {resume_json},
Provide a brief assessment of the match between the candidate and the job in exactly 50 words.
"""
        
        # Call OpenAI API for comparison
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a job matching specialist. Provide concise, honest assessments of how well a candidate matches a job description."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=100  # Limiting to ensure we get a concise response
        )
        
        # Extract the response
        analysis = response.choices[0].message.content.strip()
        
        
        return {
            "analysis": analysis,
        }
        
    except Exception as e:
        return {
            "error": f"Failed to compare resume with job description: {str(e)}",
            "match_score": 0,
            "analysis": "Unable to analyze the match due to an error."
        }
    