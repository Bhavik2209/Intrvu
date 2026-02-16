import React from 'react';
import StatusBadges from '../StatusBadges';
import { AnalysisData } from '../../types/AnalysisData';
import { Info, Lightbulb, CheckCircle2 } from 'lucide-react';

interface KeywordsSectionProps {
  analysisData: AnalysisData | null;
}

const KeywordsSection: React.FC<KeywordsSectionProps> = ({ analysisData }) => {
  const keywordDataCheck = analysisData?.detailed_analysis?.keyword_match;

  if (!analysisData || !keywordDataCheck) {
    return (
      <div>
        <StatusBadges analysisData={null} />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-100 rounded-lg w-1/3 mb-8"></div>
            <div className="flex gap-8 items-center mb-10">
              <div className="w-24 h-24 bg-gray-100 rounded-full"></div>
              <div className="space-y-3 flex-1">
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                <div className="h-8 bg-gray-100 rounded w-3/4"></div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="h-10 bg-gray-100 rounded-full w-full"></div>
              ))}
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
    : 'Neutral';

  const strongMatches = Array.isArray(keywordData.analysis?.strongMatches)
    ? keywordData.analysis.strongMatches
    : [];
  const partialMatches = Array.isArray(keywordData.analysis?.partialMatches)
    ? keywordData.analysis.partialMatches
    : [];
  const missingKeywords = Array.isArray(keywordData.analysis?.missingKeywords)
    ? keywordData.analysis.missingKeywords
    : [];

  // Normalize suggestionsText
  let suggestionsText: string | null = null;
  const rawSuggestions = keywordData.analysis?.suggestedImprovements as unknown;
  if (typeof rawSuggestions === 'string') suggestionsText = rawSuggestions;
  else if (Array.isArray(rawSuggestions)) suggestionsText = rawSuggestions.join('\n');

  const getRatingStyle = (rating: string) => {
    const r = rating.toLowerCase();
    if (r.includes('excellent') || r.includes('good') || r.includes('high'))
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (r.includes('average') || r.includes('fair') || r.includes('moderate'))
      return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-rose-100 text-rose-700 border-rose-200';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-blue-500';
    return 'text-amber-500';
  };

  return (
    <div className="space-y-6">
      <StatusBadges analysisData={analysisData} />

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 transition-all duration-500">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">Keywords Match</h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-semibold text-gray-500 border border-gray-100">
            <Info className="w-3.5 h-3.5" />
            BASED ON JOB DESCRIPTION
          </div>
        </div>

        {/* Score Overview */}
        <div className="flex items-center justify-between mb-12 bg-gray-50/50 rounded-2xl p-6 border border-gray-50 transition-all hover:bg-gray-50">
          <div className="flex items-center gap-4">
            <span className={`text-3xl font-bold leading-none ${getScoreColor(safeMatchPct)} tabular-nums tracking-tighter`}>
              {safeMatchPct}%
            </span>
            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold border tracking-widest shadow-sm ${getRatingStyle(safeRating)}`}>
              {safeRating.toUpperCase()}
            </span>
          </div>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Overall Match</span>
        </div>

        <div className="space-y-8">
          {/* Matched Keywords */}
          {(strongMatches.length > 0 || partialMatches.length > 0) && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Matched Keywords</h4>
                <span className="ml-auto text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {strongMatches.length + partialMatches.length} FOUND
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {[...strongMatches, ...partialMatches].map((item, idx) => (
                  <div
                    key={idx}
                    className="group relative flex items-center gap-2 bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-md px-4 py-2 rounded-xl transition-all duration-300 cursor-default hover:-translate-y-0.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">
                      {String((item as any)?.keyword ?? item)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Keywords */}
          {missingKeywords.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-rose-500 rounded-full"></div>
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">High Impact Missing</h4>
                <span className="ml-auto text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                  {missingKeywords.length} REQUIRED
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5 opacity-80">
                {missingKeywords.map((item, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center gap-2 bg-gray-50 border border-transparent hover:border-rose-300 hover:bg-rose-50/30 px-4 py-2 rounded-xl transition-all duration-300 cursor-default"
                  >
                    <span className="text-sm font-medium text-gray-500 group-hover:text-rose-700">
                      {String((item as any)?.keyword ?? item)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Suggestions */}
          {suggestionsText && (
            <div className="relative overflow-hidden bg-blue-50/50 border border-blue-100 rounded-3xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-blue-100/30 rounded-full blur-2xl"></div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    Optimization Suggestions
                  </h4>
                  <p className="text-blue-800/80 text-sm leading-relaxed whitespace-pre-line">
                    {suggestionsText}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KeywordsSection;