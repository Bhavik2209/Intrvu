# Frontend Integration Guide - V4 Resume Optimizer

## API Changes

### ✅ What Changed
- **V4 is now the ONLY version** - no version parameter needed
- API endpoint remains the same: `POST /api/analyze`
- V3 scoring system has been removed

### 📡 API Request (No Changes Needed)

```javascript
const formData = new FormData();
formData.append('resume', pdfFile);
formData.append('jobData', JSON.stringify({
  jobTitle: "Software Engineer",
  company: "Tech Corp",
  description: "Job description text..."
}));

const response = await fetch('/api/analyze', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

## 🎯 New V4 Response Structure

### Main Scores

```javascript
const analysis = result.analysis;

// Two independent scores (NEW in V4)
const jobFitScore = analysis.jobFitScore.score;        // Number: 0-100
const jobFitLabel = analysis.jobFitScore.label;        // String: "Great Match" | "Good Match" | "Moderate Match" | "Low Fit"

const qualityScore = analysis.resumeQualityScore.score; // Number: 0-100
const qualityTier = analysis.resumeQualityScore.tier;   // String: "Ready to Impress" | "Needs Polish" | "Refine for Impact"

// Context information (NEW in V4)
const context = analysis.context;
const careerStage = context.careerStage;                // String: "Entry-Level" | "Mid-Level" | "Senior/Executive"
const industry = context.industry;                      // String: "Tech/Engineering" | "Creative/Design" | etc.
const yearsExp = context.yearsOfExperience;             // Number: e.g., 5.5
```

### Job Fit Components (Total: 100 points)

```javascript
const jobFit = analysis.jobFitScore.components;

// Keyword & Contextual Match (0-35 points)
const keywordScore = jobFit.keywordMatch.score.pointsAwarded;
const keywordAnalysis = jobFit.keywordMatch.analysis;
// keywordAnalysis contains: strongMatches, partialMatches, missingKeywords, keywordStuffing

// Experience Alignment (0-30 points)
const experienceScore = jobFit.experienceAlignment.score.pointsAwarded;
const experienceAnalysis = jobFit.experienceAlignment.analysis;
// experienceAnalysis contains: strongMatches, partialMatches, misalignedRoles

// Education Requirement (0 or 20 points - BINARY)
const educationScore = jobFit.educationRequirement.score.pointsAwarded;
const educationPassed = jobFit.educationRequirement.score.passed; // Boolean
const educationAnalysis = jobFit.educationRequirement.analysis;
// educationAnalysis contains: degreeFound, degreeType, status

// Skills & Tools Match (0-15 points)
const skillsScore = jobFit.skillsToolsMatch.score.pointsAwarded;
const skillsAnalysis = jobFit.skillsToolsMatch.analysis;
// skillsAnalysis contains: hardSkillMatches, softSkillMatches, missingSkills
```

### Resume Quality Components (Total: 100 points)

```javascript
const quality = analysis.resumeQualityScore.components;

// Resume Structure (0-30 points)
const structureScore = quality.structure.score.pointsAwarded;
const structureAnalysis = quality.structure.analysis;
// structureAnalysis contains: sectionStatus, missingRequiredSections, atsIssues

// Action Words Usage (0-25 points)
const actionWordsScore = quality.actionWords.score.pointsAwarded;
const actionWordsAnalysis = quality.actionWords.analysis;
// actionWordsAnalysis contains: strongActionVerbs, weakActionVerbs, clichesAndBuzzwords

// Measurable Results (0-25 points)
const measurableScore = quality.measurableResults.score.pointsAwarded;
const measurableAnalysis = quality.measurableResults.analysis;
// measurableAnalysis contains: measurableResults, opportunitiesForMetrics

// Bullet Effectiveness (0-20 points)
const bulletScore = quality.bulletEffectiveness.score.pointsAwarded;
const bulletAnalysis = quality.bulletEffectiveness.analysis;
// bulletAnalysis contains: effectiveBullets, ineffectiveBullets
```

## 🎨 Recommended UI Components

### 1. Hero Score Display

```jsx
<div className="score-hero">
  <div className="job-fit">
    <h2>Job Fit Score</h2>
    <div className="score">{jobFitScore.toFixed(1)}</div>
    <div className="label">{jobFitLabel}</div>
    <ProgressBar value={jobFitScore} max={100} />
  </div>
  
  <div className="resume-quality">
    <h2>Resume Quality</h2>
    <div className="score">{qualityScore.toFixed(1)}</div>
    <div className="tier">{qualityTier}</div>
    <ProgressBar value={qualityScore} max={100} />
  </div>
</div>
```

### 2. Context Badge

```jsx
<div className="context-info">
  <span className="badge">{careerStage}</span>
  <span className="badge">{industry}</span>
  <span className="badge">{yearsExp} years exp</span>
</div>
```

### 3. Job Fit Breakdown

```jsx
<div className="job-fit-breakdown">
  <h3>Job Fit Breakdown</h3>
  
  <ScoreBar 
    label="Keyword Match" 
    score={keywordScore} 
    max={35} 
  />
  
  <ScoreBar 
    label="Experience Alignment" 
    score={experienceScore} 
    max={30} 
  />
  
  <ScoreBar 
    label="Education Required" 
    score={educationScore} 
    max={20}
    passed={educationPassed}
  />
  
  <ScoreBar 
    label="Skills & Tools" 
    score={skillsScore} 
    max={15} 
  />
</div>
```

### 4. Resume Quality Breakdown

```jsx
<div className="quality-breakdown">
  <h3>Resume Quality Breakdown</h3>
  
  <ScoreBar 
    label="Structure" 
    score={structureScore} 
    max={30} 
  />
  
  <ScoreBar 
    label="Action Words" 
    score={actionWordsScore} 
    max={25} 
  />
  
  <ScoreBar 
    label="Measurable Results" 
    score={measurableScore} 
    max={25} 
  />
  
  <ScoreBar 
    label="Bullet Effectiveness" 
    score={bulletScore} 
    max={20} 
  />
</div>
```

## 📊 Score Labels & Colors

### Job Fit Labels
- **90-100:** "Great Match" → Green (#22c55e)
- **75-89:** "Good Match" → Blue (#3b82f6)
- **60-74:** "Moderate Match" → Yellow (#eab308)
- **0-59:** "Low Fit" → Red (#ef4444)

### Resume Quality Tiers
- **90-100:** "Ready to Impress" → Green (#22c55e)
- **70-89:** "Needs Polish" → Yellow (#eab308)
- **0-69:** "Refine for Impact" → Orange (#f97316)

## 🔄 Migration Checklist

- [ ] Update API response parsing to use new V4 structure
- [ ] Create/update UI components for two-score display
- [ ] Add context badge display (career stage, industry, years)
- [ ] Update score breakdown components (new max values)
- [ ] Update color schemes for new labels/tiers
- [ ] Remove any V3-specific code
- [ ] Test with real API responses
- [ ] Update TypeScript types (if applicable)

## 📝 TypeScript Types (Optional)

```typescript
interface V4Analysis {
  jobFitScore: {
    score: number;
    label: "Great Match" | "Good Match" | "Moderate Match" | "Low Fit";
    components: {
      keywordMatch: ComponentScore;
      experienceAlignment: ComponentScore;
      educationRequirement: ComponentScore & { passed: boolean };
      skillsToolsMatch: ComponentScore;
    };
  };
  resumeQualityScore: {
    score: number;
    tier: "Ready to Impress" | "Needs Polish" | "Refine for Impact";
    components: {
      structure: ComponentScore;
      actionWords: ComponentScore;
      measurableResults: ComponentScore;
      bulletEffectiveness: ComponentScore;
    };
  };
  context: {
    careerStage: "Entry-Level" | "Mid-Level" | "Senior/Executive";
    industry: string;
    yearsOfExperience: number;
  };
}

interface ComponentScore {
  score: {
    pointsAwarded: number;
    maxPoints: number;
    rating: string;
    ratingSymbol: string;
  };
  analysis: any; // Specific to each component
}
```

## ⚠️ Breaking Changes from V3

1. **No more `overall_score`** - Use `jobFitScore.score` instead
2. **Component max points changed:**
   - Keyword: 21 → 35
   - Experience: 18 → 30
   - Education: 20 → 20 (now binary)
   - Skills: 21 → 15
   - Structure: 12 → 30
   - Action Words: 10 → 25
   - Measurable Results: 10 → 25
   - Bullet Effectiveness: 8 → 20

3. **New required fields:**
   - `jobFitScore.label`
   - `resumeQualityScore.tier`
   - `context` object

## ✅ Summary

**What You Need to Do:**
1. Update your response parsing to read from `jobFitScore` and `resumeQualityScore`
2. Display two scores instead of one overall score
3. Show the new labels/tiers
4. Update component max values in your UI
5. Optionally display context information (career stage, industry)

**What Stays the Same:**
- API endpoint URL
- Request format (FormData with resume + jobData)
- Authentication
- Error handling

The backend is now V4-only and ready to use! 🚀
