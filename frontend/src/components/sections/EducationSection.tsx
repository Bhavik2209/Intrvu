import React from 'react';
import StatusBadges from '../StatusBadges';
import { AnalysisData } from '../../types/AnalysisData';

interface EducationSectionProps {
  analysisData: AnalysisData | null;
}

const EducationSection: React.FC<EducationSectionProps> = ({ analysisData }) => {
  const educationData = analysisData?.detailed_analysis?.education_certifications;

  if (!analysisData || !educationData) {
    return (
      <div>
        <StatusBadges analysisData={null} />
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-16 bg-gray-200 rounded-lg"></div>
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { analysis, score } = educationData;

  return (
    <div>
      <StatusBadges analysisData={analysisData} />
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Education Requirement</h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Status:</h3>
            <span className={`text-lg font-bold ${score.passed ? 'text-green-600' : 'text-red-600'}`}>
              {score.passed ? 'Requirement Met' : 'Requirement Not Met'} ({score.pointsAwarded}/{score.maxPoints} pts)
            </span>
          </div>

          <div className={`border rounded-lg p-4 ${score.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{score.passed ? '✅' : '❌'}</span>
              <div>
                <p className="font-medium text-gray-800">
                  Analysis: {analysis.status}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Degree Found: <span className="font-semibold">{analysis.degreeFound}</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Type: {analysis.degreeType}
                </p>
                {analysis.fieldOfStudy && (
                  <p className="text-sm text-gray-600 mt-1">
                    Field: {analysis.fieldOfStudy}
                  </p>
                )}
              </div>
            </div>
          </div>

          {analysis.suggestedImprovements && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Suggestion</h4>
              <p className="text-blue-700 text-sm">{analysis.suggestedImprovements}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EducationSection;