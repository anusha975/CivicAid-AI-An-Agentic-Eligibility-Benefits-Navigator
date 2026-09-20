"""
CivicAid AI - Document Readiness API Router (Module 7)
Provides POST /api/documents/analyze endpoint to inspect uploaded certificates (PDF / Images),
classify Indian document categories, match scheme prerequisites, and return explainable readiness advice.
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel, Field
from backend.documents.analyzer import DocumentAnalyzer
from backend.app.repositories.scheme_repo import get_scheme_repository

router = APIRouter(prefix="/documents", tags=["Document Readiness Checker"])


class DocumentAnalysisResponse(BaseModel):
    document_type: str = Field(..., description="Identified document category")
    detected_fields: Dict[str, Any] = Field(default_factory=dict, description="Extracted non-sensitive document metadata")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score of classification")
    matched_requirement: Optional[str] = Field(None, description="Matched scheme required document string")
    warnings: List[str] = Field(default_factory=list, description="Ethical & legal non-verification disclaimers")


@router.post(
    "/analyze",
    response_model=DocumentAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Uploaded Sample Document"
)
async def analyze_uploaded_document(
    file: UploadFile = File(..., description="PDF or Image file to analyze"),
    scheme_id: Optional[str] = Form(None, description="Optional scheme ID for requirement alignment"),
    required_documents: Optional[str] = Form(None, description="Optional comma-separated list of required documents")
) -> DocumentAnalysisResponse:
    """
    Accepts PDF, JPG, PNG, WEBP files and deterministically identifies document type,
    masks sensitive IDs, matches against scheme requirements, and provides readiness advice.
    """
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided.")

    allowed_exts = (".pdf", ".jpg", ".jpeg", ".png", ".webp", ".txt")
    if not any(file.filename.lower().endswith(ext) for ext in allowed_exts):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format. Supported formats: {', '.join(allowed_exts)}"
        )

    # Read file content safely (max 10MB)
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds maximum allowable limit of 10MB."
        )

    req_list: List[str] = []
    if required_documents:
        req_list = [r.strip() for r in required_documents.split(",") if r.strip()]
    elif scheme_id:
        repo = get_scheme_repository()
        scheme = repo.get_by_id(scheme_id)
        if scheme and scheme.required_documents:
            req_list = scheme.required_documents

    analysis = DocumentAnalyzer.analyze_document(
        file_bytes=file_bytes,
        filename=file.filename,
        scheme_id=scheme_id,
        required_documents=req_list
    )

    return DocumentAnalysisResponse(**analysis)
