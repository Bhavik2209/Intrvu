import React from 'react';
import { Check } from 'lucide-react';
import { AnalysisData } from '../../types/AnalysisData';
import { useJobExtraction } from '../../hooks/useJobExtraction';
import DetailedAnalysisHeader from '../DetailedAnalysisHeader';

interface OverviewSectionProps {
  analysisData: AnalysisData | null;
}

const OverviewSection: React.FC<OverviewSectionProps> = ({ analysisData }) => {
  const { jobStatus } = useJobExtraction();

  // Extract job description sections from the extracted job data
  const parseJobDescription = (description: string) => {
    if (!description) return { responsibilities: [], qualifications: [] };

    const responsibilities: string[] = [];
    const qualifications: string[] = [];

    // Split by common section headers
    const sections = description.split(/(?:Key Responsibilities|Responsibilities|Role and Responsibilities|What you'll do|Job Description|About the role)/i);
    const qualSection = description.split(/(?:Qualifications|Requirements|Skills|Experience|What we're looking for|Minimum Requirements)/i);

    // Extract responsibilities
    if (sections.length > 1) {
      const respText = sections[1].split(/(?:Qualifications|Requirements|Skills|Experience)/i)[0];
      const respLines = respText.split(/[•\n-]/).filter(line =>
        line.trim().length > 20 && !line.includes('About') && !line.includes('Company')
      );
      responsibilities.push(...respLines.slice(0, 8).map(line => line.trim()));
    }

    // Extract qualifications
    if (qualSection.length > 1) {
      const qualText = qualSection[1];
      const qualLines = qualText.split(/[•\n-]/).filter(line =>
        line.trim().length > 15 && !line.includes('About') && !line.includes('Company')
      );
      qualifications.push(...qualLines.slice(0, 6).map(line => line.trim()));
    }

    return { responsibilities, qualifications };
  };

  const jobData = jobStatus.currentJobData;
  const { responsibilities, qualifications } = jobData?.jobDescription
    ? parseJobDescription(jobData.jobDescription)
    : { responsibilities: [], qualifications: [] };

  // Fallback to default content if no job data is available
  const defaultResponsibilities = [
    "Navigate to a LinkedIn job page to see role responsibilities",
    "The extension will automatically extract job details",
    "Job description will be parsed and displayed here"
  ];

  const defaultQualifications = [
    "Job qualifications will appear here",
    "Requirements will be extracted from the job posting",
    "Skills and experience needed will be listed"
  ];

  const displayResponsibilities = responsibilities.length > 0 ? responsibilities : defaultResponsibilities;
  const displayQualifications = qualifications.length > 0 ? qualifications : defaultQualifications;

  const ListItem = ({ text }: { text: string }) => (
    <div className="flex items-start gap-4 py-2 group">
      <div className="w-6 h-6 rounded-full bg-[#d1fae5] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200 shadow-sm border border-[#10b981]/10">
        <Check className="w-3.5 h-3.5 text-[#10b981] stroke-[3]" />
      </div>
      <span className="text-[#1f2937] text-base font-normal leading-relaxed">
        {text}
      </span>
    </div>
  );

  return (
    <div className="min-h-full flex flex-col max-w-4xl mx-auto py-4">
      {/* Shared Header */}
      <DetailedAnalysisHeader analysisData={analysisData} />

      <div className="mt-12 space-y-16">
        {/* Role and Responsibilities Section */}
        <section>
          <h2 className="text-xl font-black text-[#111827] mb-8 tracking-tight">Role and Responsibilities</h2>
          <div className="flex flex-col gap-3">
            {displayResponsibilities.length > 0 ? (
              displayResponsibilities.map((responsibility, index) => (
                <ListItem key={`resp-${index}`} text={responsibility} />
              ))
            ) : (
              <p className="text-[#9ca3af] italic text-base pl-1">No responsibilities listed</p>
            )}
          </div>
        </section>

        {/* Qualifications and Experience Section */}
        <section>
          <h2 className="text-xl font-black text-[#111827] mb-8 tracking-tight">Qualifications and Experience</h2>
          <div className="flex flex-col gap-3">
            {displayQualifications.length > 0 ? (
              displayQualifications.map((qualification, index) => (
                <ListItem key={`qual-${index}`} text={qualification} />
              ))
            ) : (
              <p className="text-[#9ca3af] italic text-base pl-1">No qualifications listed</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default OverviewSection;