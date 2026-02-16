import React from 'react';
import { SectionType } from '../App';
import { AnalysisData } from '../types/AnalysisData';
import StartSection from './sections/StartSection';
import ResultsView from './sections/ResultsView';
import OverviewSection from './sections/OverviewSection';
import KeywordsSection from './sections/KeywordsSection';
import ExperienceSection from './sections/ExperienceSection';
import EducationSection from './sections/EducationSection';
import SkillsSection from './sections/SkillsSection';
import StructureSection from './sections/StructureSection';
import ActionVerbsSection from './sections/ActionVerbsSection';
import MeasurableResultsSection from './sections/MeasurableResultsSection';
import BulletEffectivenessSection from './sections/BulletEffectivenessSection';
import { JobData } from '../types/JobData';

interface MainContentProps {
  currentSection: SectionType;
  resumeUploaded: boolean;
  setResumeUploaded: (uploaded: boolean) => void;
  setAnalysisStarted: (started: boolean) => void;
  onSectionChange: (section: SectionType) => void;
  analysisData: AnalysisData | null;
  setAnalysisData: (data: AnalysisData | null) => void;
  jobDataFromHeader?: JobData;
}

const MainContent: React.FC<MainContentProps> = ({
  currentSection,
  resumeUploaded,
  setResumeUploaded,
  setAnalysisStarted,
  onSectionChange,
  analysisData,
  setAnalysisData,
  jobDataFromHeader
}) => {
  const renderSection = () => {
    switch (currentSection) {
      case 'start':
        return (
          <StartSection
            resumeUploaded={resumeUploaded}
            setResumeUploaded={setResumeUploaded}
            setAnalysisStarted={setAnalysisStarted}
            onSectionChange={onSectionChange}
            setAnalysisData={setAnalysisData}
            jobDataFromHeader={jobDataFromHeader}
          />
        );
      case 'overview':
        return <OverviewSection analysisData={analysisData} />;
      case 'keywords':
        return <KeywordsSection analysisData={analysisData} />;
      case 'experience':
        return <ExperienceSection analysisData={analysisData} />;
      case 'education':
        return <EducationSection analysisData={analysisData} />;
      case 'skills':
        return <SkillsSection analysisData={analysisData} />;
      case 'structure':
        return <StructureSection analysisData={analysisData} />;
      case 'action-verbs':
        return <ActionVerbsSection analysisData={analysisData} />;
      case 'measurable-results':
        return <MeasurableResultsSection analysisData={analysisData} />;
      case 'bullet-effectiveness':
        return <BulletEffectivenessSection analysisData={analysisData} />;
      case 'results':
        return (
          <ResultsView
            analysisData={analysisData}
            onViewDetails={() => onSectionChange('keywords')}
            onUploadNewResume={() => {
              setAnalysisData(null);
              setResumeUploaded(false);
              setAnalysisStarted(false);
              // Clear stored resume from localStorage
              localStorage.removeItem('intrvufit_resume');
              onSectionChange('start');
            }}
          />
        );
      default:
        return <StartSection
          resumeUploaded={resumeUploaded}
          setResumeUploaded={setResumeUploaded}
          setAnalysisStarted={setAnalysisStarted}
          onSectionChange={onSectionChange}
          setAnalysisData={setAnalysisData}
        />;
    }
  };

  return (
    <main className="p-6 overflow-y-auto bg-white relative min-w-0 flex flex-col h-full">
      <div className="flex items-center justify-start">
        <div className="w-full">
          {renderSection()}
        </div>
      </div>

      {/* Version info - Hidden only for results section to avoid duplication with new design */}
      {currentSection !== 'results' && (
        <div className="text-center text-xs text-gray-400 mt-8">
          <div>IntrvuFit v0.0.7</div>
          <div>All rights reserved © 2025 intrvu.ca</div>
        </div>
      )}
    </main>
  );
};

export default MainContent;