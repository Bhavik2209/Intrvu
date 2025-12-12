#to check whether the pdf is valid or not.

def is_valid_pdf(file_content: bytes) -> bool:
    """
    Validate if the file is a valid PDF
    
    Args:
        file_content (bytes): File content to check
    
    Returns:
        bool: True if valid PDF, False otherwise
    """
    try:
        # Check PDF signature
        return file_content[:4] == b'%PDF'
    except Exception:
        return False