"""
CivicAid AI - Multi-Agent Tool Registry
Standardized deterministic tools invoked by CivicAid specialized agents.
"""
from typing import List, Dict, Any, Optional
from backend.app.models.scheme_v2 import SchemeKnowledgeItem
from backend.app.repositories.scheme_repo import get_scheme_repository
from backend.rag.retriever import get_rag_retriever
from backend.rag.evidence import EvidenceExtractor


def search_schemes(
    query: str = "",
    category: Optional[str] = None,
    state: Optional[str] = None,
    profile: Optional[Dict[str, Any]] = None,
    limit: int = 10
) -> List[SchemeKnowledgeItem]:
    """
    Tool: Discovers relevant schemes using hybrid RAG semantic search and repository filters.
    """
    if query and query.strip():
        retriever = get_rag_retriever()
        rag_results = retriever.search(query=query, profile=profile, top_k=limit)
        return [r["scheme"] for r in rag_results]
    else:
        repo = get_scheme_repository()
        return repo.list_all(category=category, state=state, limit=limit)


def get_scheme(scheme_id: str) -> Optional[SchemeKnowledgeItem]:
    """
    Tool: Retrieves full official scheme knowledge item by ID.
    """
    repo = get_scheme_repository()
    return repo.get_by_id(scheme_id)


def check_eligibility(
    profile: Dict[str, Any],
    scheme: SchemeKnowledgeItem
) -> Dict[str, Any]:
    """
    Tool: Deterministically evaluates a citizen profile against a scheme's eligibility rules
    using ExplainableEligibilityEngine across 11 normalized dimensions.
    Distinguishes: ELIGIBLE, NOT_ELIGIBLE, POSSIBLY_ELIGIBLE, NEEDS_MORE_INFORMATION / INSUFFICIENT_INFORMATION.
    Strictly does not invent missing information.
    """
    from backend.rules.eligibility_engine import ExplainableEligibilityEngine
    result = ExplainableEligibilityEngine.evaluate(profile, scheme)

    reasons = [m.detail for m in result.matched_conditions]
    failed_reasons = [f.detail for f in result.failed_conditions]
    missing_questions = [u.detail for u in result.unknown_conditions]

    return {
        "scheme_id": scheme.id,
        "scheme_name": scheme.name,
        "status": result.status,
        "confidence_score": result.confidence_score,
        "matched_conditions": [c.model_dump() for c in result.matched_conditions],
        "failed_conditions": [c.model_dump() for c in result.failed_conditions],
        "unknown_conditions": [c.model_dump() for c in result.unknown_conditions],
        "explanation": result.explanation,
        "reasons": reasons or ["General welfare criteria under review."],
        "missing_criteria": failed_reasons,
        "clarification_questions": missing_questions,
        "audit_trace": result.audit_trace
    }


def get_required_documents(
    scheme: SchemeKnowledgeItem,
    user_documents: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Tool: Resolves mandatory documents, issuing departments, and readiness instructions.
    """
    docs = scheme.required_documents or []
    user_docs_set = set(d.lower() for d in (user_documents or []))

    doc_action_plan = []
    for doc in docs:
        d_lower = doc.lower()
        is_ready = any(ud in d_lower for ud in user_docs_set)

        issuing_authority = "Competent Government Authority"
        if "aadhaar" in d_lower:
            issuing_authority = "UIDAI / Nearest Aadhaar Seva Kendra"
        elif "caste" in d_lower:
            issuing_authority = "Tehsildar / Sub-Divisional Magistrate (SDM) / State e-District Portal"
        elif "income" in d_lower:
            issuing_authority = "Revenue Department / Tehsildar / e-District Portal"
        elif "land" in d_lower or "khatauni" in d_lower or "patta" in d_lower:
            issuing_authority = "Revenue Department / Bhulekh Portal / Patwari"
        elif "domicile" in d_lower:
            issuing_authority = "Tehsildar / District Magistrate Office"
        elif "ration" in d_lower or "samagra" in d_lower:
            issuing_authority = "Department of Food & Civil Supplies / Gram Panchayat"
        elif "bank" in d_lower:
            issuing_authority = "Nationalized or Commercial Bank Branch (Must be NPCI Aadhaar-seeded)"
        elif "marksheet" in d_lower or "student" in d_lower or "bonafide" in d_lower:
            issuing_authority = "Recognized School / College / University Institute Registrar"
        elif "birth" in d_lower:
            issuing_authority = "Municipal Corporation / Registrar of Births & Deaths"
        elif "udyam" in d_lower or "business" in d_lower:
            issuing_authority = "Ministry of MSME (udyamregistration.gov.in)"

        doc_action_plan.append({
            "document_name": doc,
            "issuing_authority": issuing_authority,
            "status": "Ready in Profile" if is_ready else "Action Required",
            "is_mandatory": True
        })

    return {
        "scheme_id": scheme.id,
        "scheme_name": scheme.name,
        "total_documents": len(docs),
        "required_documents": docs,
        "action_plan": doc_action_plan
    }


def get_application_method(scheme: SchemeKnowledgeItem) -> Dict[str, Any]:
    """
    Tool: Provides concrete step-by-step application walkthrough and official portal routing.
    """
    is_online = "online" in scheme.application_method.lower() or scheme.official_source.startswith("http")
    is_csc = "csc" in scheme.application_method.lower() or "common service" in scheme.application_method.lower()
    is_bank = "bank" in scheme.application_method.lower()

    steps = [
        f"Step 1: Check document readiness (gather {', '.join((scheme.required_documents or [])[:2])}).",
        f"Step 2: Access official portal at {scheme.official_source} or visit nearest Common Service Center (CSC).",
        "Step 3: Complete biometric/Aadhaar OTP verification and fill online welfare application.",
        "Step 4: Upload attested supporting documents and link bank account for Direct Benefit Transfer (DBT).",
        "Step 5: Obtain Application Reference Number (ARN) for real-time tracking and grievance redressal."
    ]

    return {
        "scheme_id": scheme.id,
        "scheme_name": scheme.name,
        "application_method": scheme.application_method,
        "official_source": scheme.official_source,
        "source_name": scheme.source_name,
        "is_online_available": is_online,
        "is_csc_available": is_csc,
        "is_bank_available": is_bank,
        "steps": steps
    }
