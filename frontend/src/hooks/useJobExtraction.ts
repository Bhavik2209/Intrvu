import { useState, useEffect } from 'react';
import { JobData, JobExtractionStatus } from '../types/JobData';

export const useJobExtraction = () => {
  const [jobStatus, setJobStatus] = useState<JobExtractionStatus>({
    isActive: false
  });

  useEffect(() => {
    // Check if we have extracted job data
    const checkJobData = async () => {
      try {
        // Check if chrome APIs are available
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          const result = await chrome.storage.local.get(['currentJobData', 'lastExtracted']);

          console.log('useJobExtraction: Checking stored data:', result);

          if (result.currentJobData && result.lastExtracted) {
            // Check if data is recent (within last 5 minutes)
            const isRecent = Date.now() - result.lastExtracted < 5 * 60 * 1000;

            console.log('useJobExtraction: Found job data, isRecent:', isRecent, 'jobData:', result.currentJobData);

            setJobStatus({
              isActive: isRecent,
              lastExtracted: result.lastExtracted,
              currentJobData: result.currentJobData
            });
          } else {
            console.log('useJobExtraction: No job data found in storage');
            setJobStatus({
              isActive: false
            });
          }
        } else {
          console.warn('Chrome extension APIs not available');
        }
      } catch (error) {
        console.error('Error checking job data:', error);
      }
    };

    checkJobData();

    // Listen for new job data
    const handleMessage = (message: any) => {
      if (message.type === 'JOB_DATA_EXTRACTED') {
        setJobStatus({
          isActive: true,
          lastExtracted: Date.now(),
          currentJobData: message.data
        });
      }
    };

    // Listen for storage changes
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === 'local' && changes.currentJobData) {
        console.log('useJobExtraction: Storage change detected:', changes.currentJobData);
        checkJobData();
      }
    };

    // Add message listener only if chrome APIs are available
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);
    }

    // Add storage change listener
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    // Check periodically for updates
    const interval = setInterval(checkJobData, 2000); // Check every 2 seconds for faster response

    return () => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(handleMessage);
      }
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
      clearInterval(interval);
    };
  }, []);

  const sendJobToAPI = async (jobData: JobData) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/analyze-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData)
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        throw new Error(`API request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending job to API:', error);
      throw error;
    }
  };

  return {
    jobStatus,
    sendJobToAPI
  };
};
