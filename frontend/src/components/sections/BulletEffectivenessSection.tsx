import React from 'react';
import StatusBadges from '../StatusBadges';
import { AnalysisData } from '../../types/AnalysisData';



interface BulletEffectivenessSectionProps {
    analysisData: AnalysisData | null;
}

const BulletEffectivenessSection: React.FC<BulletEffectivenessSectionProps> = ({ analysisData }) => {
    const bulletDataCheck = analysisData?.detailed_analysis?.bullet_point_effectiveness;

    if (!analysisData || !bulletDataCheck) {
        return (
            <div>
                <StatusBadges analysisData={null} />
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
                        <div className="space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-16 bg-gray-200 rounded-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const bulletData = analysisData.detailed_analysis.bullet_point_effectiveness;
    if (!bulletData) return null; // Additional safety

    return (
        <div>
            <StatusBadges analysisData={analysisData} />

            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
                <h2 className="text-xl font-extrabold text-gray-800 mb-10 tracking-tight">Bullet Point Analysis</h2>

                {/* Score Display Card */}
                <div className="flex items-center justify-between mb-12 bg-gray-50/50 rounded-2xl p-6 border border-gray-50">
                    <div className="flex items-center gap-3">
                        <span className={`text-3xl font-bold tabular-nums tracking-tighter ${bulletData.score.effectiveBulletPercentage >= 80 ? 'text-emerald-500' :
                            bulletData.score.effectiveBulletPercentage >= 60 ? 'text-blue-500' : 'text-amber-500'
                            }`}>
                            {bulletData.score.effectiveBulletPercentage}%
                        </span>
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold border tracking-widest shadow-sm uppercase ${bulletData.score.effectiveBulletPercentage >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            bulletData.score.effectiveBulletPercentage >= 60 ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                            {bulletData.score.rating}
                        </span>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Effectiveness Score</span>
                </div>

                <div className="space-y-10">
                    {/* Effective Bullets */}
                    {bulletData.analysis.effectiveBullets.length > 0 && (
                        <div>
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Effective Bullets</h3>
                            <div className="space-y-4">
                                {bulletData.analysis.effectiveBullets.map((bullet, index) => (
                                    <div key={index} className="bg-green-50 border border-green-100 rounded-2xl p-5 hover:bg-green-100/50 transition-all duration-300 shadow-sm">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1">
                                                <p className="text-gray-900 font-medium mb-3 tracking-tight leading-relaxed">{bullet.bulletPoint}</p>
                                                <div className="flex items-center gap-4">
                                                    <span className="px-2 py-1 bg-white border border-green-200 rounded-lg text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                                        {bullet.wordCount} Words
                                                    </span>
                                                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">
                                                        +{bullet.points} Points
                                                    </span>
                                                </div>
                                                {bullet.strengths && (
                                                    <div className="mt-4 pt-4 border-t border-green-100/50">
                                                        <p className="text-green-800 text-xs font-medium leading-relaxed">
                                                            <span className="font-bold uppercase tracking-widest text-[9px] block mb-1 opacity-60">Strengths</span>
                                                            {bullet.strengths}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ineffective Bullets */}
                    {bulletData.analysis.ineffectiveBullets.length > 0 && (
                        <div>
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 text-rose-400">Action Required</h3>
                            <div className="space-y-4">
                                {bulletData.analysis.ineffectiveBullets.map((bullet, index) => (
                                    <div key={index} className="bg-rose-50 border border-rose-100 rounded-2xl p-6 hover:bg-rose-100/50 transition-all duration-300 shadow-sm">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1">
                                                <p className="text-gray-900 font-medium mb-3 tracking-tight leading-relaxed">{bullet.bulletPoint}</p>
                                                <div className="flex items-center gap-4 mb-4">
                                                    <span className="px-2 py-1 bg-white border border-rose-200 rounded-lg text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                                        {bullet.wordCount} Words
                                                    </span>
                                                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                                                        {bullet.points} Points
                                                    </span>
                                                </div>

                                                {bullet.issues && (
                                                    <div className="bg-white/50 rounded-xl p-4 mb-4 border border-rose-100">
                                                        <span className="font-bold uppercase tracking-widest text-[9px] block mb-1 text-rose-900 opacity-60">Identified Issues</span>
                                                        <p className="text-rose-800 text-xs font-medium leading-relaxed">{bullet.issues}</p>
                                                    </div>
                                                )}

                                                {bullet.suggestedRevision && (
                                                    <div className="bg-blue-600/5 rounded-xl p-4 border border-blue-600/20">
                                                        <span className="font-bold uppercase tracking-widest text-[9px] block mb-1 text-blue-600">Suggested Revision</span>
                                                        <p className="text-blue-900 text-sm font-semibold leading-relaxed">{bullet.suggestedRevision}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Suggestions */}
                    {bulletData.analysis.suggestedImprovements && (
                        <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 relative overflow-hidden group">
                            <div className="relative border-l-4 border-blue-600 pl-6">
                                <h4 className="text-[10px] font-bold text-blue-600 mb-3 tracking-widest uppercase">Expert Strategy</h4>
                                <p className="text-gray-600 text-sm font-medium leading-relaxed">{bulletData.analysis.suggestedImprovements}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulletEffectivenessSection;
