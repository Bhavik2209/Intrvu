# Intrvu Backend - AI-Powered Resume Analysis API

![FastAPI](https://img.shields.io/badge/FastAPI-0.109.2-009688?logo=fastapi) 
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Caching-DC382D?logo=redis&logoColor=white)
![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=white)

A production-ready FastAPI backend that analyzes resumes against job descriptions using AI, providing detailed matching scores, skill assessments, and actionable feedback.

## 🚀 Features

- **AI-Powered Analysis** - Uses LLM (OpenAI/Groq/Gemini) to intelligently match resumes to job requirements
- **V4 Scoring System** - Advanced scoring across 8 key dimensions
- **PDF Processing** - Secure extraction and validation of resume content
- **Job Description Filtering** - Smart extraction of core job postings from messy text
- **Upstash Redis Caching** - Optimized for Vercel/Serverless with REST API support
- **Rate Limiting** - Built-in protection against abuse (10/min, 50/hour)
- **Circuit Breaker** - Resilient error handling for external API failures
- **Health Monitoring** - Health check endpoints for deployment monitoring
- **Security** - Input sanitization, authentication, request timeouts
- **Docker Support** - Containerized deployment ready

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [API Endpoints](#-api-endpoints)
- [Environment Configuration](#-environment-configuration)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Development](#-development)

## ⚡ Quick Start

### Prerequisites

- Python 3.11+
- Redis (Cloud-based Upstash recommended for Vercel/Production)
- Groq/OpenAI/Gemini API key

### 1. Clone and Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy example environment file
copy .env.example .env

# Edit .env and add your API keys
GROQ_API_KEY=your_actual_groq_api_key_here
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

### 4. Run Redis (Optional for Local Dev)

```bash
# Using Docker (Standard TCP Redis)
docker run -d -p 6379:6379 redis:alpine

# Using Upstash (Recommended for Cloud/Vercel)
# Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env
```

### 5. Start the Server

```bash
python server.py
```

Server will be available at: `http://localhost:8000`

### 6. Test the API

```bash
# Health check
curl http://localhost:8000/health

# Ping
curl http://localhost:8000/ping
```

## 📡 API Endpoints

### **POST /api/analyze**

Analyze a resume against a job description.

**Request:**
- `resume`: PDF file (multipart/form-data)
- `jobData`: JSON string with job details

**Example:**

```javascript
const formData = new FormData();
formData.append('resume', pdfFile);
formData.append('jobData', JSON.stringify({
  jobTitle: "Software Engineer",
  company: "Tech Corp",
  description: "Looking for a skilled developer..."
}));

const response = await fetch('http://localhost:8000/api/analyze', {
  method: 'POST',
  body: formData
});
```

**Response Structure:**

```json
{
  "job_context": {
    "title": "Software Engineer",
    "company": "Tech Corp",
    "description_length": 1250
  },
  "analysis": {
    "overall_score": 78,
    "overall_match_level": "Strong Match",
    "experience": { "score": 85, "level": "Strong Match", ... },
    "skills": { "score": 72, "missing_skills": [...], ... },
    "education": { ... },
    "structure": { ... },
    "ats_compatibility": { ... },
    "keyword_optimization": { ... },
    "achievements": { ... },
    "bullet_effectiveness": { ... }
  },
  "process_time_seconds": 3.42
}
```

### **POST /api/filter-job-description**

Filter and clean job description text using AI.

**Request:**

```json
{
  "text": "Raw job posting with navigation and ads..."
}
```

**Response:**

```json
{
  "filtered_text": "Clean job description...",
  "original_length": 5420,
  "filtered_length": 1250,
  "reduction_percent": 76.9
}
```

### **GET /health**

Comprehensive health check with Redis status.

```json
{
  "status": "healthy",
  "checks": {
    "redis": "healthy"
  },
  "version": "1.0.0"
}
```

### **GET /ping**

Simple liveness check.

```json
{
  "status": "ok",
  "message": "pong"
}
```

## 🔧 Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GROQ_API_KEY` | Groq API key (required) | `gsk_...` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8000` | Server port |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins (comma-separated) |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection string (Standard TCP) |
| `UPSTASH_REDIS_REST_URL` | - | Upstash REST URL (for Serverless) |
| `UPSTASH_REDIS_REST_TOKEN` | - | Upstash REST Token (for Serverless) |
| `REQUEST_TIMEOUT` | `120` | Request timeout in seconds |
| `REQUIRE_AUTH` | `false` | Enable API key authentication |
| `VALID_API_KEYS` | - | Valid API keys (comma-separated) |
| `MAX_FILE_SIZE_MB` | `10` | Max PDF upload size |
| `LLM_PROVIDER` | `groq` | LLM provider: `openai`, `gemini`, or `groq` |

See [`.env.example`](file:///d:/Intrvu/Intrvu/backend/.env.example) for complete configuration options.

### Multi-Provider Support

This backend supports multiple LLM providers. See [`MULTI_PROVIDER_GUIDE.md`](file:///d:/Intrvu/Intrvu/backend/MULTI_PROVIDER_GUIDE.md) for detailed instructions.

## 🌐 Deployment

### Deploy to Render

This backend is optimized for [Render](https://render.com) deployment with built-in Redis support.

1. **Push to GitHub:**

```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

2. **Deploy via Blueprint:**
   - Go to [render.com](https://render.com) and sign up
   - Click **New +** → **Blueprint**
   - Select your repository
   - Render will auto-detect `render.yaml` and create:
     - Web service (FastAPI app)
     - Redis instance (automatically linked)

3. **Set Environment Variables in Render Dashboard:**
   - `GROQ_API_KEY` - Your Groq API key (required)
   - `ALLOWED_ORIGINS` - Your frontend URL for CORS

4. **Access Your API:**
   - Render provides a URL like: `https://intrvu-backend.onrender.com`
   - Test: `https://intrvu-backend.onrender.com/health`

**Note**: Free tier spins down after 15 minutes of inactivity. First request after spin-down may take 30-60 seconds.

```bash
docker-compose up -d
```

### Deploy to Vercel

1. **Connect Repository**: Link your GitHub repo to Vercel.
2. **Environment Variables**: Add your API keys and Upstash credentials (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
3. **Deploy**: Vercel will use `vercel.json` and `api/main.py`.

## 📁 Project Structure

```
backend/
├── api/
│   └── main.py              # FastAPI application entry point
├── app/
│   ├── cache/               # Redis caching implementation
│   ├── core/                # Configuration, exceptions, logging
│   ├── middleware/          # Rate limiting, auth, timeouts
│   ├── prompts/             # LLM prompt templates
│   ├── resilience/          # Circuit breaker, retry logic
│   ├── resume_structure_analysis/  # V4 analysis engine
│   ├── services/            # LLM providers, external services
│   └── utils/               # Helpers (PDF extraction, sanitization)
├── routers/
│   └── analyze.py           # API route handlers
├── schemas/
│   └── analyze.py           # Pydantic models for request/response
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── Dockerfile               # Docker container definition
├── docker-compose.yml       # Multi-container setup
├── render.yaml              # Render deployment config
├── requirements.txt         # Python dependencies
└── server.py                # Production server with workers
```

## 🛠 Development

### Running Tests

```bash
# Install dev dependencies
pip install pytest pytest-cov

# Run tests
pytest

# With coverage
pytest --cov=app tests/
```

### Code Quality

```bash
# Format code
black .

# Lint
flake8 app/ routers/

# Type checking
mypy app/
```

### Local Development with Hot Reload

```bash
uvicorn api.main:app --reload
```

### Debugging

Set `DEBUG=true` in `.env` for detailed logging:

```bash
DEBUG=true
LOG_LEVEL=DEBUG
```

## 🔒 Security Features

- **Input Sanitization** - All user inputs sanitized using `bleach`
- **PDF Validation** - Magic byte verification, size limits
- **Rate Limiting** - SlowAPI protection (10/min, 50/hour per IP)
- **Request Timeouts** - Configurable timeout middleware
- **Circuit Breaker** - Auto-recovery from API failures
- **Optional Authentication** - API key verification
- **CORS Configuration** - Controlled origin access

## 📊 Monitoring & Observability

### Health Checks

- **Liveness**: `GET /ping` - Basic server health
- **Readiness**: `GET /health` - Includes Redis connectivity check

### Logging

Structured logging to stdout for cloud platform integration:

```python
logger.info("Request processed", extra={
    "process_time": 3.42,
    "endpoint": "/api/analyze"
})
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Additional Documentation

- [Frontend Integration Guide](file:///d:/Intrvu/Intrvu/backend/FRONTEND_INTEGRATION_V4.md) - V4 API integration details
- [Multi-Provider Guide](file:///d:/Intrvu/Intrvu/backend/MULTI_PROVIDER_GUIDE.md) - Switch between OpenAI/Groq/Gemini

## 📄 License

This project is proprietary and confidential.

## 🙋 Support

For issues or questions, please open an issue in the repository.

---

**Built with ❤️ using FastAPI, Redis, and AI**
