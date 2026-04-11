import React from 'react';
import { TrendingUp, CheckCircle2 } from 'lucide-react';
import { AnalysisData } from '../types/AnalysisData';
import { getScoreSymbol, getScoreTone, getToneClasses } from '../utils/scoreDisplay';

interface DetailedAnalysisHeaderProps {
    analysisData: AnalysisData | null;
}

const DetailedAnalysisHeader: React.FC<DetailedAnalysisHeaderProps> = ({ analysisData }) => {
    const jobFit = analysisData?.job_fit_score;
    const resumeQuality = analysisData?.resume_quality_score;

    const jobFitLabel = jobFit?.label || 'In Progress';
    const qualityLabel = resumeQuality?.label || 'In Progress';

    const jobFitClasses = getToneClasses(getScoreTone(jobFitLabel));
    const qualityClasses = getToneClasses(getScoreTone(qualityLabel));

    return (
        <header className="flex items-end justify-between gap-3 mb-3 border-b border-gray-100 pb-2 w-full max-w-4xl mx-auto">
            <h1 className="text-2xl font-black text-[#1e293b] tracking-tight whitespace-nowrap">Detailed Analysis</h1>

            <div className="flex flex-col gap-1.5 items-end">
                {/* Job Fit Badge */}
                <div className="flex items-center justify-end gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#64748b]">
                        <TrendingUp className="w-4 h-4 text-[#4f46e5]" />
                        <span>Job Fit</span>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 min-w-[140px] justify-center ${jobFitClasses.bg} ${jobFitClasses.text} ${jobFitClasses.border}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{getScoreSymbol(jobFitLabel)}</span>
                        {jobFitLabel}
                    </div>
                </div>

                {/* Resume Quality Badge */}
                <div className="flex items-center justify-end gap-3">
                    <div className="text-xs font-bold text-[#64748b]">Resume Quality</div>
                    <div className={`px-4 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 min-w-[140px] justify-center ${qualityClasses.bg} ${qualityClasses.text} ${qualityClasses.border}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{getScoreSymbol(qualityLabel)}</span>
                        {qualityLabel}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default DetailedAnalysisHeader;
