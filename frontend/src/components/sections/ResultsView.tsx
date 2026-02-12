import React from 'react';
import { TrendingUp, Award } from 'lucide-react';
import { AnalysisData } from '../../types/AnalysisData';

interface ResultsSectionProps {
  analysisData: AnalysisData | null;
  onUploadNewResume?: () => void;
}

const ResultsView: React.FC<ResultsSectionProps> = ({ analysisData, onUploadNewResume }) => {
  if (!analysisData) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your resume...</p>
        </div>
      </div>
    );
  }

  const jobFitScore = analysisData.job_fit_score || { percentage: 0, label: 'Unknown', score: 0 };
  const resumeQuality = analysisData.resume_quality_score || { label: 'Unknown', total_points: 0 };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Resume Analysis Results</h1>
        <p className="text-gray-600">Here's how your resume matches this job</p>
      </div>

      <div className="space-y-6">
        {/* Job Fit Score */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Job Fit Score</h2>
            <span className="text-2xl font-bold text-blue-600">{jobFitScore.percentage}%</span>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              {jobFitScore.label}
            </span>
          </div>

          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${jobFitScore.percentage}%` }}>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs">i</span>
              </div>
              <p className="text-sm text-blue-800">
                <strong>Improvement tip:</strong> {analysisData.detailed_analysis?.keyword_match?.analysis?.suggestedImprovements || 'Focus on adding more relevant keywords to improve your match score.'}
              </p>
            </div>
          </div>
        </div>

        {/* Resume Quality */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Resume Quality</h2>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              {resumeQuality.label}
            </span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs">i</span>
              </div>
              <p className="text-sm text-blue-800">
                <strong>Pro tip:</strong> Consider adding more industry-specific keywords to improve your match score.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex">
          <button
            onClick={onUploadNewResume}
            className="w-full bg-white text-blue-600 py-3 px-6 rounded-lg font-medium border-2 border-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
          >
            Upload New Resume
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;