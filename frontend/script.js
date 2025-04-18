function extractJobDescription() {
    // Check if we're on LinkedIn
    if (window.location.hostname.includes('linkedin.com')) {
        // LinkedIn specific selectors
        const jobTitle = document.querySelector('.top-card-layout__title, .job-details-jobs-unified-top-card__job-title')?.textContent?.trim() || '';
        const company = document.querySelector('.top-card-layout__second-subline span:nth-child(1), .job-details-jobs-unified-top-card__company-name')?.textContent?.trim() || '';
        const location = document.querySelector('.top-card-layout__second-subline span:nth-child(2), .job-details-jobs-unified-top-card__bullet')?.textContent?.trim() || '';

        // Updated job description selectors with more options
        const descriptionSelectors = [
            '.description__text',
            '.show-more-less-html__markup',
            '.job-details-jobs-unified-description__text',
            '.jobs-description__content',
            '.jobs-box__html-content',
            '.jobs-description-content',
            '[data-test-id="job-details-description"]',
            '.jobs-description',
            '.jobs-unified-description__content'
        ];
        
        let jobDescription = '';
        
        // Try each selector
        for (const selector of descriptionSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 50) {
                jobDescription = element.textContent.trim();
                break;
            }
        }
        
        // If still no description, try to find it by looking for containers with substantial text
        if (!jobDescription) {
            const contentContainers = document.querySelectorAll('.jobs-description-content__text, .jobs-box__html-content');
            for (const container of contentContainers) {
                if (container.textContent.trim().length > 100) {
                    jobDescription = container.textContent.trim();
                    break;
                }
            }
        }

        // Updated skills or insights section
        const insightsSection = Array.from(document.querySelectorAll(
            '.job-criteria__item, .job-details-jobs-unified-top-card__job-insight, .job-details-jobs-unified-top-card__workplace-type'
        ));
        const skills = insightsSection
            .map(section => section.textContent.trim())
            .filter(text => text)
            .join(', ');

        return {
            jobTitle,
            company,
            description: jobDescription || 'Description not found. LinkedIn may have updated their page structure.',
            url: window.location.href
        };
    } else {
        // Generic extraction for other job sites
        const possibleSelectors = [
            '[class*="job-description"]',
            '[class*="description"]',
            '[id*="job-description"]',
            '[class*="jobDescription"]',
            'article',
            '.details-pane'
        ];

        let jobDescription = '';

        // Try each selector until we find content
        for (const selector of possibleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 100) { // Ensure we get substantial content
                jobDescription = element.textContent.trim();
                break;
            }
        }

        return {
            description: jobDescription || 'No job description found. Try another selector.',
            source: window.location.hostname,
            url: window.location.href
        };
    }
}

// Function to create and display the results from the backend
function displayResults(resultsContainer, data) {
    // Clear any previous content
    resultsContainer.innerHTML = '';
    
    // Create a styled container for the results
    const resultsCard = document.createElement('div');
    resultsCard.className = 'results-card';
    
    // Handle error case
    if (data.error) {
        resultsCard.innerHTML = `
            <div class="error-banner">
                <h3>Error Occurred</h3>
                <p>${data.error}</p>
            </div>
        `;
        resultsContainer.appendChild(resultsCard);
        return;
    }
    
    // Add header section with job context
    const header = document.createElement('div');
    header.className = 'results-header';
    
    // Safely access job context data with fallbacks
    const jobContext = data.job_context || {};
    const jobTitle = jobContext.title || 'Job Position';
    const company = jobContext.company || 'Company';
    
    header.innerHTML = `
        <h2>Resume Analysis Results</h2>
        <div class="job-context">
            <p><strong>${jobTitle}</strong>${company !== 'Company' ? ` at ${company}` : ''}</p>
        </div>
    `;
    resultsCard.appendChild(header);
    
    // Get the analysis data
    const analysis = data.analysis || {};
    const overallScore = analysis.overall_score || 0;
    
    // Determine color based on overall score
    const scoreColor = getScoreColor(overallScore);
    
    // Create score visualization
    const scoreSection = document.createElement('div');
    scoreSection.className = 'score-section';
    
    // Create overall score display with color
    scoreSection.innerHTML = `
        <div class="overall-score-container">
            <div class="overall-score-circle" style="background: conic-gradient(${scoreColor} ${overallScore}%, #e0e0e0 0)">
                <div class="overall-score-value">${Math.round(overallScore)}</div>
            </div>
            <div class="overall-score-label">${getMatchLevel(overallScore)}</div>
        </div>
    `;
    resultsCard.appendChild(scoreSection);
    
    // Add the Detailed Analysis button
    const detailAnalysisButton = document.createElement('button');
    detailAnalysisButton.className = 'detail-analysis-button';
    detailAnalysisButton.innerHTML = '📊 View Detailed Analysis';
    detailAnalysisButton.onclick = () => {
        displayDetailedAnalysisInPopup(resultsContainer, analysis);
    };
    resultsCard.appendChild(detailAnalysisButton);
    
    // Add the results card to the container
    resultsContainer.appendChild(resultsCard);
    
    // Make sure the results are visible
    resultsContainer.style.display = 'block';
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

function displayDetailedAnalysisInPopup(container, analysis) {
    // Clear existing content
    container.innerHTML = '';
    
    // Create the detailed analysis container
    const analysisContainer = document.createElement('div');
    analysisContainer.className = 'detailed-analysis-container';
    
    // Add header with back button
    const header = `
        <div class="analysis-header">
            <button class="back-button" id="analysis-back-button">← Back</button>
            <h1>Detailed Analysis</h1>
            <div class="overall-score">
                <div class="score-circle" style="background: conic-gradient(${getScoreColor(analysis.overall_score)} ${analysis.overall_score}%, #e0e0e0 0)">
                    <span class="score-value">${Math.round(analysis.overall_score)}</span>
                </div>
            </div>
        </div>
    `;
    
    // Create tabs navigation
    const tabsNav = `
        <div class="tabs">
            <button class="tab active" data-tab="summary">Summary</button>
            <button class="tab" data-tab="keyword">Keywords</button>
            <button class="tab" data-tab="experience">Experience</button>
            <button class="tab" data-tab="skills">Skills</button>
            <button class="tab" data-tab="structure">Structure</button>
            <button class="tab" data-tab="actions">Action Words</button>
            <button class="tab" data-tab="results">Measurable Results</button>
            <button class="tab" data-tab="bullets">Bullet Points</button>
        </div>
    `;

    // Create content sections for all tabs
    const contentSections = `
        <div class="tab-contents">
            <div id="summary-content" class="tab-content active">
                <div class="score-breakdown">
                    <h3>Score Breakdown</h3>
                    ${createScoreBar('Keyword Match', analysis.keyword_match.score.matchPercentage, analysis.keyword_match.score.pointsAwarded, 20)}
                    ${createScoreBar('Job Experience', analysis.job_experience.score.alignmentPercentage, analysis.job_experience.score.pointsAwarded, 20)}
                    ${createScoreBar('Skills & Certifications', analysis.skills_certifications.score.matchPercentage, analysis.skills_certifications.score.pointsAwarded, 15)}
                    ${createScoreBar('Resume Structure', (analysis.resume_structure.score.pointsAwarded/15)*100, analysis.resume_structure.score.pointsAwarded, 15)}
                    ${createScoreBar('Action Words', analysis.action_words.score.actionVerbPercentage, analysis.action_words.score.pointsAwarded, 10)}
                    ${createScoreBar('Measurable Results', (analysis.measurable_results.score.pointsAwarded/10)*100, analysis.measurable_results.score.pointsAwarded, 10)}
                    ${createScoreBar('Bullet Points', analysis.bullet_point_effectiveness.score.effectiveBulletPercentage, analysis.bullet_point_effectiveness.score.pointsAwarded, 10)}
                </div>
            </div>

            <!-- Keyword Match Tab -->
            <div id="keyword-content" class="tab-content">
                <h3>Keyword Analysis</h3>
                <div class="analysis-section">
                    <div class="metric-summary">
                        <span class="metric-label">Match Percentage:</span>
                        <span class="metric-value">${analysis.keyword_match.score.matchPercentage}% (${analysis.keyword_match.score.rating || ''})</span>
                    </div>
                    
                    <h4>Matched Keywords</h4>
                    ${createMatchedList(analysis.keyword_match.analysis.matchedKeywords)}
                    
                    <h4>Missing Keywords</h4>
                    ${createMissingList(analysis.keyword_match.analysis.missingKeywords)}
                    
                    <div class="improvement-suggestions">
                        <h4>Suggestions</h4>
                        <p>${analysis.keyword_match.analysis.suggestedImprovements || 'No suggestions available'}</p>
                    </div>
                </div>
            </div>

            <!-- Job Experience Tab -->
            <div id="experience-content" class="tab-content">
                <h3>Job Experience Analysis</h3>
                <div class="analysis-section">
                    <div class="metric-summary">
                        <span class="metric-label">Alignment Percentage:</span>
                        <span class="metric-value">${analysis.job_experience.score.alignmentPercentage}% (${analysis.job_experience.score.rating || ''})</span>
                    </div>
                    
                    <h4>Strong Matches</h4>
                    ${createExperienceList(analysis.job_experience.analysis.strongMatches, 'matched')}
                    
                    <h4>Partial Matches</h4>
                    ${createExperienceList(analysis.job_experience.analysis.partialMatches, 'partial')}
                    
                    <h4>Missing Experience</h4>
                    ${createExperienceList(analysis.job_experience.analysis.missingExperience, 'missing')}
                    
                    <div class="improvement-suggestions">
                        <h4>Suggestions</h4>
                        <p>${analysis.job_experience.analysis.suggestedImprovements || 'No suggestions available'}</p>
                    </div>
                </div>
            </div>

            <!-- Skills Tab -->
            <div id="skills-content" class="tab-content">
                <h3>Skills & Certifications Analysis</h3>
                <div class="analysis-section">
                    <div class="metric-summary">
                        <span class="metric-label">Match Percentage:</span>
                        <span class="metric-value">${analysis.skills_certifications.score.matchPercentage}% (${analysis.skills_certifications.score.rating || ''})</span>
                    </div>
                    
                    <h4>Matched Skills</h4>
                    ${createSkillsList(analysis.skills_certifications.analysis.matchedSkills, 'matched')}
                    
                    <h4>Missing Skills</h4>
                    ${createSkillsList(analysis.skills_certifications.analysis.missingSkills, 'missing')}
                    
                    <h4>Certifications</h4>
                    ${createCertificationsList(analysis.skills_certifications.analysis.certificationMatch)}
                    
                    <div class="improvement-suggestions">
                        <h4>Suggestions</h4>
                        <p>${analysis.skills_certifications.analysis.suggestedImprovements || 'No suggestions available'}</p>
                    </div>
                </div>
            </div>

            <!-- Structure Tab -->
            <div id="structure-content" class="tab-content">
                <h3>Resume Structure Analysis</h3>
                <div class="analysis-section">
                    <div class="metric-summary">
                        <span class="metric-label">Completed Sections:</span>
                        <span class="metric-value">${analysis.resume_structure.score.completedSections}/${analysis.resume_structure.score.totalMustHaveSections}</span>
                    </div>
                    
                    <h4>Section Status</h4>
                    ${createSectionsList(analysis.resume_structure.analysis.sectionStatus)}
                    
                    <div class="improvement-suggestions">
                        <h4>Suggestions</h4>
                        <p>${analysis.resume_structure.analysis.suggestedImprovements || 'No suggestions available'}</p>
                    </div>
                </div>
            </div>

            <!-- Action Words Tab -->
            <div id="actions-content" class="tab-content">
                <h3>Action Words Analysis</h3>
                <div class="analysis-section">
                    <div class="metric-summary">
                        <span class="metric-label">Strong Action Verbs Percentage:</span>
                        <span class="metric-value">${analysis.action_words.score.actionVerbPercentage}%</span>
                    </div>
                    
                    <h4>Strong Action Verbs</h4>
                    ${createActionVerbsList(analysis.action_words.analysis.strongActionVerbs || [], 'strong')}
                    
                    <h4>Weak Action Verbs</h4>
                    ${createActionVerbsList(analysis.action_words.analysis.weakActionVerbs || [], 'weak')}
                    
                    <h4>Missing Action Verbs</h4>
                    ${createActionVerbsList(analysis.action_words.analysis.missingActionVerbs || [], 'missing')}
                    
                    <div class="improvement-suggestions">
                        <h4>Suggestions</h4>
                        <p>${analysis.action_words.analysis.suggestedImprovements || 'No suggestions available'}</p>
                    </div>
                </div>
            </div>

            <!-- Measurable Results Tab -->
            <div id="results-content" class="tab-content">
                <h3>Measurable Results Analysis</h3>
                <div class="analysis-section">
                    <div class="metric-summary">
                        <span class="metric-label">Measurable Results Count:</span>
                        <span class="metric-value">${analysis.measurable_results.score.measurableResultsCount}</span>
                    </div>
                    
                    <h4>Measurable Results Found</h4>
                    ${createMeasurableResultsList(analysis.measurable_results.analysis.measurableResults || [])}
                    
                    <h4>Opportunities for Metrics</h4>
                    ${createOpportunitiesList(analysis.measurable_results.analysis.opportunitiesForMetrics || [])}
                    
                    <div class="improvement-suggestions">
                        <h4>Suggestions</h4>
                        <p>${analysis.measurable_results.analysis.suggestedImprovements || 'No suggestions available'}</p>
                    </div>
                </div>
            </div>

            <!-- Bullet Points Tab -->
            <div id="bullets-content" class="tab-content">
                <h3>Bullet Point Effectiveness</h3>
                <div class="analysis-section">
                    <div class="metric-summary">
                        <span class="metric-label">Effective Bullets Percentage:</span>
                        <span class="metric-value">${analysis.bullet_point_effectiveness.score.effectiveBulletPercentage}%</span>
                    </div>
                    
                    <h4>Effective Bullet Points</h4>
                    ${createBulletPointsList(analysis.bullet_point_effectiveness.analysis.effectiveBullets || [], 'effective')}
                    
                    <h4>Ineffective Bullet Points</h4>
                    ${createBulletPointsList(analysis.bullet_point_effectiveness.analysis.ineffectiveBullets || [], 'ineffective')}
                    
                    <div class="improvement-suggestions">
                        <h4>Suggestions</h4>
                        <p>${analysis.bullet_point_effectiveness.analysis.suggestedImprovements || 'No suggestions available'}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Combine all elements
    analysisContainer.innerHTML = header + tabsNav + contentSections;
    container.appendChild(analysisContainer);

    // Add new styles to the page
    addDetailedAnalysisStyles();

    // Add tab switching functionality
    const tabs = container.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const contentId = `${tab.dataset.tab}-content`;
            container.querySelector(`#${contentId}`).classList.add('active');
        });
    });

    // Add back button functionality
    document.getElementById('analysis-back-button').addEventListener('click', () => {
        location.reload();
    });

    // Animate score bars
    setTimeout(() => {
        container.querySelectorAll('.score-fill').forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = width;
            }, 100);
        });
    }, 100);
}

// Helper function to create score bars
function createScoreBar(label, percentage, points, maxPoints) {
    return `
        <div class="score-item">
            <div class="score-label">${label}</div>
            <div class="score-bar-container">
                <div class="score-bar">
                    <div class="score-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="score-points">${points}/${maxPoints}</div>
            </div>
        </div>
    `;
}

// Helper function to create matched items list with better error handling
function createMatchedList(items) {
    if (!items || !Array.isArray(items) || items.length === 0) {
        return `<div class="empty-list">No matched keywords found</div>`;
    }
    
    return `
        <div class="matched-items">
            ${items.map(item => `
                <div class="matched-item">
                    <span class="match-icon">✓</span>
                    <span class="match-text">${item}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// Helper function to create missing items list
function createMissingList(items) {
    return `
        <div class="missing-items">
            ${items.map(item => `
                <div class="missing-item">
                    <span class="missing-icon">×</span>
                    <span class="missing-text">${item}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// Helper function to get color based on score
function getScoreColor(score) {
    if (score >= 85) return '#4CAF50'; // Green for excellent
    if (score >= 70) return '#2196F3'; // Blue for good
    if (score >= 55) return '#FF9800'; // Orange for fair
    return '#F44336'; // Red for low scores
}

// Helper function for experience items
function createExperienceList(items, type) {
    if (!items || !Array.isArray(items) || items.length === 0) {
        return `<div class="empty-list">No ${type} experience found</div>`;
    }
    
    return `
        <div class="${type}-items">
            ${items.map(item => `
                <div class="${type}-item">
                    <div class="item-header">
                        <span class="${type}-icon">${getIcon(type)}</span>
                        <span class="item-title">${item.responsibility}</span>
                    </div>
                    <div class="item-details">
                        ${item.notes}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Helper function to get appropriate icon
function getIcon(type) {
    switch(type) {
        case 'matched':
        case 'strong':
            return '✅';
        case 'partial':
        case 'weak':
            return '⚠️';
        case 'missing':
            return '❌';
        default:
            return '•';
    }
}

// Helper function for skills
function createSkillsList(items, type) {
    if (!items || !Array.isArray(items) || items.length === 0) {
        return `<div class="empty-list">No ${type} skills found</div>`;
    }
    
    return `
        <div class="${type}-items">
            ${items.map(item => `
                <div class="${type}-item">
                    <span class="${type}-icon">${item.symbol}</span>
                    <span class="item-text">${item.skill}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// Helper function for certifications
function createCertificationsList(items) {
    if (!items || !Array.isArray(items) || items.length === 0) {
        return `<div class="empty-list">No certifications found</div>`;
    }
    
    return `
        <div class="certification-items">
            ${items.map(item => `
                <div class="certification-item ${item.status === 'Found' ? 'matched' : 'missing'}">
                    <span class="certification-icon">${item.symbol}</span>
                    <span class="certification-text">${item.certification}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// Helper function for sections
function createSectionsList(items) {
    if (!items || !Array.isArray(items) || items.length === 0) {
        return `<div class="empty-list">No section data available</div>`;
    }
    
    return `
        <div class="section-items">
            ${items.map(item => `
                <div class="section-item ${item.status === 'Completed' ? 'matched' : 'missing'}">
                    <span class="section-icon">${item.status === 'Completed' ? '✓' : '×'}</span>
                    <span class="section-text">${item.section || ''}</span>
                    <span class="section-status">${item.status || ''}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// Helper function for action verbs
function createActionVerbsList(items, type) {
    if (!items || !Array.isArray(items) || items.length === 0) {
        return `<div class="empty-list">No ${type} action verbs found</div>`;
    }
    
    const icons = {
        strong: '✓',
        weak: '⚠',
        missing: '×'
    };
    
    return `
        <div class="${type}-verbs">
            ${items.map(item => `
                <div class="${type}-verb-item">
                    <div class="verb-header">
                        <span class="${type}-icon">${icons[type]}</span>
                        <span class="verb-text">${type === 'weak' ? 
                            `<strong>${item.actionVerb || ''}</strong> → <span class="suggested">${item.suggestedReplacement || ''}</span>` : 
                            (type === 'missing' ? 'Missing action verb' : `<strong>${item.actionVerb || ''}</strong>`)
                        }</span>
                    </div>
                    <div class="verb-example">
                        ${item.bulletPoint || ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Helper function for measurable results
function createMeasurableResultsList(items) {
    if (!items || !Array.isArray(items) || items.length === 0) {
        return `<div class="empty-list">No measurable results found</div>`;
    }
    
    return `
        <div class="measurable-results">
            ${items.map(item => `
                <div class="measurable-result-item">
                    <div class="result-header">
                        <span class="result-icon">✓</span>
                        <span class="result-metric">${item.metric || ''}</span>
                    </div>
                    <div class="result-text">
                        ${item.bulletPoint || ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Helper function for opportunities
function createOpportunitiesList(items) {
    if (!items || !Array.isArray(items) || items.length === 0) {
        return `<div class="empty-list">No opportunities for metrics found</div>`;
    }
    
    return `
        <div class="opportunities">
            ${items.map(item => `
                <div class="opportunity-item">
                    <div class="opportunity-header">
                        <span class="opportunity-icon">💡</span>
                        <span class="opportunity-suggestion">${item.suggestion || ''}</span>
                    </div>
                    <div class="opportunity-text">
                        ${item.bulletPoint || ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Helper function for bullet points
function createBulletPointsList(items, type) {
    if (!items || !Array.isArray(items) || items.length === 0) {
        return `<div class="empty-list">No ${type} bullet points found</div>`;
    }
    
    return `
        <div class="${type}-bullets">
            ${items.map(item => `
                <div class="${type}-bullet-item">
                    <div class="bullet-header">
                        <span class="bullet-icon">${type === 'effective' ? '✓' : '×'}</span>
                        <span class="bullet-count">Word Count: ${item.wordCount || 0}</span>
                    </div>
                    <div class="bullet-text">
                        ${item.bulletPoint || ''}
                    </div>
                    <div class="bullet-feedback">
                        <strong>${type === 'effective' ? 'Strengths' : 'Issues'}:</strong> 
                        ${type === 'effective' ? (item.strengths || '') : (item.issues || '')}
                    </div>
                    ${type === 'ineffective' ? `
                        <div class="bullet-suggestion">
                            <strong>Suggested Revision:</strong> 
                            ${item.suggestedRevision || ''}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

// Add styles for the detailed analysis
function addDetailedAnalysisStyles() {
    const styles = `
        <style>
            .detailed-analysis-container {
                padding: 20px;
                max-height: 600px;
                overflow-y: auto;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .analysis-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid #e2e8f0;
            }

            .analysis-header h1 {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
                color: #1e293b;
            }

            .back-button {
                padding: 8px 16px;
                background: #f1f5f9;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                color: #475569;
                transition: all 0.2s ease;
            }

            .back-button:hover {
                background: #e2e8f0;
                color: #1e293b;
            }

            .score-circle {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            }

            .score-circle::before {
                content: '';
                position: absolute;
                width: 42px;
                height: 42px;
                border-radius: 50%;
                background: white;
            }

            .score-value {
                position: relative;
                font-size: 16px;
                font-weight: bold;
                color: #1e293b;
            }

            .tabs {
                display: flex;
                gap: 8px;
                overflow-x: auto;
                padding-bottom: 10px;
                margin-bottom: 20px;
                border-bottom: 1px solid #e2e8f0;
            }

            .tab {
                padding: 8px 16px;
                background: none;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                white-space: nowrap;
                color: #64748b;
                transition: all 0.2s ease;
            }

            .tab:hover {
                background: #f1f5f9;
                color: #334155;
            }

            .tab.active {
                background: #3b82f6;
                color: white;
            }

            .tab-content {
                display: none;
                animation: fadeIn 0.3s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .tab-content.active {
                display: block;
            }

            .score-item {
                margin-bottom: 15px;
            }

            .score-label {
                margin-bottom: 5px;
                font-weight: 500;
                color: #475569;
            }

            .score-bar-container {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .score-bar {
                flex-grow: 1;
                height: 8px;
                background: #e2e8f0;
                border-radius: 4px;
                overflow: hidden;
            }

            .score-fill {
                height: 100%;
                background: #3b82f6;
                transition: width 0.5s ease;
            }

            .score-points {
                font-weight: 600;
                color: #334155;
                min-width: 50px;
                text-align: right;
            }

            .analysis-section {
                background: #f8fafc;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
            }

            .metric-summary {
                display: flex;
                justify-content: space-between;
                background: #f1f5f9;
                padding: 10px 15px;
                border-radius: 6px;
                margin-bottom: 15px;
            }

            .metric-label {
                font-weight: 500;
                color: #475569;
            }

            .metric-value {
                font-weight: 600;
                color: #1e293b;
            }

            .matched-items, .missing-items, .matched-skills, .missing-skills,
            .certification-items, .section-items, .strong-verbs, .weak-verbs,
            .missing-verbs, .measurable-results, .opportunities,
            .effective-bullets, .ineffective-bullets {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 15px;
            }

            .matched-item, .missing-item, .matched-skill, .missing-skill,
            .certification-item, .section-item, .strong-verb-item, .weak-verb-item,
            .missing-verb-item, .measurable-result-item, .opportunity-item,
            .effective-bullet-item, .ineffective-bullet-item {
                padding: 12px;
                border-radius: 6px;
                background: white;
                border: 1px solid #e2e8f0;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            }

            .matched-item, .matched-skill, .strong-verb-item, .measurable-result-item,
            .effective-bullet-item {
                border-left: 3px solid #10b981;
            }

            .missing-item, .missing-skill, .missing-verb-item, .ineffective-bullet-item {
                border-left: 3px solid #ef4444;
            }

            .weak-verb-item, .opportunity-item {
                border-left: 3px solid #f59e0b;
            }

            .match-icon, .matched-icon, .strong-icon {
                color: #10b981;
                margin-right: 8px;
            }

            .missing-icon {
                color: #ef4444;
                margin-right: 8px;
            }

            .partial-icon, .weak-icon {
                color: #f59e0b;
                margin-right: 8px;
            }

            .item-header, .verb-header, .result-header, .bullet-header {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
            }

            .item-title, .verb-text, .result-metric, .bullet-count {
                font-weight: 600;
                margin-left: 8px;
            }

            .item-details, .verb-example, .result-text, .bullet-text, .opportunity-text {
                color: #475569;
                line-height: 1.5;
                margin-left: 24px;
            }

            .suggested {
                color: #10b981;
                font-weight: 600;
            }

            .empty-list {
                padding: 12px;
                background: #f1f5f9;
                border-radius: 6px;
                color: #64748b;
                text-align: center;
                font-style: italic;
            }

            .improvement-suggestions {
                margin-top: 20px;
                padding: 15px;
                background: #f1f5f9;
                border-radius: 6px;
            }

            .improvement-suggestions h4 {
                margin-top: 0;
                margin-bottom: 10px;
                color: #334155;
            }

            h3 {
                margin-top: 0;
                margin-bottom: 15px;
                color: #1e293b;
            }

            h4 {
                margin-top: 15px;
                margin-bottom: 10px;
                color: #334155;
            }

            .bullet-feedback, .bullet-suggestion {
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px dashed #e2e8f0;
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}

// Function to handle the display of the match level
function getMatchLevel(score) {
    score = parseFloat(score) || 0;
    if (score >= 85) return "Excellent Match";
    if (score >= 70) return "Strong Match";
    if (score >= 55) return "Good Match";
    if (score >= 40) return "Fair Match";
    return "Poor Match";
}

// Function to handle null or undefined fields in the JSON response
function safeProp(obj, path, defaultValue = '') {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return defaultValue;
        }
        current = current[key];
    }
    
    return current !== null && current !== undefined ? current : defaultValue;
}

// When popup opens, inject script into current tab
document.addEventListener('DOMContentLoaded', async () => {
    let uploadedResume = null; // Store the resume file
    const resumeUpload = document.getElementById('resumeUpload');
    const resumeStatus = document.getElementById('resumeStatus');
    const submitBtn = document.getElementById('submit-button');
    const progressBar = document.getElementById('progressBar');
    const warningMessage = document.getElementById('warningMessage');
    const resultsContainer = document.getElementById('resultsContainer');
    const analysisSection = document.getElementById('analysisSection');
    const progressBarFill = progressBar.querySelector('.progress-bar-fill'); 
    // Function to update button state
    function updateButtonState() {
        // Button should be disabled when:
        // - No resume is uploaded
        // - Request is in progress
        submitBtn.disabled = !uploadedResume || progressBar.style.display === 'block';
    }

    resumeUpload.addEventListener('change', async (event) => {
        const file = event.target.files[0];

        if (file) {
            // Check if file is PDF
            if (file.type !== 'application/pdf') {
                resumeStatus.textContent = 'Please upload a PDF file';
                resumeStatus.className = 'error';
                uploadedResume = null;
                updateButtonState();
                return;
            }

            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                resumeStatus.textContent = 'File size should be less than 5MB';
                resumeStatus.className = 'error';
                uploadedResume = null;
                updateButtonState();
                return;
            }

            uploadedResume = file; // Store the file for later use
            resumeStatus.textContent = 'Resume ready to submit';
            resumeStatus.className = 'success';
            updateButtonState();
        } else {
            resumeStatus.textContent = 'No file selected';
            resumeStatus.className = '';
            uploadedResume = null;
            updateButtonState();
        }
    });

    // Create loading spinner
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    loadingSpinner.style.display = 'none';
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'spinner-dot';
        loadingSpinner.appendChild(dot);
    }

    // Add submit button click handler
    submitBtn.onclick = async () => {
        let progressInterval = null;
        try {
            if (!uploadedResume) {
                alert('Please upload a resume first');
                return;
            }

            // Show loading state & start progress bar
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Analyzing... <div class="loading-spinner"></div>'; // Add spinner
            progressBar.style.display = 'block';
            warningMessage.style.display = 'block';

            // Start progress bar filling
            let currentProgress = 0;
            progressBarFill.style.width = '0%'; // Start at 0%
            progressInterval = setInterval(() => {
                currentProgress += 10; // Increment progress
                if (currentProgress <= 90) {
                    progressBarFill.style.width = `${currentProgress}%`;
                }
            }, 300); // Update every 300ms

            // Get the current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Add a small delay to ensure page is loaded
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Inject script into the page to extract job description
            const [{ result }] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: extractJobDescription
            });

            // Check if the description is valid
            if (!result.description || result.description.length < 100) {
                clearInterval(progressInterval); // Clear progress interval
                progressBar.style.display = 'none'; // Hide progress bar
                warningMessage.style.display = 'none'; // Hide warning message
                submitBtn.innerHTML = 'Analyze Job Match'; // Reset button text
                submitBtn.disabled = false; // Enable button
                alert('No valid job description found. Please open a specific job posting.'); // User-friendly message
                return; // Prevent sending the request
            }

            const formData = new FormData();
            formData.append('resume', uploadedResume);
            formData.append('jobData', JSON.stringify(result));

            const response = await fetch('http://127.0.0.1:8000/api/analyze', {
                method: 'POST',
                body: formData
            });

            // Clear interval if it's still running
            if (progressInterval) clearInterval(progressInterval);
            progressInterval = null;

            // Complete progress bar
            progressBarFill.style.width = '100%';

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const responseData = await response.json();

            // Display the results from the backend
            analysisSection.style.display = 'block';
            displayResults(resultsContainer, responseData);

            // Reset button state and hide progress/warning after a short delay
            setTimeout(() => {
                submitBtn.innerHTML = 'Analyze Job Match'; // Reset button text
                submitBtn.disabled = false;
                progressBar.style.display = 'none';
                warningMessage.style.display = 'none';
                progressBarFill.style.width = '0%'; // Reset for next time
            }, 500); // Hide after 0.5 seconds
            updateButtonState();

        } catch (error) {
            if (progressInterval) clearInterval(progressInterval); // Clear interval on error too
            console.error('Error submitting data:', error);

            // Display error in results container
            analysisSection.style.display = 'block';
            displayResults(resultsContainer, {
                error: `Failed to analyze job match: ${error.message}`
            });

            // Reset button state and hide progress/warning
            submitBtn.innerHTML = 'Analyze Job Match'; // Reset button text
            submitBtn.disabled = false;
            progressBar.style.display = 'none';
            warningMessage.style.display = 'none';
            const progressBarFillOnError = progressBar.querySelector('.progress-bar-fill');
            if (progressBarFillOnError) progressBarFillOnError.style.width = '0%'; // Reset on error
            updateButtonState();
        }
    };

    // Initial button state
    updateButtonState();
});
