# The Intrvu Engine: How it Works

This document explains the technical "journey" of a resume from the moment you click "Analyze" until the score appears on your screen. We use a **Two-Layer Memory System** to keep the app lightning fast and cost-effective.

---

## 🟢 Phase 1: The Input
**What happens:** You upload a **Resume (PDF)** and paste the **Job Description**.
**Technical bit:** The backend receives a `POST` request at `/api/analyze` containing your file and job details.

---

## 🔵 Phase 2: Resume Parsing (Memory Layer 1)
Before we can analyze your resume, we need to turn the PDF into structured sections (Work History, Skills, etc.).

1.  **The Digital Fingerprint (Hashing):** The system takes the raw text from your PDF and creates a unique "fingerprint" (a 64-character code called a **Hash**).
2.  **The Memory Check:** We check **Upstash Redis** for this fingerprint.
    *   **Memory Hit!** If you've uploaded this resume before, we pull the sections instantly. 0ms delay. 0 AI cost.
    *   **Memory Miss:** If it's a new resume, we ask the **AI Brain (OpenAI/Groq)** to read and organize it. We then save it in Upstash so we never have to ask again.

---

## 🟣 Phase 3: The Match Analysis (Memory Layer 2)
Now we have your organized resume sections and the job description. We need to see how they fit together.

1.  **The Combo Fingerprint:** We create a new fingerprint that combines:
    *   Your organized Resume data
    *   The cleaned-up Job Description
    *   The current version of our "Scoring Rules"
2.  **The Final Memory Check:** We check Upstash again for this specific combination.
    *   **Memory Hit!** If you're analyzing the same resume against the same job, we show you the saved score immediately.
    *   **Memory Miss:** The **AI Brain** performs the deep analysis—calculating your Job Fit Score, checking skill gaps, and providing feedback. This result is then stored in Upstash.

---

## 🟡 Phase 4: The Result
**What happens:** You see your **Job Fit Score (0-100)** and **Resume Quality Tier**.
**Technical bit:** The backend sends back a clean JSON package that the frontend (browser) turns into the beautiful charts and badges you see.

---

## 🚀 Why This Design?

### 1. The "Double Cache" Efficiency
Because we separate **Parsing** (Layer 1) from **Analysis** (Layer 2), if you use the same resume for **10 different jobs**, we only ever "parse" it once. We only use AI power for the new comparisons.

### 2. Privacy & Security
We don't store your actual PDF files. We only store the "fingerprints" and the analyzed results in our secure memory layer, which are automatically deleted (expire) after a set time.

---
