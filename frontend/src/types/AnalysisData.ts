export interface AnalysisData {
    version: string;
    job_fit_score: {
        total_points: number;
        percentage: number;
        label: string;
        symbol: string;
    };
    resume_quality_score: {
        total_points: number;
        percentage: number;
        label: string;
        symbol: string;
    };
    detailed_analysis: {
        keyword_match: {
            score: {
                matchPercentage: number;
                pointsAwarded: number;
                maxPoints: number;
                rating: string;
                ratingSymbol: string;
            };
            analysis: {
                strongMatches: any[];
                partialMatches: any[];
                missingKeywords: any[];
                suggestedImprovements: string;
            };
        };
        job_experience: {
            score: {
                alignmentPercentage: number;
                pointsAwarded: number;
                maxPoints: number;
                rating: string;
                ratingSymbol: string;
            };
            analysis: {
                strongMatches: any[];
                partialMatches: any[];
                misalignedRoles: any[];
                suggestedImprovements: string;
            };
        };
        skills_tools: {
            score: {
                matchPercentage: number;
                pointsAwarded: number;
                maxPoints: number;
                rating: string;
                ratingSymbol: string;
            };
            analysis: {
                hardSkillMatches: any[];
                softSkillMatches: any[];
                missingSkills: any[];
                doubleCountReductions: any[];
                suggestedImprovements: string;
            };
        };
        resume_structure: {
            score: {
                pointsAwarded: number;
                maxPoints: number;
                completedMustHave: number;
                totalMustHave: number;
                completedNiceToHave: number;
                bonusPoints: number;
                rating: string;
                ratingSymbol: string;
            };
            analysis: {
                sectionStatus: any[];
                suggestedImprovements: string;
            };
        };
        action_words: {
            score: {
                actionVerbPercentage: number;
                pointsAwarded: number;
                maxPoints: number;
                rating: string;
                ratingSymbol: string;
            };
            analysis: {
                strongActionVerbs: any[];
                weakActionVerbs: any[];
                clichesAndBuzzwords: any[];
                suggestedImprovements: string;
            };
        };
        measurable_results: {
            score: {
                measurableResultsCount: number;
                pointsAwarded: number;
                maxPoints: number;
                rating: string;
                ratingSymbol: string;
            };
            analysis: {
                measurableResults: any[];
                opportunitiesForMetrics: any[];
                suggestedImprovements: string;
            };
        };
        education_certifications?: {
            score: {
                passed: boolean;
                pointsAwarded: number;
                maxPoints: number;
                rating: string;
                ratingSymbol: string;
            };
            analysis: {
                status: string;
                degreeFound: string;
                degreeType: string;
                fieldOfStudy: string;
                suggestedImprovements: string;
            };
        };
        bullet_point_effectiveness?: {
            score: {
                effectiveBulletPercentage: number;
                pointsAwarded: number;
                maxPoints: number;
                rating: string;
                ratingSymbol: string;
            };
            analysis: {
                effectiveBullets: any[];
                ineffectiveBullets: any[];
                suggestedImprovements: string;
            };
        };
        [key: string]: any;
    };
    overall_score?: any;
    // Allow dynamic fields but prioritize the above strict structure
    [key: string]: any;
}
