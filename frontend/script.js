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
    let scoreColor = '#F44336'; // Red for low scores
    if (overallScore >= 85) scoreColor = '#4CAF50'; // Green for excellent
    else if (overallScore >= 70) scoreColor = '#2196F3'; // Blue for good
    else if (overallScore >= 55) scoreColor = '#FF9800'; // Orange for fair
    
    // Determine match level based on overall score
    let matchLevel = "Poor Match";
    if (overallScore >= 85) matchLevel = "Excellent Match";
    else if (overallScore >= 70) matchLevel = "Strong Match";
    else if (overallScore >= 55) matchLevel = "Good Match";
    else if (overallScore >= 40) matchLevel = "Fair Match";
    
    // Create score visualization
    const scoreSection = document.createElement('div');
    scoreSection.className = 'score-section';
    
    // Create overall score display with color
    scoreSection.innerHTML = `
        <div class="overall-score-container">
            <div class="overall-score-circle" style="background: conic-gradient(${scoreColor} ${overallScore}%, #e0e0e0 0)">
                <div class="overall-score-value">${overallScore}</div>
            </div>
            <div class="overall-score-label">${matchLevel}</div>
        </div>
    `;
    resultsCard.appendChild(scoreSection);
    
    // Add the Detailed Analysis button
    const detailAnalysisButton = document.createElement('button');
    detailAnalysisButton.className = 'detail-analysis-button';
    detailAnalysisButton.innerHTML = '📊 View Detailed Analysis';
    detailAnalysisButton.onclick = () => {
        // Create a new window/tab with the detailed analysis
        const detailWindow = window.open('', '_blank');
        displayDetailedAnalysis(detailWindow, analysis);
    };
    resultsCard.appendChild(detailAnalysisButton);
    
    // Add the results card to the container
    resultsContainer.appendChild(resultsCard);
    
    // Make sure the results are visible
    resultsContainer.style.display = 'block';
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Add new function to display detailed analysis in new tab
function displayDetailedAnalysis(window, analysis) {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Detailed Resume Analysis</title>
            <style>
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 20px;
                    background: #f8fafc;
                    color: #334155;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
                }
                .header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .header h1 {
                    margin: 0;
                    color: #1e293b;
                }
                .overall-score {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .score-circle {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: conic-gradient(#3b82f6 ${analysis.overall_score}%, #e2e8f0 0);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .score-circle::before {
                    content: '';
                    position: absolute;
                    width: 70px;
                    height: 70px;
                    border-radius: 50%;
                    background: white;
                }
                .score-value {
                    position: relative;
                    font-size: 24px;
                    font-weight: bold;
                    color: #1e293b;
                }
                .section {
                    margin-bottom: 30px;
                    padding: 20px;
                    background: #fff;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                .section-title {
                    font-size: 1.5em;
                    color: #1e293b;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .metric {
                    display: flex;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .metric-label {
                    font-weight: 500;
                    min-width: 200px;
                }
                .score-bar {
                    height: 20px;
                    background: #e2e8f0;
                    border-radius: 10px;
                    overflow: hidden;
                    flex-grow: 1;
                    margin: 0 15px;
                }
                .score-fill {
                    height: 100%;
                    background: #3b82f6;
                    width: 0%;
                    transition: width 1s ease-out;
                }
                .score-text {
                    font-weight: 600;
                    color: #1e293b;
                    white-space: nowrap;
                }
                .analysis-list {
                    list-style: none;
                    padding: 0;
                }
                .analysis-item {
                    padding: 12px;
                    margin: 8px 0;
                    background: #f8fafc;
                    border-radius: 6px;
                    border-left: 4px solid #3b82f6;
                }
                .matched { border-color: #10b981; color: #059669; }
                .partial { border-color: #f59e0b; color: #b45309; }
                .missing { border-color: #ef4444; color: #b91c1c; }
                
                .tabs {
                    display: flex;
                    flex-wrap: wrap;
                    border-bottom: 1px solid #e2e8f0;
                    margin-bottom: 20px;
                }
                .tab {
                    padding: 10px 20px;
                    cursor: pointer;
                    border-bottom: 3px solid transparent;
                    font-weight: 500;
                }
                .tab.active {
                    border-bottom-color: #3b82f6;
                    color: #3b82f6;
                }
                .tab-content {
                    display: none;
                }
                .tab-content.active {
                    display: block;
                }
                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                .card {
                    background: #f8fafc;
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                .card-title {
                    font-weight: 600;
                    margin-bottom: 10px;
                    padding-bottom: 5px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .recommendation {
                    padding: 15px;
                    margin: 10px 0;
                    background: #f8fafc;
                    border-radius: 8px;
                    border-left: 4px solid #3b82f6;
                }
                .high { border-color: #ef4444; }
                .medium { border-color: #f59e0b; }
                .low { border-color: #10b981; }
                .recommendation-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-weight: 600;
                }
                .recommendation-priority {
                    font-size: 12px;
                    padding: 2px 8px;
                    border-radius: 12px;
                    background: #e2e8f0;
                }
                .high-priority { background: #fee2e2; color: #b91c1c; }
                .medium-priority { background: #fef3c7; color: #92400e; }
                .low-priority { background: #d1fae5; color: #065f46; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Detailed Resume Analysis</h1>
                    <div class="overall-score">
                        <div class="score-circle">
                            <span class="score-value">${analysis.overall_score}</span>
                        </div>
                        <div>
                            <div style="font-weight: 600; font-size: 18px;">Overall Score</div>
                            <div style="color: #64748b;">Based on 7 key categories</div>
                        </div>
                    </div>
                </div>
                
                <div class="tabs">
                    <div class="tab active" data-tab="summary">Summary</div>
                    <div class="tab" data-tab="keyword">Keyword Match</div>
                    <div class="tab" data-tab="experience">Job Experience</div>
                    <div class="tab" data-tab="skills">Skills & Certifications</div>
                    <div class="tab" data-tab="structure">Resume Structure</div>
                    <div class="tab" data-tab="actions">Action Words</div>
                    <div class="tab" data-tab="results">Measurable Results</div>
                    <div class="tab" data-tab="bullets">Bullet Points</div>
                    <div class="tab" data-tab="recommendations">Recommendations</div>
                </div>
                
                <!-- Summary Tab -->
                <div class="tab-content active" id="summary-tab">
                    <div class="section">
                        <h2 class="section-title">📊 Score Breakdown</h2>
                        
                        <div class="metric">
                            <span class="metric-label">🎯 Keyword Match</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${analysis.keyword_match.score.matchPercentage}%"></div>
                            </div>
                            <span class="score-text">${analysis.keyword_match.score.pointsAwarded}/20 points</span>
                        </div>
                        
                        <div class="metric">
                            <span class="metric-label">💼 Job Experience</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${analysis.job_experience.score.alignmentPercentage}%"></div>
                            </div>
                            <span class="score-text">${analysis.job_experience.score.pointsAwarded}/20 points</span>
                        </div>
                        
                        <div class="metric">
                            <span class="metric-label">📚 Skills & Certifications</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${analysis.skills_certifications.score.matchPercentage}%"></div>
                            </div>
                            <span class="score-text">${analysis.skills_certifications.score.pointsAwarded}/15 points</span>
                        </div>
                        
                        <div class="metric">
                            <span class="metric-label">📝 Resume Structure</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${(analysis.resume_structure.score.pointsAwarded/15)*100}%"></div>
                            </div>
                            <span class="score-text">${analysis.resume_structure.score.pointsAwarded}/15 points</span>
                        </div>
                        
                        <div class="metric">
                            <span class="metric-label">💪 Action Words</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${analysis.action_words.score.actionVerbPercentage}%"></div>
                            </div>
                            <span class="score-text">${analysis.action_words.score.pointsAwarded}/10 points</span>
                        </div>
                        
                        <div class="metric">
                            <span class="metric-label">📊 Measurable Results</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${(analysis.measurable_results.score.pointsAwarded/10)*100}%"></div>
                            </div>
                            <span class="score-text">${analysis.measurable_results.score.pointsAwarded}/10 points</span>
                        </div>
                        
                        <div class="metric">
                            <span class="metric-label">✍️ Bullet Point Effectiveness</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${analysis.bullet_point_effectiveness.score.effectiveBulletPercentage}%"></div>
                            </div>
                            <span class="score-text">${analysis.bullet_point_effectiveness.score.pointsAwarded}/10 points</span>
                        </div>
                    </div>
                </div>
                
                <!-- Keyword Match Tab -->
                <div class="tab-content" id="keyword-tab">
                    <div class="section">
                        <h2 class="section-title">🎯 Keyword Match Analysis</h2>
                        <div class="metric">
                            <span class="metric-label">Match Percentage</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${analysis.keyword_match.score.matchPercentage}%"></div>
                            </div>
                            <span class="score-text">${analysis.keyword_match.score.matchPercentage}% (${analysis.keyword_match.score.rating})</span>
                        </div>
                        
                        <h3>Matched Keywords</h3>
                        <div class="analysis-list">
                            ${analysis.keyword_match.analysis.matchedKeywords.map(keyword => 
                                `<div class="analysis-item matched">✅ ${keyword}</div>`
                            ).join('')}
                        </div>
                        
                        <h3>Missing Keywords</h3>
                        <div class="analysis-list">
                            ${analysis.keyword_match.analysis.missingKeywords.map(keyword => 
                                `<div class="analysis-item missing">❌ ${keyword}</div>`
                            ).join('')}
                        </div>
                        
                        <h3>Improvement Suggestions</h3>
                        <p>${analysis.keyword_match.analysis.suggestedImprovements}</p>
                    </div>
                </div>
                
                <!-- Job Experience Tab -->
                <div class="tab-content" id="experience-tab">
                    <div class="section">
                        <h2 class="section-title">💼 Job Experience Analysis</h2>
                        <div class="metric">
                            <span class="metric-label">Alignment Percentage</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${analysis.job_experience.score.alignmentPercentage}%"></div>
                            </div>
                            <span class="score-text">${analysis.job_experience.score.alignmentPercentage}% (${analysis.job_experience.score.rating})</span>
                        </div>
                        
                        <h3>Strong Matches</h3>
                        <div class="analysis-list">
                            ${analysis.job_experience.analysis.strongMatches.map(match => `
                                <div class="analysis-item matched">
                                    <strong>✅ ${match.responsibility}</strong><br>
                                    ${match.notes}
                                </div>
                            `).join('')}
                        </div>
                        
                        <h3>Partial Matches</h3>
                        <div class="analysis-list">
                            ${analysis.job_experience.analysis.partialMatches.map(match => `
                                <div class="analysis-item partial">
                                    <strong>⚠️ ${match.responsibility}</strong><br>
                                    ${match.notes}
                                </div>
                            `).join('')}
                        </div>
                        
                        <h3>Missing Experience</h3>
                        <div class="analysis-list">
                            ${analysis.job_experience.analysis.missingExperience.map(exp => `
                                <div class="analysis-item missing">
                                    <strong>❌ ${exp.responsibility}</strong><br>
                                    ${exp.notes}
                                </div>
                            `).join('')}
                        </div>
                        
                        <h3>Improvement Suggestions</h3>
                        <p>${analysis.job_experience.analysis.suggestedImprovements}</p>
                    </div>
                </div>
                
                <!-- Skills Tab -->
                <div class="tab-content" id="skills-tab">
                    <div class="section">
                        <h2 class="section-title">📚 Skills & Certifications Analysis</h2>
                        <div class="metric">
                            <span class="metric-label">Match Percentage</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${analysis.skills_certifications.score.matchPercentage}%"></div>
                            </div>
                            <span class="score-text">${analysis.skills_certifications.score.matchPercentage}% (${analysis.skills_certifications.score.rating})</span>
                        </div>
                        
                        <div class="grid">
                            <div class="card">
                                <div class="card-title">✅ Matched Skills</div>
                                ${analysis.skills_certifications.analysis.matchedSkills.map(skill => 
                                    `<div class="analysis-item matched">${typeof skill === 'object' ? skill.skill : skill}</div>`
                                ).join('')}
                            </div>
                            
                            <div class="card">
                                <div class="card-title">❌ Missing Skills</div>
                                ${analysis.skills_certifications.analysis.missingSkills.map(skill => 
                                    `<div class="analysis-item missing">${typeof skill === 'object' ? skill.skill : skill}</div>`
                                ).join('')}
                            </div>
                            
                            <div class="card">
                                <div class="card-title">🎓 Certifications</div>
                                ${analysis.skills_certifications.analysis.certificationMatch ? 
                                    analysis.skills_certifications.analysis.certificationMatch.map(cert => 
                                        `<div class="analysis-item ${cert.status === 'Found' ? 'matched' : 'missing'}">${cert.symbol} ${cert.certification}</div>`
                                    ).join('') : 
                                    '<div class="analysis-item">No certification data available</div>'
                                }
                            </div>
                        </div>
                        
                        <h3>Improvement Suggestions</h3>
                        <p>${analysis.skills_certifications.analysis.suggestedImprovements || 'Focus on adding the missing skills to your resume in relevant context.'}</p>
                    </div>
                </div>
                
                <!-- Resume Structure Tab -->
                <div class="tab-content" id="structure-tab">
                    <div class="section">
                        <h2 class="section-title">📝 Resume Structure Analysis</h2>
                        <div class="metric">
                            <span class="metric-label">Completed Sections</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${(analysis.resume_structure.score.completedSections/analysis.resume_structure.score.totalMustHaveSections)*100}%"></div>
                            </div>
                            <span class="score-text">${analysis.resume_structure.score.completedSections}/${analysis.resume_structure.score.totalMustHaveSections} sections</span>
                        </div>
                        
                        <h3>Section Status</h3>
                        <div class="grid">
                            <div class="card">
                                <div class="card-title">📑 Section Analysis</div>
                                ${analysis.resume_structure.analysis.sectionStatus ? 
                                    analysis.resume_structure.analysis.sectionStatus.map(section => 
                                        `<div class="analysis-item ${section.status === 'Completed' ? 'matched' : 'missing'}">
                                            ${section.symbol || (section.status === 'Completed' ? '✅' : '❌')} ${section.section}: ${section.status}
                                        </div>`
                                    ).join('') : 
                                    '<div class="analysis-item">No detailed section data available</div>'
                                }
                            </div>
                        </div>
                        
                        <h3>Improvement Suggestions</h3>
                        <p>${analysis.resume_structure.analysis.suggestedImprovements || 'Ensure all required sections are included in your resume for optimal ATS compatibility.'}</p>
                    </div>
                </div>
                
                <!-- Action Words Tab -->
                <div class="tab-content" id="actions-tab">
                    <div class="section">
                        <h2 class="section-title">💪 Action Words Analysis</h2>
                        <div class="metric">
                            <span class="metric-label">Strong Action Verbs</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${analysis.action_words.score.actionVerbPercentage}%"></div>
                            </div>
                            <span class="score-text">${analysis.action_words.score.actionVerbPercentage}%</span>
                        </div>
                        
                        <h3>Strong Action Verbs</h3>
                        <div class="analysis-list">
                            ${analysis.action_words.analysis.strongActionVerbs ? 
                                analysis.action_words.analysis.strongActionVerbs.map(item => 
                                    `<div class="analysis-item matched">
                                        <strong>✅ ${item.actionVerb}</strong><br>
                                        ${item.bulletPoint}
                                    </div>`
                                ).join('') : 
                                '<div class="analysis-item">No strong action verbs data available</div>'
                            }
                        </div>
                        
                        <h3>Weak Verbs</h3>
                        <div class="analysis-list">
                            ${analysis.action_words.analysis.weakActionVerbs ? 
                                analysis.action_words.analysis.weakActionVerbs.map(item => 
                                    `<div class="analysis-item missing">
                                        <strong>⚠️ ${item.actionVerb}</strong> → Suggested: <strong>${item.suggestedReplacement}</strong><br>
                                        ${item.bulletPoint}
                                    </div>`
                                ).join('') : 
                                '<div class="analysis-item">No weak verbs data available</div>'
                            }
                        </div>
                        
                        <h3>Improvement Suggestions</h3>
                        <p>${analysis.action_words.analysis.suggestedImprovements || 'Replace weak verbs with strong action verbs to make your resume more impactful.'}</p>
                    </div>
                </div>
                
                <!-- Measurable Results Tab -->
                <div class="tab-content" id="results-tab">
                    <div class="section">
                        <h2 class="section-title">📊 Measurable Results Analysis</h2>
                        <div class="metric">
                            <span class="metric-label">Measurable Results Count</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${(analysis.measurable_results.score.measurableResultsCount/5)*100}%"></div>
                            </div>
                            <span class="score-text">${analysis.measurable_results.score.measurableResultsCount} results</span>
                        </div>
                        
                        <h3>Measurable Results Found</h3>
                        <div class="analysis-list">
                            ${analysis.measurable_results.analysis.measurableResults ? 
                                analysis.measurable_results.analysis.measurableResults.map(item => 
                                    `<div class="analysis-item matched">
                                        <strong>✅ ${item.metric}</strong><br>
                                        ${item.bulletPoint}
                                    </div>`
                                ).join('') : 
                                '<div class="analysis-item">No measurable results data available</div>'
                            }
                        </div>
                        
                        <h3>Opportunities for Metrics</h3>
                        <div class="analysis-list">
                            ${analysis.measurable_results.analysis.opportunitiesForMetrics ? 
                                analysis.measurable_results.analysis.opportunitiesForMetrics.map(item => 
                                    `<div class="analysis-item missing">
                                        <strong>💡 ${item.suggestion}</strong><br>
                                        ${item.bulletPoint}
                                    </div>`
                                ).join('') : 
                                '<div class="analysis-item">No opportunities data available</div>'
                            }
                        </div>
                        
                        <h3>Improvement Suggestions</h3>
                        <p>${analysis.measurable_results.analysis.suggestedImprovements || 'Add specific metrics and quantifiable achievements to strengthen your resume.'}</p>
                    </div>
                </div>
                
                <!-- Bullet Points Tab -->
                <div class="tab-content" id="bullets-tab">
                    <div class="section">
                        <h2 class="section-title">✍️ Bullet Point Effectiveness</h2>
                        <div class="metric">
                            <span class="metric-label">Effective Bullets</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${analysis.bullet_point_effectiveness.score.effectiveBulletPercentage}%"></div>
                            </div>
                            <span class="score-text">${analysis.bullet_point_effectiveness.score.effectiveBulletPercentage}%</span>
                        </div>
                        
                        <h3>Effective Bullet Points</h3>
                        <div class="analysis-list">
                            ${analysis.bullet_point_effectiveness.analysis.effectiveBullets ? 
                                analysis.bullet_point_effectiveness.analysis.effectiveBullets.map(item => 
                                    `<div class="analysis-item matched">
                                        <strong>✅ Word Count: ${item.wordCount}</strong><br>
                                        ${item.bulletPoint}<br>
                                        <small><strong>Strengths:</strong> ${item.strengths}</small>
                                    </div>`
                                ).join('') : 
                                '<div class="analysis-item">No effective bullets data available</div>'
                            }
                        </div>
                        
                        <h3>Ineffective Bullet Points</h3>
                        <div class="analysis-list">
                            ${analysis.bullet_point_effectiveness.analysis.ineffectiveBullets ? 
                                analysis.bullet_point_effectiveness.analysis.ineffectiveBullets.map(item => 
                                    `<div class="analysis-item missing">
                                        <strong>⚠️ Word Count: ${item.wordCount}</strong><br>
                                        ${item.bulletPoint}<br>
                                        <small><strong>Issues:</strong> ${item.issues}</small><br>
                                        <small><strong>Suggested Revision:</strong> ${item.suggestedRevision}</small>
                                    </div>`
                                ).join('') : 
                                '<div class="analysis-item">No ineffective bullets data available</div>'
                            }
                        </div>
                        
                        <h3>Improvement Suggestions</h3>
                        <p>${analysis.bullet_point_effectiveness.analysis.suggestedImprovements || 'Improve bullet points by making them concise, specific, and impactful.'}</p>
                    </div>
                </div>
                
                <!-- Recommendations Tab -->
                <div class="tab-content" id="recommendations-tab">
                    <div class="section">
                        <h2 class="section-title">💡 Personalized Recommendations</h2>
                        
                        <div class="analysis-list">
                            ${analysis.keyword_match && analysis.keyword_match.analysis && analysis.keyword_match.analysis.suggestedImprovements ? 
                                `<div class="recommendation high">
                                    <div class="recommendation-header">
                                        <span>🎯 Keyword Optimization</span>
                                        <span class="recommendation-priority high-priority">HIGH</span>
                                    </div>
                                    <p>${analysis.keyword_match.analysis.suggestedImprovements}</p>
                                </div>` : ''
                            }
                            
                            ${analysis.job_experience && analysis.job_experience.analysis && analysis.job_experience.analysis.suggestedImprovements ? 
                                `<div class="recommendation high">
                                    <div class="recommendation-header">
                                        <span>💼 Experience Alignment</span>
                                        <span class="recommendation-priority high-priority">HIGH</span>
                                    </div>
                                    <p>${analysis.job_experience.analysis.suggestedImprovements}</p>
                                </div>` : ''
                            }
                            
                            ${analysis.skills_certifications && analysis.skills_certifications.analysis && analysis.skills_certifications.analysis.suggestedImprovements ? 
                                `<div class="recommendation medium">
                                    <div class="recommendation-header">
                                        <span>📚 Skills Enhancement</span>
                                        <span class="recommendation-priority medium-priority">MEDIUM</span>
                                    </div>
                                    <p>${analysis.skills_certifications.analysis.suggestedImprovements}</p>
                                </div>` : ''
                            }
                            
                            ${analysis.resume_structure && analysis.resume_structure.analysis && analysis.resume_structure.analysis.suggestedImprovements ? 
                                `<div class="recommendation medium">
                                    <div class="recommendation-header">
                                        <span>📝 Structure Optimization</span>
                                        <span class="recommendation-priority medium-priority">MEDIUM</span>
                                    </div>
                                    <p>${analysis.resume_structure.analysis.suggestedImprovements}</p>
                                </div>` : ''
                            }
                            
                            ${analysis.action_words && analysis.action_words.analysis && analysis.action_words.analysis.suggestedImprovements ? 
                                `<div class="recommendation medium">
                                    <div class="recommendation-header">
                                        <span>💪 Action Verb Enhancement</span>
                                        <span class="recommendation-priority medium-priority">MEDIUM</span>
                                    </div>
                                    <p>${analysis.action_words.analysis.suggestedImprovements}</p>
                                </div>` : ''
                            }
                            
                            ${analysis.measurable_results && analysis.measurable_results.analysis && analysis.measurable_results.analysis.suggestedImprovements ? 
                                `<div class="recommendation high">
                                    <div class="recommendation-header">
                                        <span>📊 Results Enhancement</span>
                                        <span class="recommendation-priority high-priority">HIGH</span>
                                    </div>
                                    <p>${analysis.measurable_results.analysis.suggestedImprovements}</p>
                                </div>` : ''
                            }
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
    
    window.document.write(html);
    
    // Add a small delay to ensure DOM is fully loaded before attaching event handlers
    setTimeout(() => {
        const doc = window.document;
        
        // Fix tab navigation
        doc.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and content
                doc.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                doc.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Show corresponding content
                const tabName = tab.getAttribute('data-tab');
                doc.getElementById(tabName + '-tab').classList.add('active');
            });
        });
        
        // Animate score bars
        doc.querySelectorAll('.score-fill').forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = width;
            }, 100);
        });
    }, 500);
}

// When popup opens, inject script into current tab
document.addEventListener('DOMContentLoaded', async () => {
    let uploadedResume = null; // Store the resume file
    const resumeUpload = document.getElementById('resumeUpload');
    const resumeStatus = document.getElementById('resumeStatus');
    
    resumeUpload.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        
        if (file) {
            // Check if file is PDF
            if (file.type !== 'application/pdf') {
                resumeStatus.textContent = 'Please upload a PDF file';
                resumeStatus.className = 'error';
                return;
            }

            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                resumeStatus.textContent = 'File size should be less than 5MB';
                resumeStatus.className = 'error';
                return;
            }

            uploadedResume = file; // Store the file for later use
            resumeStatus.textContent = 'Resume ready to submit';
            resumeStatus.className = 'success';
        }
    });

    const descriptionElement = document.getElementById('jobDescription');
    const statusElement = document.createElement('div');
    statusElement.id = 'status';
    descriptionElement.parentNode.insertBefore(statusElement, descriptionElement);
    
    // Create a container for results
    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'resultsContainer';
    document.body.appendChild(resultsContainer);

    try {
        statusElement.textContent = 'Extracting job details...';

        // Get the current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Add a small delay to ensure page is loaded
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Inject script into the page
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractJobDescription
        });

        // Display the result
        if (result && typeof result === 'object') {
            // Clear the container first
            descriptionElement.innerHTML = '';

            // Create structured display
            if (result.jobTitle) {
                const titleEl = document.createElement('h2');
                titleEl.textContent = result.jobTitle;
                descriptionElement.appendChild(titleEl);
            }

            if (result.company) {
                const companyEl = document.createElement('h3');
                companyEl.textContent = result.company;
                if (result.location) companyEl.textContent += ` • ${result.location}`;
                descriptionElement.appendChild(companyEl);
            }

            if (result.description) {
                const descEl = document.createElement('div');
                descEl.className = 'description-text';
                descEl.textContent = result.description;
                descriptionElement.appendChild(descEl);
            }

            if (result.skills) {
                const skillsEl = document.createElement('div');
                skillsEl.className = 'skills-section';
                skillsEl.innerHTML = `<strong>Skills:</strong> ${result.skills}`;
                descriptionElement.appendChild(skillsEl);
            }

            // Create submit button with loading state
            const submitBtn = document.createElement('button');
            submitBtn.textContent = 'Analyze Job Match';
            submitBtn.id = 'submit-button';
            submitBtn.className = 'primary-button';
            
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
                try {
                    if (!uploadedResume) {
                        alert('Please upload a resume first');
                        return;
                    }

                    // Show loading state
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Analyzing...';
                    loadingSpinner.style.display = 'inline-block';
                    submitBtn.appendChild(loadingSpinner);

                    const formData = new FormData();
                    formData.append('resume', uploadedResume);
                    formData.append('jobData', JSON.stringify(result));

                    const response = await fetch('http://127.0.0.1:8000/', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) {
                        throw new Error(`Server responded with status: ${response.status}`);
                    }

                    const responseData = await response.json();
                    
                    // Display the results from the backend
                    displayResults(resultsContainer, responseData);
                    
                    // Reset button state
                    submitBtn.textContent = 'Analyze Job Match';
                    submitBtn.disabled = false;
                    loadingSpinner.style.display = 'none';

                } catch (error) {
                    console.error('Error submitting data:', error);
                    
                    // Display error in results container
                    displayResults(resultsContainer, {
                        error: `Failed to analyze job match: ${error.message}`
                    });
                    
                    // Reset button state
                    submitBtn.textContent = 'Analyze Job Match';
                    submitBtn.disabled = false;
                    loadingSpinner.style.display = 'none';
                }
            };
            
            descriptionElement.appendChild(submitBtn);

            statusElement.textContent = result.description ? 'Job details extracted successfully!' : 'Please open a specific job posting page';
        } else {
            descriptionElement.textContent = 'No job description found. Please open a specific job posting page.';
            statusElement.textContent = 'Extraction complete with limited results';
        }
    } catch (error) {
        descriptionElement.textContent = 'Error: Could not extract job description';
        statusElement.textContent = 'Extraction failed';
        console.error(error);
    }
});
