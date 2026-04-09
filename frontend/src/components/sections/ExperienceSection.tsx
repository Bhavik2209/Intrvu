import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { AnalysisData } from '../../types/AnalysisData';
import DetailedAnalysisHeader from '../DetailedAnalysisHeader';

interface ExperienceSectionProps {
  analysisData: AnalysisData | null;
}

const ExperienceSection: React.FC<ExperienceSectionProps> = ({ analysisData }) => {
  const experienceData = analysisData?.detailed_analysis?.job_experience;

  // Placeholder/Loading State
  if (!analysisData || !experienceData) {
    return (
      <div className="animate-pulse py-8">
        <DetailedAnalysisHeader analysisData={null} />
        <div className="h-8 bg-gray-100 rounded-lg w-64 mb-6 mt-8"></div>
        <div className="h-14 bg-gray-50 rounded-2xl w-full mb-10"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-gray-100 rounded-3xl w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  const { score, analysis } = experienceData;
  const strongMatches = Array.isArray(analysis?.strongMatches) ? analysis.strongMatches : [];
  const partialMatches = Array.isArray(analysis?.partialMatches) ? analysis.partialMatches : [];

  const renderMatchCard = (
    item: { role?: string; notes?: string },
    index: number,
    type: 'strong' | 'partial'
  ) => {
    const isStrong = type === 'strong';

    return (
      <div
        key={`${type}-${index}`}
        className="bg-white border border-[#e5e7eb] rounded-xl px-4 py-3 transition-colors hover:border-[#cbd5e1]"
      >
        <div className="flex gap-3 items-start">
          <div
            className={`mt-0.5 w-4 h-4 rounded-[4px] flex items-center justify-center flex-shrink-0 ${
              isStrong ? 'bg-[#22c55e]/15' : 'bg-[#f59e0b]/15'
            }`}
          >
            {isStrong ? (
              <CheckCircle2 className="w-3 h-3 text-[#16a34a]" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-[#d97706]" />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#334155] leading-[1.45]">
              {item.role || 'Match insight unavailable'}
            </p>
            {item.notes && (
              <p className="text-[12px] text-[#64748b] mt-1 leading-[1.45]">
                {item.notes}
              </p>
            )}
          </div>
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
        <h2 className="text-xl font-black text-[#1e293b] mb-4 tracking-tight">Job Experience Alignment</h2>

        {/* Alignment Percentage Section */}
        <div className="bg-[#e5e7eb] rounded-xl px-4 py-3 flex items-center justify-between mb-5 border border-[#d1d5db]">
          <span className="text-[13px] font-semibold text-[#475569]">Alignment Percentage :</span>
          <span className="text-[13px] font-black text-[#1e293b]">
            {score.alignmentPercentage}% ( {score.rating} )
          </span>
        </div>

        <div className="bg-[#f1f5f9] rounded-2xl border border-[#e2e8f0] p-4 space-y-5">
          {/* Strong Matches Section */}
          <section>
            <h3 className="text-[15px] font-extrabold text-[#475569] mb-2">Strong Matches</h3>
            <div className="space-y-2.5">
              {strongMatches.map((item, index) => renderMatchCard(item, index, 'strong'))}
              {strongMatches.length === 0 && (
                <p className="text-[13px] text-[#64748b] italic p-3 bg-white rounded-xl text-center border border-dashed border-[#cbd5e1]">
                  No strong matches found.
                </p>
              )}
            </div>
          </section>

          {/* Partial Matches Section */}
          <section>
            <h3 className="text-[15px] font-extrabold text-[#475569] mb-2">Partial Matches</h3>
            <div className="space-y-2.5">
              {partialMatches.map((item, index) => renderMatchCard(item, index, 'partial'))}
              {partialMatches.length === 0 && (
                <p className="text-[13px] text-[#64748b] italic p-3 bg-white rounded-xl text-center border border-dashed border-[#cbd5e1]">
                  No partial matches found.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ExperienceSection;