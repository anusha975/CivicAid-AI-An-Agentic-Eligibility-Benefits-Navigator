"""
CivicAid AI - Application Copilot Service (Module 8)
Generates structured, verified application roadmaps for government schemes:
1. Eligibility summary
2. Required documents
3. Step-by-step application process
4. Official application source
5. What information to prepare
6. Common missing information & pitfalls
7. Final checklist
Guided 5-Step Workflow:
STEP 1: Confirm eligibility
STEP 2: Prepare documents
STEP 3: Open official application source
STEP 4: Complete application
STEP 5: Save acknowledgement/reference number

Safety & Ethics:
- NEVER simulates submitting applications to government systems.
- Strictly provides preparation guidance and links to verified official sources.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from backend.app.models.scheme_v2 import SchemeKnowledgeItem


class GuidedWorkflowStep(BaseModel):
    step_number: int
    title: str
    action_label: str
    description: str
    key_tip: str
    is_external_link: bool = False
    external_url: Optional[str] = None


class RequiredDocumentDetail(BaseModel):
    document_name: str
    issuing_authority: str
    format_guide: str
    is_mandatory: bool = True


class SchemeApplicationGuide(BaseModel):
    scheme_id: str
    scheme_name: str
    ministry: str
    category: str
    state: str
    level: str
    benefit_summary: str
    
    # The 7 Required Sections
    eligibility_summary: str
    required_documents_details: List[RequiredDocumentDetail]
    step_by_step_process: List[str]
    official_application_source: Dict[str, Any]
    what_information_to_prepare: List[str]
    common_missing_information: List[str]
    final_checklist: List[str]
    
    # 5-Step Guided Workflow
    guided_workflow: List[GuidedWorkflowStep]
    
    # Ethical Safety Disclaimer
    disclaimer: str


class ApplicationCopilotService:
    """
    Constructs deterministic, grounded application copilots for Indian welfare schemes.
    """

    @classmethod
    def generate_guide(cls, scheme: SchemeKnowledgeItem) -> SchemeApplicationGuide:
        rules = scheme.eligibility_rules or {}
        level = "Central" if scheme.state.strip().lower() in ("all india", "central", "national") else "State"
        
        # 1. Eligibility Summary
        target_str = ", ".join(scheme.target_beneficiaries) if scheme.target_beneficiaries else "Eligible Indian Citizens"
        min_age = rules.get("min_age", 0)
        max_age = rules.get("max_age", "No ceiling")
        max_income = rules.get("max_annual_family_income") or rules.get("max_annual_income")
        income_text = f"Annual family income ceiling ₹{max_income:,}" if max_income else "No strict income ceiling (or based on category)"
        
        eligibility_summary = (
            f"{scheme.name} is a {level} government program administered by {scheme.ministry}. "
            f"Target Beneficiaries: {target_str}. Age Requirement: {min_age} to {max_age} years. "
            f"Income Criteria: {income_text}. Jurisdiction: {scheme.state}."
        )

        # 2. Required Documents Details
        doc_details: List[RequiredDocumentDetail] = []
        for doc in (scheme.required_documents or ["Aadhaar Card"]):
            d_lower = doc.lower()
            auth = "Competent Revenue / Administrative Authority"
            fmt = "Self-attested clear scan (PDF or JPEG, < 2MB)"

            if "aadhaar" in d_lower:
                auth = "UIDAI (Aadhaar Seva Kendra / eaadhaar.uidai.gov.in)"
                fmt = "e-Aadhaar PDF or clear photo (Masked Aadhaar accepted)"
            elif "income" in d_lower:
                auth = "Revenue Department / Tehsildar / e-District Portal"
                fmt = "Valid Income Certificate issued for current financial year"
            elif "caste" in d_lower:
                auth = "Tehsildar / Sub-Divisional Magistrate / Social Welfare Dept"
                fmt = "Digitally signed Permanent Caste/Community Certificate"
            elif "bank" in d_lower:
                auth = "Commercial / Public Bank Branch"
                fmt = "First page of Bank Passbook showing IFSC, Account No, and NPCI status"
            elif "land" in d_lower or "khatauni" in d_lower or "patta" in d_lower:
                auth = "State Revenue Records / Bhulekh Portal / Patwari"
                fmt = "Recent certified copy of RoR / Khatauni / Jamabandi record"
            elif "student" in d_lower or "marks" in d_lower or "college" in d_lower:
                auth = "Recognized School / College / University Institute Registrar"
                fmt = "Bonafide Student Certificate or Official Marksheet/Grade Memo"
            elif "ration" in d_lower or "samagra" in d_lower:
                auth = "Department of Food & Civil Supplies"
                fmt = "Active Ration Card / Family ID Copy"

            doc_details.append(RequiredDocumentDetail(
                document_name=doc,
                issuing_authority=auth,
                format_guide=fmt,
                is_mandatory=True
            ))

        # 3. Step-by-Step Application Process
        is_online = "online" in scheme.application_method.lower() or scheme.official_source.startswith("http")
        portal_name = scheme.source_name or "Official Government Portal"
        
        step_process = [
            f"1. Registration & Authentication: Visit {portal_name} ({scheme.official_source}) and create your citizen login using your Aadhaar-linked Mobile Number and OTP verification.",
            "2. Profile & Scheme Form Filling: Navigate to the active schemes section, select the scheme application form, and input personal, demographic, educational, and occupation details.",
            "3. Upload Supporting Certificates: Upload legible, self-attested scanned copies of mandatory documents (Aadhaar, income certificate, bank passbook).",
            "4. Bank Account Verification for DBT: Verify that your Bank Account Number, IFSC code, and Aadhaar NPCI DBT mapping are accurately linked for Direct Benefit Transfer.",
            "5. Final Review, Submission & ARN Generation: Review the filled application preview, submit the form, and download the Application Acknowledgment Receipt containing your unique Application Reference Number (ARN)."
        ]

        # 4. Official Application Source
        official_source = {
            "source_name": scheme.source_name,
            "url": scheme.official_source,
            "is_verified_gov_domain": any(scheme.official_source.endswith(ext) or ext in scheme.official_source for ext in [".gov.in", ".nic.in", ".in"]),
            "application_method": scheme.application_method,
            "helpline_info": "National / State Citizen Helpline (1800-toll-free where available)"
        }

        # 5. What Information to Prepare
        what_to_prepare = [
            "Aadhaar Number and active mobile phone registered with Aadhaar (for receiving OTPs).",
            "Bank Account Number, Branch IFSC Code, and confirmation of NPCI Aadhaar seeding for DBT.",
            "Exact annual family income figure as stated on your revenue income certificate.",
            "Current residential address with District, Mandal/Taluk, Village/Ward, and PIN code.",
            "Educational roll number, institution name, or occupational registration ID (where applicable)."
        ]
        if "farmer" in scheme.category.lower() or "agriculture" in scheme.category.lower():
            what_to_prepare.append("Land Survey Number (Khasra/Khatauni/Patta No.) and total cultivable acreage.")

        # 6. Common Missing Information & Pitfalls
        common_pitfalls = [
            "Bank Account not mapped with NPCI: Ensure your savings account is active for Aadhaar-based DBT, or payment installments will fail.",
            "Name/DOB mismatch: Names must match exactly across your Aadhaar, bank account, and educational marksheet.",
            "Expired Income Certificate: Revenue income certificates are typically valid for 1 year; ensure you have the latest fiscal certificate.",
            "Blurred Document Scans: Upload clear, legible PDF/JPEG files without cut-off borders or obscured seals.",
            "Not Saving ARN: Always record and save your Application Reference Number immediately after submitting."
        ]

        # 7. Final Pre-Submission Checklist
        final_checklist = [
            "All demographic details (Name, Father's Name, DOB, Gender) verified against Aadhaar.",
            "Mandatory documents scanned, clear, and uploaded in accepted file formats (< 2MB).",
            "Bank account is active and seeded with Aadhaar on NPCI mapper.",
            "Income certificate details match current financial year figures.",
            "Downloaded and printed the final PDF Application Form and Acknowledgment Receipt."
        ]

        # Guided 5-Step Workflow
        guided_workflow = [
            GuidedWorkflowStep(
                step_number=1,
                title="Confirm Eligibility",
                action_label="Review Eligibility Norms",
                description="Verify that your age, income, category, and state residency strictly satisfy the scheme criteria.",
                key_tip="Use the CivicAid AI Benefits Advisor to review deterministic rules before proceeding."
            ),
            GuidedWorkflowStep(
                step_number=2,
                title="Prepare Documents",
                action_label="Open Document Readiness Checker",
                description=f"Gather all {len(scheme.required_documents or [])} mandatory certificates (Aadhaar, income certificate, bank proof).",
                key_tip="Verify that all files are clear PDFs/JPEGs under 2MB."
            ),
            GuidedWorkflowStep(
                step_number=3,
                title="Open Official Application Source",
                action_label="Start Application on Official Portal",
                description=f"Access the verified government portal at {scheme.official_source}.",
                key_tip="Never apply through unauthorized third-party agencies or pay unofficial fees.",
                is_external_link=True,
                external_url=scheme.official_source
            ),
            GuidedWorkflowStep(
                step_number=4,
                title="Complete Application",
                action_label="Fill Online Form & Upload Files",
                description="Input your verified details, enter Aadhaar OTP, upload certificates, and confirm your DBT bank account.",
                key_tip="Double-check spellings against your Aadhaar card before clicking submit."
            ),
            GuidedWorkflowStep(
                step_number=5,
                title="Save Acknowledgement / Reference Number",
                action_label="Store ARN & Download PDF",
                description="Record your unique Application Reference Number (ARN) and save the submission acknowledgment PDF.",
                key_tip="Use the ARN in the CivicAid Application Locker below to monitor status and grievance updates."
            )
        ]

        disclaimer = (
            "IMPORTANT: CivicAid AI is an independent citizen preparation and guidance copilot. "
            "We DO NOT submit applications to government servers on your behalf. "
            "All official welfare applications must be finalized directly on official government portals (.gov.in / .nic.in) "
            "or authorized Common Service Centers (CSC)."
        )

        return SchemeApplicationGuide(
            scheme_id=scheme.id,
            scheme_name=scheme.name,
            ministry=scheme.ministry,
            category=scheme.category,
            state=scheme.state,
            level=level,
            benefit_summary=scheme.benefits,
            eligibility_summary=eligibility_summary,
            required_documents_details=doc_details,
            step_by_step_process=step_process,
            official_application_source=official_source,
            what_information_to_prepare=what_to_prepare,
            common_missing_information=common_pitfalls,
            final_checklist=final_checklist,
            guided_workflow=guided_workflow,
            disclaimer=disclaimer
        )
