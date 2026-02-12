"""Centralized LLM service with multi-provider support (OpenAI, Gemini, Groq)."""
import logging
from typing import Optional, Dict, Any
try:
    from langchain_core.caches import InMemoryCache
    from langchain_core.globals import set_llm_cache
except ImportError:
    try:
        from langchain.cache import InMemoryCache
        from langchain.globals import set_llm_cache
    except ImportError:
        # Fallback for even older versions or community packages if needed
        from langchain_community.cache import InMemoryCache
        from langchain.globals import set_llm_cache
from app.core.config import settings
from app.core.exceptions import OpenAIError
from app.services.llm_providers import BaseLLMProvider, OpenAIProvider, GeminiProvider, GroqProvider

logger = logging.getLogger(__name__)


class LLMService:
    """Singleton service for LLM interactions with multi-provider support."""
    
    _instance: Optional['LLMService'] = None
    _provider: Optional[BaseLLMProvider] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """Initialize the LLM provider based on configuration."""
        try:
            # Set up LangChain caching
            set_llm_cache(InMemoryCache())
            
            # Create provider based on configuration
            provider_name = settings.llm_provider.lower()
            
            if provider_name == "openai":
                if not settings.openai_api_key:
                    raise ValueError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")
                self._provider = OpenAIProvider(
                    api_key=settings.openai_api_key,
                    model=settings.llm_model,
                    temperature=settings.llm_temperature,
                    max_tokens=settings.llm_max_tokens,
                    timeout=settings.llm_timeout
                )
            
            elif provider_name == "gemini":
                if not settings.gemini_api_key:
                    raise ValueError("GEMINI_API_KEY is required when LLM_PROVIDER=gemini")
                self._provider = GeminiProvider(
                    api_key=settings.gemini_api_key,
                    model=settings.llm_model,
                    temperature=settings.llm_temperature,
                    max_tokens=settings.llm_max_tokens,
                    timeout=settings.llm_timeout
                )
            
            elif provider_name == "groq":
                if not settings.groq_api_key:
                    raise ValueError("GROQ_API_KEY is required when LLM_PROVIDER=groq")
                self._provider = GroqProvider(
                    api_key=settings.groq_api_key,
                    model=settings.llm_model,
                    temperature=settings.llm_temperature,
                    max_tokens=settings.llm_max_tokens,
                    timeout=settings.llm_timeout
                )
            
            else:
                raise ValueError(f"Unsupported LLM provider: {provider_name}")
            
            logger.info(f"LLM service initialized with {self._provider.provider_name} provider (model: {settings.llm_model})")
            
        except Exception as e:
            logger.error(f"Failed to initialize LLM service: {e}")
            raise OpenAIError(f"Failed to initialize LLM service: {e}")
    
    @property
    def provider(self) -> BaseLLMProvider:
        """Get the LLM provider instance."""
        if self._provider is None:
            self._initialize()
        return self._provider
    
    def generate_json(self, prompt: str, system_message: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate structured JSON response from LLM.
        
        Args:
            prompt: User prompt
            system_message: Optional system message
            
        Returns:
            Dict containing the parsed JSON response
            
        Raises:
            OpenAIError: If the API call or parsing fails
        """
        try:
            result = self.provider.generate_json(prompt, system_message)
            
            if not isinstance(result, dict):
                raise ValueError("Response is not a valid JSON object")
            
            return result
            
        except Exception as e:
            logger.error(f"Error in LLM generation: {str(e)}")
            raise OpenAIError(f"LLM generation failed: {str(e)}")
    
    async def generate_json_async(self, prompt: str, system_message: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate structured JSON response from LLM asynchronously.
        
        Args:
            prompt: User prompt
            system_message: Optional system message
            
        Returns:
            Dict containing the parsed JSON response
            
        Raises:
            OpenAIError: If the API call or parsing fails
        """
        try:
            result = await self.provider.generate_json_async(prompt, system_message)
            
            if not isinstance(result, dict):
                raise ValueError("Response is not a valid JSON object")
            
            return result
            
        except Exception as e:
            logger.error(f"Error in async LLM generation: {str(e)}")
            raise OpenAIError(f"Async LLM generation failed: {str(e)}")


# Global singleton instance
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """Get the global LLM service instance."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
