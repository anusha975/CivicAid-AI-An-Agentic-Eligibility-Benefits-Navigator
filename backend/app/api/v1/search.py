"""
CivicAid AI - AI Semantic Search & RAG API Router
Provides POST /api/search endpoint with evidence extraction over verified welfare schemes.
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, status
from pydantic import BaseModel, Field
from backend.app.models.scheme_v2 import SchemeKnowledgeItem
from backend.rag.retriever import get_rag_retriever

router = APIRouter(tags=["AI Semantic Scheme Search"])


class SchemeSearchResultItem(BaseModel):
    scheme: SchemeKnowledgeItem
    relevance_score: float = Field(..., ge=0.0, le=1.0, description="Semantic match confidence score (0.0 to 1.0)")
    matched_rules: List[str] = Field(default_factory=list, description="Specific eligibility rules and criteria matched")
    evidence: str = Field(..., description="Grounded factual citation directly from the scheme knowledge base")
    source: str = Field(..., description="Official government portal source attribution")


class SchemeSearchRequest(BaseModel):
    query: str = Field(..., description="Natural language citizen question (e.g. 'I am an engineering student looking for scholarships')")
    profile: Optional[Dict[str, Any]] = Field(default=None, description="Optional citizen profile dictionary for personalized ranking")
    top_k: Optional[int] = Field(default=5, ge=1, le=25, description="Number of matching schemes to return")


class SchemeSearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SchemeSearchResultItem]


@router.post(
    "/search",
    response_model=SchemeSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="AI Semantic Scheme Search with Grounded Evidence"
)
def semantic_scheme_search(payload: SchemeSearchRequest) -> SchemeSearchResponse:
    """
    Executes local RAG vector retrieval over the official scheme knowledge base,
    returning ranked schemes with matched rules, grounded evidence clauses, and official source links.
    """
    retriever = get_rag_retriever()
    raw_results = retriever.search(
        query=payload.query,
        profile=payload.profile,
        top_k=payload.top_k or 5
    )

    items = [
        SchemeSearchResultItem(
            scheme=r["scheme"],
            relevance_score=r["relevance_score"],
            matched_rules=r["matched_rules"],
            evidence=r["evidence"],
            source=r["source"]
        )
        for r in raw_results
    ]

    return SchemeSearchResponse(
        query=payload.query,
        total_results=len(items),
        results=items
    )
