from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, model_validator


class SchemeEligibilityRules(BaseModel):
    min_age: Optional[int] = Field(None, ge=0, le=120)
    max_age: Optional[int] = Field(None, ge=0, le=120)
    gender: Optional[str] = Field(None, description="All, Female, Male, Transgender")
    social_categories: Optional[List[str]] = Field(None, description="General, OBC, SC, ST, EWS")
    max_annual_family_income: Optional[int] = Field(None, ge=0, description="Income ceiling in INR")
    occupations: Optional[List[str]] = Field(None, description="Eligible occupations")
    area_type: Optional[str] = Field(None, description="Rural, Urban, Semi-Urban, All")
    education_criteria: Optional[str] = None
    landholding_criteria: Optional[str] = None
    housing_criteria: Optional[str] = None
    disability_required: Optional[bool] = None
    special_conditions: Optional[List[str]] = Field(default_factory=list)


class SchemeKnowledgeItem(BaseModel):
    """
    Standardized Government Scheme Knowledge Item.
    Conforms to Module 3 specification with verifiable official source attribution.
    """
    id: str = Field(..., description="Unique scheme slug (e.g. pm-kisan)")
    name: str = Field(..., description="Full official title of the scheme")
    ministry: str = Field(..., description="Nodal Ministry or State Department")
    category: str = Field(..., description="Primary welfare category")
    state: str = Field(default="All India", description="All India (Central) or specific State/UT")
    description: str = Field(..., description="Official overview of the program")
    target_beneficiaries: List[str] = Field(..., description="Target citizen groupings")
    eligibility_rules: Dict[str, Any] = Field(..., description="Structured eligibility conditions")
    required_documents: List[str] = Field(..., description="Mandatory certificates and proof documents")
    benefits: str = Field(..., description="Specific financial or in-kind assistance delivered")
    application_method: str = Field(..., description="Procedure to apply (Online, CSC, Bank, Portal)")
    official_source: str = Field(..., description="Verified official URL or 'Official source requires verification'")
    source_name: str = Field(..., description="Name of official portal or gazette")
    last_verified: str = Field(..., description="Date of latest verification (YYYY-MM-DD)")
    tags: List[str] = Field(default_factory=list, description="Keywords and tags")

    # Backward compatibility aliases for frontend UI consumers
    documents_required: Optional[List[str]] = None
    benefit_amount: Optional[str] = None
    official_url: Optional[str] = None
    level: Optional[str] = None

    @model_validator(mode="after")
    def populate_compatibility_fields(self):
        if not self.documents_required:
            self.documents_required = self.required_documents
        if not self.benefit_amount:
            self.benefit_amount = self.benefits
        if not self.official_url:
            self.official_url = self.official_source
        if not self.level:
            self.level = "Central" if self.state.strip().lower() in ("all india", "central", "national") else "State"
        return self


class SchemeSearchResponse(BaseModel):
    total: int
    query: Optional[str] = None
    category: Optional[str] = None
    state: Optional[str] = None
    schemes: List[SchemeKnowledgeItem]


class CategorySummaryItem(BaseModel):
    category: str
    count: int

