from openai import OpenAI
import re
import os
import numpy as np
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity
import json

# Load environment variables
load_dotenv()

# Initialize the OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ResumeAnalyzer:
    def __init__(self, resume_text, job_description_text):
        self.resume = resume_text
        self.job_desc = job_description_text
        
        # Define all possible resume sections
        self.all_sections = {
            'Personal Information': False,
            'Website and Social Links': False,
            'Professional Summaries': False,
            'Work Experience': False,
            'Education': False,
            'Certification': False,
            'Awards and Achievement': False,
            'Projects': False,
            'Skills and Interests': False,
            'Volunteering': False,
            'Publication': False
        }
        
        # Define scoring weights as per document
        self.weights = {
            "keyword_match": 20,
            "job_experience": 20,
            "skills_certifications": 15,
            "resume_structure": 15,
            "action_words": 10,
            "measurable_results": 10,
            "bullet_effectiveness": 10
        }
        
        # Define scoring thresholds
        self.thresholds = {
            "keyword_match": {
                90: 20,  # 90%+ = 20 points
                75: 15,  # 75-89% = 15 points
                60: 10,  # 60-74% = 10 points
                40: 5    # Below 60% = 5 points
            },
            "job_experience": {
                80: 20,  # 80%+ = 20 points
                65: 15,  # 65-79% = 15 points
                50: 10,  # 50-64% = 10 points
                30: 5    # Below 50% = 5 points
            },
            "skills_certifications": {
                90: 15,  # 90%+ = 15 points
                75: 12,  # 75-89% = 12 points
                60: 9,   # 60-74% = 9 points
                40: 6    # Below 60% = 6 points
            }
        }
        
        # Define action verbs and weak words
        self.action_verbs = [
            'achieved', 'improved', 'launched', 'developed', 'implemented',
            'created', 'reduced', 'increased', 'designed', 'established',
            'managed', 'led', 'executed', 'generated', 'delivered',
            'streamlined', 'optimized', 'innovated', 'transformed', 'pioneered'
        ]
        
        self.weak_words = [
            'worked', 'helped', 'assisted', 'responsible for', 'participated',
            'results-oriented', 'detail-oriented', 'team player', 'dynamic',
            'proven track record', 'go-getter', 'think outside the box'
        ]

    def analyze_job_requirements(self):
        """Analyze job description to extract requirements"""
        try:
            prompt = """Analyze this job description and extract key requirements:

            1. Required technical skills and keywords (specific tools, technologies, methodologies)
            2. Required experience (years, type, level)
            3. Required skills and certifications
            4. Required education
            5. Required soft skills
            6. Expected measurable achievements
            7. Required document sections

            Format as JSON with these exact keys:
            {
                "keywords": [],
                "experience": {},
                "skills": [],
                "certifications": [],
                "education": {},
                "soft_skills": [],
                "achievements": [],
                "required_sections": []
            }

            Job Description: {self.job_desc}"""

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a precise job requirements analyzer. Extract specific, measurable requirements."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
            
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Error in analyze_job_requirements: {str(e)}")
            return None

    def check_resume_structure(self):
        """Analyze resume structure and ATS readability"""
        try:
            # Check for all possible sections
            present_sections = 0
            total_sections = len(self.all_sections)
            
            for section in self.all_sections:
                if re.search(rf'\b{section}\b', self.resume, re.IGNORECASE):
                    self.all_sections[section] = True
                    present_sections += 1
            
            # Calculate structure score (15 points max)
            structure_score = round((present_sections / total_sections) * 15)
            
            # Check ATS readability
            ats_issues = []
            
            # Check for common ATS issues
            if re.search(r'[^\x00-\x7F]+', self.resume):  # Non-ASCII characters
                ats_issues.append("Contains special characters that may affect ATS readability")
            if re.search(r'<[^>]+>', self.resume):  # HTML tags
                ats_issues.append("Contains HTML formatting that may affect ATS parsing")
            if len(re.findall(r'\n\n+', self.resume)) > 5:  # Excessive spacing
                ats_issues.append("Contains excessive blank lines that may affect formatting")
                
            return structure_score, self.all_sections, ats_issues
            
        except Exception as e:
            print(f"Error in check_resume_structure: {str(e)}")
            return 0, {}, []

    def analyze_bullet_points(self):
        """Analyze bullet point effectiveness"""
        try:
            # Extract bullet points
            bullet_points = re.findall(r'[•\-]\s*(.*?)(?:\n|$)', self.resume)
            if not bullet_points:
                bullet_points = [s.strip() for s in re.split(r'\.\s+', self.resume) if s.strip()]
            
            total_points = len(bullet_points)
            if total_points == 0:
                return 0, [], "No bullet points found"
            
            effective_bullets = []
            for bullet in bullet_points:
                words = bullet.split()
                char_length = len(bullet)
                
                # Check criteria:
                # 1. Character length (85-120 characters)
                # 2. Impactful first/last words
                # 3. Contains measurable result
                if (85 <= char_length <= 120 and
                    any(word.lower() in self.action_verbs for word in words[:4]) and
                    not any(weak in bullet.lower() for weak in self.weak_words) and
                    re.search(r'\d+%|\$\d+|\d+\s*[kKmMbB]|\d+\s*times', bullet)):
                    effective_bullets.append(bullet)
            
            effectiveness_score = round((len(effective_bullets) / total_points) * 10)
            return effectiveness_score, effective_bullets, f"{len(effective_bullets)} of {total_points} bullets are effective"
            
        except Exception as e:
            print(f"Error in analyze_bullet_points: {str(e)}")
            return 0, [], str(e)

    def analyze_measurable_results(self):
        """Analyze measurable achievements"""
        try:
            # Find all quantifiable metrics
            metrics = re.findall(r'\d+%|\$\d+|\d+\s*[kKmMbB]|\d+\s*times|\d+\+?\s*years?', self.resume)
            
            # Extract full sentences containing metrics
            sentences = re.split(r'[.!?]+', self.resume)
            achievements = []
            
            for sentence in sentences:
                if any(metric in sentence for metric in metrics):
                    # Check if the metric is paired with an action verb and impact
                    if (any(verb in sentence.lower() for verb in self.action_verbs) and
                        re.search(r'increased|decreased|improved|reduced|generated|saved|achieved', sentence.lower())):
                        achievements.append(sentence.strip())
            
            # Score based on quality achievements (max 10 points)
            score = min(10, len(achievements) * 2)
            return score, achievements, f"Found {len(achievements)} impactful achievements"
            
        except Exception as e:
            print(f"Error in analyze_measurable_results: {str(e)}")
            return 0, [], str(e)

    def calculate_score(self):
        """Calculate overall resume score"""
        try:
            # Get job requirements
            job_reqs = self.analyze_job_requirements()
            if not job_reqs:
                raise Exception("Failed to analyze job requirements")

            scores = {}
            detailed_analysis = {}
            
            # 1. Keyword Match (20%)
            prompt = f"""Compare these required keywords with the resume text and calculate match percentage. Return a JSON object in this exact format:
            {{
                "match_percentage": number between 0-100,
                "matches": [list of matching keywords found],
                "missing": [list of keywords not found]
            }}

            Required Keywords: {json.dumps(job_reqs['keywords'])}
            Resume: {self.resume}"""
            
            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a keyword matching specialist. Always return valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3
                )
                
                # Extract the content and clean it to ensure valid JSON
                content = response.choices[0].message.content.strip()
                # Remove any markdown code block indicators if present
                content = re.sub(r'^```json\s*|\s*```$', '', content)
                keyword_analysis = json.loads(content)
                
                match_percentage = float(keyword_analysis.get("match_percentage", 0))
                
            except (json.JSONDecodeError, ValueError) as e:
                print(f"Error parsing keyword analysis response: {str(e)}")
                print(f"Raw response: {response.choices[0].message.content}")
                match_percentage = 0
                keyword_analysis = {"matches": [], "missing": []}
            
            # Apply threshold scoring
            for threshold, score in sorted(self.thresholds["keyword_match"].items(), reverse=True):
                if match_percentage >= threshold:
                    scores["keyword_match"] = score
                    break
            else:
                scores["keyword_match"] = 5
            
            detailed_analysis["keyword_match"] = f"Keyword match: {match_percentage}%. Found matches: {', '.join(keyword_analysis.get('matches', []))}"

            # 2. Job Experience (20%)
            prompt = f"""Analyze how well the resume's experience matches these job requirements. Return a JSON object in this exact format:
            {{
                "match_percentage": number between 0-100,
                "matches": [list of matching experiences],
                "missing": [list of missing requirements],
                "justification": "detailed explanation"
            }}

            Required Experience: {json.dumps(job_reqs['experience'])}
            Resume: {self.resume}"""

            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are an experience matching specialist. Always return valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3
                )
                
                content = response.choices[0].message.content.strip()
                content = re.sub(r'^```json\s*|\s*```$', '', content)
                exp_analysis = json.loads(content)
                
                exp_percentage = float(exp_analysis.get("match_percentage", 0))
                
            except (json.JSONDecodeError, ValueError) as e:
                print(f"Error parsing experience analysis response: {str(e)}")
                print(f"Raw response: {response.choices[0].message.content}")
                exp_percentage = 0
                exp_analysis = {"matches": [], "missing": [], "justification": "Analysis failed"}

            # Apply threshold scoring
            for threshold, score in sorted(self.thresholds["job_experience"].items(), reverse=True):
                if exp_percentage >= threshold:
                    scores["job_experience"] = score
                    break
            else:
                scores["job_experience"] = 5

            detailed_analysis["job_experience"] = f"Experience match: {exp_percentage}%. {exp_analysis.get('justification', '')}"

            # 3. Skills & Certifications (15%)
            prompt = f"""Analyze how well the resume's skills and certifications match these requirements. Return a JSON object in this exact format:
            {{
                "match_percentage": number between 0-100,
                "matches": [list of matching skills/certifications],
                "missing": [list of missing requirements],
                "justification": "detailed explanation"
            }}

            Required Skills: {json.dumps(job_reqs['skills'])}
            Required Certifications: {json.dumps(job_reqs['certifications'])}
            Required Education: {json.dumps(job_reqs['education'])}
            Resume: {self.resume}"""

            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a skills matching specialist. Always return valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3
                )
                
                content = response.choices[0].message.content.strip()
                content = re.sub(r'^```json\s*|\s*```$', '', content)
                skills_analysis = json.loads(content)
                
                skills_percentage = float(skills_analysis.get("match_percentage", 0))
                
            except (json.JSONDecodeError, ValueError) as e:
                print(f"Error parsing skills analysis response: {str(e)}")
                print(f"Raw response: {response.choices[0].message.content}")
                skills_percentage = 0
                skills_analysis = {"matches": [], "missing": [], "justification": "Analysis failed"}

            # Apply threshold scoring
            for threshold, score in sorted(self.thresholds["skills_certifications"].items(), reverse=True):
                if skills_percentage >= threshold:
                    scores["skills_certifications"] = score
                    break
            else:
                scores["skills_certifications"] = 6

            detailed_analysis["skills_certifications"] = f"Skills match: {skills_percentage}%. {skills_analysis.get('justification', '')}"
            
            # 4. Resume Structure (15%)
            structure_score, sections, ats_issues = self.check_resume_structure()
            scores["resume_structure"] = structure_score
            detailed_analysis["resume_structure"] = f"Structure score: {structure_score}/15. ATS Issues: {', '.join(ats_issues)}"
            
            # 5. Action Words (10%)
            action_words = [word for word in self.action_verbs if word.lower() in self.resume.lower()]
            weak_words = [word for word in self.weak_words if word.lower() in self.resume.lower()]
            action_score = round((len(action_words) / max(len(action_words) + len(weak_words), 1)) * 10)
            scores["action_words"] = action_score
            detailed_analysis["action_words"] = f"Found {len(action_words)} strong action words and {len(weak_words)} weak words"
            
            # 6. Measurable Results (10%)
            metrics_score, achievements, metrics_analysis = self.analyze_measurable_results()
            scores["measurable_results"] = metrics_score
            detailed_analysis["measurable_results"] = metrics_analysis
            
            # 7. Bullet Point Effectiveness (10%)
            bullet_score, effective_bullets, bullet_analysis = self.analyze_bullet_points()
            scores["bullet_effectiveness"] = bullet_score
            detailed_analysis["bullet_effectiveness"] = bullet_analysis
            
            # Calculate total score
            total_score = sum(scores.values())
            
            # Generate recommendations using OpenAI
            prompt = f"""Based on this detailed analysis, provide specific, actionable recommendations:

            Analysis Summary:
            - Overall Score: {total_score}/100
            - Keyword Match: {scores['keyword_match']}/20 ({keyword_analysis.get('matches', [])})
            - Experience Match: {scores['job_experience']}/20 ({exp_analysis.get('missing', [])})
            - Skills & Certifications: {scores['skills_certifications']}/15 ({skills_analysis.get('missing', [])})
            - Resume Structure: {scores['resume_structure']}/15 (Issues: {ats_issues})
            - Action Words: {scores['action_words']}/10 (Weak words: {weak_words})
            - Measurable Results: {scores['measurable_results']}/10
            - Bullet Points: {scores['bullet_effectiveness']}/10

            Job Requirements:
            {json.dumps(job_reqs, indent=2)}

            Provide 5-7 specific, actionable recommendations to improve this resume for this job.
            Focus on the lowest scoring areas and most critical missing elements.
            Each recommendation should be clear, specific, and directly address gaps found in the analysis."""

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a professional resume expert. Provide specific, actionable recommendations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )

            recommendations = [rec.strip() for rec in response.choices[0].message.content.split('\n') if rec.strip()]

            # Format results
            return {
                "overall_score": total_score,
                "category_scores": scores,
                "detailed_analysis": detailed_analysis,
                "recommendations": recommendations,
                "sections_present": sections,
                "achievements": achievements,
                "effective_bullets": effective_bullets,
                "job_requirements": job_reqs,
                "matches_found": {
                    "keywords": keyword_analysis.get('matches', []),
                    "experience": exp_analysis.get('matches', []),
                    "skills": skills_analysis.get('matches', []),
                    "metrics": achievements
                },
                "missing_elements": {
                    "keywords": keyword_analysis.get('missing', []),
                    "experience": exp_analysis.get('missing', []),
                    "skills": skills_analysis.get('missing', []),
                    "sections": [section for section, present in sections.items() if not present]
                }
            }

        except Exception as e:
            print(f"Error in calculate_score: {str(e)}")
            return {
                "overall_score": 0,
                "category_scores": {
                    "keyword_match": 0,
                    "job_experience": 0,
                    "skills_certifications": 0,
                    "resume_structure": 0,
                    "action_words": 0,
                    "measurable_results": 0,
                    "bullet_effectiveness": 0
                },
                "detailed_analysis": {
                    "keyword_match": f"Analysis failed: {str(e)}",
                    "job_experience": "Analysis unavailable due to error",
                    "skills_certifications": "Analysis unavailable due to error",
                    "resume_structure": "Analysis unavailable due to error",
                    "action_words": "Analysis unavailable due to error",
                    "measurable_results": "Analysis unavailable due to error",
                    "bullet_effectiveness": "Analysis unavailable due to error"
                },
                "recommendations": [
                    "There was an error analyzing your resume. Please try again.",
                    f"Error details: {str(e)}"
                ]
            }