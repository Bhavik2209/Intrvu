import React from 'react';
import { TrendingUp, Award, Lightbulb } from 'lucide-react';
import { AnalysisData } from '../../types/AnalysisData';

interface ResultsSectionProps {
  analysisData: AnalysisData | null;
  onUploadNewResume?: () => void;
}

const ResultsView: React.FC<ResultsSectionProps> = ({ analysisData, onUploadNewResume }) => {
  if (!analysisData) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium tracking-tight">AI is analyzing your profile...</p>
        </div>
      </div>
    );
  }

  const jobFitScore = analysisData.job_fit_score || { percentage: 0, label: 'Unknown', score: 0 };
  const resumeQuality = analysisData.resume_quality_score || { label: 'Unknown', total_points: 0 };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (score >= 60) return 'text-blue-500 bg-blue-50 border-blue-100';
    return 'text-rose-500 bg-rose-50 border-rose-100';
  };

  const scoreStyle = getScoreColor(jobFitScore.percentage);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Analysis Complete</h1>
        <p className="text-gray-500 font-medium text-sm">We've identified key areas to improve your match</p>
      </div>

      <div className="space-y-6">
        {/* Job Fit Score Card */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
          <div className="flex flex-col items-center mb-8 bg-gray-50/50 rounded-2xl p-8 border border-gray-50">
            <div className="flex flex-col items-center gap-4">
              <span className={`text-5xl font-extrabold leading-none ${getScoreColor(jobFitScore.percentage).split(' ')[0]} tabular-nums tracking-tighter`}>
                {jobFitScore.percentage}%
              </span>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <div className={`px-4 py-1.5 rounded-xl border ${scoreStyle} text-[10px] font-bold uppercase tracking-widest shadow-sm`}>
                  {jobFitScore.label}
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Lightbulb className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm text-blue-900/80 leading-relaxed">
                <strong className="text-blue-900 font-bold block mb-1">Improvement tip</strong>
                <p>{analysisData.detailed_analysis?.keyword_match?.analysis?.suggestedImprovements || 'Focus on adding more relevant keywords to improve your match score.'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resume Quality Card */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shadow-sm">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-gray-800 leading-tight">Resume Quality</h2>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] mt-1">Visual & Content Integrity</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl text-[10px] font-bold border border-emerald-100 shadow-sm uppercase tracking-wider`}>
                {resumeQuality.label}
              </span>
              <span className="bg-purple-100 text-purple-800 px-3 py-2 rounded-2xl text-[10px] font-bold border border-purple-200 shadow-sm">
                {resumeQuality.percentage}%
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-6 font-medium">
            Your resume content and structure have been evaluated for professional standards, formatting consistency, and readability.
          </p>

          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5">
            <div className="flex items-center gap-4 text-purple-900">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-xl">✨</span>
              </div>
              <p className="text-xs font-bold leading-relaxed">Great progress! Your resume follows most industry best practices for quality and structure.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6">
          <button
            onClick={onUploadNewResume}
            className="w-full bg-blue-600 text-white py-4 px-8 rounded-3xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-blue-700 active:bg-blue-800 transition-all duration-300 transform hover:-translate-y-1 shadow-xl shadow-blue-500/20 active:shadow-none"
          >
            Upload New Resume
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;