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

            // Modify the copy button to send data to backend
            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'Submit to Backend';
            copyBtn.onclick = async () => {
                try {
                    if (!uploadedResume) {
                        alert('Please upload a resume first');
                        return;
                    }

                    const formData = new FormData();
                    formData.append('resume', uploadedResume);
                    formData.append('jobData', JSON.stringify(result));

                    const response = await fetch('http://localhost:8000', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) {
                        throw new Error('Failed to submit data');
                    }

                    const responseData = await response.json();
                    copyBtn.textContent = 'Submitted Successfully!';
                    setTimeout(() => copyBtn.textContent = 'Submit to Backend', 2000);

                } catch (error) {
                    console.error('Error submitting data:', error);
                    copyBtn.textContent = 'Submission Failed';
                    setTimeout(() => copyBtn.textContent = 'Submit to Backend', 2000);
                }
            };
            descriptionElement.appendChild(copyBtn);

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
