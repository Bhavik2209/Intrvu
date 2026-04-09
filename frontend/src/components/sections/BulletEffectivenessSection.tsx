import React from 'react';
import { CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { AnalysisData } from '../../types/AnalysisData';
import DetailedAnalysisHeader from '../DetailedAnalysisHeader';

interface BulletEffectivenessSectionProps {
    analysisData: AnalysisData | null;
}

const BulletEffectivenessSection: React.FC<BulletEffectivenessSectionProps> = ({ analysisData }) => {
    const bulletDataCheck = analysisData?.detailed_analysis?.bullet_point_effectiveness;

    // Loading/Missing State
    if (!analysisData || !bulletDataCheck) {
        return (
            <div className="animate-pulse py-6">
                <DetailedAnalysisHeader analysisData={null} />
                <div className="h-6 bg-gray-100 rounded-lg w-48 mb-4 mt-6"></div>
                <div className="h-48 bg-gray-50 rounded-3xl w-full"></div>
            </div>
        );
    }

    const bulletData = analysisData.detailed_analysis.bullet_point_effectiveness;
    if (!bulletData) return null;

    const effectiveBullets = Array.isArray(bulletData.analysis?.effectiveBullets) ? bulletData.analysis.effectiveBullets : [];
    const ineffectiveBullets = Array.isArray(bulletData.analysis?.ineffectiveBullets) ? bulletData.analysis.ineffectiveBullets : [];
    const safeEffectivePct = typeof bulletData.score?.effectiveBulletPercentage === 'number'
        ? Math.max(0, Math.min(100, Math.round(bulletData.score.effectiveBulletPercentage)))
        : 0;

    const suggestionsList = typeof bulletData.analysis?.suggestedImprovements === 'string'
        ? bulletData.analysis.suggestedImprovements.split('. ').map((s) => s.trim()).filter(Boolean)
        : [];

    const makeUniqueKey = (() => {
        const seen: Record<string, number> = {};
        return (group: string, text: string) => {
            const base = `${group}-${text.toLowerCase().trim()}`;
            seen[base] = (seen[base] ?? 0) + 1;
            return `${base}-${seen[base]}`;
        };
    })();

    return (
        <div className="min-h-full flex flex-col max-w-4xl mx-auto py-3">
            {/* Shared Header */}
            <DetailedAnalysisHeader analysisData={analysisData} />

            {/* Main Content Area */}
            <div className="mt-2">
                <h2 className="text-xl font-black text-[#1e293b] mb-3 tracking-tight">Bullet Point Analysis</h2>

                <div className="space-y-4">
                    <div className="bg-[#f1f5f9] rounded-2xl p-4 border border-[#e2e8f0]">
                        <div className="bg-[#e5e7eb] rounded-xl px-4 py-3 flex items-center justify-between mb-4 border border-[#d1d5db]">
                            <span className="text-[13px] font-semibold text-[#475569]">Effective Bullet Percentage:</span>
                            <span className="text-[13px] font-black text-[#1e293b]">{safeEffectivePct}%</span>
                        </div>

                    {/* Effective Bullets */}
                    {effectiveBullets.length > 0 && (
                        <div>
                            <h3 className="text-[15px] font-extrabold text-[#475569] mb-2">Effective Bullets</h3>

                            <div className="space-y-2.5">
                                    {effectiveBullets.map((bullet) => {
                                        const bulletPoint = String(bullet?.bulletPoint || '').trim();
                                        const strengths = String(bullet?.strengths || '').trim();
                                        const wordCount = Number(bullet?.wordCount ?? 0);
                                        const points = Number(bullet?.points ?? 0);

                                        return (
                                        <div key={makeUniqueKey('effective', bulletPoint)} className="bg-white border border-[#e5e7eb] rounded-xl px-3 py-3 flex items-start gap-3">
                                            <div className="w-4 h-4 rounded-[4px] flex items-center justify-center bg-[#22c55e]/15 mt-0.5">
                                                <CheckCircle2 className="w-3 h-3 text-[#16a34a]" />
                                            </div>
                                            <div className="flex-1">
                                                {bulletPoint && <p className="text-[13px] font-semibold text-[#334155] mb-1 leading-[1.45]">{bulletPoint}</p>}
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-[#f8fafc] border border-[#e2e8f0] rounded text-[10px] font-semibold text-[#64748b]">
                                                        {wordCount} words
                                                    </span>
                                                    <span className="text-[10px] font-bold text-[#16a34a]">
                                                        +{points} points
                                                    </span>
                                                </div>
                                                {strengths && (
                                                    <div className="mt-2 pt-2 border-t border-[#f1f5f9]">
                                                        <p className="text-[#065f46] text-[12px] leading-[1.45]">
                                                            <span className="font-semibold text-[11px] text-[#16a34a] mr-1">Strengths:</span>
                                                            {strengths}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                    )}

                    {effectiveBullets.length === 0 && (
                        <p className="text-[13px] text-[#64748b] italic p-3 bg-white rounded-xl text-center border border-dashed border-[#cbd5e1]">No effective bullets found</p>
                    )}

                    {/* Ineffective Bullets */}
                    {ineffectiveBullets.length > 0 && (
                        <div>
                            <h3 className="text-[15px] font-extrabold text-[#475569] mb-2">Action Required</h3>

                            <div className="space-y-2.5">
                                    {ineffectiveBullets.map((bullet) => {
                                        const bulletPoint = String(bullet?.bulletPoint || '').trim();
                                        const issues = String(bullet?.issues || '').trim();
                                        const suggestedRevision = String(bullet?.suggestedRevision || '').trim();
                                        const wordCount = Number(bullet?.wordCount ?? 0);
                                        const points = Number(bullet?.points ?? 0);

                                        return (
                                        <div key={makeUniqueKey('ineffective', bulletPoint)} className="bg-white border border-[#e5e7eb] rounded-xl px-3 py-3 flex items-start gap-3">
                                            <div className="w-4 h-4 rounded-[4px] flex items-center justify-center bg-[#f59e0b]/15 mt-0.5">
                                                <AlertTriangle className="w-3 h-3 text-[#d97706]" />
                                            </div>
                                            <div className="flex-1">
                                                {bulletPoint && <p className="text-[13px] font-semibold text-[#334155] mb-1 leading-[1.45]">{bulletPoint}</p>}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-2 py-0.5 bg-[#f8fafc] border border-[#e2e8f0] rounded text-[10px] font-semibold text-[#64748b]">
                                                        {wordCount} words
                                                    </span>
                                                    <span className="text-[10px] font-bold text-[#d97706]">
                                                        {points} points
                                                    </span>
                                                </div>

                                                {issues && (
                                                    <div className="bg-[#fff7ed] rounded-lg p-2.5 mb-2 border border-[#fed7aa]">
                                                        <span className="font-semibold text-[11px] block mb-0.5 text-[#b45309]">Identified issues</span>
                                                        <p className="text-[#92400e] text-[12px] leading-[1.45]">{issues}</p>
                                                    </div>
                                                )}

                                                {suggestedRevision && (
                                                    <div className="bg-[#eff6ff] rounded-lg p-2.5 border border-[#bfdbfe]">
                                                        <span className="font-semibold text-[11px] block mb-0.5 text-[#1e40af]">Suggested revision</span>
                                                        <p className="text-[#1e3a8a] text-[12px] font-medium leading-[1.45]">{suggestedRevision}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                    )}
                    </div>

                    {/* Suggestions */}
                    {suggestionsList.length > 0 && (
                        <div className="bg-[#f1f5f9] rounded-2xl p-4 border border-[#e2e8f0]">
                            <h3 className="text-[15px] font-extrabold text-[#475569] mb-2">Suggestions</h3>
                            <div className="space-y-2">
                                {suggestionsList.map((suggestion) => {
                                    const suggestionText = suggestion.endsWith('.') ? suggestion : `${suggestion}.`;
                                    return (
                                        <div key={makeUniqueKey('suggestion', suggestion)} className="flex items-start gap-2.5">
                                            <Lightbulb className="w-3.5 h-3.5 text-[#d97706] mt-1 flex-shrink-0" />
                                            <p className="text-[#334155] text-[13px] leading-[1.45]">{suggestionText}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {effectiveBullets.length === 0 && ineffectiveBullets.length === 0 && suggestionsList.length === 0 && (
                        <div className="bg-[#f1f5f9] rounded-2xl p-4 border border-[#e2e8f0]">
                            <p className="text-[13px] text-[#64748b] italic p-3 bg-white rounded-xl text-center border border-dashed border-[#cbd5e1]">
                                No bullet analysis data available.
                            </p>
                        </div>
                    )}
                                </div>
            </div>
        </div>
    );
};

export default BulletEffectivenessSection;
