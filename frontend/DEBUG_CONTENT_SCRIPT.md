# Debug Content Script Injection

## Check if Content Script is Running

1. **Open LinkedIn job page**: `https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4139507733`

2. **Open Chrome DevTools** (F12) and go to **Console** tab

3. **Look for this message**: 
   ```
   IntrvuFit: React-based content script loaded on: https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4139507733
   ```

4. **If you DON'T see this message**, the content script is not being injected. Try:
   - Reload the extension in `chrome://extensions/`
   - Refresh the LinkedIn page
   - Check if the extension is enabled

5. **If you DO see the message**, test the message listener by running in console:
   ```javascript
   chrome.runtime.sendMessage({action: 'extractJobData'}, (response) => {
       console.log('Response:', response);
   });
   ```

## Quick Fix - Manual Content Script Test

Run this in the LinkedIn page console to test extraction directly:

```javascript
// Test if extraction works
window.IntrvuFitDebug();
```

This will show if the extraction logic itself is working, regardless of the React popup communication.
