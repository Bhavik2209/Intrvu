"""Centralized configuration management for the application."""
import os
import logging
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field, validator


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # API Keys
    openai_api_key: str = Field(default="", env="OPENAI_API_KEY")
    gemini_api_key: str = Field(default="", env="GEMINI_API_KEY")
    groq_api_key: str = Field(default="", env="GROQ_API_KEY")
    
    # CORS Settings
    allowed_origins: str = Field(
        default="http://localhost:3000,http://localhost:5173",
        env="ALLOWED_ORIGINS"
    )
    
    # Server Settings
    port: int = Field(default=8000, env="PORT")
    environment: str = Field(default="development", env="ENVIRONMENT")
    debug: bool = Field(default=False, env="DEBUG")
    
    # File Processing Limits
    max_pdf_size_mb: int = Field(default=50, env="MAX_PDF_SIZE_MB")
    max_pdf_pages: int = Field(default=100, env="MAX_PDF_PAGES")
    max_text_length: int = Field(default=100000, env="MAX_TEXT_LENGTH")
    
    # Caching Settings
    cache_size: int = Field(default=100, env="CACHE_SIZE")
    cache_ttl_seconds: int = Field(default=3600, env="CACHE_TTL_SECONDS")  # 1 hour default
    
    # LLM Settings
    llm_provider: str = Field(default="openai", env="LLM_PROVIDER")  # openai, gemini, groq
    llm_model: str = Field(default="gpt-4o", env="LLM_MODEL")
    llm_temperature: float = Field(default=0.3, env="LLM_TEMPERATURE")
    llm_max_tokens: int = Field(default=8000, env="LLM_MAX_TOKENS")
    llm_timeout: float = Field(default=30.0, env="LLM_TIMEOUT")
    
    # Redis Settings
    redis_url: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    redis_max_connections: int = Field(default=50, env="REDIS_MAX_CONNECTIONS")
    
    # Upstash REST Settings (Preferred for serverless)
    upstash_redis_rest_url: str = Field(default="", env="UPSTASH_REDIS_REST_URL")
    upstash_redis_rest_token: str = Field(default="", env="UPSTASH_REDIS_REST_TOKEN")
    
    # Request Timeout Settings
    request_timeout: int = Field(default=120, env="REQUEST_TIMEOUT")  # 120 seconds for LLM processing
    
    # Authentication Settings
    require_auth: bool = Field(default=False, env="REQUIRE_AUTH")
    valid_api_keys: str = Field(default="", env="VALID_API_KEYS")  # Comma-separated API keys
    
    # Security Settings
    max_file_size_mb: int = Field(default=10, env="MAX_FILE_SIZE_MB")
    max_text_length: int = Field(default=50000, env="MAX_TEXT_LENGTH")
    
    
    def get_allowed_origins_list(self) -> List[str]:
        """Get allowed origins as a list."""
        if isinstance(self.allowed_origins, str):
            return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]
        return self.allowed_origins
    
    
    @validator("llm_provider")
    def validate_llm_provider(cls, v):
        """Validate LLM provider selection."""
        valid_providers = ["openai", "gemini", "groq"]
        if v.lower() not in valid_providers:
            raise ValueError(f"Invalid LLM_PROVIDER. Must be one of: {', '.join(valid_providers)}")
        return v.lower()
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()


def setup_logging():
    """Configure logging for the entire application."""
    log_level = logging.DEBUG if settings.debug else logging.INFO
    
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler()
        ]
    )
    
    # Set third-party loggers to WARNING to reduce noise
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("groq").setLevel(logging.WARNING)
