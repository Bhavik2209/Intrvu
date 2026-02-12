import React from 'react';
import StatusBadges from '../StatusBadges';
import { AnalysisData } from '../../types/AnalysisData';

interface StructureSectionProps {
  analysisData: AnalysisData | null;
}

const StructureSection: React.FC<StructureSectionProps> = ({ analysisData }) => {
  const structureDataCheck = analysisData?.detailed_analysis?.resume_structure;

  if (!analysisData || !structureDataCheck) {
    return (
      <div>
        <StatusBadges analysisData={null} />
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="space-y-3">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const structureData = analysisData?.detailed_analysis?.resume_structure;

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes('completed') || normalizedStatus.includes('included')) {
      return 'bg-green-100 text-green-700';
    } else if (normalizedStatus.includes('missing') || normalizedStatus.includes('not included')) {
      return 'bg-orange-100 text-orange-700';
    }
    return 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (status: string, symbol: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes('completed') || normalizedStatus.includes('included')) {
      return `✅ Included`;
    } else if (normalizedStatus.includes('missing') || normalizedStatus.includes('not included')) {
      return `${symbol} Not included`;
    }
    return `✅ ${status}`;
  };

  return (
    <div>
      <StatusBadges analysisData={analysisData} />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Resume Structure Analysis</h2>

        <div className="space-y-6">
          {/* Rating Only */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Rating:</h3>
            <span className="text-lg text-gray-600">
              {structureData.score.ratingSymbol} {structureData.score.rating}
            </span>
          </div>

          {/* Section Status */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-4">Section Status</h3>

            <div className="space-y-3">
              {structureData.analysis.sectionStatus.map((section, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 transform hover:scale-102 active:scale-98 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-700 font-medium">{section.section}</span>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                      {section.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(section.status)}`}>
                      {getStatusText(section.status, section.symbol)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          {structureData.analysis.suggestedImprovements && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Suggestions</h4>
              <p className="text-blue-700 text-sm">{structureData.analysis.suggestedImprovements}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StructureSection;