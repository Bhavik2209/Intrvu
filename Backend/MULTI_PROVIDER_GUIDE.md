# Multi-Provider LLM Support Guide

## Overview

The backend now supports multiple LLM providers: **OpenAI**, **Gemini**, and **Groq**. You can switch between providers by simply changing environment variables - no code changes required!

## Configuration

### Environment Variables (.env)

```env
# LLM Provider Selection
LLM_PROVIDER=openai  # Options: openai, gemini, groq

# API Keys (add the one you want to use)
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=your-gemini-api-key-here
GROQ_API_KEY=your-groq-api-key-here

# Model Settings
LLM_MODEL=gpt-4o
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=8000
LLM_TIMEOUT=30.0
```

## Switching Providers

### Option 1: Use OpenAI (Default)

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...
LLM_MODEL=gpt-4o
```

### Option 2: Use Google Gemini

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
LLM_MODEL=gemini-1.5-pro  # or gemini-1.5-flash
```

**Model Mapping:**
- `gpt-4o` → `gemini-1.5-pro` (automatically mapped)
- `gpt-4` → `gemini-1.5-pro`
- `gpt-3.5-turbo` → `gemini-1.5-flash`

### Option 3: Use Groq

```env
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
LLM_MODEL=llama-3.3-70b-versatile
```

**Model Mapping:**
- `gpt-4o` → `llama-3.3-70b-versatile` (automatically mapped)
- `gpt-4` → `llama-3.3-70b-versatile`
- `gpt-3.5-turbo` → `llama-3.1-8b-instant`

## How It Works

1. **Provider Factory**: The system automatically creates the correct provider based on `LLM_PROVIDER`
2. **Unified Interface**: All providers implement the same interface, so your code doesn't change
3. **Automatic Model Mapping**: Generic model names (like `gpt-4o`) are automatically mapped to provider-specific models
4. **Validation**: The system validates that the required API key is present for the selected provider

## Installation Requirements

### For OpenAI (Default)
```bash
pip install langchain-openai
```

### For Gemini
```bash
pip install langchain-google-genai
```

### For Groq
```bash
pip install langchain-groq
```

## Example Usage

### Switching to Gemini

1. Get your Gemini API key from: https://makersuite.google.com/app/apikey

2. Update `.env`:
   ```env
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=AIzaSy...
   LLM_MODEL=gemini-1.5-pro
   ```

3. Restart the backend:
   ```bash
   python api/main.py
   ```

4. Check logs for confirmation:
   ```
   LLM service initialized with gemini provider (model: gemini-1.5-pro)
   ```

### Switching to Groq

1. Get your Groq API key from: https://console.groq.com/

2. Update `.env`:
   ```env
   LLM_PROVIDER=groq
   GROQ_API_KEY=gsk_...
   LLM_MODEL=llama-3.3-70b-versatile
   ```

3. Restart the backend

## Troubleshooting

### Error: "OPENAI_API_KEY is required when LLM_PROVIDER=openai"
**Solution:** Add your OpenAI API key to `.env`

### Error: "GEMINI_API_KEY is required when LLM_PROVIDER=gemini"
**Solution:** Add your Gemini API key to `.env`

### Error: "Unsupported LLM provider: xyz"
**Solution:** Use one of: `openai`, `gemini`, or `groq`

### Provider not switching
**Solution:** Restart the backend server after changing `.env`

## Architecture

```
┌─────────────────────────────────────┐
│         LLM Service                 │
│  (Singleton, Provider Factory)      │
└──────────────┬──────────────────────┘
               │
               ├─── OpenAI Provider
               ├─── Gemini Provider
               └─── Groq Provider
                    (All implement BaseLLMProvider)
```

## Benefits

✅ **No Code Changes**: Switch providers by changing env vars only  
✅ **Unified Interface**: Same API regardless of provider  
✅ **Automatic Mapping**: Model names automatically converted  
✅ **Easy Testing**: Test different providers without code changes  
✅ **Cost Optimization**: Use cheaper providers for testing  
✅ **Fallback Options**: Switch if one provider is down  

## Notes

- All providers support both sync and async operations
- Caching works the same across all providers
- Circuit breaker and retry logic apply to all providers
- Response format is identical regardless of provider
