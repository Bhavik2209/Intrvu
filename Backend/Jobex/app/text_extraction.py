import PyPDF2
import io

def extract_text_from_pdf(file):
    # Create a PDF reader object
    try:
        # Convert the file to BytesIO if it's not already
        if not isinstance(file, io.BytesIO):
            file_content = io.BytesIO(file.read())
        else:
            file_content = file
            
        # Create PDF reader object
        pdf_reader = PyPDF2.PdfReader(file_content)
        
        # Extract text from all pages
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
            
        return text.strip()
    except Exception as e:
        print(f"Error extracting text from PDF: {str(e)}")
        return ""
    finally:
        # Ensure the file is closed
        if hasattr(file, 'close'):
            file.close()