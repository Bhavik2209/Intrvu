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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Job Experience Alignment</h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Alignment Percentage:</h3>
            <span className="text-lg text-gray-600">
              {experienceData.score.alignmentPercentage}% ({experienceData.score.rating})
            </span>
          </div>

          {/* Strong Matches */}
          {experienceData.analysis.strongMatches.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-4">Strong Matches</h3>
              <div className="space-y-4">
                {experienceData.analysis.strongMatches.map((match, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4 cursor-pointer hover:bg-green-100 active:bg-green-200 transition-all duration-200 transform hover:scale-102 active:scale-98 shadow-sm hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 flex-shrink-0 mt-0.5 text-lg">✅</span>
                      <div>
                        <p className="font-medium text-gray-800 mb-2">{match.role}</p>
                        <p className="text-sm text-gray-600">{match.notes}</p>
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
              <h3 className="font-semibold text-gray-700 mb-4">Partial Matches</h3>
              <div className="space-y-4">
                {experienceData.analysis.partialMatches.map((match, index) => (
                  <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4 cursor-pointer hover:bg-orange-100 active:bg-orange-200 transition-all duration-200 transform hover:scale-102 active:scale-98 shadow-sm hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <span className="text-orange-600 flex-shrink-0 mt-0.5 text-lg">{match.symbol}</span>
                      <div>
                        <p className="font-medium text-gray-800 mb-2">{match.role}</p>
                        <p className="text-sm text-gray-600">{match.notes}</p>
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
              <h3 className="font-semibold text-gray-700 mb-4">Missing Experience</h3>
              <div className="space-y-4">
                {experienceData.analysis.misalignedRoles.map((role, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4 cursor-pointer hover:bg-red-100 active:bg-red-200 transition-all duration-200 transform hover:scale-102 active:scale-98 shadow-sm hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <span className="text-red-600 flex-shrink-0 mt-0.5 text-lg">{role.symbol}</span>
                      <div>
                        <p className="font-medium text-gray-800 mb-2">{role.role}</p>
                        <p className="text-sm text-gray-600">{role.notes}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {experienceData.analysis.suggestedImprovements && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Suggestions</h4>
              <p className="text-blue-700 text-sm">{experienceData.analysis.suggestedImprovements}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExperienceSection;