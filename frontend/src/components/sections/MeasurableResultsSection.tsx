import React from 'react';
import { CheckCircle2, Lightbulb } from 'lucide-react';
import { AnalysisData } from '../../types/AnalysisData';
import DetailedAnalysisHeader from '../DetailedAnalysisHeader';

interface MeasurableResultsSectionProps {
  analysisData: AnalysisData | null;
}

const MeasurableResultsSection: React.FC<MeasurableResultsSectionProps> = ({ analysisData }) => {
  const measurableDataCheck = analysisData?.detailed_analysis?.measurable_results;

  // Loading/Missing State
  if (!analysisData || !measurableDataCheck) {
    return (
      <div className="animate-pulse py-6">
        <DetailedAnalysisHeader analysisData={null} />
        <div className="h-6 bg-gray-100 rounded-lg w-48 mb-4 mt-6"></div>
        <div className="h-48 bg-gray-50 rounded-3xl w-full"></div>
      </div>
    );
  }

  const measurableData = analysisData.detailed_analysis.measurable_results;
  const measurableResults = Array.isArray(measurableData.analysis?.measurableResults)
    ? measurableData.analysis.measurableResults
    : [];
  const opportunitiesForMetrics = Array.isArray(measurableData.analysis?.opportunitiesForMetrics)
    ? measurableData.analysis.opportunitiesForMetrics
    : [];

  const measurableCount = typeof measurableData.score?.measurableResultsCount === 'number'
    ? measurableData.score.measurableResultsCount
    : measurableResults.length;

  const suggestionsList = typeof measurableData.analysis?.suggestedImprovements === 'string'
    ? measurableData.analysis.suggestedImprovements.split('. ').map((s) => s.trim()).filter(Boolean)
    : [];

  const makeUniqueKey = (() => {
    const seen: Record<string, number> = {};
    return (group: string, text: string) => {
      const base = `${group}-${text.toLowerCase().trim()}`;
      seen[base] = (seen[base] ?? 0) + 1;
      return `${base}-${seen[base]}`;
    };
  })();

  return (
    <div className="min-h-full flex flex-col max-w-4xl mx-auto py-3">
      {/* Shared Header */}
      <DetailedAnalysisHeader analysisData={analysisData} />

      {/* Main Content Area */}
      <div className="mt-2">
        <h2 className="text-xl font-black text-[#1e293b] mb-3 tracking-tight">Measurable Results Analysis</h2>

        <div className="space-y-4">
          {/* Measurable Results Found Section */}
          <div>
            <div className="bg-[#f1f5f9] rounded-2xl p-4 border border-[#e2e8f0]">
              <div className="bg-[#e5e7eb] rounded-xl px-4 py-3 flex items-center justify-between mb-4 border border-[#d1d5db]">
                <span className="text-[13px] font-semibold text-[#475569]">Measurable Results Count:</span>
                <span className="text-[13px] font-black text-[#1e293b]">{measurableCount}</span>
              </div>

              <h3 className="text-[15px] font-extrabold text-[#475569] mb-2">Measurable Results Found</h3>

              {measurableResults.length > 0 ? (
                <div className="space-y-2.5">
                  {measurableResults.map((result) => {
                    const metric = String(result?.metric || 'Result').trim();
                    const bulletPoint = String(result?.bulletPoint || '').trim();
                    return (
                    <div key={makeUniqueKey('measurable', `${metric}-${bulletPoint}`)} className="bg-white border border-[#e5e7eb] rounded-xl px-3 py-3 flex items-start gap-3">
                      <div className="w-4 h-4 rounded-[4px] flex items-center justify-center bg-[#22c55e]/15 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-[#16a34a]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[13px] font-bold text-[#334155] leading-tight">
                          {metric}
                        </span>
                        {bulletPoint && <p className="text-[12px] text-[#64748b] mt-1 leading-[1.45]">{bulletPoint}</p>}
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[13px] text-[#64748b] italic p-3 bg-white rounded-xl text-center border border-dashed border-[#cbd5e1]">No measurable results found</p>
              )}

              {/* Opportunities for Metrics Section */}
              {opportunitiesForMetrics.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-[15px] font-extrabold text-[#475569] mb-2">Opportunities for Metrics</h3>
                  <div className="space-y-2.5">
                    {opportunitiesForMetrics.map((opportunity) => {
                      const bulletPoint = String(opportunity?.bulletPoint || '').trim();
                      const suggestion = String(opportunity?.suggestion || '').trim();
                      return (
                      <div key={makeUniqueKey('opportunity', `${bulletPoint}-${suggestion}`)} className="bg-white border border-[#e5e7eb] rounded-xl px-3 py-3">
                        <div className="flex items-start gap-3">
                          <div className="w-4 h-4 rounded-[4px] flex items-center justify-center bg-[#f59e0b]/15 mt-0.5">
                            <Lightbulb className="w-3 h-3 text-[#d97706]" />
                          </div>
                          <div>
                            {bulletPoint && <p className="text-[13px] font-semibold text-[#334155] leading-[1.4]">{bulletPoint}</p>}
                            {suggestion && <p className="text-[12px] text-[#64748b] mt-1 leading-[1.45]">{suggestion}</p>}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Suggestions Section */}
          {suggestionsList.length > 0 && (
            <div className="bg-[#f1f5f9] rounded-2xl p-4 border border-[#e2e8f0]">
              <h3 className="text-[15px] font-extrabold text-[#475569] mb-2">Suggestions</h3>
              <div className="space-y-2">
                {suggestionsList.map((suggestion) => {
                  const suggestionText = suggestion.endsWith('.') ? suggestion : `${suggestion}.`;
                  return (
                    <div key={makeUniqueKey('suggestion', suggestion)} className="flex items-start gap-2.5">
                      <span className="text-[#64748b] mt-1 text-base leading-none">•</span>
                      <p className="text-[#334155] text-[13px] leading-[1.45]">{suggestionText}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeasurableResultsSection;