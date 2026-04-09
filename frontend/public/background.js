// Background script for IntrvuFit Chrome Extension

function isLinkedInJobUrl(url) {
  if (!url) return false;
  return /linkedin\.com\/(jobs\/(view|search|collections)|company\/.*\/jobs|jobs\/)/i.test(url);
}

async function ensureJobScriptsInjected(tabId, url) {
  if (!tabId || !isLinkedInJobUrl(url)) return;

  try {
    await chrome.tabs.sendMessage(tabId, { action: 'PING_CONTENT_SCRIPT' });
    return;
  } catch {
    console.log('Background: Content script not reachable, injecting scripts on tab:', tabId);
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-script.js', 'launcher-button.js']
    });
    console.log('Background: Job scripts injected on tab:', tabId);
  } catch (injectionError) {
    console.error('Background: Failed to inject job scripts:', injectionError);
  }
}

async function openPanelOnJobTab(tabId, url) {
  if (!tabId || !isLinkedInJobUrl(url)) return;

  try {
    await chrome.tabs.sendMessage(tabId, { action: 'OPEN_PANEL' });
    return;
  } catch {
    // Injector may not be active yet, inject then retry.
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['side-panel-injector.js']
    });
  } catch (injectionError) {
    console.error('Background: Failed to inject side panel injector:', injectionError);
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 250));

  try {
    await chrome.tabs.sendMessage(tabId, { action: 'OPEN_PANEL' });
  } catch (sendError) {
    console.error('Background: Failed to auto-open panel on job tab:', sendError);
  }
}

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

  if (typeof changeInfo.url === 'string') {
    ensureJobScriptsInjected(tabId, changeInfo.url);
    openPanelOnJobTab(tabId, changeInfo.url);
  }

  if (changeInfo.status === 'complete') {
    ensureJobScriptsInjected(tabId, tab?.url);
    openPanelOnJobTab(tabId, tab?.url);
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('IntrvuFit extension installed');
});

chrome.runtime.onStartup.addListener(async () => {
  const tabs = await chrome.tabs.query({
    url: ['https://www.linkedin.com/*', 'https://*.linkedin.com/*']
  });

  for (const tab of tabs) {
    await ensureJobScriptsInjected(tab.id, tab.url);
    await openPanelOnJobTab(tab.id, tab.url);
  }
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
