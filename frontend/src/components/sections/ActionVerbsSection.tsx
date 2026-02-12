import React from 'react';
import StatusBadges from '../StatusBadges';
import { AnalysisData } from '../../types/AnalysisData';

interface ActionVerbsSectionProps {
  analysisData: AnalysisData | null;
}

const ActionVerbsSection: React.FC<ActionVerbsSectionProps> = ({ analysisData }) => {
  const actionVerbsDataCheck = analysisData?.detailed_analysis?.action_words;

  if (!analysisData || !actionVerbsDataCheck) {
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

  const actionVerbsData = analysisData?.detailed_analysis?.action_words;

  return (
    <div>
      <StatusBadges analysisData={analysisData} />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Action Verbs Analysis</h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Action Verbs Percentage:</h3>
            <span className="text-2xl font-bold text-blue-600">
              {actionVerbsData.score.actionVerbPercentage}%
            </span>
          </div>

          {/* Strong Action Verbs */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Strong Action Verbs</h3>
            {actionVerbsData.analysis.strongActionVerbs.length > 0 ? (
              <div className="space-y-3">
                {actionVerbsData.analysis.strongActionVerbs.map((verb, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4 cursor-pointer hover:bg-green-100 active:bg-green-200 transition-all duration-200 transform hover:scale-102 active:scale-98 shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <span className="text-sm">✅</span>
                      <span className="font-medium">{verb.actionVerb}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{verb.bulletPoint}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-gray-500 italic">No strong action verbs found</p>
              </div>
            )}
          </div>

          {/* Weak Action Verbs */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Weak Action Verbs</h3>
            {actionVerbsData.analysis.weakActionVerbs.length > 0 ? (
              <div className="space-y-3">
                {actionVerbsData.analysis.weakActionVerbs.map((verb, index) => (
                  <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4 cursor-pointer hover:bg-orange-100 active:bg-orange-200 transition-all duration-200 transform hover:scale-102 active:scale-98 shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-2 text-orange-700 mb-2">
                      <span className="text-sm">{verb.symbol}</span>
                      <span className="font-medium">{verb.actionVerb}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{verb.bulletPoint}</p>
                    <p className="text-orange-700 text-xs">
                      <strong>Suggested:</strong> {verb.suggestedReplacement}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-gray-500 italic">No weak action verbs found</p>
              </div>
            )}
          </div>

          {/* Missing Action Verbs */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Missing Action Verbs</h3>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-500 italic">No missing action verbs found</p>
            </div>
          </div>

          {/* Clichés and Buzzwords */}
          {actionVerbsData.analysis.clichesAndBuzzwords.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Clichés & Buzzwords</h3>
              <div className="space-y-3">
                {actionVerbsData.analysis.clichesAndBuzzwords.map((cliche, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4 cursor-pointer hover:bg-red-100 active:bg-red-200 transition-all duration-200 transform hover:scale-102 active:scale-98 shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-2 text-red-700 mb-2">
                      <span className="text-sm">{cliche.symbol}</span>
                      <span className="font-medium">"{cliche.phrase}"</span>
                    </div>
                    <p className="text-red-700 text-xs">
                      <strong>Suggested:</strong> {cliche.suggestedReplacement}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {actionVerbsData.analysis.suggestedImprovements && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Suggestions</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm">{actionVerbsData.analysis.suggestedImprovements}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionVerbsSection;