import React from 'react';
import StatusBadges from '../StatusBadges';
import { Check } from 'lucide-react';
import { AnalysisData } from '../../types/AnalysisData';
import { useJobExtraction } from '../../hooks/useJobExtraction';

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

  return (
    <div>
      <StatusBadges analysisData={analysisData} />

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
        <h2 className="text-xl font-extrabold text-gray-800 mb-8 tracking-tight">Role and Responsibilities</h2>

        <div className="space-y-3 mb-8">
          {displayResponsibilities.map((responsibility: string, index: number) => (
            <div key={index} className="flex items-start gap-3 p-2 rounded-lg transition-all duration-200">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0 mt-2" />
              <span className="text-gray-600 text-sm font-medium leading-relaxed">{responsibility}</span>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-extrabold text-gray-800 mb-8 mt-12 tracking-tight">Qualifications and Experience</h2>

        <div className="space-y-3">
          {displayQualifications.map((qualification: string, index: number) => (
            <div key={index} className="flex items-start gap-3 p-2 rounded-lg transition-all duration-200">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0 mt-2" />
              <span className="text-gray-600 text-sm font-medium leading-relaxed">{qualification}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;