# Intrvu - Resume Fit Analyzer

[Link to Intrvu - Resume Fit Analyzer](https://chromewebstore.google.com/detail/intrvu-resume-fit-analyze/mmobebjanimgfmpbiclpcnedhahngleb) <!-- Replace with actual link when available -->

## Overview
Intrvu - Resume Fit Analyzer is a Chrome extension designed to help users analyze how well their resumes match job descriptions on LinkedIn job pages. By leveraging AI and machine learning, the extension provides detailed insights and scoring to improve resume effectiveness.

## Features
- Extracts job descriptions from LinkedIn job pages.
- Analyzes resumes against job descriptions using a comprehensive scoring system.
- Provides actionable feedback to enhance resume quality.

## Scoring System
The scoring system evaluates resumes based on several criteria, including keyword match, job experience alignment, skills and certifications, and more. For detailed information, please refer to the `scoring_system.docx` file included in the project.

## Installation

### Prerequisites
- Google Chrome
- Python 3.x (for backend development)

### Frontend Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd frontend
   ```
2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable "Developer mode" in the top right corner.
   - Click "Load unpacked" and select the `frontend` directory.

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```

## Usage
1. Open a LinkedIn job posting in your browser.
2. Click the Intrvu extension icon to open the popup.
3. Upload your resume in PDF format.
4. Click "Analyze Job Match" to receive detailed feedback.

## Privacy Policy
For more information on how we handle your data, please visit our [Privacy Policy](https://bhavik2209.github.io/Intrvu/). 

## License
This project is licensed under the MIT License.

## Contact
For questions or support, please contact [getintrvu@gmail.com](mailto:support@intrvu.com).
