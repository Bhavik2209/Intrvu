"""
Score Validation Module for IntrvuFit Resume Optimizer V4

This module provides comprehensive validation for all scoring components to ensure:
- All scores are valid numbers (no NaN, Infinity, null, undefined)
- All scores are within defined ranges
- Component scores sum correctly
- Proper error handling and graceful degradation
"""

import logging
from typing import Any, Dict, List, Optional, Union
import math

logger = logging.getLogger(__name__)


class ValidationError(Exception):
    """Custom exception for validation errors"""
    pass


def validate_numeric(value: Any, field_name: str) -> float:
    """
    Validate that a value is a valid number (not NaN, Infinity, null, undefined).
    
    Args:
        value: The value to validate
        field_name: Name of the field for error messages
        
    Returns:
        float: The validated numeric value
        
    Raises:
        ValidationError: If value is not a valid number
    """
    if value is None:
        raise ValidationError(f"{field_name} is None/null")
    
    try:
        num_value = float(value)
    except (ValueError, TypeError) as e:
        raise ValidationError(f"{field_name} cannot be converted to number: {value}")
    
    if math.isnan(num_value):
        raise ValidationError(f"{field_name} is NaN")
    
    if math.isinf(num_value):
        raise ValidationError(f"{field_name} is Infinity")
    
    return num_value


def validate_range(value: float, min_val: float, max_val: float, field_name: str) -> float:
    """
    Validate that a value is within the specified range.
    
    Args:
        value: The value to validate
        min_val: Minimum allowed value (inclusive)
        max_val: Maximum allowed value (inclusive)
        field_name: Name of the field for error messages
        
    Returns:
        float: The validated value
        
    Raises:
        ValidationError: If value is out of range
    """
    if value < min_val or value > max_val:
        raise ValidationError(
            f"{field_name} ({value}) is out of range [{min_val}, {max_val}]"
        )
    
    return value


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """
    Perform division with protection against division by zero.
    
    Args:
        numerator: The numerator
        denominator: The denominator
        default: Default value to return if denominator is zero
        
    Returns:
        float: Result of division or default value
    """
    if denominator == 0:
        logger.warning(f"Division by zero: {numerator}/{denominator}, returning {default}")
        return default
    
    result = numerator / denominator
    
    # Additional safety check
    if math.isnan(result) or math.isinf(result):
        logger.warning(f"Division resulted in NaN/Inf: {numerator}/{denominator}, returning {default}")
        return default
    
    return result


def round_to_precision(value: float, decimals: int = 1) -> float:
    """
    Round a value to specified decimal places.
    
    Args:
        value: The value to round
        decimals: Number of decimal places (default: 1)
        
    Returns:
        float: Rounded value
    """
    try:
        return round(float(value), decimals)
    except (ValueError, TypeError):
        logger.error(f"Cannot round value: {value}")
        return 0.0


def validate_score_component(
    component_data: Dict[str, Any],
    max_points: float,
    component_name: str,
    required_fields: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Validate a single scoring component.
    
    Args:
        component_data: The component data dictionary
        max_points: Maximum points for this component
        component_name: Name of the component for error messages
        required_fields: List of required fields in the component
        
    Returns:
        Dict: Validated component data
        
    Raises:
        ValidationError: If validation fails
    """
    if not isinstance(component_data, dict):
        raise ValidationError(f"{component_name} is not a dictionary")
    
    # Validate score field exists
    if 'score' not in component_data:
        raise ValidationError(f"{component_name} missing 'score' field")
    
    score_data = component_data['score']
    if not isinstance(score_data, dict):
        raise ValidationError(f"{component_name}.score is not a dictionary")
    
    # Validate pointsAwarded
    if 'pointsAwarded' not in score_data:
        raise ValidationError(f"{component_name}.score missing 'pointsAwarded'")
    
    points = validate_numeric(score_data['pointsAwarded'], f"{component_name}.pointsAwarded")
    points = validate_range(points, 0, max_points, f"{component_name}.pointsAwarded")
    
    # Round to 1 decimal place
    component_data['score']['pointsAwarded'] = round_to_precision(points, 1)
    
    # Validate percentage fields if they exist
    for key in score_data:
        if 'percentage' in key.lower() or 'percent' in key.lower():
            if score_data[key] is not None:
                pct = validate_numeric(score_data[key], f"{component_name}.{key}")
                pct = validate_range(pct, 0, 100, f"{component_name}.{key}")
                component_data['score'][key] = round_to_precision(pct, 1)
    
    # Validate required fields
    if required_fields:
        for field in required_fields:
            if field not in score_data:
                raise ValidationError(f"{component_name}.score missing required field: {field}")
    
    # Ensure analysis field exists
    if 'analysis' not in component_data:
        component_data['analysis'] = {}
    
    return component_data


def validate_job_fit_score(scores_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate all Job Fit Score components.
    
    Job Fit Score (0-100):
    - Keyword & Contextual Match: 35 points
    - Experience Alignment: 30 points
    - Education Requirement: 20 points
    - Skills & Tools Match: 15 points
    
    Args:
        scores_dict: Dictionary containing all job fit components
        
    Returns:
        Dict: Validated scores dictionary
        
    Raises:
        ValidationError: If validation fails
    """
    total_points = 0.0
    max_total = 100.0
    
    # Validate Keyword & Contextual Match (35 points)
    if 'keywordMatch' in scores_dict:
        validate_score_component(scores_dict['keywordMatch'], 35, 'keywordMatch')
        total_points += scores_dict['keywordMatch']['score']['pointsAwarded']
    
    # Validate Experience Alignment (30 points)
    if 'experienceAlignment' in scores_dict:
        validate_score_component(scores_dict['experienceAlignment'], 30, 'experienceAlignment')
        total_points += scores_dict['experienceAlignment']['score']['pointsAwarded']
    
    # Validate Education Requirement (20 points)
    if 'educationRequirement' in scores_dict:
        validate_score_component(scores_dict['educationRequirement'], 20, 'educationRequirement')
        total_points += scores_dict['educationRequirement']['score']['pointsAwarded']
    
    # Validate Skills & Tools Match (15 points)
    if 'skillsToolsMatch' in scores_dict:
        validate_score_component(scores_dict['skillsToolsMatch'], 15, 'skillsToolsMatch')
        total_points += scores_dict['skillsToolsMatch']['score']['pointsAwarded']
    
    # Validate total doesn't exceed maximum (with small tolerance for rounding)
    if total_points > max_total + 0.5:
        logger.warning(f"Job Fit Score total ({total_points}) exceeds maximum ({max_total})")
        # Cap at maximum
        total_points = max_total
    
    return scores_dict


def validate_resume_quality_score(scores_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate all Resume Quality Score components.
    
    Resume Quality Score (0-100):
    - Resume Structure: 30 points
    - Action Words Usage: 25 points
    - Measurable Results: 25 points
    - Bullet Effectiveness: 20 points
    
    Args:
        scores_dict: Dictionary containing all resume quality components
        
    Returns:
        Dict: Validated scores dictionary
        
    Raises:
        ValidationError: If validation fails
    """
    total_points = 0.0
    max_total = 100.0
    
    # Validate Resume Structure (30 points)
    if 'structure' in scores_dict:
        validate_score_component(scores_dict['structure'], 30, 'structure')
        total_points += scores_dict['structure']['score']['pointsAwarded']
    
    # Validate Action Words Usage (25 points)
    if 'actionWords' in scores_dict:
        validate_score_component(scores_dict['actionWords'], 25, 'actionWords')
        total_points += scores_dict['actionWords']['score']['pointsAwarded']
    
    # Validate Measurable Results (25 points)
    if 'measurableResults' in scores_dict:
        validate_score_component(scores_dict['measurableResults'], 25, 'measurableResults')
        total_points += scores_dict['measurableResults']['score']['pointsAwarded']
    
    # Validate Bullet Effectiveness (20 points)
    if 'bulletEffectiveness' in scores_dict:
        validate_score_component(scores_dict['bulletEffectiveness'], 20, 'bulletEffectiveness')
        total_points += scores_dict['bulletEffectiveness']['score']['pointsAwarded']
    
    # Validate total doesn't exceed maximum (with small tolerance for rounding)
    if total_points > max_total + 0.5:
        logger.warning(f"Resume Quality Score total ({total_points}) exceeds maximum ({max_total})")
        # Cap at maximum
        total_points = max_total
    
    return scores_dict


def get_job_fit_label(score: float) -> str:
    """
    Get the Job Fit label based on score.
    
    Args:
        score: Job Fit Score (0-100)
        
    Returns:
        str: Label ("Great Match", "Good Match", "Moderate Match", "Low Fit")
    """
    if score >= 90:
        return "Great Match"
    elif score >= 75:
        return "Good Match"
    elif score >= 60:
        return "Moderate Match"
    else:
        return "Low Fit"


def get_resume_quality_tier(score: float) -> str:
    """
    Get the Resume Quality tier based on score.
    
    Args:
        score: Resume Quality Score (0-100)
        
    Returns:
        str: Tier label ("Ready to Impress", "Needs Polish", "Refine for Impact")
    """
    if score >= 90:
        return "Ready to Impress"
    elif score >= 70:
        return "Needs Polish"
    else:
        return "Refine for Impact"


def create_safe_default_component(component_name: str, max_points: float) -> Dict[str, Any]:
    """
    Create a safe default component structure with zero scores.
    
    Args:
        component_name: Name of the component
        max_points: Maximum points for this component
        
    Returns:
        Dict: Safe default component structure
    """
    return {
        "score": {
            "pointsAwarded": 0.0,
            "maxPoints": max_points,
            "percentage": 0.0,
            "rating": "Error",
            "ratingSymbol": "❌"
        },
        "analysis": {
            "error": f"Failed to analyze {component_name}",
            "suggestedImprovements": "Please try again or contact support"
        }
    }


def validate_and_sanitize_response(response: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and sanitize the entire response structure.
    
    This is the main entry point for validation. It ensures:
    - All scores are valid numbers
    - All scores are within range
    - All required fields exist
    - Graceful degradation on errors
    
    Args:
        response: The complete response dictionary
        
    Returns:
        Dict: Validated and sanitized response
    """
    try:
        # Ensure top-level structure exists
        if 'jobFitScore' not in response:
            response['jobFitScore'] = {
                'score': 0.0,
                'label': 'Low Fit',
                'components': {}
            }
        
        if 'resumeQualityScore' not in response:
            response['resumeQualityScore'] = {
                'score': 0.0,
                'tier': 'Refine for Impact',
                'components': {}
            }
        
        # Validate Job Fit components
        if 'components' in response['jobFitScore']:
            try:
                validate_job_fit_score(response['jobFitScore']['components'])
            except ValidationError as e:
                logger.error(f"Job Fit validation error: {e}")
                # Set safe defaults for failed components
                response['jobFitScore']['components'] = {
                    'keywordMatch': create_safe_default_component('keywordMatch', 35),
                    'experienceAlignment': create_safe_default_component('experienceAlignment', 30),
                    'educationRequirement': create_safe_default_component('educationRequirement', 20),
                    'skillsToolsMatch': create_safe_default_component('skillsToolsMatch', 15)
                }
        
        # Validate Resume Quality components
        if 'components' in response['resumeQualityScore']:
            try:
                validate_resume_quality_score(response['resumeQualityScore']['components'])
            except ValidationError as e:
                logger.error(f"Resume Quality validation error: {e}")
                # Set safe defaults for failed components
                response['resumeQualityScore']['components'] = {
                    'structure': create_safe_default_component('structure', 30),
                    'actionWords': create_safe_default_component('actionWords', 25),
                    'measurableResults': create_safe_default_component('measurableResults', 25),
                    'bulletEffectiveness': create_safe_default_component('bulletEffectiveness', 20)
                }
        
        # Validate and set overall scores
        try:
            job_fit_score = validate_numeric(response['jobFitScore'].get('score', 0), 'jobFitScore.score')
            job_fit_score = validate_range(job_fit_score, 0, 100, 'jobFitScore.score')
            response['jobFitScore']['score'] = round_to_precision(job_fit_score, 1)
            response['jobFitScore']['label'] = get_job_fit_label(job_fit_score)
        except ValidationError as e:
            logger.error(f"Job Fit score validation error: {e}")
            response['jobFitScore']['score'] = 0.0
            response['jobFitScore']['label'] = 'Low Fit'
        
        try:
            quality_score = validate_numeric(response['resumeQualityScore'].get('score', 0), 'resumeQualityScore.score')
            quality_score = validate_range(quality_score, 0, 100, 'resumeQualityScore.score')
            response['resumeQualityScore']['score'] = round_to_precision(quality_score, 1)
            response['resumeQualityScore']['tier'] = get_resume_quality_tier(quality_score)
        except ValidationError as e:
            logger.error(f"Resume Quality score validation error: {e}")
            response['resumeQualityScore']['score'] = 0.0
            response['resumeQualityScore']['tier'] = 'Refine for Impact'
        
        return response
        
    except Exception as e:
        logger.error(f"Critical validation error: {e}")
        # Return absolute minimum safe structure
        return {
            'jobFitScore': {
                'score': 0.0,
                'label': 'Low Fit',
                'components': {}
            },
            'resumeQualityScore': {
                'score': 0.0,
                'tier': 'Refine for Impact',
                'components': {}
            },
            'context': {
                'careerStage': 'Unknown',
                'industry': 'Unknown',
                'yearsOfExperience': 0
            },
            'error': 'Critical validation error occurred'
        }
