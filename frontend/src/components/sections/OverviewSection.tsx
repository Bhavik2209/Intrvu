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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Role and Responsibilities</h2>

        <div className="space-y-3 mb-8">
          {displayResponsibilities.map((responsibility: string, index: number) => (
            <div key={index} className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 p-2 rounded-lg transition-all duration-200 transform hover:scale-102 active:scale-98">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{responsibility}</span>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Qualifications and Experience</h2>

        <div className="space-y-3">
          {displayQualifications.map((qualification: string, index: number) => (
            <div key={index} className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 p-2 rounded-lg transition-all duration-200 transform hover:scale-102 active:scale-98">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{qualification}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;