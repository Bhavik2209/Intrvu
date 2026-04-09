import React from 'react';
import { AnalysisData } from '../../types/AnalysisData';
import DetailedAnalysisHeader from '../DetailedAnalysisHeader';

interface KeywordsSectionProps {
  analysisData: AnalysisData | null;
}

const KeywordsSection: React.FC<KeywordsSectionProps> = ({ analysisData }) => {
  const keywordData = analysisData?.detailed_analysis?.keyword_match;

  // Placeholder/Loading State
  if (!analysisData || !keywordData) {
    return (
      <div className="animate-pulse py-8">
        <div className="h-8 bg-gray-100 rounded-lg w-48 mb-6"></div>
        <div className="h-12 bg-gray-50 rounded-2xl w-full mb-8"></div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-10 bg-gray-100 rounded-full w-24"></div>
          ))}
        </div>
      </div>
    );
  }

  const safeMatchPct = keywordData.score?.matchPercentage ?? 0;
  const safeRating = keywordData.score?.rating ?? 'Neutral';

  const strongMatches = Array.isArray(keywordData.analysis?.strongMatches) ? keywordData.analysis.strongMatches : [];
  const partialMatches = Array.isArray(keywordData.analysis?.partialMatches) ? keywordData.analysis.partialMatches : [];
  const missingKeywords = Array.isArray(keywordData.analysis?.missingKeywords) ? keywordData.analysis.missingKeywords : [];

  const toKeywordString = (item: any) => String(item?.keyword ?? item);

  const matchedKeywords = [...strongMatches, ...partialMatches].map(toKeywordString);
  const missingKeywordStrings = missingKeywords.map(toKeywordString);

  const makeUniqueKey = (() => {
    const seen: Record<string, number> = {};
    return (group: string, value: string) => {
      const base = `${group}-${value.toLowerCase().trim()}`;
      seen[base] = (seen[base] ?? 0) + 1;
      return `${base}-${seen[base]}`;
    };
  })();

  return (
    <div className="min-h-full flex flex-col max-w-4xl mx-auto py-3">
      {/* Shared Header */}
      <DetailedAnalysisHeader analysisData={analysisData} />

      {/* Keywords Match Section */}
      <section className="mt-2 mb-8">
        <h2 className="text-xl font-black text-[#1e293b] mb-4 tracking-tight">Keywords Match</h2>

        <div className="bg-[#f8fafc] border border-[#f1f5f9] rounded-2xl p-4 flex items-center justify-between mb-8 shadow-sm">
          <span className="text-sm font-bold text-[#64748b]">Match Percentage :</span>
          <span className="text-sm font-black text-[#1e293b]">
            {safeMatchPct}% ( {safeRating} )
          </span>
        </div>

        {/* Dynamic Keywords Tags Grid */}
        <div className="flex flex-wrap gap-3">
          {matchedKeywords.map((keyword) => (
            <div
              key={makeUniqueKey('matched', keyword)}
              className="px-6 py-2.5 bg-[#4f46e5] text-white text-sm font-extrabold rounded-full shadow-sm hover:bg-[#4338ca] transition-colors cursor-default"
            >
              {keyword}
            </div>
          ))}

          {missingKeywordStrings.map((keyword) => (
            <div
              key={makeUniqueKey('missing', keyword)}
              className="px-6 py-2.5 bg-[#f1f5f9] text-[#475569] text-sm font-extrabold rounded-full border border-transparent hover:border-gray-300 transition-all cursor-default"
            >
              {keyword}
            </div>
          ))}

          {matchedKeywords.length === 0 && missingKeywordStrings.length === 0 && (
            <p className="text-sm text-[#94a3b8] italic p-4 text-center w-full">No keywords found for this role.</p>
          )}
        </div>
      </section>

      {/* Footer removed to avoid duplication with global footer */}
    </div>
  );
};

export default KeywordsSection;