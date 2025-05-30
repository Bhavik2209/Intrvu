import React from 'react';
import { getScoreColor, getMatchLevel } from '../utils'; // Assuming utils.js is in src

function ResultsCard({ jobContext, analysis, onViewDetails }) {
  if (!analysis || !jobContext) {
    // This case should ideally be handled by the parent component (AnalysisDisplay)
    // by not rendering ResultsCard if data is not ready.
    // However, as a fallback:
    return <div>Loading results or data missing...</div>;
  }

  const overallScore = analysis.overall_score || 0;
  const scoreColorValue = getScoreColor(overallScore); // Renamed to avoid conflict with style property
  const matchLevel = getMatchLevel(overallScore);

  const jobTitle = jobContext.title || 'Job Position';
  const company = jobContext.company || 'Company';

  return (
    <div className="results-card"> {/* Ensure this class exists in style.css or add styles */}
      <div className="results-header">
        <h2>Resume Analysis Results</h2>
        <div className="job-context">
          <p><strong>{jobTitle}</strong>{company !== 'Company' ? ` at ${company}` : ''}</p>
        </div>
      </div>

      <div className="score-section"> {/* Ensure this class exists or add styles */}
        <div className="overall-score-container">
          <div
            className="overall-score-circle"
            // Corrected conic-gradient: it takes a color, its percentage, then the next color, and its starting percentage
            style={{ background: `conic-gradient(${scoreColorValue} ${overallScore}%, #e0e0e0 ${overallScore}%)` }}
          >
            <div className="overall-score-value">{Math.round(overallScore)}</div>
          </div>
          <div className="overall-score-label">{matchLevel}</div>
        </div>
      </div>

      <button
        className="detail-analysis-button" // Ensure this class is styled
        onClick={onViewDetails}
      >
        📊 View Detailed Analysis
      </button>
    </div>
  );
}

export default ResultsCard;
