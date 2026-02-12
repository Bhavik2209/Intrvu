"""Custom exception classes for the application."""


class ResumeAnalysisError(Exception):
    """Base exception for resume analysis errors."""
    pass


class ResumeExtractionError(ResumeAnalysisError):
    """Raised when resume text extraction fails."""
    pass


class PDFValidationError(ResumeAnalysisError):
    """Raised when PDF validation fails."""
    pass


class OpenAIError(ResumeAnalysisError):
    """Raised when OpenAI API calls fail."""
    pass


class InvalidResumeContentError(ResumeAnalysisError):
    """Raised when resume content is invalid or insufficient."""
    pass


class JobDescriptionError(ResumeAnalysisError):
    """Raised when job description validation fails."""
    pass
