import React from 'react';
import { TrendingUp, CheckCircle2, Info, User, ChevronRight } from 'lucide-react';
import { AnalysisData } from '../../types/AnalysisData';

interface ResultsSectionProps {
  analysisData: AnalysisData | null;
  onUploadNewResume?: () => void;
  onViewDetails?: () => void;
}

const ResultsView: React.FC<ResultsSectionProps> = ({
  analysisData,
  onUploadNewResume,
  onViewDetails
}) => {
  if (!analysisData) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium tracking-tight">AI is analyzing your profile...</p>
        </div>
      </div>
    );
  }

  const jobFitScore = analysisData.job_fit_score || { percentage: 0, label: 'Unknown', score: 0 };

  // Suggested improvement tip from analysis data or fallback
  const improvementTip = analysisData.detailed_analysis?.keyword_match?.analysis?.suggestedImprovements ||
    "Your extensive experience in customer experience strategy and stakeholder facilitation aligns well with the Senior Director role...";

  const qualityTip = "Consider adding more industry-specific keywords to improve your match score.";

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col min-h-full">
      {/* Page Title Section */}
      <div className="text-center mb-6">
        <h1 className="text-[24px] font-black text-[#1e293b] mb-1 tracking-tight">
          Resume Analysis Results
        </h1>
        <p className="text-[#64748b] text-sm font-medium">
          Here's how your resume matches this job
        </p>
      </div>

      <div className="space-y-4 flex-grow">
        {/* Job Fit Score Card */}
        <div className="bg-white rounded-[24px] shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-[#f1f5f9] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#3b82f6]" />
              </div>
              <h2 className="text-lg font-bold text-[#1e293b]">Job Fit Score</h2>
            </div>
            <div className="flex items-center gap-1.5 bg-[#f0fdf4] text-[#166534] px-3 py-1 rounded-full border border-[#dcfce7]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">Good Match</span>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="mb-6 px-1">
            <div className="relative h-3 w-full bg-[#f1f5f9] rounded-full overflow-hidden mb-2">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#6366f1] to-[#4f46e5] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${jobFitScore.percentage}%` }}
              />
            </div>
            <div className="relative flex justify-between">
              {[0, 25, 50, 75, 100].map((marker) => (
                <div key={marker} className="flex flex-col items-center">
                  <span className="text-[9px] font-bold text-[#94a3b8]">{marker}%</span>
                </div>
              ))}
              {/* Actual Percentage Float */}
              <div
                className="absolute -top-1 font-black text-[#1e293b] text-xs"
                style={{ left: `calc(${jobFitScore.percentage}% - 12px)` }}
              >
                {jobFitScore.percentage}%
              </div>
            </div>
          </div>

          {/* Improvement Tip */}
          <div className="bg-[#eff6ff] rounded-[18px] p-4 flex gap-3 items-start border border-[#dbeafe]">
            <div className="mt-0.5">
              <Info className="w-4 h-4 text-[#3b82f6]" />
            </div>
            <div className="text-xs leading-relaxed text-[#1e40af]">
              <span className="font-bold">Improvement tip: </span>
              {improvementTip}
            </div>
          </div>
        </div>

        {/* Resume Quality Card */}
        <div className="bg-white rounded-[24px] shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-[#f1f5f9] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#f5f3ff] flex items-center justify-center">
                <User className="w-5 h-5 text-[#8b5cf6]" />
              </div>
              <h2 className="text-lg font-bold text-[#1e293b]">Resume Quality</h2>
            </div>
            <div className="bg-[#f0fdf4] text-[#166534] px-3 py-1 rounded-full border border-[#dcfce7] flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              <span className="text-[10px] font-bold">Ready to Impress</span>
            </div>
          </div>

          {/* Pro Tip */}
          <div className="bg-[#eff6ff] rounded-[18px] p-4 flex gap-3 items-start border border-[#dbeafe]">
            <div className="mt-0.5">
              <Info className="w-4 h-4 text-[#3b82f6]" />
            </div>
            <div className="text-xs leading-relaxed text-[#1e40af]">
              <span className="font-bold">Pro tip: </span>
              {qualityTip}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <button
            onClick={onViewDetails}
            className="w-full max-w-[280px] bg-[#4f46e5] text-white py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#4338ca] transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-indigo-100"
          >
            <span className="text-sm">View Detailed Analysis</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onUploadNewResume}
            className="text-[#4f46e5] font-bold text-xs hover:underline decoration-1 underline-offset-4"
          >
            Upload New Resume
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 pt-4 border-t border-gray-100">
        <div className="text-[9px] font-medium text-[#94a3b8] uppercase tracking-widest leading-tight">
          <p>internship v3.0.2 • All rights reserved © 2025 Intrvu.ca</p>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;