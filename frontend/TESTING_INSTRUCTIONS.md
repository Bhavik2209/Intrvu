# LinkedIn Job Extraction Extension - Testing Instructions

## Build the Extension

1. Open terminal in the project directory
2. Run: `npm run build`
3. The extension files will be generated in the `dist/` folder

## Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist/` folder from the project directory
5. The IntrvuFit extension should appear in your extensions list

## Test Job Extraction

### Method 1: LinkedIn Job Pages
1. Navigate to any LinkedIn job page:
   - Direct job view: `https://www.linkedin.com/jobs/view/[job-id]`
   - Job search results: `https://www.linkedin.com/jobs/search/`
   - Collections: `https://www.linkedin.com/jobs/collections/`

2. Open Chrome DevTools (F12)
3. Go to Console tab
4. Look for "IntrvuFit:" prefixed log messages
5. You should see extraction progress and results

### Method 2: Manual Debug Function
1. On any LinkedIn job page, open Chrome DevTools Console
2. Type: `IntrvuFitDebug()`
3. Press Enter
4. This will run the extraction and show detailed debug output

## Expected Console Output

When working correctly, you should see:
```
IntrvuFit: Content script loaded on: [URL]
IntrvuFit: LinkedInJobExtractor initialized
IntrvuFit: Initializing job extractor...
IntrvuFit: Valid LinkedIn job page detected: [URL]
IntrvuFit: Starting job extraction...
IntrvuFit: LinkedIn detected, extracting job data...
IntrvuFit: Found job description using selector: [selector]
IntrvuFit: Extracted job data: {jobTitle: "...", company: "...", ...}
IntrvuFit: Job data extracted successfully
IntrvuFit: Job data stored for extension popup
```

## Troubleshooting

### No Console Messages
- Check if extension is properly loaded
- Verify you're on a LinkedIn job page
- Try refreshing the page

### "Description not found" Message
- LinkedIn may have updated their DOM structure
- Check the actual page elements in DevTools
- Update selectors in `content-script.js` if needed

### Extension Not Working
- Ensure `dist/` folder contains all files after build
- Check Chrome extensions page for any errors
- Verify manifest.json permissions are correct

## Test Different LinkedIn Page Types

1. **Direct Job View**: `linkedin.com/jobs/view/[id]`
2. **Job Search**: `linkedin.com/jobs/search/`
3. **Collections**: `linkedin.com/jobs/collections/`

Each should trigger the extraction automatically when the page loads.


