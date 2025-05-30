import React from 'react';

function SubmitSection({ uploadedResume, isLoading, onSubmit, showProgressBar, showWarning }) {
  const isButtonDisabled = !uploadedResume || isLoading;

  return (
    <>
      <div id="progressBar" className="progress-bar" style={{ display: showProgressBar ? 'block' : 'none' }}>
        {/* Basic loading indication for progress bar fill, can be enhanced */}
        <div className="progress-bar-fill" style={{ width: isLoading ? '75%' : '0%', transition: isLoading ? 'width 0.5s ease-in-out 0.3s' : 'width 0.1s' }}></div>
      </div>
      <div id="warningMessage" className="warning-message" style={{ display: showWarning ? 'block' : 'none' }}>
        Please stay on this tab while the extension processes your data. Switching tabs or navigating away might cause it to close and lose your progress.
      </div>
      <div className="submit-section">
        <button
          id="submit-button"
          className="primary-button"
          disabled={isButtonDisabled}
          onClick={onSubmit}
        >
          {isLoading ? (
            <>
              Analyzing...
              {/* Simple inline spinner for button, actual .loading-spinner class from style.css might be better */}
              <div
                style={{
                  display: 'inline-block',
                  marginLeft: '10px',
                  width: '16px',
                  height: '16px',
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderTop: '3px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              ></div>
              {/* Keyframes for spin if not globally available:
                  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                  Add this to style.css or a style tag if needed, or use existing .loading-spinner if it works
              */}
            </>
          ) : (
            'Analyze Job Match'
          )}
        </button>
      </div>
    </>
  );
}

export default SubmitSection;
