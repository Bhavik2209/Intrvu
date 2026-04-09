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

  const isLinkedInJobContext = (url?: string) => {
    if (!url) return false;
    return /linkedin\.com\/(jobs\/(view|search|collections)|company\/.*\/jobs|jobs\/)/i.test(url);
  };

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
    let timeoutId: number | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = globalThis.setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) {
        globalThis.clearTimeout(timeoutId);
      }
    }
  };

  const requestFromContentScript = (tabId: number, action: 'getJobDetails' | 'extractNow' | 'PING_CONTENT_SCRIPT') => {
    return new Promise<any>((resolve, reject) => {
      (chrome as any).tabs.sendMessage(tabId, { action }, (response: any) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || 'Content script communication failed'));
          return;
        }
        resolve(response);
      });
    });
  };

  const readStoredJobData = async () => {
    if (!(chrome as any)?.storage?.local) return null;
    const stored = await (chrome as any).storage.local.get(['currentJobData', 'lastExtracted']);
    const data = stored?.currentJobData;
    if (data?.jobDescription && data.jobDescription.length >= 120) {
      return data;
    }
    return null;
  };

  const ensureContentScriptReady = async (tabId: number) => {
    try {
      await withTimeout(requestFromContentScript(tabId, 'PING_CONTENT_SCRIPT'), 1000, 'Content script ping timeout');
      return;
    } catch {
      await (chrome as any).scripting.executeScript({
        target: { tabId },
        files: ['content-script.js', 'launcher-button.js']
      });
      await wait(250);
      await withTimeout(requestFromContentScript(tabId, 'PING_CONTENT_SCRIPT'), 1500, 'Content script injection did not initialize');
    }
  };

  const getJobDataWithRetry = async (tabId: number) => {
    const maxAttempts = 5;

    await ensureContentScriptReady(tabId);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const cached = await readStoredJobData();
        if (cached) return cached;

        const response: any = await withTimeout(
          requestFromContentScript(tabId, 'getJobDetails'),
          2500,
          'Timed out getting job details'
        );
        const data = response?.data;

        if (data?.jobDescription && data.jobDescription.length >= 120) {
          return data;
        }

        const forced: any = await withTimeout(
          requestFromContentScript(tabId, 'extractNow'),
          3500,
          'Timed out forcing extraction'
        );
        const forcedData = forced?.data;
        if (forcedData?.jobDescription && forcedData.jobDescription.length >= 120) {
          return forcedData;
        }
      } catch (error) {
        if (attempt === maxAttempts) throw error;
      }

      if (attempt < maxAttempts) {
        await wait(350);
      }
    }

    return await readStoredJobData();
  };

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

      try {
        const data = await withTimeout(
          getJobDataWithRetry(tab.id),
          18000,
          'Extraction timed out. Please keep the job details section visible and try again.'
        );
        console.log('Received data from content script:', data);

        if (!data) {
          throw new Error('No job description found yet. Please wait a second and try again.');
        }

        handleExtractedData(data);

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
        const shouldExtract = isLinkedInJobContext(tab.url);

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
      const isJob = isLinkedInJobContext(newUrl);
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
    const isSpecificJob = isLinkedInJobContext(currentUrl);
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
                isLinkedInJobContext(currentUrl) ? '✅' : '❌'}
        </span>
        <span className="status-text">
          {extractionStatus === 'extracting' ? 'Extracting job details...' :
            extractionStatus === 'success' && jobData ? `${jobData.jobTitle} at ${jobData.company}` :
              extractionStatus === 'error' ? 'Extraction failed' :
                isLinkedInJobContext(currentUrl) ? 'LinkedIn job page detected' : 'Navigate to LinkedIn job page'}
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
