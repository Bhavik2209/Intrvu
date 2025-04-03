import PyPDF2
import io
import logging
import os
from typing import Union, BinaryIO

# Configure logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def extract_text_from_pdf(file: Union[BinaryIO, bytes]) -> str:
    """
    Securely extract text from a PDF file.
    
    Args:
        file (Union[BinaryIO, bytes]): PDF file object or bytes
    
    Returns:
        str: Extracted text from the PDF
    """
    # Validate input
    if file is None:
        logger.warning("No file provided for text extraction")
        return ""

    # Input sanitization and conversion
    try:
        # Convert to BytesIO if not already
        if not isinstance(file, io.BytesIO):
            # If it's a file-like object, read its content
            if hasattr(file, 'read'):
                file_content = io.BytesIO(file.read())
            # If it's bytes, convert directly
            elif isinstance(file, bytes):
                file_content = io.BytesIO(file)
            else:
                logger.error(f"Unsupported file type: {type(file)}")
                return ""
        else:
            file_content = file

        # Security: Limit PDF size (e.g., 50 MB)
        max_file_size = 50 * 1024 * 1024  # 50 MB
        file_content.seek(0, os.SEEK_END)
        file_size = file_content.tell()
        file_content.seek(0)

        if file_size > max_file_size:
            logger.warning(f"PDF file too large: {file_size} bytes")
            return ""

        # Create PDF reader object with additional security
        pdf_reader = PyPDF2.PdfReader(file_content)

        # Validate number of pages
        max_pages = 100  # Prevent processing extremely large PDFs
        if len(pdf_reader.pages) > max_pages:
            logger.warning(f"PDF exceeds max page limit: {len(pdf_reader.pages)} pages")
            # Extract only first 100 pages
            pdf_reader.pages = pdf_reader.pages[:max_pages]

        # Extract text with additional error handling
        text = ""
        for page_num, page in enumerate(pdf_reader.pages, 1):
            try:
                page_text = page.extract_text()
                text += page_text + "\n"
                
                # Optional: Limit total text length
                if len(text) > 100000:  # ~100,000 characters
                    logger.warning("Truncating extracted text due to length")
                    text = text[:100000]
                    break
            except Exception as page_error:
                logger.error(f"Error extracting text from page {page_num}: {page_error}")
                continue

        # Final text processing
        processed_text = text.strip()

        # Log successful extraction
        logger.info(f"Successfully extracted text from PDF (Length: {len(processed_text)} chars)")

        return processed_text

    except PyPDF2.errors.PdfReadError as pdf_error:
        # Specific handling for PDF-related errors
        logger.error(f"PDF reading error: {pdf_error}")
        return ""
    except Exception as e:
        # Comprehensive error logging
        logger.error(f"Unexpected error in PDF text extraction: {e}", exc_info=True)
        return ""
    finally:
        # Ensure file is closed if possible
        try:
            if hasattr(file, 'close'):
                file.close()
        except Exception as close_error:
            logger.error(f"Error closing file: {close_error}")

# Optional: Add a function to validate PDF
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