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

    return (
        <div>
            <StatusBadges analysisData={analysisData} />

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Bullet Point Effectiveness Analysis</h2>

                <div className="space-y-6">
                    {/* Score Display */}
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-700">Effective Bullet Percentage:</h3>
                        <span className="text-2xl font-bold text-blue-600">
                            {bulletData.score.effectiveBulletPercentage}% ({bulletData.score.rating} {bulletData.score.ratingSymbol})
                        </span>
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                        <h3 className="font-semibold text-gray-700">Score:</h3>
                        <span className="text-lg text-gray-600">
                            {bulletData.score.pointsAwarded} / {bulletData.score.maxPoints} points
                        </span>
                    </div>

                    {/* Effective Bullets */}
                    {bulletData.analysis.effectiveBullets.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-gray-700 mb-3">Effective Bullets ✅</h3>
                            <div className="space-y-3">
                                {bulletData.analysis.effectiveBullets.map((bullet, index) => (
                                    <div
                                        key={index}
                                        className="bg-green-50 border border-green-200 rounded-lg p-4 cursor-pointer hover:bg-green-100 active:bg-green-200 transition-all duration-200 transform hover:scale-102 active:scale-98 shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-green-600 text-lg flex-shrink-0">{bullet.symbol}</span>
                                            <div className="flex-1">
                                                <p className="text-gray-800 font-medium mb-2">{bullet.bulletPoint}</p>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <span>Words: {bullet.wordCount}</span>
                                                    <span>•</span>
                                                    <span className="text-green-700 font-medium">+{bullet.points} pts</span>
                                                </div>
                                                {bullet.strengths && (
                                                    <p className="text-green-700 text-sm mt-2">
                                                        <strong>Strengths:</strong> {bullet.strengths}
                                                    </p>
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
                            <h3 className="font-semibold text-gray-700 mb-3">Ineffective Bullets ❌</h3>
                            <div className="space-y-3">
                                {bulletData.analysis.ineffectiveBullets.map((bullet, index) => (
                                    <div
                                        key={index}
                                        className="bg-red-50 border border-red-200 rounded-lg p-4 cursor-pointer hover:bg-red-100 active:bg-red-200 transition-all duration-200 transform hover:scale-102 active:scale-98 shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-red-600 text-lg flex-shrink-0">{bullet.symbol}</span>
                                            <div className="flex-1">
                                                <p className="text-gray-800 font-medium mb-2">{bullet.bulletPoint}</p>
                                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                                    <span>Words: {bullet.wordCount}</span>
                                                    <span>•</span>
                                                    <span className="text-red-700 font-medium">{bullet.points} pts</span>
                                                </div>
                                                {bullet.issues && (
                                                    <p className="text-red-700 text-sm mb-2">
                                                        <strong>Issues:</strong> {bullet.issues}
                                                    </p>
                                                )}
                                                {bullet.suggestedRevision && (
                                                    <div className="bg-white border border-blue-200 rounded p-3 mt-2">
                                                        <p className="text-blue-800 text-sm">
                                                            <strong>Suggested Revision:</strong> {bullet.suggestedRevision}
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

                    {/* Suggestions */}
                    {bulletData.analysis.suggestedImprovements && (
                        <div>
                            <h3 className="font-semibold text-gray-700 mb-3">Suggestions</h3>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-blue-700 text-sm">{bulletData.analysis.suggestedImprovements}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulletEffectivenessSection;
