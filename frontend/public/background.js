// Background script for IntrvuFit Chrome Extension

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background: Received message:', message);

  if (message.type === 'JOB_DATA_EXTRACTED') {
    console.log('Background: Received job data from content script:', message.data);

    // Store the job data for popup access
    chrome.storage.local.set({
      currentJobData: message.data,
      lastExtracted: Date.now(),
      tabId: sender.tab?.id
    });

    // Optionally show notification that job was detected
    if (message.data.jobTitle && message.data.company) {
      chrome.action.setBadgeText({
        text: '!',
        tabId: sender.tab?.id
      });

      chrome.action.setBadgeBackgroundColor({
        color: '#4CAF50',
        tabId: sender.tab?.id
      });
    }

    sendResponse({ success: true });
  }

  if (message.action === 'CONTENT_SCRIPT_READY') {
    console.log('Background: Content script is ready on tab:', sender.tab?.id);
    sendResponse({ success: true });
  }
});

// Clear badge when tab is updated/navigated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({
      text: '',
      tabId: tabId
    });
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('IntrvuFit extension installed');
});

// Handle action click to toggle side panel
chrome.action.onClicked.addListener(async (tab) => {
  try {
    console.log('Extension icon clicked, toggling side panel on tab:', tab.id);

    // Send message to side panel injector to toggle the panel
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_PANEL' });
    console.log('Panel toggle response:', response);
  } catch (error) {
    console.error('Error toggling panel:', error);

    // If content script is not ready, try to inject it
    try {
      console.log('Attempting to inject side panel script...');
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['side-panel-injector.js']
      });

      // Wait a bit for the script to initialize
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_PANEL' });
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }, 500);
    } catch (injectionError) {
      console.error('Failed to inject side panel script:', injectionError);
    }
  }
});
