import React from 'react';
import { TrendingUp, CheckCircle2 } from 'lucide-react';
import { AnalysisData } from '../types/AnalysisData';

interface DetailedAnalysisHeaderProps {
    analysisData: AnalysisData | null;
}

const DetailedAnalysisHeader: React.FC<DetailedAnalysisHeaderProps> = ({ analysisData }) => {
    const jobFit = analysisData?.job_fit_score;
    const resumeQuality = analysisData?.resume_quality_score;

    const getStatusBadgeColor = (label: string) => {
        const l = label.toLowerCase();
        // Prioritize "Poor" or "Improvement" to red
        if (l.includes('poor') || l.includes('improvement') || l.includes('low')) {
            return 'bg-[#fef2f2] text-[#991b1b] border-[#fee2e2]';
        }
        // Good/Excellent/Ready to green
        if (l.includes('excellent') || l.includes('good') || l.includes('ready') || l.includes('match')) {
            return 'bg-[#f0fdf4] text-[#166534] border-[#dcfce7]';
        }
        // Fair/Average to amber
        if (l.includes('fair') || l.includes('average') || l.includes('needs work')) {
            return 'bg-[#fffbeb] text-[#92400e] border-[#fef3c7]';
        }
        return 'bg-[#f8fafc] text-[#64748b] border-[#f1f5f9]';
    };

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
                    <div className={`px-4 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 min-w-[140px] justify-center ${getStatusBadgeColor(jobFit?.label || '')}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {jobFit?.label || 'In Progress'}
                    </div>
                </div>

                {/* Resume Quality Badge */}
                <div className="flex items-center justify-end gap-3">
                    <div className="text-xs font-bold text-[#64748b]">Resume Quality</div>
                    <div className={`px-4 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 min-w-[140px] justify-center ${getStatusBadgeColor(resumeQuality?.label || '')}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {resumeQuality?.label || 'In Progress'}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default DetailedAnalysisHeader;
