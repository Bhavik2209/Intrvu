import React, { useState } from 'react';
import { getScoreColor } from '../utils'; // Assuming utils.js is in src

// Placeholder for sub-components, will be created in next steps
const SummaryContent = ({ analysis }) => <div>Summary Content Placeholder. Overall Score: {analysis.overall_score !== undefined ? Math.round(analysis.overall_score) : 'N/A'}</div>;
const KeywordContent = ({ analysis }) => <div>Keyword Content Placeholder. Matched: {analysis.keyword_match?.analysis?.matchedKeywords?.join(', ') || 'N/A'}</div>;
const ExperienceContent = ({ analysis }) => <div>Experience Content Placeholder. Alignment: {analysis.job_experience?.score?.alignmentPercentage || 'N/A'}%</div>;
const SkillsContent = ({ analysis }) => <div>Skills Content Placeholder. Matched: {analysis.skills_certifications?.analysis?.matchedSkills?.length || 0} skills.</div>;
const StructureContent = ({ analysis }) => <div>Structure Content Placeholder. Sections: {analysis.resume_structure?.score?.completedSections || 0}/{analysis.resume_structure?.score?.totalMustHaveSections || 0}</div>;
const ActionsContent = ({ analysis }) => <div>Action Words Content Placeholder. Strong Verbs: {analysis.action_words?.analysis?.strongActionVerbs?.length || 0}</div>;
const ResultsContent = ({ analysis }) => <div>Measurable Results Content Placeholder. Count: {analysis.measurable_results?.score?.measurableResultsCount || 0}</div>;
const BulletsContent = ({ analysis }) => <div>Bullet Points Content Placeholder. Effective: {analysis.bullet_point_effectiveness?.score?.effectiveBulletPercentage || 'N/A'}%</div>;

const TABS = [
  { id: 'summary', label: 'Summary', component: SummaryContent },
  { id: 'keyword', label: 'Keywords', component: KeywordContent },
  { id: 'experience', label: 'Experience', component: ExperienceContent },
  { id: 'skills', label: 'Skills', component: SkillsContent },
  { id: 'structure', label: 'Structure', component: StructureContent },
  { id: 'actions', label: 'Action Words', component: ActionsContent },
  { id: 'results', label: 'Measurable Results', component: ResultsContent },
  { id: 'bullets', label: 'Bullet Points', component: BulletsContent },
];

function DetailedAnalysisView({ analysis, onBack }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  if (!analysis) {
    return <div>Loading detailed analysis...</div>; // Should ideally not happen if parent checks
  }

  const overallScore = analysis.overall_score || 0;
  const scoreColorValue = getScoreColor(overallScore);

  const ActiveTabComponent = TABS.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="detailed-analysis-container"> {/* Ensure this class is in style.css */}
      <div className="analysis-header"> {/* Ensure this class is in style.css */}
        <button className="back-button" onClick={onBack}> {/* Ensure this class is in style.css */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Back</span>
        </button>
        <h1>Detailed Analysis</h1>
        <div className="overall-score"> {/* Ensure this class is in style.css */}
          <div
            className="score-circle" // Ensure this class is styled
            style={{ background: `conic-gradient(${scoreColorValue} ${overallScore}%, #e0e0e0 ${overallScore}%)` }}
          >
            <span className="score-value">{Math.round(overallScore)}</span>
          </div>
        </div>
      </div>

      <div className="tabs"> {/* Ensure this class is in style.css */}
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`} // Ensure .tab and .tab.active are styled
            onClick={() => setActiveTab(tab.id)}
            data-tab={tab.id} // data-tab might not be needed unless CSS uses it
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-contents"> {/* Ensure this class is in style.css */}
        {ActiveTabComponent ? <ActiveTabComponent analysis={analysis} /> : <div>Select a tab</div>}
      </div>
    </div>
  );
}

export default DetailedAnalysisView;
