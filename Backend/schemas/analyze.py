from pydantic import BaseModel, Field
from typing import Optional

class JobData(BaseModel):
    jobTitle: Optional[str] = Field(default=None, max_length=100)
    company: Optional[str] = Field(default=None, max_length=100)
    description: str = Field(min_length=100)
    url: str = Field(max_length=500)

class KeywordMatchScore(BaseModel):
    matchPercentage: float
    pointsAwarded: float
    maxPoints: Optional[float] = None
    rating: Optional[str] = None
    ratingSymbol: Optional[str] = None

class KeywordMatchAnalysis(BaseModel):
    matchedKeywords: list
    missingKeywords: list
    suggestedImprovements: Optional[str] = None

class KeywordMatch(BaseModel):
    score: KeywordMatchScore
    analysis: KeywordMatchAnalysis

class GenericScore(BaseModel):
    pointsAwarded: float
    rating: Optional[str] = None
    ratingSymbol: Optional[str] = None
    maxPoints: Optional[float] = None

class SectionStatusItem(BaseModel):
    section: str
    status: str
    symbol: str

class ResumeStructureAnalysis(BaseModel):
    sectionStatus: list[SectionStatusItem]
    suggestedImprovements: Optional[str]

class ResumeStructure(BaseModel):
    score: GenericScore | dict
    analysis: ResumeStructureAnalysis | dict

class AnalysisPayload(BaseModel):
    keyword_match: dict | KeywordMatch
    job_experience: dict
    skills_certifications: dict
    resume_structure: dict | ResumeStructure
    action_words: dict
    measurable_results: dict
    bullet_point_effectiveness: dict
    overall_score: float | int | None = None

class JobContext(BaseModel):
    title: str
    company: str
    description_length: int

class AnalyzeResponse(BaseModel):
    job_context: JobContext
    analysis: AnalysisPayload
    process_time_seconds: float
