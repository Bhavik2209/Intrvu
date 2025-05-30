import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FeedbackLink from './components/FeedbackLink';
import FileUpload from './components/FileUpload';
import SubmitSection from './components/SubmitSection';
import AnalysisDisplay from './components/AnalysisDisplay';
import Footer from './components/Footer';

// Helper function (can be moved to a util file later)
async function storeResumeInStorage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            localStorage.setItem('storedResume', e.target.result);
            localStorage.setItem('storedResumeName', file.name);
            resolve();
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function getResumeFromStorage() {
    const storedResume = localStorage.getItem('storedResume');
    const storedResumeName = localStorage.getItem('storedResumeName');
    if (storedResume && storedResumeName) {
        const byteCharacters = atob(storedResume.split(',')[1]);
        const byteArrays = [];
        for (let i = 0; i < byteCharacters.length; i++) {
            byteArrays.push(byteCharacters.charCodeAt(i));
        }
        const byteArray = new Uint8Array(byteArrays);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        return new File([blob], storedResumeName, { type: 'application/pdf' });
    }
    return null;
}

function clearStoredResume() {
    localStorage.removeItem('storedResume');
    localStorage.removeItem('storedResumeName');
}

// This function will be injected into the target page, so it doesn't use React.
function extractJobDescriptionForInjection() {
    // Check if we're on LinkedIn
    if (window.location.hostname.includes('linkedin.com')) {
        // LinkedIn specific selectors
        const jobTitle = document.querySelector('.top-card-layout__title, .job-details-jobs-unified-top-card__job-title')?.textContent?.trim() || '';
        const company = document.querySelector('.top-card-layout__second-subline span:nth-child(1), .job-details-jobs-unified-top-card__company-name')?.textContent?.trim() || '';
        const location = document.querySelector('.top-card-layout__second-subline span:nth-child(2), .job-details-jobs-unified-top-card__bullet')?.textContent?.trim() || '';
        const descriptionSelectors = ['.description__text', '.show-more-less-html__markup', '.job-details-jobs-unified-description__text', '.jobs-description__content', '.jobs-box__html-content', '.jobs-description-content', '[data-test-id="job-details-description"]', '.jobs-description', '.jobs-unified-description__content'];
        let jobDescription = '';
        for (const selector of descriptionSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 50) { jobDescription = element.textContent.trim(); break; }
        }
        if (!jobDescription) {
            const contentContainers = document.querySelectorAll('.jobs-description-content__text, .jobs-box__html-content');
            for (const container of contentContainers) { if (container.textContent.trim().length > 100) { jobDescription = container.textContent.trim(); break; } }
        }
        return { jobTitle, company, description: jobDescription || 'Description not found. LinkedIn may have updated their page structure.', url: window.location.href };
    } else {
        // Generic extraction for other job sites
        const possibleSelectors = [
            '[class*="job-description"]',
            '[class*="description"]',
            '[id*="job-description"]',
            '[class*="jobDescription"]',
            'article',
            '.details-pane'
        ];
        let jobDescription = '';
        for (const selector of possibleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 100) { // Ensure we get substantial content
                jobDescription = element.textContent.trim();
                break;
            }
        }
        return { description: jobDescription || 'No job description found. Try another selector.', source: window.location.hostname, url: window.location.href };
    }
}

function App() {
  const [uploadedResume, setUploadedResume] = useState(null);
  const [resumeStatusMessage, setResumeStatusMessage] = useState('No file selected');
  const [resumeStatusClassName, setResumeStatusClassName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [showWarningMessage, setShowWarningMessage] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [activeTabId, setActiveTabId] = useState(null);

  useEffect(() => {
     const storedResumeFile = getResumeFromStorage();
     if (storedResumeFile) {
         setUploadedResume(storedResumeFile);
         setResumeStatusMessage(`Resume ready to submit: ${storedResumeFile.name}`);
         setResumeStatusClassName('success');
     }
     if (chrome.tabs) {
         chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
             if (tabs && tabs.length > 0) {
                 setActiveTabId(tabs[0].id);
             } else {
                 console.error("Could not get active tab ID for scripting.");
                 // Consider setting a user-facing error if tab ID is critical for all operations
             }
         });
     } else {
        console.warn("chrome.tabs API not available. Running in a context where tabs cannot be queried (e.g. standard web page, not extension).");
        // Potentially set a mock tab ID for development on a regular webpage or disable features.
     }
  }, []);

  const handleFileChange = async (file) => {
     if (file) {
         if (file.type !== 'application/pdf') {
             setResumeStatusMessage('Please upload a PDF file');
             setResumeStatusClassName('error');
             setUploadedResume(null);
             clearStoredResume();
             return;
         }
         if (file.size > 5 * 1024 * 1024) { // 5MB
             setResumeStatusMessage('File size should be less than 5MB');
             setResumeStatusClassName('error');
             setUploadedResume(null);
             clearStoredResume();
             return;
         }
         try {
             await storeResumeInStorage(file);
             setUploadedResume(file);
             setResumeStatusMessage(`Resume ready to submit: ${file.name}`);
             setResumeStatusClassName('success');
         } catch (err) {
             console.error('Error storing resume:', err);
             setResumeStatusMessage('Error storing resume');
             setResumeStatusClassName('error');
             setUploadedResume(null);
         }
     } else {
         setResumeStatusMessage('No file selected');
         setResumeStatusClassName('');
         setUploadedResume(null);
         clearStoredResume();
     }
  };

  const handleSubmit = async () => {
     if (!uploadedResume) {
         setError('Please upload a resume first.');
         return;
     }
     if (!activeTabId && chrome.scripting) { // Check if chrome.scripting exists before complaining about tab
         setError("Cannot access active tab to extract job description. Ensure the extension has 'activeTab' permission or is running in a valid context.");
         return;
     }

     setIsLoading(true);
     setShowWarningMessage(true);
     setAnalysisData(null);
     setError(null);

     try {
         let jobData;
         if (!chrome.scripting || !activeTabId) { // Fallback or error if scripting is not available (e.g. dev on web)
            console.warn("chrome.scripting API not available or no active tab. Using placeholder job data.");
            // Placeholder for development if not in extension context
            jobData = { description: "Placeholder job description for development. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.", source: "placeholder.com", url: "http://placeholder.com/job/123" };
         } else {
            await new Promise(resolve => setTimeout(resolve, 100)); // Short delay for UI update

            const injectionResults = await chrome.scripting.executeScript({
                target: { tabId: activeTabId },
                function: extractJobDescriptionForInjection
            });

            if (!injectionResults || !injectionResults[0] || !injectionResults[0].result) {
                throw new Error("Failed to extract job description. No result from script execution.");
            }
            jobData = injectionResults[0].result;
         }


         if (!jobData.description || jobData.description.length < 100) {
             alert('No valid job description found. Please open a specific job posting or check the page content.');
             throw new Error('No valid job description found on the page.');
         }

         const formData = new FormData();
         formData.append('resume', uploadedResume);
         formData.append('jobData', JSON.stringify(jobData));

         const response = await fetch('https://intrvu.onrender.com/api/analyze', {
             method: 'POST',
             body: formData
         });

         if (!response.ok) {
             const errorText = await response.text();
             throw new Error(`Server error: ${response.status} - ${errorText || 'Unknown server error'}`);
         }

         const responseData = await response.json();
         if (responseData.error) { // Handle application-level errors from backend
            throw new Error(responseData.error);
         }
         setAnalysisData(responseData);

     } catch (err) {
         console.error('Error during analysis submission:', err);
         setError(err.message || 'An unknown error occurred during analysis.');
     } finally {
         setIsLoading(false);
         // setShowWarningMessage(false); // Warning message might stay until user dismisses or new action
     }
  };

  const handleViewDetailedAnalysis = () => {
     setShowDetailedAnalysis(true);
  };

  const handleBackToSummary = () => {
     setShowDetailedAnalysis(false);
  };

  return (
    <div className="container">
      <FeedbackLink />
      <Header />
      <div className="main-content">
        <div className="left-panel">
          <FileUpload
             onFileChange={handleFileChange}
             resumeStatusMessage={resumeStatusMessage}
             resumeStatusClassName={resumeStatusClassName}
          />
        </div>
        <div className="right-panel">
          <SubmitSection
             uploadedResume={uploadedResume}
             isLoading={isLoading}
             onSubmit={handleSubmit}
             showProgressBar={isLoading} // Control progress bar visibility
             showWarning={showWarningMessage} // Control warning message visibility
          />
        </div>
      </div>
      <AnalysisDisplay
         isLoading={isLoading} // Pass isLoading to potentially show a loading state in results area
         analysisData={analysisData}
         error={error}
         showDetailedAnalysis={showDetailedAnalysis}
         onViewDetailedAnalysis={handleViewDetailedAnalysis}
         onBackToSummary={handleBackToSummary}
      />
      <Footer />
    </div>
  );
}

export default App;
