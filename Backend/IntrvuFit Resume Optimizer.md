# **IntrvuFit Resume Optimizer Specification (v4)**

## **1\. Objective**

Build a deterministic, explainable scoring system that evaluates a candidate’s resume against a specific job posting and returns:

* A **Job Fit Score** (0–100, exposed to user)  
* A **Resume Quality Tier** (label only, numeric score hidden)

System goals:

* Minimize false negatives  
* Avoid score inflation/deflation  
* Ensure consistency across roles, industries, and career stages  
* Produce outputs that are explainable to end users

---

## **2\. System Overview**

The system evaluates resumes across **two independent dimensions**:

1. **Job Fit Score (0–100)**  
   Measures alignment between resume content and job requirements.  
2. **Resume Quality Score (0–100, internal)**  
   Measures resume structure, language quality, and ATS readiness. Converted to a tiered label for UI.

These dimensions are computed independently and must not share scoring signals unless explicitly stated.

---

## **3\. Adaptive Context Configuration**

### **3.1 Career Stage Detection (Deterministic)**

Career stage is derived using a rule-based heuristic to ensure consistency and debuggability.

Detection logic:

* **Entry-Level**: \< 2 years total professional experience  
* **Mid-Level**: 2–8 years total professional experience  
* **Senior / Executive**: \> 8 years experience OR presence of leadership indicators (e.g., managed team, owned strategy, org-wide impact)

Career stage modifies internal weight emphasis only. Final scores remain capped at 100\.

---

### **3.2 Industry Context Adjustment**

Industry is inferred from job posting keywords and role taxonomy.

Adjustments:

* **Tech / Engineering**: Emphasize technical skills, tools, and methodologies  
* **Creative / Design**: Emphasize portfolio links and project-based experience  
* **Sales / Marketing**: Emphasize quantified business impact  
* **Academic / Research**: Emphasize publications, grants, and research output  
* **Regulated (Healthcare / Legal)**: Emphasize credentials and compliance

---

# **PART A: JOB FIT SCORE (0–100)**

## **4\. Job Fit Output**

| Range | Label |
| ----- | ----- |
| 90–100 | Great Match |
| 75–89 | Good Match |
| 60–74 | Moderate Match |
| \<60 | Low Fit |

---

## **5\. Job Fit Scoring Model**

| Component | Max Pts | Type |
| ----- | ----- | ----- |
| Keyword & Contextual Match | 35 | Scored |
| Experience Alignment | 30 | Scored (normalized) |
| Education Requirement | 20 | Eligibility gate |
| Skills & Tools Match | 15 | Scored |
| **Total** | **100** |  |

**Negative score guardrail**: Negative adjustments within any single component are capped at **40% of that component’s maximum points**.

---

\------|---------|------|  
| Keyword & Contextual Match | 35 | Scored |  
| Experience Alignment | 30 | Scored (normalized) |  
| Education Requirement | 20 | Eligibility gate |  
| Skills & Tools Match | 15 | Scored |  
| **Total** | **100** | |

---

## **6\. Keyword & Contextual Match (0–35)**

### **6.1 Inputs**

* Tokenized job description keywords and phrases  
* Tokenized resume content

### **6.2 Matching Method**

* Generate embeddings for job keywords and resume phrases  
* Compute cosine similarity

### **6.3 Thresholds**

* similarity ≥ 0.80 → strong match (+2)  
* 0.65 ≤ similarity \< 0.80 → partial match (+1)

### **6.4 Penalties**

* Missing critical keyword: –1  
* Keyword stuffing (frequency \> 3 per 100 words): –2 per instance

### **6.5 Guardrails**

* Positive points capped at 35  
* Penalties applied after capping  
* Final score floored at 0

---

## **7\. Experience Alignment (0–30)**

### **7.1 Evaluation Units**

Each distinct role on the resume is evaluated independently.

### **7.2 Raw Role Scoring**

* Strong alignment: \+3  
* Partial / transferable alignment: \+1.5  
* Misaligned emphasis: –1

### **7.3 Expected Maximum Definition**

To normalize experience scores fairly across resumes of varying length:

expected\_max \= min(number\_of\_relevant\_roles × 3, 12\)

Where:

* `number_of_relevant_roles` includes strong \+ partial matches  
* 12 represents the saturation point beyond which additional roles do not increase signal strength

### **7.4 Normalization**

experience\_score \= min((raw\_score / expected\_max) × 30, 30\)

This ensures experience contributes proportionally without over- or under-weighting resume length.

---

## **8\. Education Requirement (0 or 20\)**

### **8.1 Rule Type**

Binary eligibility gate. No partial scoring.

### **8.2 Pass Condition**

Resume contains a Bachelor’s degree or equivalent.

Accepted indicators:

* Bachelor’s Degree / BA / BS / BEng / BCom / BBA  
* Undergraduate Degree  
* International Bachelor-equivalent degrees (via mapping)

### **8.3 Fail Condition**

* No Bachelor-equivalent detected

### **8.4 Scoring**

* Pass → \+20  
* Fail → 0

Field of study is ignored unless explicitly required by the job.

---

## **9\. Skills & Tools Match (0–15)**

### **9.1 Skill Types**

* Hard / technical: \+1  
* Soft skill: \+0.5  
* Missing critical skill: –1

### **9.2 De-duplication Rule**

If a skill is credited under Experience Alignment:

* Full value applies to Experience  
* Skills category applies 50% value

### **9.3 Guardrails**

* Skills weighted by job frequency and importance  
* Cap total at 15

---

# **PART B: RESUME QUALITY SCORE (INTERNAL)**

## **10\. Output Mapping**

| Internal Score | UI Label |
| ----- | ----- |
| ≥90 | Ready to Impress |
| 70–89 | Needs Polish |
| \<70 | Refine for Impact |

Numeric score must not be exposed in UI.

---

## **11\. Resume Quality Components**

| Component | Max Pts |
| ----- | ----- |
| Resume Structure | 30 |
| Action Words Usage | 25 |
| Measurable Results | 25 |
| Bullet Effectiveness | 20 |

---

## **12\. Resume Structure (0–30)**

### **12.1 Required Sections**

* Personal Information  
* Website / Social Links  
* Work Experience  
* Education

### **12.2 Conditional Requirement**

* Certifications required **only if** job explicitly requires them.

### **12.3 Penalties**

* ATS-unfriendly formatting (tables, columns): –1 per issue.

### **12.4 Notes**

No user-facing structure rating is displayed.

---

## **13\. Action Words Usage (0–25)**

* Strong verbs: \+1 each (capped)  
* Weak verbs: –0.5  
* Clichés / buzzwords: –1

---

## **14\. Measurable Results (0–25)**

* Quantified outcome: \+2.5  
* Outcome language without metrics: partial credit

---

## **15\. Bullet Point Effectiveness (0–20)**

* Optimal length and structure: \+2 per bullet  
* Poorly structured bullet: –0.5

---

## **16\. Certification Handling (Job Fit Only)**

Rules:

* Not mentioned in job → ignore  
* Required → binary pass/fail  
* Preferred → additive boost only  
* Normalize certification aliases

Certifications must not be double-counted in Resume Quality.

---

## **17\. System Constraints (Hard Rules)**

* No penalty unless explicitly required by job  
* Eligibility gates ≠ scored dimensions  
* No unbounded scoring loops  
* All category outputs must be explainable  
* Total Job Fit Score ∈ \[0,100\]

---

# **APPENDICES**

---

## **Appendix A: Action Word Lexicon**

### **Strong Action Verbs (Non-Exhaustive)**

led, launched, designed, implemented, optimized, scaled, automated, improved, drove, delivered, owned, architected, executed, increased, reduced, accelerated

### **Weak / Low-Signal Verbs**

assisted, helped, worked on, responsible for, supported, participated in, contributed to

### **Clichés / Buzzwords**

team player, results-driven, self-starter, go-getter, dynamic professional, detail-oriented, fast-paced environment

---

## **Appendix B: Degree Equivalency Mapping**

The following are treated as Bachelor-equivalent degrees:

* Bachelor’s Degree (BA, BS, BEng, BCom, BBA)  
* Undergraduate Degree  
* International equivalents:  
  * Licence (EU)  
  * 4-year Diploma (India, select regions)  
  * Honours Bachelor (UK, Canada)

Degree mappings should be configurable and region-aware.

---

## **Appendix C: ATS Formatting Rules**

The following formatting patterns are considered ATS-unfriendly and may trigger penalties:

* Multi-column layouts  
* Tables for primary content  
* Text embedded in images  
* Non-standard section headers  
* Excessive use of icons or graphics

Each detected issue applies a –1 adjustment, subject to category penalty caps.

---

## **Appendix D: Semantic Matching Requirements**

Semantic matching implementations must:

* Operate reliably on short text fragments (phrases, bullet points)  
* Produce stable cosine similarity distributions  
* Support synonym and paraphrase recognition

Implementation may use embeddings, hybrid keyword systems, or equivalent techniques, provided behavioral thresholds are met.

---

**End of Engineering Specification (v4)**