import React from 'react';
import StatusBadges from '../StatusBadges';
import { AnalysisData } from '../../types/AnalysisData';

interface KeywordsSectionProps {
  analysisData: AnalysisData | null;
}

const KeywordsSection: React.FC<KeywordsSectionProps> = ({ analysisData }) => {
  const keywordDataCheck = analysisData?.detailed_analysis?.keyword_match;

  if (!analysisData || !keywordDataCheck) {
    return (
      <div>
        <StatusBadges analysisData={null} />
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded-full w-20"></div>
                <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                <div className="h-8 bg-gray-200 rounded-full w-16"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const keywordData = analysisData?.detailed_analysis?.keyword_match;

  if (!keywordData) return null;
  const safeMatchPct = typeof keywordData.score?.matchPercentage === 'number'
    ? keywordData.score.matchPercentage
    : Number(keywordData.score?.matchPercentage) || 0;
  const safeRating = typeof keywordData.score?.rating === 'string'
    ? keywordData.score.rating
    : JSON.stringify(keywordData.score?.rating ?? '');
  // Defensive guards to ensure we only render strings/arrays of strings
  const strongMatches = Array.isArray(keywordData.analysis?.strongMatches)
    ? keywordData.analysis.strongMatches
    : [];
  const partialMatches = Array.isArray(keywordData.analysis?.partialMatches)
    ? keywordData.analysis.partialMatches
    : [];
  const missingKeywords = Array.isArray(keywordData.analysis?.missingKeywords)
    ? keywordData.analysis.missingKeywords
    : [];

  // Normalize suggestedImprovements to a safe string for rendering
  let suggestionsText: string | null = null;
  const rawSuggestions = keywordData.analysis?.suggestedImprovements as unknown;
  if (typeof rawSuggestions === 'string') {
    suggestionsText = rawSuggestions;
  } else if (Array.isArray(rawSuggestions)) {
    // Join array items into a readable sentence
    suggestionsText = rawSuggestions
      .map((it) => {
        if (typeof it === 'string') return it;
        if (it && typeof it === 'object') {
          // Attempt to extract a human-readable field; fallback to JSON
          const maybeText = (it as any).text || (it as any).message || (it as any).suggestion;
          return typeof maybeText === 'string' ? maybeText : JSON.stringify(it);
        }
        return String(it);
      })
      .join('\n');
  } else if (rawSuggestions && typeof rawSuggestions === 'object') {
    // Fallback to JSON string for unexpected object shapes to avoid React error #31
    suggestionsText = JSON.stringify(rawSuggestions);
  }

  return (
    <div>
      <StatusBadges analysisData={analysisData} />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Keywords Match</h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Match Percentage:</h3>
            <span className="text-lg text-gray-600">
              {safeMatchPct}% ({safeRating})
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Strong Matches - Blue */}
            {strongMatches.map((item) => (
              <span
                key={String((item as any)?.keyword ?? '')}
                className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-md hover:shadow-lg"
                title={`${item.status} - ${item.points} points`}
              >
                {String((item as any)?.keyword ?? '')}
              </span>
            ))}

            {/* Partial Matches - Gray */}
            {partialMatches.map((item) => (
              <span
                key={String((item as any)?.keyword ?? '')}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer hover:bg-gray-400 active:bg-gray-500 transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                title={`${item.status} - ${item.points} points`}
              >
                {String((item as any)?.keyword ?? '')}
              </span>
            ))}

            {/* Missing Keywords - Gray */}
            {missingKeywords.map((item) => (
              <span
                key={String((item as any)?.keyword ?? '')}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer hover:bg-gray-400 active:bg-gray-500 transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                title={`${item.status} - ${item.points} points`}
              >
                {String((item as any)?.keyword ?? '')}
              </span>
            ))}
          </div>

          {suggestionsText && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Suggestions</h4>
              <p className="text-blue-700 text-sm whitespace-pre-line">{suggestionsText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KeywordsSection;