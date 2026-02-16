// IntrvuFit Launcher Button
// Persistent floating button for LinkedIn job pages that toggles the overlay panel

(function () {
    'use strict';

    console.log('🚀 IntrvuFit: Launcher button module loaded');

    // ========================================
    // Constants
    // ========================================
    const BUTTON_ID = 'intrvu-launcher-button';
    const DEBOUNCE_DELAY = 300; // ms
    let buttonElement = null;
    let isPanelVisible = false;
    let urlChangeTimeout = null;

    // Job Page Detection (reuse from content-script.js)
    // ========================================
    function isJobPage(url) {
        const jobPatterns = [
            /linkedin\.com\/jobs\/view\//,
            /linkedin\.com\/jobs\/collections\//,
            /linkedin\.com\/company\/.*\/jobs\//,
            /linkedin\.com\/jobs\//  // Add broader pattern for job search pages
        ];

        const isJob = jobPatterns.some(pattern => pattern.test(url));
        console.log('IntrvuFit Launcher: isJobPage check for', url, '→', isJob);
        return isJob;
    }

    // ========================================
    // Button Creation
    // ========================================
    function createButton() {
        if (buttonElement) {
            console.log('IntrvuFit Launcher: Button already exists');
            return;
        }

        console.log('IntrvuFit Launcher: Creating button...');

        try {
            buttonElement = document.createElement('button');
            buttonElement.id = BUTTON_ID;
            buttonElement.className = 'intrvu-launcher';
            buttonElement.setAttribute('aria-label', 'Open IntrvuFit Resume Analyzer');
            buttonElement.setAttribute('title', 'Analyze this job against your resume');

            // Button content with icon and text
            buttonElement.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 2C8.45 2 8 2.45 8 3V4H4C3.45 4 3 4.45 3 5V19C3 19.55 3.45 20 4 20H8V21C8 21.55 8.45 22 9 22H15C15.55 22 16 21.55 16 21V20H20C20.55 20 21 19.55 21 19V5C21 4.45 20.55 4 20 4H16V3C16 2.45 15.55 2 15 2H9ZM10 4H14V6H10V4ZM5 6H19V18H5V6ZM7 8V10H17V8H7ZM7 12V14H17V12H7ZM7 16V18H14V16H7Z"/>
            </svg>
            <span>Analyze</span>
        `;

            // Attach click handler
            buttonElement.addEventListener('click', handleButtonClick);

            // Inject button into page
            if (!document.body) {
                console.error('IntrvuFit Launcher: document.body not available!');
                return;
            }

            document.body.appendChild(buttonElement);
            console.log('IntrvuFit Launcher: Button appended to body');

            // Inject CSS
            injectButtonCSS();

            console.log('IntrvuFit Launcher: Button created successfully');
        } catch (error) {
            console.error('IntrvuFit Launcher: Error creating button:', error);
        }
    }

    // ========================================
    // Button Removal
    // ========================================
    function removeButton() {
        if (!buttonElement) return;

        console.log('IntrvuFit Launcher: Removing button...');
        buttonElement.remove();
        buttonElement = null;
    }

    // ========================================
    // CSS Injection
    // ========================================
    function injectButtonCSS() {
        if (document.getElementById('intrvu-launcher-styles')) {
            return;
        }

        const link = document.createElement('link');
        link.id = 'intrvu-launcher-styles';
        link.rel = 'stylesheet';
        link.href = chrome.runtime.getURL('launcher-button.css');
        document.head.appendChild(link);

        console.log('IntrvuFit Launcher: CSS injected');
    }

    // ========================================
    // Button Click Handler
    // ========================================
    function handleButtonClick(event) {
        event.preventDefault();
        event.stopPropagation();

        console.log('IntrvuFit Launcher: Button clicked, toggling panel...');

        // Send message to side-panel-injector to toggle panel
        window.postMessage({
            type: 'INTRVU_TOGGLE_PANEL'
        }, '*');
    }

    // ========================================
    // Panel State Updates
    // ========================================
    function updateButtonState(visible) {
        if (!buttonElement) return;

        isPanelVisible = visible;

        if (visible) {
            buttonElement.classList.add('intrvu-launcher-active');
            buttonElement.setAttribute('aria-pressed', 'true');
            buttonElement.setAttribute('title', 'Close IntrvuFit Resume Analyzer');
        } else {
            buttonElement.classList.remove('intrvu-launcher-active');
            buttonElement.setAttribute('aria-pressed', 'false');
            buttonElement.setAttribute('title', 'Analyze this job against your resume');
        }

        console.log('IntrvuFit Launcher: Button state updated, panel visible:', visible);
    }

    // Listen for panel state changes
    window.addEventListener('message', (event) => {
        // Only accept messages from same origin
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'INTRVU_PANEL_STATE_CHANGED') {
            updateButtonState(event.data.visible);
        }
    });

    // ========================================
    // URL Change Detection
    // ========================================
    function handleURLChange() {
        clearTimeout(urlChangeTimeout);

        urlChangeTimeout = setTimeout(() => {
            const currentURL = window.location.href;
            console.log('IntrvuFit Launcher: URL change detected:', currentURL);

            if (isJobPage(currentURL)) {
                if (!buttonElement) {
                    createButton();
                }
            } else {
                removeButton();
            }
        }, DEBOUNCE_DELAY);
    }

    // ========================================
    // MutationObserver for Button Persistence
    // ========================================
    // Watch for button removal by LinkedIn's DOM updates
    let buttonObserver = null;

    function startButtonObserver() {
        if (buttonObserver) return;

        buttonObserver = new MutationObserver((mutations) => {
            // Check if button still exists in DOM
            if (buttonElement && !document.body.contains(buttonElement)) {
                console.log('IntrvuFit Launcher: Button removed from DOM, re-injecting...');
                buttonElement = null; // Reset reference
                if (isJobPage(window.location.href)) {
                    createButton();
                }
            }
        });

        buttonObserver.observe(document.body, {
            childList: true,
            subtree: false
        });

        console.log('IntrvuFit Launcher: Button observer started');
    }

    // ========================================
    // History API Hooks (for SPA navigation)
    // ========================================
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
        const result = originalPushState.apply(this, args);
        handleURLChange();
        return result;
    };

    history.replaceState = function (...args) {
        const result = originalReplaceState.apply(this, args);
        handleURLChange();
        return result;
    };

    // Listen for browser back/forward navigation
    window.addEventListener('popstate', handleURLChange);

    // Listen for hash changes
    window.addEventListener('hashchange', handleURLChange);

    // ========================================
    // Initialization
    // ========================================
    function initialize() {
        const currentURL = window.location.href;
        console.log('IntrvuFit Launcher: Initializing...');
        console.log('IntrvuFit Launcher: Current URL:', currentURL);
        console.log('IntrvuFit Launcher: Is job page?', isJobPage(currentURL));

        // Create button if on job page
        if (isJobPage(currentURL)) {
            console.log('IntrvuFit Launcher: Creating button for job page');
            createButton();
            startButtonObserver();
        } else {
            console.log('IntrvuFit Launcher: Not a job page, skipping button creation');
        }

        console.log('IntrvuFit Launcher: Initialization complete');
    }

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        if (buttonObserver) {
            buttonObserver.disconnect();
            buttonObserver = null;
        }
        removeButton();
    });

    console.log('IntrvuFit Launcher: Module initialized');

})(); // End of IIFE - Isolates launcher button scope from content-script.js
