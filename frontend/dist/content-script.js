// DOM Observer-Based LinkedIn Job Extraction
// Robust extraction using MutationObserver and semantic anchors
console.log('🚀 IntrvuFit: DOM Observer content script loaded on:', window.location.href);

// ========================================
// State Management
// ========================================
let lastExtractedDescription = null;
let lastExtractedJobTitle = null;
let lastExtractedCompany = null;
let extractionTimeout = null;
const DEBOUNCE_DELAY = 500; // ms

// URL Change Detection State
let lastProcessedURL = window.location.href;
let urlCheckInterval = null;

// ========================================
// URL Change Detection
// ========================================
function isJobPage(url) {
    const jobPatterns = [
        /linkedin\.com\/jobs\/view\//,
        /linkedin\.com\/jobs\/collections\//,
        /linkedin\.com\/company\/.*\/jobs\//
    ];

    return jobPatterns.some(pattern => pattern.test(url));
}

function clearJobData() {
    console.log('IntrvuFit: Clearing previous job data');

    lastExtractedDescription = null;
    lastExtractedJobTitle = null;
    lastExtractedCompany = null;

    window.__INTRVU_JOB_DATA__ = null;

    // Notify popup/side panel of data clear
    window.postMessage({
        type: 'INTRVU_JOB_CLEARED'
    }, '*');
}

function handleURLChange() {
    const currentURL = window.location.href;

    if (currentURL === lastProcessedURL) {
        return; // No change
    }

    console.log('IntrvuFit: URL changed from', lastProcessedURL, 'to', currentURL);
    lastProcessedURL = currentURL;

    // Clear previous data
    clearJobData();

    // Check if still on job page
    if (!isJobPage(currentURL)) {
        console.log('IntrvuFit: Not a job page, skipping extraction');
        return;
    }

    // Debounced re-extraction
    clearTimeout(extractionTimeout);
    extractionTimeout = setTimeout(() => {
        console.log('IntrvuFit: Re-extracting job data for new URL');
        attemptExtraction();
    }, DEBOUNCE_DELAY);
}

// ========================================
// Semantic Header Detection
// ========================================
function findJobDescriptionSection() {
    // Headers to look for (prioritized)
    const headerPatterns = [
        /about the job/i,
        /job description/i,
        /description/i,
        /job details/i
    ];

    // Find all heading elements
    const possibleHeaders = document.querySelectorAll('h1, h2, h3, [role="heading"]');

    for (const header of possibleHeaders) {
        const headerText = header.textContent.trim();

        // Check if this header matches any pattern
        if (headerPatterns.some(pattern => pattern.test(headerText))) {
            console.log('IntrvuFit: Found job description header:', headerText);

            // Try to find the content container
            const container = findContentContainer(header);
            if (container) {
                return container;
            }
        }
    }

    // Fallback: Look for data-testid="expandable-text-box"
    const expandableBox = document.querySelector('[data-testid="expandable-text-box"]');
    if (expandableBox) {
        console.log('IntrvuFit: Found job description via data-testid');
        return expandableBox;
    }

    console.log('IntrvuFit: No job description section found');
    return null;
}

// ========================================
// Container Traversal
// ========================================
function findContentContainer(headerElement) {
    let current = headerElement;

    // Strategy 1: Check next sibling
    const nextSibling = current.nextElementSibling;
    if (nextSibling && hasSubstantialContent(nextSibling)) {
        console.log('IntrvuFit: Found container via next sibling');
        return nextSibling;
    }

    // Strategy 2: Check parent's next sibling
    const parent = current.parentElement;
    if (parent) {
        const parentNextSibling = parent.nextElementSibling;
        if (parentNextSibling && hasSubstantialContent(parentNextSibling)) {
            console.log('IntrvuFit: Found container via parent next sibling');
            return parentNextSibling;
        }
    }

    // Strategy 3: Traverse up to find a container with the content
    current = headerElement.parentElement;
    let depth = 0;
    const maxDepth = 5;

    while (current && current !== document.body && depth < maxDepth) {
        // Look for a child that has substantial content
        const children = Array.from(current.children);
        for (const child of children) {
            if (child !== headerElement && hasSubstantialContent(child)) {
                console.log('IntrvuFit: Found container via upward traversal');
                return child;
            }
        }
        current = current.parentElement;
        depth++;
    }

    return null;
}

function hasSubstantialContent(element) {
    if (!element) return false;

    const text = element.innerText || element.textContent || '';
    const trimmed = text.trim();

    // Must have at least 200 characters to be considered substantial
    if (trimmed.length < 200) return false;

    // Should contain job-related keywords
    const keywords = ['responsibilities', 'requirements', 'qualifications', 'experience', 'skills', 'what you'];
    const lowerText = trimmed.toLowerCase();

    return keywords.some(keyword => lowerText.includes(keyword));
}

// ========================================
// Text Extraction & Cleaning
// ========================================
function extractAndCleanText(container) {
    if (!container) return '';

    // Clone to avoid modifying the DOM
    const clone = container.cloneNode(true);

    // Remove unwanted elements
    const unwantedSelectors = [
        'button',
        'svg',
        'img',
        'a[href*="premium"]',
        '[class*="upsell"]',
        '[class*="premium"]',
        'nav',
        'aside',
        'footer'
    ];

    unwantedSelectors.forEach(selector => {
        const elements = clone.querySelectorAll(selector);
        elements.forEach(el => el.remove());
    });

    // Get text content
    let text = clone.innerText || clone.textContent || '';

    // Remove boilerplate sections
    text = removeBoilerplate(text);

    // Normalize whitespace
    text = text
        .replace(/[\t ]+/g, ' ')           // Multiple spaces → single
        .replace(/\n{3,}/g, '\n\n')         // Multiple newlines → double
        .trim();

    return text;
}

function removeBoilerplate(text) {
    const boilerplatePatterns = [
        /about the company[\s\S]*?(?=\n\n|$)/i,
        /follow us on:[\s\S]*?(?=\n\n|$)/i,
        /equal opportunity employer[\s\S]*?(?=\n\n|$)/i,
        /our commitment to diversity[\s\S]*?(?=\n\n|$)/i,
        /for more information,? visit[\s\S]*?(?=\n\n|$)/i,
        /try premium for[\s\S]*?(?=\n\n|$)/i,
        /get ai-powered advice[\s\S]*?(?=\n\n|$)/i
    ];

    let cleaned = text;
    boilerplatePatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });

    return cleaned;
}

// ========================================
// Job Title & Company Extraction
// ========================================
function extractJobTitle() {
    // Try multiple strategies

    // Strategy 1: Look for h1 with job-related content
    const h1Elements = document.querySelectorAll('h1');
    for (const h1 of h1Elements) {
        const text = h1.textContent.trim();
        if (text && text.length > 5 && text.length < 150) {
            console.log('IntrvuFit: Found job title via h1:', text);
            return text;
        }
    }

    // Strategy 2: Look for h2 with job-related content
    const h2Elements = document.querySelectorAll('h2');
    for (const h2 of h2Elements) {
        const text = h2.textContent.trim();
        // Skip if it's a section header
        if (text && text.length > 5 && text.length < 150 &&
            !/about|company|people|similar/i.test(text)) {
            console.log('IntrvuFit: Found job title via h2:', text);
            return text;
        }
    }

    return 'Job Title Not Found';
}

function extractCompanyName() {
    // Look for company links
    const companyLinks = document.querySelectorAll('a[href*="/company/"]');

    for (const link of companyLinks) {
        const text = link.textContent.trim();
        if (text && text.length > 1 && text.length < 100) {
            console.log('IntrvuFit: Found company via link:', text);
            return text;
        }
    }

    // Fallback: Look for any link near the top
    const topLinks = document.querySelectorAll('a');
    for (const link of Array.from(topLinks).slice(0, 20)) {
        const text = link.textContent.trim();
        if (text && text.length > 2 && text.length < 100 &&
            !text.includes('LinkedIn') &&
            !text.includes('Sign in') &&
            !text.includes('Join now')) {
            console.log('IntrvuFit: Found company via fallback:', text);
            return text;
        }
    }

    return 'Company Not Found';
}

// ========================================
// Main Extraction Logic
// ========================================
function attemptExtraction() {
    console.log('IntrvuFit: Attempting extraction...');

    // Extract job description
    const descriptionContainer = findJobDescriptionSection();
    const description = descriptionContainer ? extractAndCleanText(descriptionContainer) : '';

    // Extract job title and company
    const jobTitle = extractJobTitle();
    const company = extractCompanyName();

    // Check if this is different from last extraction (deduplication)
    if (description === lastExtractedDescription &&
        jobTitle === lastExtractedJobTitle &&
        company === lastExtractedCompany) {
        console.log('IntrvuFit: Skipping - identical to previous extraction');
        return;
    }

    // Update state
    lastExtractedDescription = description;
    lastExtractedJobTitle = jobTitle;
    lastExtractedCompany = company;

    console.log('IntrvuFit: Extraction complete');
    console.log('  - Job Title:', jobTitle);
    console.log('  - Company:', company);
    console.log('  - Description length:', description.length);

    // Store in page for popup to access
    window.__INTRVU_JOB_DATA__ = {
        jobTitle,
        company,
        location: '', // Will be filled by old logic if needed
        jobDescription: description,
        timestamp: Date.now()
    };

    // Notify popup if it's listening
    window.postMessage({
        type: 'INTRVU_JOB_EXTRACTED',
        data: window.__INTRVU_JOB_DATA__
    }, '*');

    console.log('IntrvuFit: Job data stored in window.__INTRVU_JOB_DATA__');
}

// ========================================
// MutationObserver Setup
// ========================================
let observerInstance = null;

function startObserver() {
    console.log('IntrvuFit: Starting DOM observer...');

    // Initial extraction
    attemptExtraction();

    // Create observer
    observerInstance = new MutationObserver((mutations) => {
        // Debounce: clear previous timeout
        clearTimeout(extractionTimeout);

        // Schedule new extraction
        extractionTimeout = setTimeout(() => {
            attemptExtraction();
        }, DEBOUNCE_DELAY);
    });

    // Start observing
    observerInstance.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });

    console.log('IntrvuFit: DOM observer active');
}

function stopObserver() {
    if (observerInstance) {
        observerInstance.disconnect();
        observerInstance = null;
        console.log('IntrvuFit: DOM observer stopped');
    }
}

// ========================================
// Message Listeners (for popup communication)
// ========================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('IntrvuFit: Received message:', request);

    if (request.action === 'getJobDetails') {
        // Return stored data
        sendResponse({
            success: true,
            data: window.__INTRVU_JOB_DATA__ || {
                jobTitle: 'Job Title Not Found',
                company: 'Company Not Found',
                location: '',
                jobDescription: ''
            }
        });
    } else if (request.action === 'extractNow') {
        // Force immediate extraction
        attemptExtraction();
        sendResponse({
            success: true,
            data: window.__INTRVU_JOB_DATA__
        });
    }

    return true; // Keep channel open for async response
});

// ========================================
// URL Monitoring Setup
// ========================================
// Hook into History API for SPA navigation detection
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function (...args) {
    originalPushState.apply(this, args);
    handleURLChange();
};

history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    handleURLChange();
};

// Listen for browser back/forward navigation
window.addEventListener('popstate', handleURLChange);

// Listen for hash changes
window.addEventListener('hashchange', handleURLChange);

// Polling fallback - check URL every second
urlCheckInterval = setInterval(() => {
    if (window.location.href !== lastProcessedURL) {
        handleURLChange();
    }
}, 1000);

// ========================================
// Initialization
// ========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
} else {
    startObserver();
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    stopObserver();
    if (urlCheckInterval) {
        clearInterval(urlCheckInterval);
    }
});

console.log('IntrvuFit: Content script initialized with URL monitoring');
