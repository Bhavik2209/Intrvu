# IntrvuFit - Frontend Chrome Extension

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwindcss&logoColor=white)

A Chrome extension that helps job seekers optimize their resumes by analyzing them against LinkedIn job postings using AI-powered analysis.

## 🎯 Overview

**IntrvuFit** automatically detects job postings on LinkedIn and provides a side panel where users can upload their resume for instant AI analysis. The extension evaluates resume fit across 8 key dimensions and provides actionable recommendations.

## ✨ Features

- **Auto Job Detection** - Automatically extracts job details from LinkedIn job pages
- **Side Panel UI** - Non-intrusive side panel for seamless analysis
- **PDF Upload** - Drag-and-drop or click-to-upload resume support
- **Real-time Analysis** - Instant AI-powered resume scoring
- **8-Dimension Scoring**:
  - Overall Match Score
  - Experience Analysis
  - Skills Assessment
  - Education Fit
  - Structure Quality
  - ATS Compatibility
  - Keyword Optimization
  - Achievement Impact
- **Visual Feedback** - Color-coded scores and detailed breakdowns
- **Responsive Design** - Works on all screen sizes

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Chrome browser

### Installation for Development

1. **Clone and Navigate:**

```bash
cd frontend
```

2. **Install Dependencies:**

```bash
npm install
```

3. **Configure Backend URL:**

Edit `.env.production` or create `.env.local`:

```bash
VITE_API_URL=http://localhost:8000
# Or production backend: https://intrvu-backend.onrender.com
```

4. **Build the Extension:**

```bash
npm run build
```

This will:
- Build React app with Vite
- Copy manifest and scripts to `dist/`
- Create production-ready extension in `dist/` folder

5. **Load in Chrome:**

- Open Chrome and go to `chrome://extensions/`
- Enable **Developer mode** (top-right toggle)
- Click **Load unpacked**
- Select the `dist/` folder

### Development Mode

For live development with hot reload:

```bash
npm run dev
```

Then rebuild extension whenever you make changes:
```bash
npm run build
```

## 📁 Project Structure

```
frontend/
├── public/
│   ├── background.js           # Service worker for Chrome extension
│   ├── content-script.js       # LinkedIn job extraction logic
│   ├── side-panel-injector.js  # Injects side panel into pages
│   └── side-panel.css          # Side panel styling
├── src/
│   ├── components/
│   │   ├── sections/           # Analysis result sections
│   │   │   ├── StartSection.tsx
│   │   │   ├── SkillsSection.tsx
│   │   │   ├── ExperienceSection.tsx
│   │   │   └── ...
│   │   ├── StatusBadges.tsx    # Score badges
│   │   └── FileUpload.tsx      # Resume upload UI
│   ├── types/
│   │   └── AnalysisData.ts     # TypeScript interfaces
│   ├── App.tsx                 # Main application component
│   └── main.tsx                # React entry point
├── dist/                       # Built extension (generated)
├── manifest.json               # Chrome extension manifest
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🔌 Chrome Extension Architecture

### Components

1. **Background Service Worker** (`background.js`)
   - Manages extension lifecycle
   - Handles side panel toggle
   - Message routing between components

2. **Content Script** (`content-script.js`)
   - Detects LinkedIn job pages
   - Extracts job title, company, description
   - Monitors URL changes for SPA navigation
   - Sends job data to side panel

3. **Side Panel** (`index.html` + React app)
   - Main UI rendered in iframe
   - File upload handling
   - API communication
   - Results display

4. **Side Panel Injector** (`side-panel-injector.js`)
   - Injects side panel iframe into pages
   - Manages panel visibility and positioning
   - Handles resize functionality

### Communication Flow

```
LinkedIn Page → Content Script → Background Worker → Side Panel → Backend API
                     ↓                                    ↓
              Extracts Job Data                    Analyzes Resume
```

## 🎨 UI Components

### Section Components

| Component | Purpose |
|-----------|---------|
| `StartSection` | Initial state, job info display |
| `SkillsSection` | Matched/missing skills breakdown |
| `ExperienceSection` | Years of experience analysis |
| `EducationSection` | Education fit assessment |
| `StructureSection` | Resume formatting quality |
| `ATSSection` | ATS compatibility score |
| `KeywordSection` | Keyword optimization analysis |
| `AchievementsSection` | Achievement impact evaluation |
| `BulletEffectivenessSection` | Bullet point quality check |

### Shared Components

- **StatusBadges** - Color-coded score display (Strong/Good/Fair/Poor/Critical)
- **FileUpload** - Drag-and-drop PDF upload with validation
- **ResultsView** - Overall results container with scroll management

## 🔧 Configuration

### Environment Variables

```bash
# Backend API URL
VITE_API_URL=https://intrvu-backend.onrender.com

# Optional: Enable debug mode
VITE_DEBUG=true
```

### Manifest Configuration

Key settings in `manifest.json`:

```json
{
  "name": "IntrvuFit - Resume optimizer",
  "version": "0.0.7",
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": [
    "https://www.linkedin.com/*",
    "http://localhost:8000/*"
  ]
}
```

## 🛠 Development

### Build Commands

```bash
# Development server (for testing components)
npm run dev

# Production build
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Testing on LinkedIn

1. Build the extension: `npm run build`
2. Load unpacked extension from `dist/` folder
3. Navigate to any LinkedIn job posting
4. Extension icon should be active
5. Click icon to toggle side panel
6. Upload resume and click "Analyze"

### Debugging

**Content Script Issues:**
```javascript
// Check console on LinkedIn page
// Look for: "Job data detected: {title, company, description}"
```

**Background Worker Issues:**
```javascript
// Go to chrome://extensions/
// Click "Inspect views: service worker"
```

**Side Panel Issues:**
```javascript
// Right-click side panel → Inspect
// Check React DevTools
```

## 📦 Building for Distribution

### Create Production Build

```bash
npm run build
```

### Create ZIP for Chrome Web Store

```bash
# Windows PowerShell
Compress-Archive -Path dist\* -DestinationPath IntrvuFit_v0.0.7.zip

# Linux/Mac
cd dist && zip -r ../IntrvuFit_v0.0.7.zip * && cd ..
```

### Chrome Web Store Submission

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Upload ZIP file
3. Fill in store listing details
4. Submit for review

## 🔗 API Integration

The extension communicates with the backend API:

```typescript
// Example API call
const formData = new FormData();
formData.append('resume', pdfFile);
formData.append('jobData', JSON.stringify({
  jobTitle: "Software Engineer",
  company: "Tech Corp",
  description: jobDescription
}));

const response = await fetch(`${API_URL}/api/analyze`, {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

See [Backend Documentation](../backend/README.md) for complete API reference.

## 🎯 User Flow

1. User navigates to LinkedIn job posting
2. Extension detects job and shows icon badge
3. User clicks extension icon to open side panel
4. Job details auto-populate in the panel
5. User uploads resume PDF (drag-drop or click)
6. User clicks "Analyze Job Match"
7. Extension sends resume + job data to backend
8. Results display in organized sections with scores
9. User can scroll through detailed feedback

## 🐛 Known Issues

- First analysis may take 30-60s if backend is on free tier (cold start)
- Very large PDFs (>10MB) may fail - size limit enforced
- LinkedIn page structure changes may break job extraction

## 📚 Additional Documentation

- [Backend API Documentation](../backend/README.md)
- [Testing Instructions](TESTING_INSTRUCTIONS.md)
- [Job Extraction Fixes](JOB_EXTRACTION_FIXES.md)
- [React Implementation](REACT_IMPLEMENTATION_COMPLETE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on LinkedIn
5. Submit a pull request

## 📄 License

See [LICENSE](../LICENSE) file in root directory.

---

**Part of the Intrvu project** | [Main Documentation](../README.md) | [Backend →](../backend/README.md)
