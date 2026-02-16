import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { SectionType } from '../../App';
import { AnalysisData } from '../../types/AnalysisData';
import { useJobExtraction } from '../../hooks/useJobExtraction';
import { API_BASE_URL } from '../../config';
import { JobData } from '../../types/JobData';

// Transform backend response to match frontend expected format
const transformBackendResponse = (backendData: any): AnalysisData => {
  const analysis = backendData.analysis;

  // Helper to normalize keyword-like inputs from backend into consistent objects
  const normKeywordItem = (input: any, defaults: { points: number; status: string; symbol: string }) => {
    try {
      if (typeof input === 'string') {
        return { keyword: input, ...defaults };
      }
      if (input && typeof input === 'object') {
        const keywordVal = typeof input.keyword === 'string'
          ? input.keyword
          : typeof input.name === 'string'
            ? input.name
            : typeof input.text === 'string'
              ? input.text
              : JSON.stringify(input);
        return {
          keyword: keywordVal,
          points: typeof input.points === 'number' ? input.points : defaults.points,
          status: typeof input.status === 'string' ? input.status : defaults.status,
          symbol: typeof input.symbol === 'string' ? input.symbol : defaults.symbol,
        };
      }
      return { keyword: String(input), ...defaults };
    } catch {
      return { keyword: String(input), ...defaults };
    }
  };

  // Calculate component scores with proper max points
  const maxJobFitPoints = 35 + 30 + 15; // keyword_match + job_experience + skills_tools
  const maxResumeQualityPoints = 20 + 30 + 25 + 25 + 20; // education + structure + action_words + measurable + bullets

  // Calculate job fit score (skills, experience, keywords)
  const jobFitRawScore =
    (analysis.keyword_match?.score?.pointsAwarded ?? 0) +
    (analysis.job_experience?.score?.pointsAwarded ?? 0) +
    ((analysis.skills_tools ?? analysis.skills_certifications)?.score?.pointsAwarded ?? 0);

  const jobFitPercentage = maxJobFitPoints > 0
    ? Math.min(100, Math.round((jobFitRawScore / maxJobFitPoints) * 100))
    : 0;

  // Calculate resume quality score (structure, education, action words, measurable results, bullets)
  const resumeQualityRawScore =
    ((analysis.skills_certifications ?? analysis.education_certifications)?.score?.pointsAwarded ?? 0) +
    (analysis.resume_structure?.score?.pointsAwarded ?? 0) +
    (analysis.action_words?.score?.pointsAwarded ?? 0) +
    (analysis.measurable_results?.score?.pointsAwarded ?? 0) +
    (analysis.bullet_point_effectiveness?.score?.pointsAwarded ?? 0);

  const resumeQualityPercentage = maxResumeQualityPoints > 0
    ? Math.min(100, Math.round((resumeQualityRawScore / maxResumeQualityPoints) * 100))
    : 0;

  return {
    version: "v3.0",
    job_fit_score: {
      total_points: jobFitRawScore,
      percentage: jobFitPercentage,
      label: jobFitPercentage >= 80 ? "✅ Excellent Match" :
        jobFitPercentage >= 70 ? "👍 Good Match" :
          jobFitPercentage >= 60 ? "⚠️ Fair Match" : "❌ Poor Match",
      symbol: jobFitPercentage >= 80 ? "✅" :
        jobFitPercentage >= 70 ? "👍" :
          jobFitPercentage >= 60 ? "⚠️" : "❌"
    },
    resume_quality_score: {
      total_points: resumeQualityRawScore,
      percentage: resumeQualityPercentage,
      label: resumeQualityPercentage >= 80 ? "✅ Excellent Quality" :
        resumeQualityPercentage >= 70 ? "👍 Good Quality" :
          resumeQualityPercentage >= 60 ? "⚠️ Needs Polish" : "❌ Poor Quality",
      symbol: resumeQualityPercentage >= 80 ? "✅" :
        resumeQualityPercentage >= 70 ? "👍" :
          resumeQualityPercentage >= 60 ? "⚠️" : "❌"
    },
    detailed_analysis: {
      keyword_match: {
        score: {
          matchPercentage: analysis.keyword_match.score.matchPercentage,
          pointsAwarded: analysis.keyword_match.score.pointsAwarded,
          maxPoints: 35,
          rating: analysis.keyword_match.score.rating,
          ratingSymbol: analysis.keyword_match.score.ratingSymbol
        },
        analysis: {
          strongMatches: (Array.isArray(analysis.keyword_match.analysis.strongMatches) && analysis.keyword_match.analysis.strongMatches.length > 0)
            ? analysis.keyword_match.analysis.strongMatches
            : (Array.isArray(analysis.keyword_match.analysis.matchedKeywords) ? analysis.keyword_match.analysis.matchedKeywords : [])
              .map((kw: any) => normKeywordItem(kw, { points: 2, status: 'Strong Match', symbol: '✅' })),
          partialMatches: Array.isArray(analysis.keyword_match.analysis.partialMatches)
            ? analysis.keyword_match.analysis.partialMatches
            : [],
          missingKeywords: (Array.isArray(analysis.keyword_match.analysis.missingKeywords) ? analysis.keyword_match.analysis.missingKeywords : [])
            .map((kw: any) => normKeywordItem(kw, { points: -1, status: 'Missing', symbol: '❌' })),
          suggestedImprovements: analysis.keyword_match.analysis.suggestedImprovements
        }
      },
      job_experience: {
        score: {
          alignmentPercentage: analysis.job_experience.score.alignmentPercentage,
          pointsAwarded: analysis.job_experience.score.pointsAwarded,
          maxPoints: 30,
          rating: analysis.job_experience.score.rating,
          ratingSymbol: analysis.job_experience.score.ratingSymbol
        },
        analysis: {
          strongMatches: (analysis.job_experience.analysis.strongMatches ?? []).map((match: any) => ({
            role: match.responsibility,
            points: 3,
            status: match.status,
            notes: match.notes,
            symbol: "✅"
          })),
          partialMatches: (analysis.job_experience.analysis.partialMatches ?? []).map((match: any) => ({
            role: match.responsibility,
            points: 1.5,
            status: match.status,
            notes: match.notes,
            symbol: "⚠️"
          })),
          misalignedRoles: (analysis.job_experience.analysis.missingExperience ?? []).map((exp: any) => ({
            role: exp.responsibility,
            points: -1,
            status: exp.status,
            notes: exp.notes,
            symbol: "❌"
          })),
          suggestedImprovements: analysis.job_experience.analysis.suggestedImprovements
        }
      },
      education_certifications: {
        score: {
          passed: analysis.jobFitScore?.components?.educationRequirement?.score?.passed ?? false,
          pointsAwarded: analysis.jobFitScore?.components?.educationRequirement?.score?.pointsAwarded ?? 0,
          maxPoints: analysis.jobFitScore?.components?.educationRequirement?.score?.maxPoints ?? 20,
          rating: analysis.jobFitScore?.components?.educationRequirement?.score?.rating ?? 'Not Met',
          ratingSymbol: analysis.jobFitScore?.components?.educationRequirement?.score?.ratingSymbol ?? '❌'
        },
        analysis: {
          status: analysis.jobFitScore?.components?.educationRequirement?.analysis?.status ?? 'Unknown',
          degreeFound: analysis.jobFitScore?.components?.educationRequirement?.analysis?.degreeFound ?? 'None',
          degreeType: analysis.jobFitScore?.components?.educationRequirement?.analysis?.degreeType ?? 'None',
          fieldOfStudy: analysis.jobFitScore?.components?.educationRequirement?.analysis?.fieldOfStudy ?? '',
          suggestedImprovements: analysis.jobFitScore?.components?.educationRequirement?.analysis?.suggestedImprovements ?? ''
        }
      },
      // Prefer backend V3 skills_tools if present; otherwise derive from skills_certifications for backward compatibility
      skills_tools: (() => {
        const v3 = (analysis as any).skills_tools;
        if (v3 && v3.score && v3.analysis) {
          // Extract matched skills - normalize different backend formats
          let matchedSkills = [];
          if (Array.isArray(v3.analysis.matchedSkills)) {
            matchedSkills = v3.analysis.matchedSkills;
          } else if (Array.isArray(v3.analysis.hardSkillMatches)) {
            matchedSkills = v3.analysis.hardSkillMatches;
          }

          return {
            score: {
              matchPercentage: v3.score.matchPercentage ?? v3.score.skillsMatchPercentage ?? 0,
              pointsAwarded: v3.score.pointsAwarded ?? v3.score.skillsPointsAwarded ?? 0,
              maxPoints: v3.score.maxPoints ?? 15,
              rating: v3.score.rating ?? v3.score.skillsRating ?? '',
              ratingSymbol: v3.score.ratingSymbol ?? v3.score.skillsRatingSymbol ?? ''
            },
            analysis: {
              hardSkillMatches: matchedSkills.map((skill: any) => ({
                skill: typeof skill === 'string' ? skill : (skill?.skill ?? skill?.name ?? String(skill)),
                points: typeof skill === 'object' ? (skill.points ?? 1.0) : 1.0,
                status: typeof skill === 'object' ? (skill.status ?? 'Found in Resume') : 'Found in Resume',
                symbol: typeof skill === 'object' ? (skill.symbol ?? '✅') : '✅'
              })),
              softSkillMatches: Array.isArray(v3.analysis.softSkillMatches) ? v3.analysis.softSkillMatches : [],
              missingSkills: Array.isArray(v3.analysis.missingSkills)
                ? v3.analysis.missingSkills.map((skill: any) => ({
                  skill: typeof skill === 'string' ? skill : (skill?.skill ?? String(skill)),
                  points: -1,
                  status: skill?.status ?? 'Not Found',
                  symbol: skill?.symbol ?? '❌'
                }))
                : [],
              doubleCountReductions: Array.isArray(v3.analysis.doubleCountReductions) ? v3.analysis.doubleCountReductions : [],
              suggestedImprovements: v3.analysis.suggestedImprovements ?? ''
            }
          };
        }
        // Fallback to skills_certifications-derived structure
        // Compute safe score fields when falling back to skills_certifications
        const scScore = analysis.skills_certifications.score;
        const scPts = Number(scScore?.skillsPointsAwarded ?? scScore?.pointsAwarded ?? 0);
        const scMax = 15;
        const scMp = typeof scScore?.skillsMatchPercentage === 'number'
          ? scScore.skillsMatchPercentage
          : Math.round(scMax > 0 ? (scPts / scMax) * 100 : 0);
        let scRating = scScore?.skillsRating as string | undefined;
        let scRatingSymbol = scScore?.skillsRatingSymbol as string | undefined;
        if (!scRating) {
          if (scPts >= 13) {
            scRating = 'Excellent'; scRatingSymbol = '✅';
          } else if (scPts >= 10) {
            scRating = 'Good'; scRatingSymbol = '👍';
          } else if (scPts >= 7) {
            scRating = 'Fair'; scRatingSymbol = '⚠️';
          } else if (scPts >= 4) {
            scRating = 'Needs Improvement'; scRatingSymbol = '🛑';
          } else {
            scRating = 'Poor'; scRatingSymbol = '❌';
          }
        }
        return {
          score: {
            matchPercentage: scMp,
            pointsAwarded: scPts,
            maxPoints: scMax,
            rating: scRating,
            ratingSymbol: scRatingSymbol ?? ''
          },
          analysis: {
            hardSkillMatches: (analysis.skills_certifications.analysis.hardSkillMatches ?? []).map((skill: any) => ({
              skill: skill.skill,
              points: skill.points ?? 1.0,
              status: skill.status,
              symbol: skill.symbol
            })),
            softSkillMatches: (analysis.skills_certifications.analysis.softSkillMatches ?? []).map((skill: any) => ({
              skill: skill.skill,
              points: skill.points ?? 0.5,
              status: skill.status,
              symbol: skill.symbol
            })),
            missingSkills: (analysis.skills_certifications.analysis.missingSkills ?? []).map((skill: any) => ({
              skill: skill.skill,
              points: skill.points ?? -1,
              status: skill.status,
              symbol: skill.symbol
            })),
            doubleCountReductions: analysis.skills_certifications.analysis.doubleCountReductions ?? [],
            suggestedImprovements: analysis.skills_certifications.analysis.suggestedImprovements
          }
        };
      })(),
      resume_structure: {
        score: {
          pointsAwarded: analysis.resume_structure.score.pointsAwarded,
          maxPoints: 30,
          completedMustHave: analysis.resume_structure.score.completedSections,
          totalMustHave: analysis.resume_structure.score.totalMustHaveSections,
          completedNiceToHave: 0,
          bonusPoints: 0,
          rating: "Excellent",
          ratingSymbol: analysis.resume_structure.score.ratingSymbol
        },
        analysis: {
          sectionStatus: (analysis.resume_structure.analysis.sectionStatus ?? []).map((section: any) => ({
            section: section.section,
            type: "Must-Have",
            status: section.status,
            points: section.status === "Completed" ? 5 : 0,
            symbol: section.symbol
          })),
          suggestedImprovements: analysis.resume_structure.analysis.suggestedImprovements
        }
      },
      action_words: {
        score: {
          actionVerbPercentage: analysis.action_words.score.actionVerbPercentage,
          pointsAwarded: analysis.action_words.score.pointsAwarded,
          maxPoints: 25,
          rating: analysis.action_words.score.actionVerbPercentage >= 80 ? "Excellent" :
            analysis.action_words.score.actionVerbPercentage >= 70 ? "Good" : "Fair",
          ratingSymbol: analysis.action_words.score.ratingSymbol
        },
        analysis: {
          strongActionVerbs: (analysis.action_words.analysis.strongActionVerbs ?? []).map((verb: any) => ({
            bulletPoint: verb.bulletPoint,
            actionVerb: verb.actionVerb,
            points: 0.5,
            status: verb.status,
            symbol: verb.symbol
          })),
          weakActionVerbs: (analysis.action_words.analysis.weakActionVerbs ?? []).map((verb: any) => ({
            bulletPoint: verb.bulletPoint,
            actionVerb: verb.actionVerb,
            points: -0.5,
            suggestedReplacement: verb.suggestedReplacement,
            status: verb.status,
            symbol: verb.symbol
          })),
          clichesAndBuzzwords: [],
          suggestedImprovements: analysis.action_words.analysis.suggestedImprovements
        }
      },
      measurable_results: {
        score: {
          measurableResultsCount: analysis.measurable_results.score.measurableResultsCount,
          pointsAwarded: analysis.measurable_results.score.pointsAwarded,
          maxPoints: 25,
          rating: analysis.measurable_results.score.measurableResultsCount >= 8 ? "Excellent" :
            analysis.measurable_results.score.measurableResultsCount >= 5 ? "Good" : "Fair",
          ratingSymbol: analysis.measurable_results.score.ratingSymbol
        },
        analysis: {
          measurableResults: analysis.measurable_results.analysis.measurableResults || [],
          opportunitiesForMetrics: (analysis.measurable_results.analysis.opportunitiesForMetrics ?? []).map((opp: any) => ({
            bulletPoint: opp.bulletPoint,
            suggestion: opp.suggestion,
            symbol: opp.symbol
          })),
          suggestedImprovements: analysis.measurable_results.analysis.suggestedImprovements
        }
      },
      bullet_point_effectiveness: {
        score: {
          effectiveBulletPercentage: analysis.bullet_point_effectiveness.score.effectiveBulletPercentage,
          pointsAwarded: analysis.bullet_point_effectiveness.score.pointsAwarded,
          maxPoints: 20,
          rating: analysis.bullet_point_effectiveness.score.effectiveBulletPercentage >= 80 ? "Excellent" :
            analysis.bullet_point_effectiveness.score.effectiveBulletPercentage >= 70 ? "Good" : "Fair",
          ratingSymbol: analysis.bullet_point_effectiveness.score.ratingSymbol
        },
        analysis: {
          effectiveBullets: (analysis.bullet_point_effectiveness.analysis.effectiveBullets ?? []).map((bullet: any) => ({
            bulletPoint: bullet.bulletPoint,
            wordCount: bullet.wordCount,
            points: 2,
            status: bullet.status,
            strengths: bullet.strengths,
            symbol: bullet.symbol
          })),
          ineffectiveBullets: (analysis.bullet_point_effectiveness.analysis.ineffectiveBullets ?? []).map((bullet: any) => ({
            bulletPoint: bullet.bulletPoint,
            wordCount: bullet.wordCount,
            points: -0.5,
            status: bullet.status,
            issues: bullet.issues,
            suggestedRevision: bullet.suggestedRevision,
            symbol: bullet.symbol
          })),
          suggestedImprovements: analysis.bullet_point_effectiveness.analysis.suggestedImprovements
        }
      }
    },
    overall_score: analysis.overall_score
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
        response = await fetch(`${API_BASE_URL}/api/analyze`, {
          method: 'POST',
          body: formData,
          mode: 'cors',
          credentials: 'omit',
          headers: {
            // Don't set Content-Type header when using FormData - browser will set it automatically with boundary
          },
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