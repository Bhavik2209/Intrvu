import PyPDF2
import io
import logging
from typing import Union

from app.core.config import settings
from app.core.exceptions import PDFValidationError

logger = logging.getLogger(__name__)

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Securely extract text from a PDF file.
    
    Args:
        file_bytes: PDF file as bytes
    
    Returns:
        Extracted text from the PDF
        
    Raises:
        PDFValidationError: If PDF is invalid or too large
    """
    if not file_bytes:
        logger.warning("No file provided for text extraction")
        raise PDFValidationError("No file provided")

    # Convert bytes to BytesIO
    file_content = io.BytesIO(file_bytes)

    # Security: Limit PDF size
    max_file_size = settings.max_pdf_size_mb * 1024 * 1024
    file_content.seek(0, 2)  # Seek to end
    file_size = file_content.tell()
    file_content.seek(0)  # Seek back to start

    if file_size > max_file_size:
        logger.warning(f"PDF file too large: {file_size} bytes")
        raise PDFValidationError(f"PDF file exceeds maximum size of {settings.max_pdf_size_mb}MB")

    # Create PDF reader
    try:
        pdf_reader = PyPDF2.PdfReader(file_content)
    except PyPDF2.errors.PdfReadError as e:
        logger.error(f"PDF reading error: {e}")
        raise PDFValidationError(f"Invalid PDF file: {str(e)}")

    # Validate number of pages
    max_pages = settings.max_pdf_pages
    num_pages = len(pdf_reader.pages)
    if num_pages > max_pages:
        logger.warning(f"PDF exceeds max page limit: {num_pages} pages")
        # Only process first max_pages
        pages_to_process = pdf_reader.pages[:max_pages]
    else:
        pages_to_process = pdf_reader.pages

    # Extract text with error handling
    text = ""
    for page_num, page in enumerate(pages_to_process, 1):
        try:
            page_text = page.extract_text()
            text += page_text + "\n"
            
            # Limit total text length
            if len(text) > settings.max_text_length:
                logger.warning("Truncating extracted text due to length")
                text = text[:settings.max_text_length]
                break
        except Exception as page_error:
            logger.error(f"Error extracting text from page {page_num}: {page_error}")
            continue

    # Final text processing
    processed_text = text.strip()

    # Log successful extraction
    logger.info(f"Successfully extracted text from PDF (Length: {len(processed_text)} chars, Pages: {len(pages_to_process)})")

    return processed_text


