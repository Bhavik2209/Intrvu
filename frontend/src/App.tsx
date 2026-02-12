import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import LinkedInJobExtractor from './components/LinkedInJobExtractor';
import { AnalysisData } from './types/AnalysisData';
import { useJobExtraction } from './hooks/useJobExtraction';
import { JobData } from './types/JobData';

export type SectionType = 'start' | 'overview' | 'keywords' | 'experience' | 'education' | 'skills' | 'structure' | 'action-verbs' | 'measurable-results' | 'bullet-effectiveness' | 'results';

function App() {
  const [currentSection, setCurrentSection] = useState<SectionType>('start');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [showFeedbackMenu, setShowFeedbackMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isAppVisible] = useState(true);
  const { jobStatus } = useJobExtraction();
  const [extractedJobData, setExtractedJobData] = useState<JobData | undefined>(undefined);

  const handleJobDataExtracted = (data: JobData) => {
    console.log('Job data extracted in App:', data);
    setExtractedJobData(data);
  };

  // Remove automatic fetching to prevent continuous requests
  // useEffect(() => {
  //   // Removed fetchAnalysisData function to prevent continuous API requests
  // }, [jobStatus.currentJobData]);

  if (!isAppVisible) {
    return null;
  }

  return (
    <div className="flex bg-white w-full h-full overflow-hidden">
      <div className="flex flex-col overflow-hidden flex-1 min-w-0">
        <Header />
        <div className="p-4">
          <LinkedInJobExtractor onJobDataExtracted={handleJobDataExtracted} />
        </div>
        <MainContent
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
          analysisData={analysisData}
          setAnalysisData={setAnalysisData}
          resumeUploaded={resumeUploaded}
          setResumeUploaded={setResumeUploaded}
          setAnalysisStarted={setAnalysisStarted}
          jobDataFromHeader={extractedJobData}
        />
      </div>
      <Sidebar
        activeSection={currentSection}
        onSectionChange={setCurrentSection}
        analysisStarted={analysisStarted}
        showUserDropdown={showUserDropdown}
        setShowUserDropdown={setShowUserDropdown}
        showFeedbackMenu={showFeedbackMenu}
        setShowFeedbackMenu={setShowFeedbackMenu}
      />
    </div>
  )
}

export default App;