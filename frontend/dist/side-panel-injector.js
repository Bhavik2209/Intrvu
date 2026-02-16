// IntrvuFit Side Panel Injector
// Handles side panel injection, toggle, and resize functionality

console.log('🎨 IntrvuFit: Side panel injector loaded');

// ========================================
// Constants
// ========================================
const PANEL_ID = 'intrvu-side-panel-container';
const RESIZE_HANDLE_ID = 'intrvu-resize-handle';
const PANEL_CONTENT_ID = 'intrvu-panel-content';
const PANEL_IFRAME_ID = 'intrvu-panel-iframe';
const RESIZE_OVERLAY_ID = 'intrvu-resize-overlay';
const STORAGE_KEY_WIDTH = 'intrvu_panel_width';
const DEFAULT_WIDTH = 450;
const MIN_WIDTH = 300;
const MAX_WIDTH = 800;

// ========================================
// State
// ========================================
let panelContainer = null;
let resizeHandle = null;
let resizeOverlay = null;
let isPanelVisible = false;
let isResizing = false;
let currentWidth = DEFAULT_WIDTH;
let startX = 0;
let startWidth = 0;

// ========================================
// Panel Creation
// ========================================
function createPanel() {
    if (document.getElementById(PANEL_ID)) {
        console.log('IntrvuFit: Panel already exists');
        return;
    }

    console.log('IntrvuFit: Creating side panel...');

    // Load saved width
    chrome.storage.local.get([STORAGE_KEY_WIDTH], (result) => {
        if (result[STORAGE_KEY_WIDTH]) {
            currentWidth = result[STORAGE_KEY_WIDTH];
            console.log('IntrvuFit: Loaded saved width:', currentWidth);
        }

        // Create container
        panelContainer = document.createElement('div');
        panelContainer.id = PANEL_ID;
        panelContainer.style.width = `${currentWidth}px`;

        // Create resize handle
        resizeHandle = document.createElement('div');
        resizeHandle.id = RESIZE_HANDLE_ID;

        // Create content area
        const contentArea = document.createElement('div');
        contentArea.id = PANEL_CONTENT_ID;

        // Create iframe for React app
        const iframe = document.createElement('iframe');
        iframe.id = PANEL_IFRAME_ID;
        iframe.src = chrome.runtime.getURL('index.html');
        iframe.allow = 'clipboard-read; clipboard-write';

        // Create resize overlay (used during resizing to capture mouse events)
        resizeOverlay = document.createElement('div');
        resizeOverlay.id = RESIZE_OVERLAY_ID;

        // Assemble
        contentArea.appendChild(iframe);
        panelContainer.appendChild(resizeHandle);
        panelContainer.appendChild(contentArea);
        document.body.appendChild(panelContainer);
        document.body.appendChild(resizeOverlay);

        // Inject CSS
        injectCSS();

        // Setup resize listeners
        setupResizeListeners();

        console.log('IntrvuFit: Panel created successfully');
    });
}

// ========================================
// CSS Injection
// ========================================
function injectCSS() {
    if (document.getElementById('intrvu-panel-styles')) {
        return;
    }

    const link = document.createElement('link');
    link.id = 'intrvu-panel-styles';
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('side-panel.css');
    document.head.appendChild(link);

    console.log('IntrvuFit: CSS injected');
}

// ========================================
// Panel Toggle
// ========================================
function togglePanel() {
    if (!panelContainer) {
        createPanel();
        // Wait for creation to complete, then show
        setTimeout(() => {
            showPanel();
        }, 100);
        return;
    }

    if (isPanelVisible) {
        hidePanel();
    } else {
        showPanel();
    }
}

function showPanel() {
    if (!panelContainer) return;

    panelContainer.classList.add('intrvu-panel-visible');
    isPanelVisible = true;
    console.log('IntrvuFit: Panel shown');

    // Notify launcher button of state change
    window.postMessage({
        type: 'INTRVU_PANEL_STATE_CHANGED',
        visible: true
    }, '*');
}

function hidePanel() {
    if (!panelContainer) return;

    panelContainer.classList.remove('intrvu-panel-visible');
    isPanelVisible = false;
    console.log('IntrvuFit: Panel hidden');

    // Notify launcher button of state change
    window.postMessage({
        type: 'INTRVU_PANEL_STATE_CHANGED',
        visible: false
    }, '*');
}

// ========================================
// Resize Functionality
// ========================================
function setupResizeListeners() {
    if (!resizeHandle) return;

    resizeHandle.addEventListener('mousedown', startResize);
}

function startResize(e) {
    e.preventDefault();
    isResizing = true;
    startX = e.clientX;
    startWidth = currentWidth;

    // Add resizing class
    panelContainer.classList.add('intrvu-resizing');
    resizeOverlay.classList.add('active');

    // Add global listeners
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);

    console.log('IntrvuFit: Resize started');
}

function handleResize(e) {
    if (!isResizing) return;

    // Calculate new width (dragging left decreases width, right increases)
    const deltaX = startX - e.clientX;
    let newWidth = startWidth + deltaX;

    // Apply constraints
    const maxAllowedWidth = Math.min(MAX_WIDTH, window.innerWidth * 0.5);
    newWidth = Math.max(MIN_WIDTH, Math.min(newWidth, maxAllowedWidth));

    // Update width
    currentWidth = newWidth;
    panelContainer.style.width = `${newWidth}px`;
}

function stopResize() {
    if (!isResizing) return;

    isResizing = false;

    // Remove resizing class
    panelContainer.classList.remove('intrvu-resizing');
    resizeOverlay.classList.remove('active');

    // Remove global listeners
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);

    // Save width to storage
    chrome.storage.local.set({ [STORAGE_KEY_WIDTH]: currentWidth }, () => {
        console.log('IntrvuFit: Width saved:', currentWidth);
    });

    console.log('IntrvuFit: Resize stopped');
}

// ========================================
// Message Listeners
// ========================================

// Listen for messages from launcher button (top window) or React UI (iframe)
window.addEventListener('message', (event) => {
    // Check if the message is from our own origin or the extension's origin
    const isSameOrigin = event.origin === window.location.origin;
    const isExtensionOrigin = event.origin.startsWith('chrome-extension://');

    if (!isSameOrigin && !isExtensionOrigin) return;

    if (event.data.type === 'INTRVU_TOGGLE_PANEL') {
        console.log('IntrvuFit Side Panel: Received toggle request from launcher button');
        togglePanel();
    }

    if (event.data.type === 'INTRVU_CLOSE_PANEL') {
        console.log('IntrvuFit Side Panel: Received close request from UI');
        hidePanel();
    }
});

// Listen for messages from background script (via chrome.runtime)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('IntrvuFit Side Panel: Received message:', request);

    if (request.action === 'TOGGLE_PANEL') {
        togglePanel();
        sendResponse({ success: true, visible: isPanelVisible });
    }

    return true;
});

// ========================================
// Initialization
// ========================================
console.log('IntrvuFit: Side panel injector initialized');
