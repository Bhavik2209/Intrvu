import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { AnalysisData } from '../../types/AnalysisData';
import DetailedAnalysisHeader from '../DetailedAnalysisHeader';

interface SkillsSectionProps {
  analysisData: AnalysisData | null;
}

const SkillsSection: React.FC<SkillsSectionProps> = ({ analysisData }) => {
  const skillsData = analysisData?.detailed_analysis?.skills_tools;

  // Placeholder/Loading State
  if (!analysisData || !skillsData) {
    return (
      <div className="animate-pulse py-8">
        <DetailedAnalysisHeader analysisData={null} />
        <div className="h-8 bg-gray-100 rounded-lg w-48 mb-6 mt-8"></div>
        <div className="h-64 bg-gray-50 rounded-3xl w-full"></div>
      </div>
    );
  }

  const fallbackMatchPct = skillsData.score?.pointsAwarded && skillsData.score?.maxPoints
    ? Math.round((skillsData.score.pointsAwarded / skillsData.score.maxPoints) * 100)
    : 0;
  const safeMatchPct = skillsData.score?.matchPercentage ?? fallbackMatchPct;

  let computedRating = 'Fair alignment';
  if (safeMatchPct >= 80) {
    computedRating = 'Excellent Match';
  } else if (safeMatchPct >= 60) {
    computedRating = 'Good alignment';
  }
  const safeRating = skillsData.score?.rating || computedRating;

  const hardSkillMatches = Array.isArray(skillsData.analysis?.hardSkillMatches) ? skillsData.analysis.hardSkillMatches : [];
  const softSkillMatches = Array.isArray(skillsData.analysis?.softSkillMatches) ? skillsData.analysis.softSkillMatches : [];
  const missingSkills = Array.isArray(skillsData.analysis?.missingSkills) ? skillsData.analysis.missingSkills : [];

  // Combine all matches for the "Matched" subsection
  const allMatchedSkills = [...hardSkillMatches, ...softSkillMatches];

  const normalizeSkillText = (skill: any) => String(skill?.skill || skill || '').trim();

  const matchedKeyCounter: Record<string, number> = {};
  const missingKeyCounter: Record<string, number> = {};

  const compactItem = (item: any, type: 'matched' | 'missing') => {
    const isMatched = type === 'matched';
    const label = normalizeSkillText(item) || 'Skill insight unavailable';
    const counterMap = isMatched ? matchedKeyCounter : missingKeyCounter;
    const keyBase = `${type}-${label.toLowerCase()}`;
    counterMap[keyBase] = (counterMap[keyBase] ?? 0) + 1;
    const uniqueKey = `${keyBase}-${counterMap[keyBase]}`;

    return (
      <div
        key={uniqueKey}
        className="bg-white border border-[#e5e7eb] rounded-xl px-3 py-3 flex items-center gap-3"
      >
        <div className={`w-4 h-4 rounded-[4px] flex items-center justify-center ${isMatched ? 'bg-[#22c55e]/15' : 'bg-[#f59e0b]/15'}`}>
          {isMatched ? (
            <CheckCircle2 className="w-3 h-3 text-[#16a34a]" />
          ) : (
            <AlertTriangle className="w-3 h-3 text-[#d97706]" />
          )}
        </div>
        <span className="text-[13px] font-semibold text-[#475569] leading-tight">{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-full flex flex-col max-w-4xl mx-auto py-3">
      {/* Shared Header */}
      <DetailedAnalysisHeader analysisData={analysisData} />

      {/* Main Content Area */}
      <div className="mt-2">
        <h2 className="text-xl font-black text-[#1e293b] mb-4 tracking-tight">Skills Match</h2>

        <div className="bg-[#f1f5f9] rounded-2xl p-4 border border-[#e2e8f0]">

          {/* Match Percentage Section */}
          <div className="bg-[#e5e7eb] rounded-xl px-4 py-3 flex items-center justify-between mb-4 border border-[#d1d5db]">
            <span className="text-[13px] font-semibold text-[#475569]">Match percentage</span>
            <span className="text-[13px] font-black text-[#1e293b]">
              {safeMatchPct}% ( {safeRating} )
            </span>
          </div>

          <div className="space-y-5">
            {/* Strong Matches Section */}
            <section>
              <h3 className="text-[15px] font-extrabold text-[#475569] mb-3">Strong Matches</h3>

              <div className="space-y-5">
                {/* Matched Subsection */}
                <div className="space-y-2.5">
                  <h4 className="text-[15px] font-extrabold text-[#475569]">Matched</h4>
                  <div className="space-y-2.5">
                    {allMatchedSkills.map((skill) => compactItem(skill, 'matched'))}
                    {allMatchedSkills.length === 0 && (
                      <p className="text-[13px] text-[#64748b] italic p-3 bg-white rounded-xl text-center border border-dashed border-[#cbd5e1]">
                        No matched skills found.
                      </p>
                    )}
                  </div>
                </div>

                {/* Missing Subsection */}
                <div className="space-y-2.5">
                  <h4 className="text-[15px] font-extrabold text-[#475569]">Missing</h4>
                  <div className="space-y-2.5">
                    {missingSkills.map((skill) => compactItem(skill, 'missing'))}
                    {missingSkills.length === 0 && (
                      <p className="text-[13px] text-[#64748b] italic p-3 bg-white rounded-xl text-center border border-dashed border-[#cbd5e1]">
                        No missing skills.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsSection;