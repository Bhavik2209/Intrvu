"""Input sanitization utilities to prevent injection attacks."""
import bleach
import re
from typing import Any, Dict


def sanitize_text(text: str, max_length: int = 50000) -> str:
    """
    Sanitize text input by removing potentially dangerous content.
    
    Args:
        text: Input text to sanitize
        max_length: Maximum allowed length (default: 50000 chars)
        
    Returns:
        Sanitized text
        
    Raises:
        ValueError: If text exceeds max_length
    """
    if not text:
        return ""
    
    # Check length
    if len(text) > max_length:
        raise ValueError(f"Input text exceeds maximum length of {max_length} characters")
    
    # Remove HTML tags and potentially dangerous content
    sanitized = bleach.clean(text, tags=[], strip=True)
    
    # Remove null bytes
    sanitized = sanitized.replace('\x00', '')
    
    return sanitized.strip()


def sanitize_job_data(job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize job description data.
    
    Args:
        job_data: Job data dictionary
        
    Returns:
        Sanitized job data
    """
    if not isinstance(job_data, dict):
        raise ValueError("Job data must be a dictionary")
    
    sanitized = {}
    
    # Sanitize description (most important field)
    if 'description' in job_data:
        sanitized['description'] = sanitize_text(job_data['description'])
    
    # Sanitize other text fields
    for field in ['title', 'company', 'location', 'type']:
        if field in job_data:
            sanitized[field] = sanitize_text(str(job_data[field]), max_length=500)
    
    # Copy other fields as-is (but validate types)
    for key, value in job_data.items():
        if key not in sanitized:
            # Only allow safe types
            if isinstance(value, (str, int, float, bool, type(None))):
                sanitized[key] = value
    
    return sanitized


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    if not filename:
        return "unnamed_file"
    
    # Remove path separators and dangerous characters
    sanitized = re.sub(r'[/\\:*?"<>|]', '_', filename)
    
    # Remove leading dots (hidden files)
    sanitized = sanitized.lstrip('.')
    
    # Limit length
    if len(sanitized) > 255:
        sanitized = sanitized[:255]
    
    return sanitized or "unnamed_file"


def validate_pdf_content(content: bytes, max_size_mb: int = 10) -> bool:
    """
    Validate PDF file content.
    
    Args:
        content: PDF file bytes
        max_size_mb: Maximum file size in MB
        
    Returns:
        True if valid
        
    Raises:
        ValueError: If validation fails
    """
    if not content:
        raise ValueError("Empty file content")
    
    # Check file size
    max_size_bytes = max_size_mb * 1024 * 1024
    if len(content) > max_size_bytes:
        raise ValueError(f"File size exceeds {max_size_mb}MB limit")
    
    # Check PDF magic bytes
    if not content.startswith(b'%PDF'):
        raise ValueError("Invalid PDF file format")
    
    return True
