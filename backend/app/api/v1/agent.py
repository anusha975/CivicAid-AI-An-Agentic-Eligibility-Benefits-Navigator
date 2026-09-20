"""
CivicAid AI - Multi-Agent Eligibility Analysis API Router
Provides POST /api/agent/analyze endpoint executing the full CivicAid Orchestrator multi-agent workflow.
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, status
from pydantic import BaseModel, Field
from backend.app.models.scheme_v2 import SchemeKnowledgeItem
from agents.orchestrator import get_civicaid_orchestrator

router = APIRouter(tags=["Multi-Agent Eligibility System"])


class AgentAnalyzeRequest(BaseModel):
    profile: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Citizen profile attributes")
    query: Optional[str] = Field(default="", description="Optional citizen query or specific intent")


class AgentEligibilityResultItem(BaseModel):
    scheme_id: str
    scheme_name: str
    status: str = Field(..., description="ELIGIBLE, NOT_ELIGIBLE, POSSIBLY_ELIGIBLE, NEEDS_MORE_INFORMATION / INSUFFICIENT_INFORMATION")
    confidence_score: int
    reasons: List[str]
    missing_criteria: List[str] = Field(default_factory=list)
    clarification_questions: List[str] = Field(default_factory=list)
    matched_conditions: List[Dict[str, Any]] = Field(default_factory=list)
    failed_conditions: List[Dict[str, Any]] = Field(default_factory=list)
    unknown_conditions: List[Dict[str, Any]] = Field(default_factory=list)
    explanation: Optional[str] = None
    audit_trace: List[str] = Field(default_factory=list)
    scheme: SchemeKnowledgeItem


class MissingInformationItem(BaseModel):
    field: str
    importance: str
    question: str


class DocumentPlanItem(BaseModel):
    scheme_id: str
    scheme_name: str
    total_documents: int
    required_documents: List[str]
    action_plan: List[Dict[str, Any]]


class ApplicationStepItem(BaseModel):
    scheme_id: str
    scheme_name: str
    application_method: str
    official_source: str
    source_name: str
    is_online_available: bool
    is_csc_available: bool
    is_bank_available: bool
    steps: List[str]


class EvidenceItem(BaseModel):
    scheme_id: str
    scheme_name: str
    status: str
    evidence_text: str
    source: str
    source_name: str


class SourceItem(BaseModel):
    source_name: str
    url: str
    schemes_covered: List[str]


class AgentAnalyzeResponse(BaseModel):
    summary: str
    recommendations: List[str]
    eligibility: List[AgentEligibilityResultItem]
    missing_information: List[MissingInformationItem]
    documents: List[DocumentPlanItem]
    application_steps: List[ApplicationStepItem]
    evidence: List[EvidenceItem]
    sources: List[SourceItem]


@router.post(
    "/analyze",
    response_model=AgentAnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Multi-Agent Citizen Welfare Analysis Pipeline"
)
def analyze_citizen_eligibility(payload: AgentAnalyzeRequest) -> AgentAnalyzeResponse:
    """
    Executes the CivicAid 5-Stage Multi-Agent Analysis Pipeline:
    Profile Analyzer -> Scheme Discovery -> Eligibility Verification -> Document Mapping -> Application Guide.
    """
    orchestrator = get_civicaid_orchestrator()
    result = orchestrator.run_pipeline(
        profile=payload.profile or {},
        query=payload.query or ""
    )
    return AgentAnalyzeResponse(**result)
