import React from 'react';
import StatusBadges from '../StatusBadges';
import { AnalysisData } from '../../types/AnalysisData';

interface MeasurableResultsSectionProps {
  analysisData: AnalysisData | null;
}

const MeasurableResultsSection: React.FC<MeasurableResultsSectionProps> = ({ analysisData }) => {
  const measurableDataCheck = analysisData?.detailed_analysis?.measurable_results;

  if (!analysisData || !measurableDataCheck) {
    return (
      <div>
        <StatusBadges analysisData={null} />
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const measurableData = analysisData?.detailed_analysis?.measurable_results;

  return (
    <div>
      <StatusBadges analysisData={analysisData} />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Measurable Results Analysis</h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Measurable Results Count:</h3>
            <span className="text-2xl font-bold text-blue-600">
              {measurableData.score.measurableResultsCount}
            </span>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Measurable Results Found</h3>
            {measurableData.analysis.measurableResults.length > 0 ? (
              <div className="space-y-3">
                {measurableData.analysis.measurableResults.map((result, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4 cursor-pointer hover:bg-green-100 active:bg-green-200 transition-all duration-200 transform hover:scale-102 active:scale-98 shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <span className="text-sm">✅</span>
                      <span className="font-medium">{result.metric}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{result.bulletPoint}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center mb-4">
                <p className="text-gray-500 italic">No measurable results found</p>
              </div>
            )}
          </div>

          {measurableData.analysis.opportunitiesForMetrics.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Opportunities for Metrics</h3>
              <div className="space-y-3">
                {measurableData.analysis.opportunitiesForMetrics.map((opportunity, index) => (
                  <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4 cursor-pointer hover:bg-orange-100 active:bg-orange-200 transition-all duration-200 transform hover:scale-102 active:scale-98 shadow-sm hover:shadow-md">
                    <div className="flex items-start gap-2">
                      <span className="text-orange-600 mt-1">{opportunity.symbol}</span>
                      <div>
                        <p className="text-gray-800 font-medium mb-1">{opportunity.bulletPoint}</p>
                        <p className="text-gray-600 text-sm">{opportunity.suggestion}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {measurableData.analysis.suggestedImprovements && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Suggestions</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm">{measurableData.analysis.suggestedImprovements}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeasurableResultsSection;