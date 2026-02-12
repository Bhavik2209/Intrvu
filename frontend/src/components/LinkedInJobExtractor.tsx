import React, { useState, useEffect } from 'react';
import './LinkedInJobExtractor.css';

interface JobData {
  jobTitle: string;
  company: string;
  location: string;
  jobDescription: string;
  url: string;
  jobInfo: any;
  extractedAt: string;
}

interface LinkedInJobExtractorProps {
  onJobDataExtracted: (data: JobData) => void;
}

const LinkedInJobExtractor: React.FC<LinkedInJobExtractorProps> = ({ onJobDataExtracted }) => {
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'extracting' | 'success' | 'error'>('idle');
  const [, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');

  const handleExtractedData = (data: any) => {
    const jobData: JobData = {
      jobTitle: data.jobTitle || 'Unknown Title',
      company: data.company || 'Unknown Company',
      location: data.location || '',
      jobDescription: data.jobDescription || '',
      url: window.location.href,
      jobInfo: data.jobInfo || {},
      extractedAt: new Date().toISOString()
    };

    setJobData(jobData);
    setExtractionStatus('success');
    onJobDataExtracted(jobData);
  };

  const extractJobDetails = async () => {
    setExtractionStatus('extracting');
    setError(null);

    try {
      const [tab] = await (chrome as any).tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      console.log('Requesting job details from content script...');

      // Request data from content script
      try {
        const response: any = await new Promise((resolve, reject) => {
          (chrome as any).tabs.sendMessage(tab.id, { action: 'getJobDetails' }, (response: any) => {
            if (chrome.runtime.lastError) {
              // If content script isn't ready, try to inject it or wait
              console.log('Content script not ready, error:', chrome.runtime.lastError);
              reject(new Error('Content script not ready. Please refresh the page.'));
            } else {
              resolve(response);
            }
          });
        });

        if (response && response.data) {
          const data = response.data;
          console.log('Received data from content script:', data);

          // Validate data
          if (!data.jobDescription || data.jobDescription.length < 100) {
            // Try to force extraction if data is missing
            const forceResponse: any = await new Promise((resolve) => {
              (chrome as any).tabs.sendMessage(tab.id, { action: 'extractNow' }, resolve);
            });

            if (forceResponse && forceResponse.data) {
              handleExtractedData(forceResponse.data);
              return;
            }

            throw new Error('No job description found. Please scroll to the "About the job" section.');
          }

          handleExtractedData(data);
        } else {
          throw new Error('Invalid response from content script');
        }

      } catch (err: any) {
        console.error('Message passing failed:', err);
        throw err;
      }

    } catch (error: any) {
      console.error('Failed to extract job details:', error);
      setError(error.message || 'Failed to extract job details');
      setExtractionStatus('error');
    }
  };

  useEffect(() => {
    // Reset all state when component mounts to ensure fresh extraction
    const resetAndExtract = async () => {
      try {
        // Reset all state first
        setJobData(null);
        setExtractionStatus('idle');
        setError(null);
        setCurrentUrl('');

        // Get fresh tab info
        const [tab] = await (chrome as any).tabs.query({ active: true, currentWindow: true });
        console.log('Component mounted, current tab URL:', tab.url);
        setCurrentUrl(tab.url);

        // Check if we should extract immediately
        const shouldExtract = tab.url && (
          (tab.url.includes('linkedin.com/jobs/') && (tab.url.includes('currentJobId=') || tab.url.includes('/view/'))) ||
          tab.url.includes('linkedin.com/job/') ||
          (tab.url.includes('linkedin.com/company/') && tab.url.includes('/jobs/') && (tab.url.includes('currentJobId=') || tab.url.includes('/view/')))
        );

        if (shouldExtract) {
          console.log('✅ Valid job page detected - starting extraction in 1 second');
          setTimeout(() => {
            extractJobDetails();
          }, 1000); // Give more time for page to be fully loaded
        } else {
          console.log('❌ Not a valid job page - setting error state');
          setError('Please navigate to a specific LinkedIn job posting page (with job description) to extract job details.');
          setExtractionStatus('error');
        }
      } catch (error) {
        console.error('Failed to initialize extraction:', error);
      }
    };

    resetAndExtract();

    let debounceTimer: number | undefined;
    const handleTabUpdated = async (_tabId: number, changeInfo: any, tab: any) => {
      if (!tab.active) return;
      const newUrl: string = tab.url || '';
      const becameComplete = changeInfo.status === 'complete';
      const urlChanged = typeof changeInfo.url === 'string';
      if (!(becameComplete || urlChanged)) return;
      const isJob = newUrl && (
        (newUrl.includes('linkedin.com/jobs/') && (newUrl.includes('currentJobId=') || newUrl.includes('/view/'))) ||
        newUrl.includes('linkedin.com/job/') ||
        (newUrl.includes('linkedin.com/company/') && newUrl.includes('/jobs/') && (newUrl.includes('currentJobId=') || newUrl.includes('/view/')))
      );
      if (!isJob) return;
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        setCurrentUrl(newUrl);
        setJobData(null);
        setExtractionStatus('idle');
        setError(null);
        setTimeout(() => extractJobDetails(), 600);
      }, 400);
    };

    if (typeof chrome !== 'undefined' && (chrome as any).tabs && (chrome as any).tabs.onUpdated) {
      (chrome as any).tabs.onUpdated.addListener(handleTabUpdated);
    }

    return () => {
      if (typeof chrome !== 'undefined' && (chrome as any).tabs && (chrome as any).tabs.onUpdated) {
        (chrome as any).tabs.onUpdated.removeListener(handleTabUpdated);
      }
      if (debounceTimer) window.clearTimeout(debounceTimer);
    };
  }, []);

  const getStatusIndicatorClass = () => {
    if (extractionStatus === 'extracting') return 'status-extracting';
    if (extractionStatus === 'success') return 'status-valid';
    if (extractionStatus === 'error') return 'status-invalid';
    if (!currentUrl) return 'status-checking';
    // Check if current URL is a specific job page
    const isSpecificJob = currentUrl && (
      (currentUrl.includes('linkedin.com/jobs/') && (currentUrl.includes('currentJobId=') || currentUrl.includes('/view/'))) ||
      currentUrl.includes('linkedin.com/job/') ||
      (currentUrl.includes('linkedin.com/company/') && currentUrl.includes('/jobs/') && (currentUrl.includes('currentJobId=') || currentUrl.includes('/view/')))
    );
    if (isSpecificJob) return 'status-valid';
    return 'status-invalid';
  };

  return (
    <div className="linkedin-job-extractor-compact">
      <div className={`compact-status-indicator ${getStatusIndicatorClass()}`}>
        <span className="status-icon">
          {extractionStatus === 'extracting' ? '🔄' :
            extractionStatus === 'success' ? '✅' :
              extractionStatus === 'error' ? '❌' :
                currentUrl && (
                  (currentUrl.includes('linkedin.com/jobs/') && (currentUrl.includes('currentJobId=') || currentUrl.includes('/view/'))) ||
                  currentUrl.includes('linkedin.com/job/') ||
                  (currentUrl.includes('linkedin.com/company/') && currentUrl.includes('/jobs/') && (currentUrl.includes('currentJobId=') || currentUrl.includes('/view/')))
                ) ? '✅' : '❌'}
        </span>
        <span className="status-text">
          {extractionStatus === 'extracting' ? 'Extracting job details...' :
            extractionStatus === 'success' && jobData ? `${jobData.jobTitle} at ${jobData.company}` :
              extractionStatus === 'error' ? 'Extraction failed' :
                currentUrl && (
                  (currentUrl.includes('linkedin.com/jobs/') && (currentUrl.includes('currentJobId=') || currentUrl.includes('/view/'))) ||
                  currentUrl.includes('linkedin.com/job/') ||
                  (currentUrl.includes('linkedin.com/company/') && currentUrl.includes('/jobs/') && (currentUrl.includes('currentJobId=') || currentUrl.includes('/view/')))
                ) ? 'LinkedIn job page detected' : 'Navigate to LinkedIn job page'}
        </span>
        {(extractionStatus === 'idle' || extractionStatus === 'error') && (
          <button
            className="compact-refresh-btn"
            onClick={() => {
              setJobData(null);
              setExtractionStatus('idle');
              setError(null);
              setTimeout(() => extractJobDetails(), 100);
            }}
            title="Refresh & Extract"
          >
            🔄
          </button>
        )}
      </div>
    </div>
  );
};

export default LinkedInJobExtractor;
