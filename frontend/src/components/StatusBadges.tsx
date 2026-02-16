import React from 'react';
import { TrendingUp, Award, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { AnalysisData } from '../types/AnalysisData';

interface StatusBadgesProps {
  analysisData: AnalysisData | null;
}

const StatusBadges: React.FC<StatusBadgesProps> = ({ analysisData }) => {
  if (!analysisData || !analysisData.job_fit_score || !analysisData.resume_quality_score) {
    return (
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-100 p-4 shadow-sm h-24">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded w-16"></div>
                <div className="h-6 bg-gray-100 rounded-full w-24"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const jobFit = analysisData.job_fit_score;
  const resumeQuality = analysisData.resume_quality_score;

  const getStatusConfig = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('excellent') || l.includes('high') || l.includes('perfect')) {
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-100',
        text: 'text-emerald-700',
        pill: 'bg-emerald-100 text-emerald-800',
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />
      };
    }
    if (l.includes('good') || l.includes('match') || l.includes('fair')) {
      if (l.includes('poor')) return {
        bg: 'bg-rose-50',
        border: 'border-rose-100',
        text: 'text-rose-700',
        pill: 'bg-rose-100 text-rose-800',
        icon: <AlertCircle className="w-5 h-5 text-rose-600" />
      };
      if (l.includes('fair') || l.includes('average')) return {
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        text: 'text-amber-700',
        pill: 'bg-amber-100 text-amber-800',
        icon: <TrendingUp className="w-5 h-5 text-amber-600" />
      };
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        text: 'text-blue-700',
        pill: 'bg-blue-100 text-blue-800',
        icon: <Award className="w-5 h-5 text-blue-600" />
      };
    }
    if (l.includes('average') || l.includes('moderate')) {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        text: 'text-amber-700',
        pill: 'bg-amber-100 text-amber-800',
        icon: <TrendingUp className="w-5 h-5 text-amber-600" />
      };
    }
    if (l.includes('poor') || l.includes('low') || l.includes('weak')) {
      return {
        bg: 'bg-rose-50',
        border: 'border-rose-100',
        text: 'text-rose-700',
        pill: 'bg-rose-100 text-rose-800',
        icon: <AlertCircle className="w-5 h-5 text-rose-600" />
      };
    }
    return {
      bg: 'bg-gray-50',
      border: 'border-gray-100',
      text: 'text-gray-700',
      pill: 'bg-gray-200 text-gray-800',
      icon: <HelpCircle className="w-5 h-5 text-gray-500" />
    };
  };

  const fitStyle = getStatusConfig(jobFit.label);
  const qualityStyle = getStatusConfig(resumeQuality.label);

  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      {/* Job Fit Card */}
      <div className={`flex items-center gap-3 p-4 rounded-3xl border ${fitStyle.bg} ${fitStyle.border} shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 hover:shadow-md group min-h-[90px]`}>
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white shadow-sm group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
          {fitStyle.icon}
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Job Fit</span>
          <div className="flex items-center justify-between gap-2">
            <span className={`font-extrabold text-xs tracking-tight ${fitStyle.text}`}>{jobFit.label}</span>
            <div className={`${fitStyle.pill} px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-tight shadow-sm`}>
              {jobFit.percentage}%
            </div>
          </div>
        </div>
      </div>

      {/* Resume Quality Card */}
      <div className={`flex items-center gap-3 p-4 rounded-3xl border ${qualityStyle.bg} ${qualityStyle.border} shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 hover:shadow-md group min-h-[90px]`}>
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white shadow-sm group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
          {qualityStyle.icon}
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Resume Quality</span>
          <div className="flex items-center justify-between gap-1">
            <span className={`text-xs font-extrabold tracking-tight ${qualityStyle.text}`}>{resumeQuality.label}</span>
            <div className={`${qualityStyle.pill} px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-tight shadow-sm`}>
              {resumeQuality.percentage}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBadges;