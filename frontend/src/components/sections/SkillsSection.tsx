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

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
        <h2 className="text-xl font-extrabold text-gray-800 mb-10 tracking-tight">Skills Match</h2>

        {/* Skills Match Score */}
        <div className="flex items-center justify-between mb-12 bg-gray-50/50 rounded-2xl p-6 border border-gray-50">
          <div className="flex items-center gap-3">
            <span className={`text-3xl font-bold tabular-nums tracking-tighter ${safeMatchPct >= 80 ? 'text-emerald-500' :
              safeMatchPct >= 60 ? 'text-blue-500' : 'text-amber-500'
              }`}>
              {safeMatchPct}%
            </span>
            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold border tracking-widest shadow-sm uppercase ${safeMatchPct >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
              safeMatchPct >= 60 ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}>
              {safeRating}
            </span>
          </div>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Skills Match</span>
        </div>

        <div className="space-y-8">
          {/* Strong Matches */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Matched Skills</h3>
            <div className="grid grid-cols-1 gap-3">
              {/* Combine Hard and Soft Skills for a cleaner grid if they both exist */}
              {[...hardSkillMatches, ...softSkillMatches].map((skill, index) => (
                <div key={index} className="bg-green-50 border border-green-100 rounded-2xl p-4 cursor-pointer hover:bg-green-100/50 active:bg-green-200/50 transition-all duration-300 shadow-sm hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      <span className="text-green-600 text-lg">✅</span>
                    </div>
                    <span className="font-semibold text-gray-800 tracking-tight">{String((skill as any)?.skill ?? '')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Skills */}
          {missingSkills.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 text-rose-400">Missing Skills</h3>
              <div className="grid grid-cols-1 gap-3">
                {missingSkills.map((skill, index) => (
                  <div key={`missing-${index}`} className="bg-rose-50 border border-rose-100 rounded-2xl p-4 cursor-pointer hover:bg-rose-100/50 active:bg-rose-200/50 transition-all duration-300 shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                        <span className="text-rose-600 text-lg">{String((skill as any)?.symbol ?? '❌')}</span>
                      </div>
                      <span className="font-semibold text-gray-800 tracking-tight">{String((skill as any)?.skill ?? '')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Double Count Reductions */}
          {doubleCountReductions && doubleCountReductions.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Point Adjustments</h3>
              <div className="space-y-3">
                {doubleCountReductions.map((reduction, index) => (
                  <div key={`reduction-${index}`} className="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <span className="text-blue-600 text-lg">ℹ️</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 block mb-1">{String((reduction as any)?.skill ?? '')}</span>
                        <p className="text-xs text-blue-700/80 font-medium leading-relaxed">
                          {String((reduction as any)?.reason ?? '')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestionsText && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="text-xl">💡</span>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-blue-900 mb-1 tracking-tight uppercase opacity-60">Improvement Strategy</h4>
                  <p className="text-blue-700/80 text-sm font-medium leading-relaxed whitespace-pre-line">{suggestionsText}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillsSection;