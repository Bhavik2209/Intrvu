import React from 'react';
import StatusBadges from '../StatusBadges';
import { AnalysisData } from '../../types/AnalysisData';

interface SkillsSectionProps {
  analysisData: AnalysisData | null;
}

const SkillsSection: React.FC<SkillsSectionProps> = ({ analysisData }) => {
  const skillsData = analysisData?.detailed_analysis?.skills_tools;

  if (!analysisData || !skillsData) {
    return (
      <div>
        <StatusBadges analysisData={null} />
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-3">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  const safeMatchPct = skillsData.score?.matchPercentage !== undefined
    ? skillsData.score.matchPercentage
    : (skillsData.score?.pointsAwarded && skillsData.score?.maxPoints
      ? Math.round((skillsData.score.pointsAwarded / skillsData.score.maxPoints) * 100)
      : 0);
  const safeRating = skillsData.score?.rating || '';

  const hardSkillMatches = Array.isArray(skillsData.analysis?.hardSkillMatches)
    ? skillsData.analysis.hardSkillMatches
    : [];
  const softSkillMatches = Array.isArray(skillsData.analysis?.softSkillMatches)
    ? skillsData.analysis.softSkillMatches
    : [];
  const missingSkills = Array.isArray(skillsData.analysis?.missingSkills)
    ? skillsData.analysis.missingSkills
    : [];
  const doubleCountReductions = Array.isArray(skillsData.analysis?.doubleCountReductions)
    ? skillsData.analysis.doubleCountReductions
    : [];

  // Normalize suggestedImprovements to a safe string for rendering
  let suggestionsText: string | null = null;
  const rawSuggestions = skillsData.analysis?.suggestedImprovements as unknown;
  if (typeof rawSuggestions === 'string') {
    suggestionsText = rawSuggestions;
  } else if (Array.isArray(rawSuggestions)) {
    suggestionsText = rawSuggestions
      .map((it) => {
        if (typeof it === 'string') return it;
        if (it && typeof it === 'object') {
          const maybeText = (it as any).text || (it as any).message || (it as any).suggestion;
          return typeof maybeText === 'string' ? maybeText : JSON.stringify(it);
        }
        return String(it);
      })
      .join('\n');
  } else if (rawSuggestions && typeof rawSuggestions === 'object') {
    suggestionsText = JSON.stringify(rawSuggestions);
  }

  return (
    <div>
      <StatusBadges analysisData={analysisData} />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Skills Match</h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Match percentage</h3>
            <span className="text-lg text-gray-600">
              {safeMatchPct}% ({safeRating})
            </span>
          </div>

          {/* Strong Matches */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Strong Matches</h3>
            <h4 className="font-medium text-gray-600 mb-3">Matched</h4>
            <div className="space-y-3">
              {/* Hard Skills */}
              {hardSkillMatches.map((skill, index) => (
                <div key={`hard-${index}`} className="bg-green-50 border border-green-200 rounded-lg p-4 cursor-pointer hover:bg-green-100 active:bg-green-200 transition-all duration-200 transform hover:scale-102 active:scale-98 shadow-sm hover:shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-lg">✅</span>
                    <div>
                      <span className="font-medium text-gray-700">{String((skill as any)?.skill ?? '')}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Soft Skills */}
              {softSkillMatches.map((skill, index) => (
                <div key={`soft-${index}`} className="bg-green-50 border border-green-200 rounded-lg p-4 cursor-pointer hover:bg-green-100 active:bg-green-200 transition-all duration-200 transform hover:scale-102 active:scale-98 shadow-sm hover:shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-lg">✅</span>
                    <div>
                      <span className="font-medium text-gray-700">{String((skill as any)?.skill ?? '')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Skills */}
          {missingSkills.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Missing</h3>
              <div className="space-y-3">
                {missingSkills.map((skill, index) => (
                  <div key={`missing-${index}`} className="bg-orange-50 border border-orange-200 rounded-lg p-4 cursor-pointer hover:bg-orange-100 active:bg-orange-200 transition-all duration-200 transform hover:scale-102 active:scale-98 shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600 text-lg">{String((skill as any)?.symbol ?? '❌')}</span>
                      <div>
                        <span className="font-medium text-gray-700">{String((skill as any)?.skill ?? '')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Double Count Reductions */}
          {doubleCountReductions && doubleCountReductions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Point Adjustments</h3>
              <div className="space-y-3">
                {doubleCountReductions.map((reduction, index) => (
                  <div key={`reduction-${index}`} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 text-lg">ℹ️</span>
                      <div>
                        <span className="font-medium text-gray-700">{String((reduction as any)?.skill ?? '')}</span>
                        <div className="text-xs text-blue-700">
                          {String((reduction as any)?.reason ?? '')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
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

export default SkillsSection;