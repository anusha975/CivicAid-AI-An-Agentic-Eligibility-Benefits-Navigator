from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status
from pydantic import BaseModel, Field
from backend.app.models.scheme_v2 import SchemeKnowledgeItem, CategorySummaryItem
from backend.app.models.schemas import CitizenProfile
from backend.app.repositories.scheme_repo import get_scheme_repository

router = APIRouter(prefix="/schemes", tags=["Schemes Knowledge Base"])


class SchemeMatchResult(BaseModel):
    scheme: SchemeKnowledgeItem
    is_eligible: bool
    status: Optional[str] = None
    match_score: int = Field(ge=0, le=100)
    reasons: List[str]
    missing_criteria: List[str] = []
    matched_conditions: List[Dict[str, Any]] = Field(default_factory=list)
    failed_conditions: List[Dict[str, Any]] = Field(default_factory=list)
    unknown_conditions: List[Dict[str, Any]] = Field(default_factory=list)
    explanation: Optional[str] = None
    actionable_next_steps: List[str] = []


class EligibilityCheckRequest(BaseModel):
    profile: CitizenProfile
    scheme_ids: Optional[List[str]] = None


class EligibilityCheckResponse(BaseModel):
    total_scanned: int
    eligible_count: int
    matches: List[SchemeMatchResult]


@router.get("", response_model=List[SchemeKnowledgeItem])
def list_schemes(
    category: Optional[str] = Query(None, description="Filter by category (e.g. Agriculture, Healthcare, Scholarships)"),
    state: Optional[str] = Query(None, description="Filter by state (e.g. All India, Uttar Pradesh, Tamil Nadu)"),
    search: Optional[str] = Query(None, description="Search keyword in scheme name, description, benefits, or tags"),
    limit: int = Query(100, ge=1, le=500, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination")
) -> List[SchemeKnowledgeItem]:
    """
    List verified welfare schemes with category, state, keyword filters and pagination.
    """
    repo = get_scheme_repository()
    return repo.list_all(category=category, state=state, search=search, limit=limit, offset=offset)


@router.get("/categories/summary", response_model=List[CategorySummaryItem])
def get_categories_summary() -> List[CategorySummaryItem]:
    """Retrieve category-wise counts of active schemes in knowledge base."""
    repo = get_scheme_repository()
    return repo.get_categories_summary()


@router.get("/{scheme_id}", response_model=SchemeKnowledgeItem)
def get_scheme_by_id(scheme_id: str) -> SchemeKnowledgeItem:
    """Retrieve complete official knowledge item for a specific scheme by ID."""
    repo = get_scheme_repository()
    scheme = repo.get_by_id(scheme_id)
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheme '{scheme_id}' not found in knowledge base."
        )
    return scheme


@router.get("/{scheme_id}/application-guide")
def get_scheme_application_guide(scheme_id: str):
    """
    Module 8: Application Copilot Endpoint.
    Generates verified 7-section application roadmap and 5-step guided workflow.
    """
    from backend.services.application_copilot import ApplicationCopilotService
    repo = get_scheme_repository()
    scheme = repo.get_by_id(scheme_id)
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheme '{scheme_id}' not found in knowledge base."
        )
    guide = ApplicationCopilotService.generate_guide(scheme)
    return guide.model_dump()


@router.post("/evaluate", response_model=EligibilityCheckResponse)
def evaluate_eligibility(payload: EligibilityCheckRequest) -> EligibilityCheckResponse:
    """
    Evaluates citizen profile against welfare schemes using ExplainableEligibilityEngine.
    """
    from backend.rules.eligibility_engine import ExplainableEligibilityEngine
    repo = get_scheme_repository()
    all_schemes = repo.list_all(limit=500)
    
    if payload.scheme_ids:
        schemes_to_eval = [s for s in all_schemes if s.id in payload.scheme_ids]
    else:
        schemes_to_eval = all_schemes

    results: List[SchemeMatchResult] = []
    profile_dict = payload.profile.model_dump()

    for scheme in schemes_to_eval:
        eval_res = ExplainableEligibilityEngine.evaluate(profile_dict, scheme)
        is_eligible = eval_res.status == "ELIGIBLE"

        next_steps = [
            f"Gather mandatory documents: {', '.join(scheme.required_documents[:2])}",
            f"Apply via {scheme.application_method} or visit {scheme.official_source}"
        ] if is_eligible else [
            "Review missing criteria or verify updated official notification."
        ]

        results.append(
            SchemeMatchResult(
                scheme=scheme,
                is_eligible=is_eligible,
                status=eval_res.status,
                match_score=eval_res.confidence_score,
                reasons=[m.detail for m in eval_res.matched_conditions] or ["General eligibility under review"],
                missing_criteria=[f.detail for f in eval_res.failed_conditions],
                matched_conditions=[c.model_dump() for c in eval_res.matched_conditions],
                failed_conditions=[c.model_dump() for c in eval_res.failed_conditions],
                unknown_conditions=[c.model_dump() for c in eval_res.unknown_conditions],
                explanation=eval_res.explanation,
                actionable_next_steps=next_steps
            )
        )

    results.sort(key=lambda x: (x.is_eligible, x.match_score), reverse=True)
    eligible_count = sum(1 for r in results if r.is_eligible)

    return EligibilityCheckResponse(
        total_scanned=len(schemes_to_eval),
        eligible_count=eligible_count,
        matches=results
    )

