import React from 'react';
import { Check, CheckCircle2 } from 'lucide-react';
import { AnalysisData } from '../../types/AnalysisData';
import DetailedAnalysisHeader from '../DetailedAnalysisHeader';

interface ActionVerbsSectionProps {
  analysisData: AnalysisData | null;
}

const ActionVerbsSection: React.FC<ActionVerbsSectionProps> = ({ analysisData }) => {
  const actionVerbsData = analysisData?.detailed_analysis?.action_words;

  // Placeholder/Loading State
  if (!analysisData || !actionVerbsData) {
    return (
      <div className="animate-pulse py-6">
        <DetailedAnalysisHeader analysisData={null} />
        <div className="h-6 bg-gray-100 rounded-lg w-48 mb-4 mt-6"></div>
        <div className="h-48 bg-gray-50 rounded-3xl w-full"></div>
      </div>
    );
  }

  const { score, analysis } = actionVerbsData;
  const strongActionVerbs = Array.isArray(analysis?.strongActionVerbs) ? analysis.strongActionVerbs : [];
  const weakActionVerbs = Array.isArray(analysis?.weakActionVerbs) ? analysis.weakActionVerbs : [];
  const missingActionVerbs = Array.isArray(analysis?.clichesAndBuzzwords) ? analysis.clichesAndBuzzwords : [];


  // Split suggestions into a list if it's a string
  const suggestionsList = typeof analysis.suggestedImprovements === 'string'
    ? analysis.suggestedImprovements.split('. ').filter(s => s.trim().length > 0)
    : [];

  const safeVerbPercentage = typeof score?.actionVerbPercentage === 'number'
    ? Math.max(0, Math.min(100, Math.round(score.actionVerbPercentage)))
    : 0;

  const makeUniqueKey = (() => {
    const seen: Record<string, number> = {};
    return (group: string, text: string) => {
      const base = `${group}-${text.toLowerCase().trim()}`;
      seen[base] = (seen[base] ?? 0) + 1;
      return `${base}-${seen[base]}`;
    };
  })();

  const renderVerbCard = (item: any, type: 'strong' | 'weak') => {
    const isStrong = type === 'strong';
    const actionVerb = String(item?.actionVerb || item?.verb || 'Action Verb').trim();
    const bulletPoint = String(item?.bulletPoint || item?.context || '').trim();
    const replacement = String(item?.suggestedReplacement || '').trim();

    return (
      <div
        key={makeUniqueKey(type, `${actionVerb}-${bulletPoint}`)}
        className="bg-white border border-[#e5e7eb] rounded-xl px-3 py-3 flex items-start gap-3"
      >
        <div className={`mt-0.5 w-4 h-4 rounded-[4px] flex items-center justify-center ${isStrong ? 'bg-[#22c55e]/15' : 'bg-[#f59e0b]/15'}`}>
          {isStrong ? (
            <CheckCircle2 className="w-3 h-3 text-[#16a34a]" />
          ) : (
            <Check className="w-3 h-3 text-[#d97706]" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-[#334155] leading-tight">{actionVerb}</p>
          {bulletPoint && (
            <p className="text-[12px] text-[#64748b] mt-1 leading-[1.45]">{bulletPoint}</p>
          )}
          {replacement && (
            <p className="text-[11px] font-semibold text-[#d97706] mt-1.5">Suggested replacement: {replacement}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full flex flex-col max-w-4xl mx-auto py-3">
      {/* Shared Header */}
      <DetailedAnalysisHeader analysisData={analysisData} />

      {/* Main Content Area */}
      <div className="mt-2">
        <h2 className="text-xl font-black text-[#1e293b] mb-3 tracking-tight">Action Verbs Analysis</h2>

        <div className="bg-[#f1f5f9] rounded-2xl p-4 border border-[#e2e8f0]">
          <div className="bg-[#e5e7eb] rounded-xl px-4 py-3 flex items-center justify-between mb-4 border border-[#d1d5db]">
            <span className="text-[13px] font-semibold text-[#475569]">Action Verbs Percentage :</span>
            <span className="text-[13px] font-black text-[#1e293b]">{safeVerbPercentage} %</span>
          </div>

          <div className="space-y-4">
            {/* Strong Action Verbs Section */}
            <section>
              <h3 className="text-[15px] font-extrabold text-[#475569] mb-2">Strong Action Verbs</h3>
              <div className="space-y-2.5">
                {strongActionVerbs.length > 0 ? (
                  strongActionVerbs.map((item) => renderVerbCard(item, 'strong'))
                ) : (
                  <p className="text-[13px] text-[#64748b] italic p-3 bg-white rounded-xl text-center border border-dashed border-[#cbd5e1]">No strong action verbs found</p>
                )}
              </div>
            </section>

            {/* Weak Action Verbs Section */}
            <section>
              <h3 className="text-[15px] font-extrabold text-[#475569] mb-2">Weak Action Verbs</h3>
              <div className="space-y-2.5">
                {weakActionVerbs.length > 0 ? (
                  weakActionVerbs.map((item) => renderVerbCard(item, 'weak'))
                ) : (
                  <p className="text-[13px] text-[#64748b] italic p-3 bg-white rounded-xl text-center border border-dashed border-[#cbd5e1]">No weak action verbs found</p>
                )}
              </div>
            </section>

            {/* Missing Action Verbs Section */}
            <section>
              <h3 className="text-[15px] font-extrabold text-[#475569] mb-2">Missing Action Verbs</h3>
              {missingActionVerbs.length > 0 ? (
                <div className="space-y-2.5">
                  {missingActionVerbs.map((item) => {
                    const value = String(item?.actionVerb || item?.term || item || '').trim();
                    return (
                      <div
                        key={makeUniqueKey('missing', value)}
                        className="bg-white border border-[#e5e7eb] rounded-xl px-3 py-3 flex items-center gap-3"
                      >
                        <div className="w-4 h-4 rounded-[4px] flex items-center justify-center bg-[#f59e0b]/15">
                          <Check className="w-3 h-3 text-[#d97706]" />
                        </div>
                        <span className="text-[13px] font-semibold text-[#475569] leading-tight">{value}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[13px] text-[#64748b] italic p-3 bg-white rounded-xl text-center border border-dashed border-[#cbd5e1]">No missing action verbs found</p>
              )}
            </section>
          </div>
        </div>

        {/* Suggestions Section */}
        <div className="mt-4">
          <div className="bg-[#f1f5f9] rounded-2xl p-4 border border-[#e2e8f0]">
            <h3 className="text-[15px] font-extrabold text-[#475569] mb-2">Suggestions</h3>
            <div className="space-y-2">
              {suggestionsList.length > 0 ? (
                suggestionsList.map((suggestion) => {
                  const trimmedSuggestion = suggestion.trim();
                  const suggestionText = trimmedSuggestion.endsWith('.')
                    ? trimmedSuggestion
                    : `${trimmedSuggestion}.`;

                  return (
                  <div key={makeUniqueKey('suggestion', suggestion)} className="flex items-start gap-2.5">
                    <span className="text-[#64748b] mt-1 text-base leading-none">•</span>
                    <p className="text-[#334155] text-[13px] leading-[1.45]">
                      {suggestionText}
                    </p>
                  </div>
                  );
                })
              ) : (
                <div className="text-[#64748b] italic text-[13px]">
                  No suggestions available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionVerbsSection;