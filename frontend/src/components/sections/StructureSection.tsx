import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { AnalysisData } from '../../types/AnalysisData';
import DetailedAnalysisHeader from '../DetailedAnalysisHeader';

interface StructureSectionProps {
  analysisData: AnalysisData | null;
}

const StructureSection: React.FC<StructureSectionProps> = ({ analysisData }) => {
  const structureData = analysisData?.detailed_analysis?.resume_structure;

  const completedMustHave = Number(structureData?.score?.completedMustHave || 0);
  const totalMustHave = Number(structureData?.score?.totalMustHave || 0);
  const completedNiceToHave = Number(structureData?.score?.completedNiceToHave || 0);
  const totalNiceToHave = Number((structureData as any)?.score?.totalNiceToHave || 0);
  const mustHavePct = totalMustHave > 0
    ? Math.round((completedMustHave / totalMustHave) * 100)
    : 0;
  const niceToHavePct = totalNiceToHave > 0
    ? Math.round((completedNiceToHave / totalNiceToHave) * 100)
    : 0;

  // Placeholder/Loading State
  if (!analysisData || !structureData) {
    return (
      <div className="animate-pulse py-6">
        <DetailedAnalysisHeader analysisData={null} />
        <div className="h-6 bg-gray-100 rounded-lg w-48 mb-4 mt-6"></div>
        <div className="h-48 bg-gray-50 rounded-3xl w-full"></div>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    const isIncluded = normalizedStatus.includes('completed') || normalizedStatus.includes('included');

    if (isIncluded) {
      return {
        text: 'Included',
        bg: 'bg-[#d1fae5]',
        textColor: 'text-[#10b981]',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
      };
    } else {
      return {
        text: 'Not included',
        bg: 'bg-[#fed7aa]',
        textColor: 'text-[#f97316]',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-[#f97316]" />
      };
    }
  };

  return (
    <div className="min-h-full flex flex-col max-w-4xl mx-auto py-3">
      {/* Shared Header */}
      <DetailedAnalysisHeader analysisData={analysisData} />

      {/* Main Content Area */}
      <div className="mt-2">
        <h2 className="text-xl font-black text-[#1e293b] mb-3 tracking-tight">Resume Structure Analysis</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-[#eef2ff] border border-[#e0e7ff] rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#4338ca] opacity-80">Must-Have Coverage</p>
              <p className="text-[15px] font-black text-[#1e293b] mt-1">{completedMustHave}/{totalMustHave} ({mustHavePct}%)</p>
            </div>
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#475569] opacity-80">Nice-to-Have Coverage</p>
              <p className="text-[15px] font-black text-[#1e293b] mt-1">{completedNiceToHave}/{totalNiceToHave} ({niceToHavePct}%)</p>
            </div>
          </div>

          {/* Section Status Area */}
          <div>
            <div className="bg-[#f1f5f9] rounded-2xl p-4 border border-[#e2e8f0]">
              <h3 className="text-[15px] font-extrabold text-[#475569] mb-2">Section Status</h3>

              <div className="space-y-2">
                {structureData.analysis.sectionStatus.map((section, index) => {
                  const statusConfig = getStatusConfig(section.status);
                  return (
                    <div
                      key={`${section.section}-${section.type || 'base'}-${section.status}-${index}`}
                      className="bg-white border border-[#e5e7eb] rounded-xl px-3 py-2.5 flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-[#475569]">
                          {section.section}
                        </span>
                        {section.type && (
                          <span className="text-[9px] text-[#94a3b8] uppercase tracking-wider font-bold mt-0.5">
                            {section.type}
                          </span>
                        )}
                      </div>

                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${statusConfig.bg}`}>
                        {statusConfig.icon}
                        <span className={`text-[11px] font-bold whitespace-nowrap ${statusConfig.textColor}`}>
                          {statusConfig.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {structureData.analysis.sectionStatus.length === 0 && (
                  <p className="text-[13px] text-[#64748b] italic p-3 bg-white rounded-xl text-center border border-dashed border-[#cbd5e1]">
                    No section data available.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {structureData.analysis.suggestedImprovements && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-base">💡</span>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-blue-900 mb-1 tracking-tight uppercase opacity-60">Structure Improvement Strategy</h4>
                  <p className="text-blue-700/80 text-[12px] font-medium leading-[1.45] whitespace-pre-line">
                    {structureData.analysis.suggestedImprovements}
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

export default StructureSection;