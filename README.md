# Intrvu - AI-Powered Resume Fit Analyzer

![Version](https://img.shields.io/badge/version-0.0.7-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Chrome%20Extension-orange)

> Optimize your resume for any job posting with AI-powered analysis

**Intrvu** is an intelligent Chrome extension that helps job seekers maximize their chances of landing interviews by analyzing how well their resume matches job descriptions on LinkedIn. Get instant feedback across 8 key dimensions and actionable recommendations to improve your resume.

## 🌟 Key Features

- ⚡ **Instant AI Analysis** - Upload your resume and get detailed matching scores in seconds
- 🎯 **8-Dimension Scoring** - Comprehensive evaluation across experience, skills, education, ATS compatibility, and more
- 🔍 **LinkedIn Integration** - Automatically extracts job details from LinkedIn job postings
- 📊 **Visual Feedback** - Color-coded scores and detailed breakdowns
- 🚀 **Production-Ready Backend** - FastAPI backend with Redis caching and resilient architecture
- 🔒 **Privacy-First** - Your resume data is processed securely and not stored

## 📦 Project Structure

This repository contains two main components:

```
Intrvu/
├── frontend/          # Chrome extension (React + TypeScript)
│   ├── src/
│   ├── public/
│   ├── manifest.json
│   └── README.md     → Frontend documentation
│
├── backend/           # FastAPI server (Python)
│   ├── api/
│   ├── app/
│   ├── routers/
│   ├── render.yaml
│   └── README.md     → Backend documentation
│
├── README.md         → This file (main documentation)
└── LICENSE
```

## 🚀 Quick Start

### For Users

1. **Install the Extension** (when published):
   - Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/intrvu-resume-fit-analyze/mmobebjanimgfmpbiclpcnedhahngleb)
   - Click "Add to Chrome"

2. **Use on LinkedIn**:
   - Navigate to any LinkedIn job posting
   - Click the Intrvu extension icon
   - Upload your resume PDF
   - Get instant analysis!

### For Developers

See component-specific documentation:
- **Frontend Setup**: [frontend/README.md](frontend/README.md)
- **Backend Setup**: [backend/README.md](backend/README.md)

## 🏗️ Architecture Overview

### Frontend - Chrome Extension
- **Tech Stack**: React 18, TypeScript, Vite, TailwindCSS
- **Components**: Content script, background worker, side panel UI
- **Features**: Auto job detection, drag-drop upload, real-time results

### Backend - FastAPI API
- **Tech Stack**: Python 3.11, FastAPI, Redis, LangChain
- **Services**: PDF processing, LLM analysis (Groq/OpenAI/Gemini), caching
- **Features**: Rate limiting, circuit breaker, health monitoring

### Communication Flow

```
LinkedIn Job Page
      ↓
Chrome Extension (Frontend)
      ↓
FastAPI Backend (API)
      ↓
LLM Service (Groq/OpenAI/Gemini)
      ↓
Analysis Results
```

## 💡 How It Works

1. **Job Detection**: Content script automatically extracts job title, company, and description from LinkedIn
2. **Resume Upload**: User uploads PDF resume via side panel
3. **Backend Processing**:
   - Extracts text from PDF
   - Extracts resume components using LLM
   - Analyzes resume against job requirements
   - Calculates 8-dimension scores
4. **Results Display**: Detailed analysis shown in organized sections with actionable feedback

## 📊 Scoring Dimensions

| Dimension | What It Measures |
|-----------|------------------|
| **Overall Match** | Aggregate compatibility score |
| **Experience** | Years and relevance of work history |
| **Skills** | Technical and soft skills alignment |
| **Education** | Degree and institution fit |
| **Structure** | Resume formatting and organization |
| **ATS Compatibility** | Applicant Tracking System readability |
| **Keyword Optimization** | Job-specific keyword usage |
| **Achievements** | Impact and quantification of accomplishments |

Each dimension provides:
- Numerical score (0-100)
- Match level (Strong/Good/Fair/Poor/Critical)
- Specific feedback and recommendations

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- Redis (for backend)
- Chrome browser

### Frontend Development

```bash
cd frontend
npm install
npm run build
# Load unpacked extension from dist/ folder
```

See [frontend/README.md](frontend/README.md) for detailed instructions.

### Backend Development

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Configure .env
copy .env.example .env
# Add your GROQ_API_KEY

python server.py
```

See [backend/README.md](backend/README.md) for detailed instructions.

## 🌐 Deployment

### Frontend (Chrome Extension)

Build and package:
```bash
cd frontend
npm run build
# Upload dist/ folder to Chrome Web Store
```

### Backend (Render)

The backend is configured for one-click deployment to Render:

```bash
# Push to GitHub
git push origin main

# Deploy on Render
# 1. Create account at render.com
# 2. New → Blueprint
# 3. Select repository
# 4. Render auto-detects render.yaml
# 5. Add GROQ_API_KEY environment variable
```

See [backend/README.md](backend/README.md) for detailed deployment instructions.

## 📚 Documentation

- **[Frontend Documentation](frontend/README.md)** - Chrome extension setup, architecture, development
- **[Backend Documentation](backend/README.md)** - API reference, deployment, configuration
- **[Frontend Integration Guide](backend/FRONTEND_INTEGRATION_V4.md)** - V4 API integration details
- **[Multi-Provider Guide](backend/MULTI_PROVIDER_GUIDE.md)** - LLM provider configuration

## 🔒 Privacy & Security

- Resume data is processed in real-time and **not stored** on servers
- All API communication uses HTTPS in production
- Input sanitization and validation on all endpoints
- Rate limiting to prevent abuse
- Optional API key authentication

For details, see our [Privacy Policy](https://bhavik2209.github.io/Intrvu/).

## 🐛 Known Issues & Limitations

- **Backend Cold Start**: First request may take 30-60s on free tier (Render spins down after 15 min)
- **PDF Size Limit**: Maximum 10MB per resume
- **LinkedIn Changes**: Job extraction may break if LinkedIn updates their page structure
- **Rate Limits**: 10 requests/minute, 50 requests/hour per IP

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- Code follows existing style
- All tests pass
- Documentation is updated
- Chrome extension tested on LinkedIn

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Support & Contact

- **Email**: [getintrvu@gmail.com](mailto:getintrvu@gmail.com)
- **Issues**: [GitHub Issues](https://github.com/Bhavik2209/Intrvu/issues)
- **Chrome Web Store**: [Intrvu Extension](https://chromewebstore.google.com/detail/intrvu-resume-fit-analyze/mmobebjanimgfmpbiclpcnedhahngleb)

## 🙏 Acknowledgments

- Backend powered by [FastAPI](https://fastapi.tiangolo.com/)
- Frontend built with [React](https://react.dev/) and [Vite](https://vitejs.dev/)
- AI analysis using [LangChain](https://www.langchain.com/) and [Groq](https://groq.com/)
- Styling with [TailwindCSS](https://tailwindcss.com/)

---

**Made with ❤️ for job seekers everywhere**

[⬆ Back to Top](#intrvu---ai-powered-resume-fit-analyzer)
