# CivicAid AI — 3-Minute Hackathon Demo Script ⏱️

**Target Duration**: 3 minutes (180 seconds)  
**Presenter Persona**: Senior AI GovTech Product Engineer  
**Demo Flow Persona**: Arjun Rao (20-year-old Undergraduate Engineering Student from Telangana, SC Category)

---

## ⏱️ Timeline & Action Script

### 0:00 – 0:30 | The Real Problem & Solution Introduction
* **Screen**: CivicAid AI Landing Page (`Home`).
* **Visual**: Clean hero headline: *"Find the government benefits you may be eligible for."*
* **Speaker**:
  > *"Over 1,200 government welfare schemes exist in India, with lakhs of crores allocated annually. Yet millions of deserving students, small farmers, and women entrepreneurs miss out because eligibility criteria are buried in dense 50-page gazettes and legacy portals.*
  >
  > *Today, we present **CivicAid AI** — an agentic welfare navigator that transforms complex government notifications into deterministic, explainable eligibility decisions and step-by-step application guidance."*

---

### 0:30 – 1:00 | Step 1: Citizen Profile Creation & Passport
* **Screen Action**: Click **"Student • Telangana • B.Tech Engineering"** 1-click persona loader (or open Profile Wizard).
* **Visual**: Profile attributes loaded instantly (Age: 20, State: Telangana, Occupation: Student, Category: SC, Income: ₹1,80,000). Show completion score: **100%**.
* **Speaker**:
  > *"Let's take Arjun — an engineering student from Telangana from an SC household. Rather than filling repetitive forms across 10 ministry portals, Arjun builds his **Citizen Passport** once. CivicAid analyzes demographic, educational, quota, and income thresholds with zero biometric storage."*

---

### 1:00 – 1:45 | Step 2: 5-Stage Multi-Agent Analysis & Explainable Eligibility
* **Screen Action**: Switch to **AI Advisor** tab. Click **"Run 5-Agent Analysis"** (Query: *"What schemes can I apply for?"*).
* **Visual**: 5-Stage visualizer animates across Profile Analyzer -> Scheme Discovery -> Eligibility Agent -> Document Agent -> Application Guide.
* **Visual**: Result appears: **Post-Matric Scholarship for SC Students** rated **ELIGIBLE (100% Confidence)**.
* **Screen Action**: Expand **"How was this determined?"** accordion.
* **Visual**: Show deterministic condition checklist:
  - `✓ Education requirement: Undergraduate B.Tech`
  - `✓ State requirement: Central All-India`
  - `✓ Student requirement: Active Student verified`
  - `✓ Age requirement: 20 in [16, 35]`
  - `✓ Income requirement: ₹1,80,000 <= ₹2,50,000 ceiling`
  - Audit trace: `[STUDENT] PASSED: Student`, `[INCOME] PASSED: ₹180,000 <= ₹250,000`.
* **Speaker**:
  > *"Behind the scenes, the **CivicAid Orchestrator** coordinates 5 specialized agents. Crucially, we **never rely purely on LLM guesswork** for eligibility. Our deterministic **Explainable Eligibility Engine** mathematically evaluates 11 normalized dimensions. 
  > Look at this audit trace: every single rule is verified with zero hallucination guarantee, citing verified government gazettes."*

---

### 1:45 – 2:20 | Step 3: Document Readiness Checker (PDF/Image Inspection)
* **Screen Action**: Click **"Application Copilot →"** or open **Documents** tab.
* **Visual**: Document Readiness dashboard displays `3 / 5 ready (60%)`.
* **Visual**: Missing certificates highlighted: `Income Certificate`.
* **Screen Action**: Click **"Test Income Certificate"** sample or drop sample file.
* **Visual**: AI Document Scanner detects `Income Certificate (98% Confidence)`, extracts stated amount `₹1,80,000`, issuing authority `Revenue Department / Tahasildar`, auto-masks PII, and updates progress bar to `4 / 5 ready (80%)`.
* **Speaker**:
  > *"Before applying, Arjun uses our **Document Readiness Checker**. He drops a sample certificate — the scanner extracts key format signatures, verifies the current financial year, masks sensitive identifiers, and marks his requirement checklist ready, while providing a clear non-verification disclaimer."*

---

### 2:20 – 3:00 | Step 4: Application Copilot & Official Portal Submission
* **Screen Action**: Navigate to **Copilot** tab for Post-Matric Scholarship.
* **Visual**: 5-Step Guided Workflow Banner (**Confirm Eligibility -> Prepare Documents -> Open Official Portal -> Complete Application -> Save Reference Number**).
* **Screen Action**: Click **"Start Application"** button (opens `https://scholarships.gov.in` in a new tab).
* **Screen Action**: In Step 5, type ARN: `NSP-2026-981249` and click **"Save Reference Record"**.
* **Visual**: Green toast notification: *"Application Reference saved in your offline CivicAid vault!"*
* **Speaker**:
  > *"Finally, our **Application Copilot** provides a 5-step roadmap. In Step 3, Arjun clicks 'Start Application', safely opening the verified National Scholarship Portal (`scholarships.gov.in`). Once submitted, he saves his Application Reference Number into his local CivicAid vault for real-time tracking.
  >
  > *From confusion to full verified benefit navigation in under 3 minutes — that is the power of CivicAid AI on AWS."*

---

## 🎯 Demo Checklist
- [x] Tested on local and cloud environments.
- [x] Zero network delays or broken links.
- [x] All 11 steps execute seamlessly without dead ends.
