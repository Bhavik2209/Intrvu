"""
Context Analyzer Module for IntrvuFit Resume Optimizer V4

This module provides deterministic career stage detection and industry context analysis.
"""

import logging
import re
from typing import Dict, Any, List, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)


def extract_years_of_experience(work_experience: Any) -> float:
    """
    Extract total years of professional experience from work experience data.
    
    Args:
        work_experience: Work experience data (dict, list, or string)
        
    Returns:
        float: Total years of experience
    """
    total_years = 0.0
    
    try:
        # Handle different input formats
        if isinstance(work_experience, dict):
            # If it's a dict, it might have multiple entries
            for key, value in work_experience.items():
                if isinstance(value, list):
                    for job in value:
                        total_years += extract_duration_from_job(job)
                elif isinstance(value, dict):
                    total_years += extract_duration_from_job(value)
        
        elif isinstance(work_experience, list):
            # If it's a list of jobs
            for job in work_experience:
                total_years += extract_duration_from_job(job)
        
        elif isinstance(work_experience, str):
            # Try to extract years from text
            total_years = extract_years_from_text(work_experience)
        
        return round(total_years, 1)
        
    except Exception as e:
        logger.error(f"Error extracting years of experience: {e}")
        return 0.0


def extract_duration_from_job(job: Any) -> float:
    """
    Extract duration in years from a single job entry.
    
    Args:
        job: Job entry (dict or string)
        
    Returns:
        float: Duration in years
    """
    try:
        if isinstance(job, dict):
            # Look for date fields
            start_date = job.get('startDate') or job.get('start_date') or job.get('start')
            end_date = job.get('endDate') or job.get('end_date') or job.get('end') or 'Present'
            
            if start_date:
                return calculate_duration(start_date, end_date)
            
            # Look for duration field
            duration = job.get('duration') or job.get('Duration')
            if duration:
                return parse_duration_string(duration)
        
        elif isinstance(job, str):
            return extract_years_from_text(job)
        
        return 0.0
        
    except Exception as e:
        logger.debug(f"Error extracting duration from job: {e}")
        return 0.0


def calculate_duration(start_date: str, end_date: str) -> float:
    """
    Calculate duration in years between two dates.
    
    Args:
        start_date: Start date string
        end_date: End date string (or "Present")
        
    Returns:
        float: Duration in years
    """
    try:
        # Parse start date
        start = parse_date(start_date)
        
        # Parse end date
        if end_date.lower() in ['present', 'current', 'now']:
            end = datetime.now()
        else:
            end = parse_date(end_date)
        
        # Calculate difference in years
        duration = (end - start).days / 365.25
        return max(0.0, duration)
        
    except Exception as e:
        logger.debug(f"Error calculating duration: {e}")
        return 0.0


def parse_date(date_str: str) -> datetime:
    """
    Parse a date string into a datetime object.
    
    Supports formats:
    - "2020-01-15"
    - "Jan 2020"
    - "January 2020"
    - "2020"
    
    Args:
        date_str: Date string
        
    Returns:
        datetime: Parsed datetime object
    """
    date_str = date_str.strip()
    
    # Try ISO format first
    for fmt in ['%Y-%m-%d', '%Y/%m/%d', '%d-%m-%Y', '%d/%m/%Y']:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    # Try month-year formats
    for fmt in ['%b %Y', '%B %Y', '%m/%Y', '%m-%Y']:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    # Try year only
    try:
        year = int(date_str)
        return datetime(year, 1, 1)
    except ValueError:
        pass
    
    # Default to current date if parsing fails
    logger.warning(f"Could not parse date: {date_str}")
    return datetime.now()


def parse_duration_string(duration_str: str) -> float:
    """
    Parse a duration string like "2 years 3 months" into years.
    
    Args:
        duration_str: Duration string
        
    Returns:
        float: Duration in years
    """
    duration_str = duration_str.lower()
    years = 0.0
    
    # Extract years
    year_match = re.search(r'(\d+)\s*(?:year|yr)', duration_str)
    if year_match:
        years += float(year_match.group(1))
    
    # Extract months
    month_match = re.search(r'(\d+)\s*(?:month|mo)', duration_str)
    if month_match:
        years += float(month_match.group(1)) / 12.0
    
    return years


def extract_years_from_text(text: str) -> float:
    """
    Extract years of experience from text using pattern matching.
    
    Args:
        text: Text to search
        
    Returns:
        float: Estimated years of experience
    """
    # Look for patterns like "5 years", "5+ years", "5-7 years"
    patterns = [
        r'(\d+)\+?\s*(?:years?|yrs?)',
        r'(\d+)-\d+\s*(?:years?|yrs?)',
    ]
    
    total_years = 0.0
    for pattern in patterns:
        matches = re.findall(pattern, text.lower())
        for match in matches:
            total_years = max(total_years, float(match))
    
    return total_years


def detect_leadership_indicators(work_experience: Any) -> bool:
    """
    Detect leadership indicators in work experience.
    
    Leadership indicators:
    - Managed team
    - Led team/project
    - Owned strategy
    - Org-wide impact
    - Director/VP/C-level titles
    
    Args:
        work_experience: Work experience data
        
    Returns:
        bool: True if leadership indicators found
    """
    leadership_keywords = [
        'managed team', 'led team', 'team lead', 'team leader',
        'owned strategy', 'strategic', 'org-wide', 'organization-wide',
        'director', 'vp', 'vice president', 'chief', 'ceo', 'cto', 'cfo',
        'head of', 'managed', 'supervised', 'oversaw',
        'built team', 'hired', 'mentored', 'coached'
    ]
    
    # Convert work experience to text
    text = str(work_experience).lower()
    
    # Check for leadership keywords
    for keyword in leadership_keywords:
        if keyword in text:
            logger.info(f"Leadership indicator found: {keyword}")
            return True
    
    return False


def detect_career_stage(work_experience: Any) -> str:
    """
    Detect career stage based on work experience.
    
    Career stages:
    - Entry-Level: <2 years total professional experience
    - Mid-Level: 2-8 years total professional experience
    - Senior/Executive: >8 years OR leadership indicators
    
    Args:
        work_experience: Work experience data
        
    Returns:
        str: Career stage ("Entry-Level", "Mid-Level", "Senior/Executive")
    """
    try:
        years = extract_years_of_experience(work_experience)
        has_leadership = detect_leadership_indicators(work_experience)
        
        logger.info(f"Career stage detection: {years} years, leadership={has_leadership}")
        
        # Senior/Executive: >8 years OR leadership indicators
        if years > 8 or has_leadership:
            return "Senior/Executive"
        
        # Mid-Level: 2-8 years
        elif years >= 2:
            return "Mid-Level"
        
        # Entry-Level: <2 years
        else:
            return "Entry-Level"
        
    except Exception as e:
        logger.error(f"Error detecting career stage: {e}")
        return "Mid-Level"  # Default to mid-level


def detect_industry(job_description: str) -> str:
    """
    Detect industry from job description keywords.
    
    Industries:
    - Tech/Engineering
    - Creative/Design
    - Sales/Marketing
    - Academic/Research
    - Regulated (Healthcare/Legal)
    
    Args:
        job_description: Job description text
        
    Returns:
        str: Industry category
    """
    if not job_description:
        return "General"
    
    job_desc_lower = job_description.lower()
    
    # Define industry keywords
    industry_keywords = {
        "Tech/Engineering": [
            'software', 'engineer', 'developer', 'programming', 'code', 'technical',
            'data', 'cloud', 'devops', 'api', 'backend', 'frontend', 'fullstack',
            'python', 'java', 'javascript', 'react', 'node', 'aws', 'azure',
            'machine learning', 'ai', 'artificial intelligence', 'ml', 'algorithm'
        ],
        "Creative/Design": [
            'design', 'creative', 'ux', 'ui', 'graphic', 'visual', 'brand',
            'portfolio', 'figma', 'sketch', 'adobe', 'photoshop', 'illustrator',
            'art director', 'creative director', 'designer'
        ],
        "Sales/Marketing": [
            'sales', 'marketing', 'business development', 'account', 'revenue',
            'customer', 'client', 'pipeline', 'quota', 'crm', 'salesforce',
            'digital marketing', 'seo', 'sem', 'social media', 'campaign',
            'growth', 'acquisition', 'retention'
        ],
        "Academic/Research": [
            'research', 'academic', 'professor', 'phd', 'publication', 'journal',
            'grant', 'thesis', 'dissertation', 'university', 'faculty',
            'teaching', 'lecturer', 'postdoc', 'scientist'
        ],
        "Regulated (Healthcare/Legal)": [
            'healthcare', 'medical', 'clinical', 'hospital', 'patient', 'doctor',
            'nurse', 'physician', 'legal', 'attorney', 'lawyer', 'compliance',
            'regulatory', 'fda', 'hipaa', 'gdpr', 'law', 'paralegal'
        ]
    }
    
    # Count keyword matches for each industry
    industry_scores = {}
    for industry, keywords in industry_keywords.items():
        score = sum(1 for keyword in keywords if keyword in job_desc_lower)
        industry_scores[industry] = score
    
    # Return industry with highest score
    if max(industry_scores.values()) > 0:
        detected_industry = max(industry_scores, key=industry_scores.get)
        logger.info(f"Detected industry: {detected_industry} (score: {industry_scores[detected_industry]})")
        return detected_industry
    
    return "General"


def apply_industry_weights(base_weights: Dict[str, float], industry: str) -> Dict[str, float]:
    """
    Apply industry-specific weight adjustments.
    
    Note: This modifies internal weight emphasis only. Final scores remain capped at 100.
    
    Args:
        base_weights: Base weights for each component
        industry: Industry category
        
    Returns:
        Dict: Adjusted weights
    """
    adjusted_weights = base_weights.copy()
    
    # Industry-specific adjustments
    if industry == "Tech/Engineering":
        # Emphasize technical skills and tools
        adjusted_weights['skillsToolsMatch'] = adjusted_weights.get('skillsToolsMatch', 1.0) * 1.2
        adjusted_weights['keywordMatch'] = adjusted_weights.get('keywordMatch', 1.0) * 1.1
    
    elif industry == "Creative/Design":
        # Emphasize portfolio and project-based experience
        adjusted_weights['experienceAlignment'] = adjusted_weights.get('experienceAlignment', 1.0) * 1.2
    
    elif industry == "Sales/Marketing":
        # Emphasize quantified business impact
        adjusted_weights['measurableResults'] = adjusted_weights.get('measurableResults', 1.0) * 1.3
    
    elif industry == "Academic/Research":
        # Emphasize education and publications
        adjusted_weights['educationRequirement'] = adjusted_weights.get('educationRequirement', 1.0) * 1.2
    
    elif industry == "Regulated (Healthcare/Legal)":
        # Emphasize credentials and compliance
        adjusted_weights['educationRequirement'] = adjusted_weights.get('educationRequirement', 1.0) * 1.2
        adjusted_weights['skillsToolsMatch'] = adjusted_weights.get('skillsToolsMatch', 1.0) * 1.1
    
    logger.info(f"Applied {industry} industry weights: {adjusted_weights}")
    return adjusted_weights


def analyze_context(resume_data: Dict[str, Any], job_description: str) -> Dict[str, Any]:
    """
    Analyze career stage and industry context.
    
    Args:
        resume_data: Resume data dictionary
        job_description: Job description text
        
    Returns:
        Dict: Context analysis with career stage, industry, and years of experience
    """
    try:
        # Extract work experience
        work_experience = resume_data.get('Work Experience', {})
        
        # Detect career stage
        career_stage = detect_career_stage(work_experience)
        
        # Extract years of experience
        years_of_experience = extract_years_of_experience(work_experience)
        
        # Detect industry
        industry = detect_industry(job_description)
        
        return {
            'careerStage': career_stage,
            'industry': industry,
            'yearsOfExperience': years_of_experience
        }
        
    except Exception as e:
        logger.error(f"Error analyzing context: {e}")
        return {
            'careerStage': 'Mid-Level',
            'industry': 'General',
            'yearsOfExperience': 0.0
        }
