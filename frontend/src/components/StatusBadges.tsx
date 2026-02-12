import React from 'react';
import { TrendingUp, Check } from 'lucide-react';
import { AnalysisData } from '../types/AnalysisData';

interface StatusBadgesProps {
  analysisData: AnalysisData | null;
}

const StatusBadges: React.FC<StatusBadgesProps> = ({ analysisData }) => {
  if (!analysisData || !analysisData.job_fit_score || !analysisData.resume_quality_score) {
    return (
      <div className="flex items-center gap-4 mb-6">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-6 bg-gray-200 rounded-full w-24"></div>
        </div>
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-6 bg-gray-200 rounded-full w-28"></div>
        </div>
      </div>
    );
  }

  const jobFitScore = analysisData.job_fit_score;
  const resumeQuality = analysisData.resume_quality_score;

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <span className="text-blue-600 font-medium">Job Fit</span>
        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-green-200 active:bg-green-300 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md">
          <Check className="w-4 h-4" />
          <span>{jobFitScore.label}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-gray-700 font-medium">Resume Quality</span>
        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-green-200 active:bg-green-300 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md">
          <Check className="w-4 h-4" />
          <span>{resumeQuality.label}</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBadges;