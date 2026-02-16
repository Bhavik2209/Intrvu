import React from 'react';
import StatusBadges from '../StatusBadges';
import { AnalysisData } from '../../types/AnalysisData';

interface ExperienceSectionProps {
  analysisData: AnalysisData | null;
}

const ExperienceSection: React.FC<ExperienceSectionProps> = ({ analysisData }) => {
  const experienceData = analysisData?.detailed_analysis?.job_experience;

  if (!analysisData || !experienceData) {
    return (
      <div>
        <StatusBadges analysisData={null} />
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <StatusBadges analysisData={analysisData} />

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
        <h2 className="text-xl font-extrabold text-gray-800 mb-10 tracking-tight">Job Experience Alignment</h2>

        {/* Experience Match Score */}
        <div className="flex items-center justify-between mb-12 bg-gray-50/50 rounded-2xl p-6 border border-gray-50">
          <div className="flex items-center gap-3">
            <span className={`text-3xl font-bold tabular-nums tracking-tighter ${experienceData.score.alignmentPercentage >= 80 ? 'text-emerald-500' :
              experienceData.score.alignmentPercentage >= 60 ? 'text-blue-500' : 'text-amber-500'
              }`}>
              {experienceData.score.alignmentPercentage}%
            </span>
            <span className={`px-3 py-1 rounded-lg text-[9px] font-bold border tracking-widest shadow-sm uppercase ${experienceData.score.alignmentPercentage >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
              experienceData.score.alignmentPercentage >= 60 ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}>
              {experienceData.score.rating}
            </span>
          </div>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-4">Experience Alignment</span>
        </div>

        <div className="space-y-8">
          {/* Strong Matches */}
          {experienceData.analysis.strongMatches.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Strong Matches</h3>
              <div className="space-y-4">
                {experienceData.analysis.strongMatches.map((match, index) => (
                  <div key={index} className="bg-green-50 border border-green-100 rounded-2xl p-5 hover:bg-green-100/50 transition-all duration-300 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-1">{match.role}</p>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed">{match.notes}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Partial Matches */}
          {experienceData.analysis.partialMatches.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Partial Matches</h3>
              <div className="space-y-4">
                {experienceData.analysis.partialMatches.map((match, index) => (
                  <div key={index} className="bg-amber-50 border border-amber-100 rounded-2xl p-5 hover:bg-amber-100/50 transition-all duration-300 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-1">{match.role}</p>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed">{match.notes}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Misaligned Roles */}
          {experienceData.analysis.misalignedRoles.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 text-rose-400">Missing Experience</h3>
              <div className="space-y-4">
                {experienceData.analysis.misalignedRoles.map((role, index) => (
                  <div key={index} className="bg-rose-50 border border-rose-100 rounded-2xl p-5 hover:bg-rose-100/50 transition-all duration-300 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-1">{role.role}</p>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed">{role.notes}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {experienceData.analysis.suggestedImprovements && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div>
                  <h4 className="text-[10px] font-bold text-blue-900 mb-1 tracking-tight uppercase opacity-60">Improvement Strategy</h4>
                  <p className="text-blue-700/80 text-sm font-medium leading-relaxed">{experienceData.analysis.suggestedImprovements}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExperienceSection;