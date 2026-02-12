"""
LLM Provider Base Class and Implementations

This module provides a unified interface for different LLM providers (OpenAI, Gemini, Groq).
"""

import logging
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class BaseLLMProvider(ABC):
    """Abstract base class for LLM providers."""
    
    def __init__(self, api_key: str, model: str, temperature: float, max_tokens: int, timeout: float):
        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.timeout = timeout
    
    @abstractmethod
    def generate_json(self, prompt: str, system_message: Optional[str] = None) -> Dict[str, Any]:
        """Generate structured JSON response synchronously."""
        pass
    
    @abstractmethod
    async def generate_json_async(self, prompt: str, system_message: Optional[str] = None) -> Dict[str, Any]:
        """Generate structured JSON response asynchronously."""
        pass
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the provider name."""
        pass


class OpenAIProvider(BaseLLMProvider):
    """OpenAI LLM provider implementation."""
    
    def __init__(self, api_key: str, model: str, temperature: float, max_tokens: int, timeout: float):
        super().__init__(api_key, model, temperature, max_tokens, timeout)
        from langchain_openai import ChatOpenAI
        from langchain_core.output_parsers import JsonOutputParser
        from langchain_core.prompts import ChatPromptTemplate
        
        self._llm = ChatOpenAI(
            model=self.model,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            api_key=self.api_key,
            timeout=self.timeout
        )
        self._parser = JsonOutputParser()
        self._prompt_template = ChatPromptTemplate
        
        logger.info(f"OpenAI provider initialized with model: {self.model}")
    
    @property
    def provider_name(self) -> str:
        return "openai"
    
    def generate_json(self, prompt: str, system_message: Optional[str] = None) -> Dict[str, Any]:
        """Generate structured JSON response from OpenAI."""
        default_system = (
            "You are a resume analysis specialist that extracts structured information "
            "from resumes and returns it as valid JSON. Only respond with valid JSON, "
            "no explanations or extra text."
        )
        
        prompt_template = self._prompt_template.from_messages([
            ("system", system_message or default_system),
            ("user", "{input}")
        ])
        
        # Add RunnableLambda to strip markdown code blocks
        from langchain_core.runnables import RunnableLambda
        
        clean_json = RunnableLambda(lambda x: x.content.replace("```json", "").replace("```", "").strip())
        
        chain = prompt_template | self._llm | clean_json | self._parser
        result = chain.invoke({"input": prompt})
        
        if not isinstance(result, dict):
            raise ValueError("Response is not a valid JSON object")
        
        return result
    
    async def generate_json_async(self, prompt: str, system_message: Optional[str] = None) -> Dict[str, Any]:
        """Generate structured JSON response from OpenAI asynchronously."""
        default_system = (
            "You are a resume analysis specialist that extracts structured information "
            "from resumes and returns it as valid JSON. Only respond with valid JSON, "
            "no explanations or extra text."
        )
        
        prompt_template = self._prompt_template.from_messages([
            ("system", system_message or default_system),
            ("user", "{input}")
        ])
        
        # Add RunnableLambda to strip markdown code blocks
        from langchain_core.runnables import RunnableLambda
        
        clean_json = RunnableLambda(lambda x: x.content.replace("```json", "").replace("```", "").strip())
        
        chain = prompt_template | self._llm | clean_json | self._parser
        result = await chain.ainvoke({"input": prompt})
        
        if not isinstance(result, dict):
            raise ValueError("Response is not a valid JSON object")
        
        return result


class GeminiProvider(BaseLLMProvider):
    """Google Gemini LLM provider implementation."""
    
    def __init__(self, api_key: str, model: str, temperature: float, max_tokens: int, timeout: float):
        super().__init__(api_key, model, temperature, max_tokens, timeout)
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.output_parsers import JsonOutputParser
        from langchain_core.prompts import ChatPromptTemplate
        
        # Map common model names to Gemini models
        gemini_model = self._map_to_gemini_model(model)
        
        self._llm = ChatGoogleGenerativeAI(
            model=gemini_model,
            temperature=self.temperature,
            max_output_tokens=self.max_tokens,
            google_api_key=self.api_key,
            timeout=self.timeout
        )
        self._parser = JsonOutputParser()
        self._prompt_template = ChatPromptTemplate
        
        logger.info(f"Gemini provider initialized with model: {gemini_model}")
    
    def _map_to_gemini_model(self, model: str) -> str:
        """Map generic model names to Gemini-specific models."""
        model_mapping = {
            "gpt-4o": "gemini-1.5-pro",
            "gpt-4": "gemini-1.5-pro",
            "gpt-3.5-turbo": "gemini-1.5-flash",
            "gemini-pro": "gemini-1.5-pro",
            "gemini-flash": "gemini-1.5-flash"
        }
        return model_mapping.get(model, model)
    
    @property
    def provider_name(self) -> str:
        return "gemini"
    
    def generate_json(self, prompt: str, system_message: Optional[str] = None) -> Dict[str, Any]:
        """Generate structured JSON response from Gemini."""
        default_system = (
            "You are a resume analysis specialist that extracts structured information "
            "from resumes and returns it as valid JSON. Only respond with valid JSON, "
            "no explanations or extra text."
        )
        
        prompt_template = self._prompt_template.from_messages([
            ("system", system_message or default_system),
            ("user", "{input}")
        ])
        
        # Add RunnableLambda to strip markdown code blocks
        from langchain_core.runnables import RunnableLambda
        
        clean_json = RunnableLambda(lambda x: x.content.replace("```json", "").replace("```", "").strip())
        
        chain = prompt_template | self._llm | clean_json | self._parser
        result = chain.invoke({"input": prompt})
        
        if not isinstance(result, dict):
            raise ValueError("Response is not a valid JSON object")
        
        return result
    
    async def generate_json_async(self, prompt: str, system_message: Optional[str] = None) -> Dict[str, Any]:
        """Generate structured JSON response from Gemini asynchronously."""
        default_system = (
            "You are a resume analysis specialist that extracts structured information "
            "from resumes and returns it as valid JSON. Only respond with valid JSON, "
            "no explanations or extra text."
        )
        
        prompt_template = self._prompt_template.from_messages([
            ("system", system_message or default_system),
            ("user", "{input}")
        ])
        
        # Add RunnableLambda to strip markdown code blocks
        from langchain_core.runnables import RunnableLambda
        
        clean_json = RunnableLambda(lambda x: x.content.replace("```json", "").replace("```", "").strip())
        
        chain = prompt_template | self._llm | clean_json | self._parser
        result = await chain.ainvoke({"input": prompt})
        
        if not isinstance(result, dict):
            raise ValueError("Response is not a valid JSON object")
        
        return result


class GroqProvider(BaseLLMProvider):
    """Groq LLM provider implementation."""
    
    def __init__(self, api_key: str, model: str, temperature: float, max_tokens: int, timeout: float):
        super().__init__(api_key, model, temperature, max_tokens, timeout)
        from langchain_groq import ChatGroq
        from langchain_core.output_parsers import JsonOutputParser
        from langchain_core.prompts import ChatPromptTemplate
        
        # Map to Groq models
        groq_model = self._map_to_groq_model(model)
        
        self._llm = ChatGroq(
            model=groq_model,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            groq_api_key=self.api_key,
            timeout=self.timeout
        )
        self._parser = JsonOutputParser()
        self._prompt_template = ChatPromptTemplate
        
        logger.info(f"Groq provider initialized with model: {groq_model}")
    
    def _map_to_groq_model(self, model: str) -> str:
        """Map generic model names to Groq-specific models."""
        model_mapping = {
            "gpt-4o": "llama-3.3-70b-versatile",
            "gpt-4": "llama-3.3-70b-versatile",
            "gpt-3.5-turbo": "llama-3.1-8b-instant"
        }
        return model_mapping.get(model, model)
    
    @property
    def provider_name(self) -> str:
        return "groq"
    
    def generate_json(self, prompt: str, system_message: Optional[str] = None) -> Dict[str, Any]:
        """Generate structured JSON response from Groq."""
        default_system = (
            "You are a resume analysis specialist that extracts structured information "
            "from resumes and returns it as valid JSON. Only respond with valid JSON, "
            "no explanations or extra text."
        )
        
        prompt_template = self._prompt_template.from_messages([
            ("system", system_message or default_system),
            ("user", "{input}")
        ])
        
        # Add RunnableLambda to strip markdown code blocks
        from langchain_core.runnables import RunnableLambda
        
        clean_json = RunnableLambda(lambda x: x.content.replace("```json", "").replace("```", "").strip())
        
        chain = prompt_template | self._llm | clean_json | self._parser
        result = chain.invoke({"input": prompt})
        
        if not isinstance(result, dict):
            raise ValueError("Response is not a valid JSON object")
        
        return result
    
    async def generate_json_async(self, prompt: str, system_message: Optional[str] = None) -> Dict[str, Any]:
        """Generate structured JSON response from Groq asynchronously."""
        default_system = (
            "You are a resume analysis specialist that extracts structured information "
            "from resumes and returns it as valid JSON. Only respond with valid JSON, "
            "no explanations or extra text."
        )
        
        prompt_template = self._prompt_template.from_messages([
            ("system", system_message or default_system),
            ("user", "{input}")
        ])
        
        # Add RunnableLambda to strip markdown code blocks
        from langchain_core.runnables import RunnableLambda
        
        clean_json = RunnableLambda(lambda x: x.content.replace("```json", "").replace("```", "").strip())
        
        chain = prompt_template | self._llm | clean_json | self._parser
        result = await chain.ainvoke({"input": prompt})
        
        if not isinstance(result, dict):
            raise ValueError("Response is not a valid JSON object")
        
        return result
