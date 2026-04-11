import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { SectionType } from '../../App';
import { AnalysisData } from '../../types/AnalysisData';
import { useJobExtraction } from '../../hooks/useJobExtraction';
import { API_BASE_URL, API_KEY } from '../../config';
import { JobData } from '../../types/JobData';
import {
  getJobFitLabel,
  getResumeQualityLabel,
  getScoreSymbol
} from '../../utils/scoreDisplay';

// Transform backend response to match frontend expected format
const transformBackendResponse = (backendData: any): AnalysisData => {
  const analysis = backendData?.analysis ?? {};
  const fitComponents = analysis?.jobFitScore?.components ?? {};
  const qualityComponents = analysis?.resumeQualityScore?.components ?? {};

  const toNumber = (value: any, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  };

  const toString = (value: any, fallback = '') => {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return fallback;
    return String(value);
  };

  const toArray = (value: any) => (Array.isArray(value) ? value : []);

  const keywordSource = analysis?.keyword_match ?? fitComponents?.keywordMatch ?? {};
  const experienceSource = analysis?.job_experience ?? fitComponents?.experienceAlignment ?? {};
  const educationSource = analysis?.education_certifications ?? fitComponents?.educationRequirement ?? {};
  const skillsSource = analysis?.skills_tools ?? analysis?.skills_certifications ?? fitComponents?.skillsToolsMatch ?? {};
  const structureSource = analysis?.resume_structure ?? qualityComponents?.structure ?? {};
  const actionSource = analysis?.action_words ?? qualityComponents?.actionWords ?? {};
  const measurableSource = analysis?.measurable_results ?? qualityComponents?.measurableResults ?? {};
  const bulletSource = analysis?.bullet_point_effectiveness ?? qualityComponents?.bulletEffectiveness ?? {};

  const keywordPoints = toNumber(keywordSource?.score?.pointsAwarded);
  const experiencePoints = toNumber(experienceSource?.score?.pointsAwarded);
  const educationPoints = toNumber(educationSource?.score?.pointsAwarded);
  const skillsPoints = toNumber(skillsSource?.score?.pointsAwarded);
  const jobFitRawScore = keywordPoints + experiencePoints + educationPoints + skillsPoints;
  const fallbackJobFitPct = Math.max(0, Math.min(100, Math.round(jobFitRawScore)));
  const jobFitPercentage = Math.max(
    0,
    Math.min(100, Math.round(toNumber(analysis?.jobFitScore?.score, fallbackJobFitPct)))
  );
  const fitLabel = toString(analysis?.jobFitScore?.label) || getJobFitLabel(jobFitPercentage);

  const structurePoints = toNumber(structureSource?.score?.pointsAwarded);
  const actionPoints = toNumber(actionSource?.score?.pointsAwarded);
  const measurablePoints = toNumber(measurableSource?.score?.pointsAwarded);
  const bulletPoints = toNumber(bulletSource?.score?.pointsAwarded);
  const resumeQualityRawScore = structurePoints + actionPoints + measurablePoints + bulletPoints;
  const fallbackQualityPct = Math.max(0, Math.min(100, Math.round(resumeQualityRawScore)));
  const resumeQualityPercentage = Math.max(
    0,
    Math.min(100, Math.round(toNumber(analysis?.resumeQualityScore?.score, fallbackQualityPct)))
  );
  const qualityLabel = toString(analysis?.resumeQualityScore?.tier) || getResumeQualityLabel(resumeQualityPercentage);

  const normalizedStrongMatches = toArray(keywordSource?.analysis?.strongMatches).length > 0
    ? toArray(keywordSource?.analysis?.strongMatches)
    : toArray(keywordSource?.analysis?.matchedKeywords).map((item: any) => ({
      keyword: toString(item?.keyword || item),
      points: toNumber(item?.points, 2),
      status: toString(item?.status, 'Strong Match'),
      symbol: toString(item?.symbol, 'OK')
    }));

  return {
    version: toString(analysis?.version, 'v4.0'),
    job_fit_score: {
      total_points: toNumber(analysis?.jobFitScore?.score, jobFitRawScore),
      percentage: jobFitPercentage,
      label: fitLabel,
      symbol: getScoreSymbol(fitLabel)
    },
    resume_quality_score: {
      total_points: toNumber(analysis?.resumeQualityScore?.score, resumeQualityRawScore),
      percentage: resumeQualityPercentage,
      label: qualityLabel,
      symbol: getScoreSymbol(qualityLabel)
    },
    detailed_analysis: {
      keyword_match: {
        score: {
          matchPercentage: toNumber(keywordSource?.score?.matchPercentage),
          pointsAwarded: keywordPoints,
          maxPoints: toNumber(keywordSource?.score?.maxPoints, 35),
          rating: toString(keywordSource?.score?.rating, 'Unknown'),
          ratingSymbol: toString(keywordSource?.score?.ratingSymbol, '')
        },
        analysis: {
          strongMatches: normalizedStrongMatches,
          partialMatches: toArray(keywordSource?.analysis?.partialMatches),
          missingKeywords: toArray(keywordSource?.analysis?.missingKeywords),
          suggestedImprovements: toString(keywordSource?.analysis?.suggestedImprovements, '')
        }
      },
      job_experience: {
        score: {
          alignmentPercentage: toNumber(experienceSource?.score?.alignmentPercentage),
          pointsAwarded: experiencePoints,
          maxPoints: toNumber(experienceSource?.score?.maxPoints, 30),
          rating: toString(experienceSource?.score?.rating, 'Unknown'),
          ratingSymbol: toString(experienceSource?.score?.ratingSymbol, '')
        },
        analysis: {
          strongMatches: toArray(experienceSource?.analysis?.strongMatches).map((item: any) => ({
            role: toString(item?.role || item?.responsibility),
            points: toNumber(item?.points, 0),
            status: toString(item?.status),
            notes: toString(item?.notes),
            symbol: toString(item?.symbol)
          })),
          partialMatches: toArray(experienceSource?.analysis?.partialMatches).map((item: any) => ({
            role: toString(item?.role || item?.responsibility),
            points: toNumber(item?.points, 0),
            status: toString(item?.status),
            notes: toString(item?.notes),
            symbol: toString(item?.symbol)
          })),
          misalignedRoles: toArray(experienceSource?.analysis?.misalignedRoles ?? experienceSource?.analysis?.missingExperience),
          suggestedImprovements: toString(experienceSource?.analysis?.suggestedImprovements, '')
        }
      },
      education_certifications: {
        score: {
          passed: Boolean(educationSource?.score?.passed),
          pointsAwarded: educationPoints,
          maxPoints: toNumber(educationSource?.score?.maxPoints, 20),
          rating: toString(educationSource?.score?.rating, 'Unknown'),
          ratingSymbol: toString(educationSource?.score?.ratingSymbol, ''),
          matchPercentage: toNumber(
            educationSource?.score?.matchPercentage ?? educationSource?.score?.educationCertificationMatchPercentage,
            0
          )
        },
        analysis: {
          status: toString(educationSource?.analysis?.status, ''),
          degreeFound: toString(educationSource?.analysis?.degreeFound, 'None'),
          degreeType: toString(educationSource?.analysis?.degreeType, 'None'),
          fieldOfStudy: toString(educationSource?.analysis?.fieldOfStudy, ''),
          suggestedImprovements: toString(educationSource?.analysis?.suggestedImprovements, ''),
          educationMatch: toArray(educationSource?.analysis?.educationMatch),
          certificationMatches: toArray(educationSource?.analysis?.certificationMatches),
          missingCredentials: toArray(educationSource?.analysis?.missingCredentials)
        }
      },
      skills_tools: {
        score: {
          matchPercentage: toNumber(skillsSource?.score?.matchPercentage ?? skillsSource?.score?.skillsMatchPercentage),
          pointsAwarded: skillsPoints,
          maxPoints: toNumber(skillsSource?.score?.maxPoints, 15),
          rating: toString(skillsSource?.score?.rating ?? skillsSource?.score?.skillsRating, 'Unknown'),
          ratingSymbol: toString(skillsSource?.score?.ratingSymbol ?? skillsSource?.score?.skillsRatingSymbol, '')
        },
        analysis: {
          hardSkillMatches: toArray(skillsSource?.analysis?.hardSkillMatches),
          softSkillMatches: toArray(skillsSource?.analysis?.softSkillMatches),
          missingSkills: toArray(skillsSource?.analysis?.missingSkills),
          doubleCountReductions: toArray(skillsSource?.analysis?.doubleCountReductions),
          suggestedImprovements: toString(skillsSource?.analysis?.suggestedImprovements, '')
        }
      },
      resume_structure: {
        score: {
          pointsAwarded: structurePoints,
          maxPoints: toNumber(structureSource?.score?.maxPoints, 30),
          completedMustHave: toNumber(structureSource?.score?.completedMustHave ?? structureSource?.score?.completedSections),
          totalMustHave: toNumber(structureSource?.score?.totalMustHave ?? structureSource?.score?.totalMustHaveSections ?? structureSource?.score?.totalRequiredSections),
          completedNiceToHave: toNumber(structureSource?.score?.completedNiceToHave, 0),
          totalNiceToHave: toNumber(structureSource?.score?.totalNiceToHave, 0),
          bonusPoints: toNumber(structureSource?.score?.bonusPoints, 0),
          rating: toString(structureSource?.score?.rating, 'Unknown'),
          ratingSymbol: toString(structureSource?.score?.ratingSymbol, '')
        },
        analysis: {
          sectionStatus: toArray(structureSource?.analysis?.sectionStatus),
          suggestedImprovements: toString(structureSource?.analysis?.suggestedImprovements, '')
        }
      },
      action_words: {
        score: {
          actionVerbPercentage: toNumber(actionSource?.score?.actionVerbPercentage),
          pointsAwarded: actionPoints,
          maxPoints: toNumber(actionSource?.score?.maxPoints, 25),
          rating: toString(actionSource?.score?.rating, 'Unknown'),
          ratingSymbol: toString(actionSource?.score?.ratingSymbol, '')
        },
        analysis: {
          strongActionVerbs: toArray(actionSource?.analysis?.strongActionVerbs),
          weakActionVerbs: toArray(actionSource?.analysis?.weakActionVerbs),
          clichesAndBuzzwords: toArray(actionSource?.analysis?.clichesAndBuzzwords),
          suggestedImprovements: toString(actionSource?.analysis?.suggestedImprovements, '')
        }
      },
      measurable_results: {
        score: {
          measurableResultsCount: toNumber(measurableSource?.score?.measurableResultsCount),
          pointsAwarded: measurablePoints,
          maxPoints: toNumber(measurableSource?.score?.maxPoints, 25),
          rating: toString(measurableSource?.score?.rating, 'Unknown'),
          ratingSymbol: toString(measurableSource?.score?.ratingSymbol, '')
        },
        analysis: {
          measurableResults: toArray(measurableSource?.analysis?.measurableResults),
          opportunitiesForMetrics: toArray(measurableSource?.analysis?.opportunitiesForMetrics),
          suggestedImprovements: toString(measurableSource?.analysis?.suggestedImprovements, '')
        }
      },
      bullet_point_effectiveness: {
        score: {
          effectiveBulletPercentage: toNumber(bulletSource?.score?.effectiveBulletPercentage),
          pointsAwarded: bulletPoints,
          maxPoints: toNumber(bulletSource?.score?.maxPoints, 20),
          rating: toString(bulletSource?.score?.rating, 'Unknown'),
          ratingSymbol: toString(bulletSource?.score?.ratingSymbol, '')
        },
        analysis: {
          effectiveBullets: toArray(bulletSource?.analysis?.effectiveBullets),
          ineffectiveBullets: toArray(bulletSource?.analysis?.ineffectiveBullets),
          suggestedImprovements: toString(bulletSource?.analysis?.suggestedImprovements, '')
        }
      }
    },
    overall_score: analysis?.overall_score ?? analysis?.jobFitScore?.score
  };
};

interface StartSectionProps {
  resumeUploaded: boolean;
  setResumeUploaded: (uploaded: boolean) => void;
  setAnalysisStarted: (started: boolean) => void;
  onSectionChange: (section: SectionType) => void;
  setAnalysisData: (data: AnalysisData) => void;
  jobDataFromHeader?: JobData;
}

const StartSection: React.FC<StartSectionProps> = ({
  resumeUploaded,
  setResumeUploaded,
  setAnalysisStarted,
  onSectionChange,
  setAnalysisData,
  jobDataFromHeader
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { jobStatus } = useJobExtraction();
  const [storedJobData, setStoredJobData] = useState<JobData | undefined>(undefined);
  const effectiveJobData = jobDataFromHeader ?? storedJobData ?? jobStatus.currentJobData;

  // Load stored resume on component mount
  useEffect(() => {
    // Try load job data from chrome storage as an immediate fallback
    (async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          const res = await chrome.storage.local.get(['currentJobData']);
          if (res?.currentJobData) setStoredJobData(res.currentJobData as JobData);
        }
      } catch { }
    })();

    // Listen for storage updates to currentJobData
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === 'local' && changes.currentJobData) {
        const val = changes.currentJobData.newValue as JobData | undefined;
        setStoredJobData(val);
      }
    };
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    // Listen for direct extractor messages for immediate updates
    const handleMessage = (message: any) => {
      if (message && message.type === 'JOB_DATA_EXTRACTED' && message.data) {
        setStoredJobData(message.data as JobData);
      }
    };
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);
    }

    const storedResume = localStorage.getItem('intrvufit_resume');
    if (storedResume) {
      try {
        const fileData = JSON.parse(storedResume);
        // Convert base64 back to File object
        fetch(fileData.content)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], fileData.name, {
              type: fileData.type,
              lastModified: fileData.lastModified
            });
            setUploadedFile(file);
            setResumeUploaded(true);
          });
      } catch (error) {
        console.error('Error loading stored resume:', error);
        localStorage.removeItem('intrvufit_resume');
      }
    }
    return () => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(handleMessage);
      }
    };
  }, []);

  const handleFileUpload = (file?: File) => {
    if (file) {
      setUploadedFile(file);
      // Store file data in localStorage
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          content: e.target?.result as string
        };
        localStorage.setItem('intrvufit_resume', JSON.stringify(fileData));
      };
      reader.readAsDataURL(file);
    }
    setResumeUploaded(true);
    setError(null);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();

      if (!uploadedFile) {
        setError('Please upload a PDF resume before analyzing.');
        setIsAnalyzing(false);
        return;
      }

      // Ensure uploaded file is a PDF by type and name
      const isPdfType = uploadedFile.type === 'application/pdf';
      const isPdfName = uploadedFile.name.toLowerCase().endsWith('.pdf');
      if (!isPdfType || !isPdfName) {
        setError('Only PDF files are allowed. Please upload a .pdf file.');
        setIsAnalyzing(false);
        return;
      }

      formData.append('resume', uploadedFile);

      // Use extracted job data from LinkedIn or fallback
      const jobData = effectiveJobData ? {
        jobTitle: effectiveJobData.jobTitle || "Job Title",
        company: effectiveJobData.company || "Company Name",
        description: effectiveJobData.jobDescription || "Job description not available",
        url: effectiveJobData.url || window.location.href,
        location: effectiveJobData.location,
        jobType: effectiveJobData.jobType,
        experienceLevel: effectiveJobData.experienceLevel,
        workMode: effectiveJobData.workMode,
        salary: effectiveJobData.salary,
        postedTime: effectiveJobData.postedTime,
        applicantCount: effectiveJobData.applicantCount
      } : {
        jobTitle: "No Job Data",
        company: "Please visit a LinkedIn job page",
        description: "Navigate to a LinkedIn job posting to extract job details for analysis",
        url: "https://linkedin.com/jobs"
      };

      // Validate description length per backend requirement (>= 100)
      const descriptionText = String(jobData.description ?? '');
      if (descriptionText.length < 100) {
        setError('Job description must be at least 100 characters. Open a job page with a full description.');
        setIsAnalyzing(false);
        return;
      }

      formData.append('jobData', JSON.stringify(jobData));

      console.log('Sending request to:', `${API_BASE_URL}/api/analyze`);
      console.log('FormData contents:', {
        resume: formData.get('resume'),
        jobData: formData.get('jobData')
      });

      let response;
      try {
        const requestHeaders: Record<string, string> = {};
        if (API_KEY) {
          requestHeaders['X-API-Key'] = API_KEY;
        }

        response = await fetch(`${API_BASE_URL}/api/analyze`, {
          method: 'POST',
          body: formData,
          mode: 'cors',
          credentials: 'omit',
          headers: requestHeaders,
        });
      } catch (fetchError) {
        console.error('Network/CORS Error:', fetchError);
        if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
          throw new Error('Unable to connect to backend server.');
        }
        throw fetchError;
      }

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const analysisResult = await response.json();
      console.log('Analysis result received:', analysisResult);

      // Transform the backend response to match the expected frontend format
      const transformedData = transformBackendResponse(analysisResult);
      console.log('Transformed data:', transformedData);

      setAnalysisData(transformedData);
      setAnalysisStarted(true);
      onSectionChange('results');
    } catch (err) {
      console.error('Analysis failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setError(errorMessage);
      console.error('Full error details:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        handleFileUpload(file);
      }
    }
  };

  const hasJobData = Boolean(effectiveJobData?.jobDescription);

  const descriptionLen = effectiveJobData?.jobDescription?.length ?? 0;
  const hasLongEnoughDescription = descriptionLen >= 100;
  const hasFile = !!uploadedFile;
  const canAnalyze = hasFile && hasJobData && hasLongEnoughDescription && !isAnalyzing;

  // Debug logging
  console.log('StartSection: jobStatus:', jobStatus);
  console.log('StartSection: currentJobData:', jobStatus.currentJobData);
  console.log('StartSection: hasJobData:', hasJobData);
  console.log('StartSection: canAnalyze:', canAnalyze);

  if (jobStatus.currentJobData) {
    console.log('StartSection: jobTitle:', jobStatus.currentJobData.jobTitle);
    console.log('StartSection: company:', jobStatus.currentJobData.company);
    console.log('StartSection: jobDescription:', jobStatus.currentJobData.jobDescription);
    console.log('StartSection: jobDescription length:', jobStatus.currentJobData.jobDescription?.length);
  }

  return (
    <div className="w-full relative">
      {/* Upload Your Resume Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Your Resume</h2>

        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 cursor-pointer
            ${dragOver
              ? 'border-blue-400 bg-blue-50 transform scale-105'
              : resumeUploaded
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {resumeUploaded ? (
            <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">Resume successfully uploaded: {uploadedFile?.name || 'Resume_John_Matthew_2025.pdf'}</span>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-4 text-sm">
                Drag and drop your PDF resume or click to browse
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Maximum file size: 5MB
              </p>
            </>
          )}

          <input
            type="file"
            accept=".pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file);
              }
            }}
            className="hidden"
            id="resume-upload"
          />
          <label
            htmlFor="resume-upload"
            className="inline-block px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
          >
            {resumeUploaded ? 'Change File' : 'Browse Files'}
          </label>
        </div>
      </div>

      {/* Success Message */}
      {resumeUploaded && (
        <div className="mb-6">
          <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Resume successfully uploaded: {uploadedFile?.name || 'Resume_John_Matthew_2025.pdf'}</span>
          </div>
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={!canAnalyze}
        className={`
          w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 text-base mb-6
          ${canAnalyze
            ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60 focus:outline-none'
          }
        `}
      >
        {isAnalyzing ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Analyzing...</span>
          </div>
        ) : (
          'Analyze'
        )}
      </button>

      {/* Job Description Status */}
      {!hasJobData && (
        <div className="mb-4">
          <div className="flex items-center gap-2 p-3 rounded-lg border border-orange-200 bg-orange-50 text-orange-600">
            <span className="text-sm">⚠️</span>
            <span className="text-sm font-medium">
              No job description extracted. Please visit a LinkedIn job page first.
            </span>
          </div>
        </div>
      )}

      {hasJobData && !hasLongEnoughDescription && (
        <div className="mb-4">
          <div className="flex items-center gap-2 p-3 rounded-lg border border-orange-200 bg-orange-50 text-orange-600">
            <span className="text-sm">⚠️</span>
            <span className="text-sm font-medium">
              The extracted job description is too short (min 100 characters required). Open a job post with a full description.
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            <span className="text-sm">❌</span>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartSection;