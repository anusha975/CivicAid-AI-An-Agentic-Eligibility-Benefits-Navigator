"""
CivicAid AI - Scheme Knowledge Chunker
Decomposes structured SchemeKnowledgeItem objects into semantic, indexable text passages.
"""
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from backend.app.models.scheme_v2 import SchemeKnowledgeItem


class SchemeChunk(BaseModel):
    """Represents a focused, semantic segment of a government welfare scheme."""
    chunk_id: str
    scheme_id: str
    scheme_name: str
    chunk_type: str  # 'overview', 'benefits', 'eligibility', 'target_group', 'documents', 'application'
    text: str
    category: str
    state: str
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


def format_eligibility_text(rules: Dict[str, Any]) -> str:
    """Converts structured eligibility rules dictionary into natural language passage."""
    clauses = []
    if "min_age" in rules and rules["min_age"] is not None:
        clauses.append(f"Minimum age requirement is {rules['min_age']} years")
    if "max_age" in rules and rules["max_age"] is not None:
        clauses.append(f"Maximum age limit is {rules['max_age']} years")
    if "gender" in rules and rules["gender"]:
        clauses.append(f"Designated for {rules['gender']} beneficiaries")
    if "social_categories" in rules and rules["social_categories"]:
        clauses.append(f"Eligible social categories: {', '.join(rules['social_categories'])}")
    if "occupations" in rules and rules["occupations"]:
        clauses.append(f"Target occupations: {', '.join(rules['occupations'])}")
    if "max_annual_family_income" in rules and rules["max_annual_family_income"] is not None:
        clauses.append(f"Annual household income ceiling: ₹{rules['max_annual_family_income']:,}")
    if "area_type" in rules and rules["area_type"]:
        clauses.append(f"Applicable area type: {rules['area_type']}")
    if "landholding_criteria" in rules and rules["landholding_criteria"]:
        clauses.append(f"Landholding: {rules['landholding_criteria']}")
    if "housing_criteria" in rules and rules["housing_criteria"]:
        clauses.append(f"Housing condition: {rules['housing_criteria']}")
    if "education_criteria" in rules and rules["education_criteria"]:
        clauses.append(f"Educational criteria: {rules['education_criteria']}")
    if "criteria" in rules and rules["criteria"]:
        clauses.append(f"General criteria: {rules['criteria']}")
    if "exclusions" in rules and rules["exclusions"]:
        clauses.append(f"Exclusions: {', '.join(rules['exclusions'])}")

    return "; ".join(clauses) if clauses else "Standard welfare eligibility criteria apply."


def chunk_scheme(scheme: SchemeKnowledgeItem) -> List[SchemeChunk]:
    """
    Generates granular semantic chunks from a SchemeKnowledgeItem for multi-field vector indexing.
    """
    chunks: List[SchemeChunk] = []
    base_meta = {
        "ministry": scheme.ministry,
        "official_source": scheme.official_source,
        "source_name": scheme.source_name,
        "last_verified": scheme.last_verified,
    }

    # 1. Overview Chunk
    overview_text = (
        f"{scheme.name}. Category: {scheme.category}. State: {scheme.state}. "
        f"Nodal Ministry: {scheme.ministry}. Description: {scheme.description}"
    )
    chunks.append(
        SchemeChunk(
            chunk_id=f"{scheme.id}-overview",
            scheme_id=scheme.id,
            scheme_name=scheme.name,
            chunk_type="overview",
            text=overview_text,
            category=scheme.category,
            state=scheme.state,
            tags=scheme.tags,
            metadata={**base_meta, "field": "description"}
        )
    )

    # 2. Benefits Chunk
    benefits_text = f"{scheme.name} Benefits & Assistance: {scheme.benefits}"
    chunks.append(
        SchemeChunk(
            chunk_id=f"{scheme.id}-benefits",
            scheme_id=scheme.id,
            scheme_name=scheme.name,
            chunk_type="benefits",
            text=benefits_text,
            category=scheme.category,
            state=scheme.state,
            tags=scheme.tags,
            metadata={**base_meta, "field": "benefits"}
        )
    )

    # 3. Target Beneficiaries Chunk
    beneficiaries_text = (
        f"{scheme.name} Target Groups: {', '.join(scheme.target_beneficiaries)}. "
        f"Keywords: {', '.join(scheme.tags)}"
    )
    chunks.append(
        SchemeChunk(
            chunk_id=f"{scheme.id}-target",
            scheme_id=scheme.id,
            scheme_name=scheme.name,
            chunk_type="target_group",
            text=beneficiaries_text,
            category=scheme.category,
            state=scheme.state,
            tags=scheme.tags,
            metadata={**base_meta, "field": "target_beneficiaries"}
        )
    )

    # 4. Eligibility Rules Chunk
    eligibility_str = format_eligibility_text(scheme.eligibility_rules)
    eligibility_text = f"{scheme.name} Eligibility Criteria: {eligibility_str}"
    chunks.append(
        SchemeChunk(
            chunk_id=f"{scheme.id}-eligibility",
            scheme_id=scheme.id,
            scheme_name=scheme.name,
            chunk_type="eligibility",
            text=eligibility_text,
            category=scheme.category,
            state=scheme.state,
            tags=scheme.tags,
            metadata={**base_meta, "field": "eligibility_rules"}
        )
    )

    # 5. Documents & Application Chunk
    docs_text = (
        f"{scheme.name} Application & Documents. Required Documents: {', '.join(scheme.required_documents)}. "
        f"Application Process: {scheme.application_method}"
    )
    chunks.append(
        SchemeChunk(
            chunk_id=f"{scheme.id}-application",
            scheme_id=scheme.id,
            scheme_name=scheme.name,
            chunk_type="application",
            text=docs_text,
            category=scheme.category,
            state=scheme.state,
            tags=scheme.tags,
            metadata={**base_meta, "field": "application_method"}
        )
    )

    return chunks


def chunk_schemes(schemes: List[SchemeKnowledgeItem]) -> List[SchemeChunk]:
    """Generates all chunks across a list of schemes."""
    all_chunks = []
    for s in schemes:
        all_chunks.extend(chunk_scheme(s))
    return all_chunks
