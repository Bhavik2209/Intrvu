export interface JobData {
  url: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  workMode?: string;
  salary?: string;
  postedTime?: string;
  applicantCount?: string;
  extractedAt: string;
}

export interface JobExtractionStatus {
  isActive: boolean;
  lastExtracted?: number;
  currentJobData?: JobData;
}
