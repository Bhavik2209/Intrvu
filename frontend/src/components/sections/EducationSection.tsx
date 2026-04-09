import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { AnalysisData } from '../../types/AnalysisData';
import DetailedAnalysisHeader from '../DetailedAnalysisHeader';

interface EducationSectionProps {
  analysisData: AnalysisData | null;
}

const EducationSection: React.FC<EducationSectionProps> = ({ analysisData }) => {
  const educationData = analysisData?.detailed_analysis?.education_certifications;

  // Placeholder/Loading State
  if (!analysisData || !educationData) {
    return (
      <div className="animate-pulse py-8">
        <DetailedAnalysisHeader analysisData={null} />
        <div className="h-8 bg-gray-100 rounded-lg w-64 mb-6 mt-8"></div>
        <div className="h-64 bg-gray-50 rounded-3xl w-full"></div>
      </div>
    );
  }

  const { score, analysis } = educationData;

  // Calculate percentage if not explicitly provided (many sections use this fallback)
  const percentage = score?.pointsAwarded && score?.maxPoints
    ? Math.round((score.pointsAwarded / score.maxPoints) * 100)
    : 0;

  // Access matched and missing items from analysis
  // Supporting both possible naming conventions (matchedItems/missingItems or matched/missing)
  const matchedItems = (analysis as any).matchedItems || (analysis as any).matched || [];
  const missingItems = (analysis as any).missingItems || (analysis as any).missing || [];

  const certificationMatchesRaw = Array.isArray((analysis as any).certificationMatches)
    ? (analysis as any).certificationMatches
    : [];
  const missingCredentialsRaw = Array.isArray((analysis as any).missingCredentials)
    ? (analysis as any).missingCredentials
    : [];

  // Fallback for demo/current data structure if arrays are empty
  const hasItems = matchedItems.length > 0 || missingItems.length > 0;

  // If no explicit arrays, we derive from degreeFound and status
  const derivedMatched = !hasItems && analysis.degreeFound && analysis.degreeFound !== 'None'
    ? [`${analysis.degreeFound} in ${analysis.fieldOfStudy || analysis.degreeType}`]
    : matchedItems;

  // If no explicit arrays, we derive missing from suggestedImprovements if status is not passing
  const derivedMissing = !hasItems && educationData.score.passed === false && analysis.suggestedImprovements
    ? [analysis.suggestedImprovements]
    : missingItems;

  const certificationMatches = certificationMatchesRaw
    .filter((item: any) => {
      const status = String(item?.status || '').toLowerCase();
      return status.includes('found') || Number(item?.points ?? 0) > 0;
    })
    .map((item: any) => String(item?.certification || item?.name || item || '').trim())
    .filter(Boolean);

  const missingCertifications = [
    ...missingCredentialsRaw.map((item: any) => String(item?.credential || item?.certification || item || '').trim()),
    ...certificationMatchesRaw
      .filter((item: any) => {
        const status = String(item?.status || '').toLowerCase();
        return status.includes('not found') || status.includes('missing') || Number(item?.points ?? 0) < 0;
      })
      .map((item: any) => String(item?.certification || item?.name || item || '').trim())
  ].filter(Boolean);

  const certScoreRaw = (score as any)?.matchPercentage ?? (score as any)?.educationCertificationMatchPercentage;
  const certMatchPercentage = typeof certScoreRaw === 'number'
    ? Math.max(0, Math.min(100, Math.round(certScoreRaw)))
    : (() => {
      const total = certificationMatches.length + missingCertifications.length;
      return total > 0 ? Math.round((certificationMatches.length / total) * 100) : 0;
    })();

  let certRating = 'Needs Improvement';
  if (certMatchPercentage >= 75) {
    certRating = 'Good alignment';
  } else if (certMatchPercentage >= 45) {
    certRating = 'Fair';
  }

  const hasCertifications = certificationMatches.length > 0 || missingCertifications.length > 0;

  const compactItem = (item: string, index: number, type: 'matched' | 'missing') => {
    const isMatched = type === 'matched';

    return (
      <div
        key={`${type}-${index}`}
        className="bg-white border border-[#e5e7eb] rounded-xl px-3 py-3 flex items-center gap-3"
      >
        <div className={`w-4 h-4 rounded-[4px] flex items-center justify-center ${isMatched ? 'bg-[#22c55e]/15' : 'bg-[#f59e0b]/15'}`}>
          {isMatched ? (
            <CheckCircle2 className="w-3 h-3 text-[#16a34a]" />
          ) : (
            <AlertTriangle className="w-3 h-3 text-[#d97706]" />
          )}
        </div>
        <span className="text-[13px] font-semibold text-[#475569] leading-tight">{item}</span>
      </div>
    );
  };

  return (
    <div className="min-h-full flex flex-col max-w-4xl mx-auto py-3">
      {/* Shared Header */}
      <DetailedAnalysisHeader analysisData={analysisData} />

      {/* Main Content Area */}
      <div className="mt-2">
        <h2 className="text-xl font-black text-[#1e293b] mb-4 tracking-tight">Education Alignment</h2>

        <div className="bg-[#f1f5f9] rounded-2xl p-4 border border-[#e2e8f0]">

          {/* Alignment Percentage Section */}
          <div className="bg-[#e5e7eb] rounded-xl px-4 py-3 flex items-center justify-between mb-4 border border-[#d1d5db]">
            <span className="text-[13px] font-semibold text-[#475569]">Alignment Percentage :</span>
            <span className="text-[13px] font-black text-[#1e293b]">
              {percentage}% ( {score.rating || (score.passed ? 'Requirement Met' : 'Requirement Not Met')} )
            </span>
          </div>

          <div className="space-y-5">
            {/* Matched Section */}
            <section>
              <h3 className="text-[15px] font-extrabold text-[#475569] mb-2">Matched</h3>
              <div className="space-y-2.5">
                {derivedMatched.map((item: string, index: number) => compactItem(item, index, 'matched'))}
                {derivedMatched.length === 0 && (
                  <p className="text-[13px] text-[#64748b] italic p-3 bg-white rounded-xl text-center border border-dashed border-[#cbd5e1]">
                    No matched education found.
                  </p>
                )}
              </div>
            </section>

            {/* Missing Section */}
            <section>
              <h3 className="text-[15px] font-extrabold text-[#475569] mb-2">Missing</h3>
              <div className="space-y-2.5">
                {derivedMissing.map((item: string, index: number) => compactItem(item, index, 'missing'))}
                {derivedMissing.length === 0 && (
                  <p className="text-[13px] text-[#64748b] italic p-3 bg-white rounded-xl text-center border border-dashed border-[#cbd5e1]">
                    No missing requirements.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Certifications Block */}
        <div className="mt-4">
          <h3 className="text-xl font-black text-[#1e293b] mb-3 tracking-tight">Certifications</h3>
          <div className="bg-[#f1f5f9] rounded-2xl p-4 border border-[#e2e8f0]">
            <div className="bg-[#e5e7eb] rounded-xl px-4 py-3 flex items-center justify-between mb-4 border border-[#d1d5db]">
              <span className="text-[13px] font-semibold text-[#475569]">Match Percentage :</span>
              <span className="text-[13px] font-black text-[#1e293b]">
                {certMatchPercentage}% ( {certRating} )
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {certificationMatches.map((cert) => (
                <span
                  key={`cert-match-${cert}`}
                  className="px-5 py-2 rounded-full text-[12px] font-semibold bg-[#4f46e5] text-white min-w-[92px] text-center"
                >
                  {cert}
                </span>
              ))}

              {missingCertifications.map((cert) => (
                <span
                  key={`cert-missing-${cert}`}
                  className="px-5 py-2 rounded-full text-[12px] font-semibold bg-[#e5e7eb] text-[#334155] min-w-[92px] text-center"
                >
                  {cert}
                </span>
              ))}

              {!hasCertifications && (
                <p className="text-[13px] text-[#64748b] italic p-3 bg-white rounded-xl text-center border border-dashed border-[#cbd5e1] w-full">
                  No certification requirements detected for this job.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationSection;