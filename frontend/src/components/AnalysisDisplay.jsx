import React from 'react';
import ResultsCard from './ResultsCard';
import DetailedAnalysisView from './DetailedAnalysisView'; // Import actual component

function AnalysisDisplay({ isLoading, analysisData, error, showDetailedAnalysis, onViewDetailedAnalysis, onBackToSummary }) {
  const shouldShowContentContainer = analysisData || error; // Determine if there's content (data or error) to show

  // Show loading indicator if isLoading is true AND there's no data yet AND no error.
  if (isLoading && !analysisData && !error) {
     return (
         <div id="analysisSection" className="analysis-section" style={{ display: 'block' }}>
             <div id="resultsContainer">
                 <div className="loading-message" style={{padding: '40px 0', textAlign: 'center', color: '#64748b'}}>
                    {/* You might want to use the .loading-spinner class from style.css if it's more elaborate */}
                    <div style={{
                        display: 'inline-block',
                        width: '24px',
                        height: '24px',
                        border: '3px solid rgba(0,0,0,0.1)',
                        borderTopColor: '#3449bd', // Assuming this is your primary color
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px auto'
                    }}></div>
                    <p>Analyzing your resume...</p>
                 </div>
             </div>
         </div>
     );
  }

  // If not loading, and no content (data or error) to show, render nothing.
  if (!shouldShowContentContainer) {
    return null;
  }

  // If there is content (data or error), render the section.
  return (
    <div
      id="analysisSection"
      className="analysis-section"
      // The section is displayed because shouldShowContentContainer is true.
      // No need for style={{ display: 'block' }} here due to the null return above.
    >
      <div id="resultsContainer">
        {error && (
          <div className="error-banner">
            <h3>Error Occurred</h3>
            <p>{typeof error === 'string' ? error : (error.message || JSON.stringify(error))}</p>
          </div>
        )}
        {analysisData && !error && ( // Only render results if data exists and no error
          showDetailedAnalysis ? (
            <DetailedAnalysisView
              analysis={analysisData.analysis}
              onBack={onBackToSummary}
            />
          ) : (
            <ResultsCard
              jobContext={analysisData.job_context}
              analysis={analysisData.analysis}
              onViewDetails={onViewDetailedAnalysis}
            />
          )
        )}
      </div>
    </div>
  );
}

export default AnalysisDisplay;
