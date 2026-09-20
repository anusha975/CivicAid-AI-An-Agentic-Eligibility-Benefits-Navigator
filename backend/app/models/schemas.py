from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", description="Application status")
    version: str = Field(default="1.0.0", description="API version")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp")
    environment: str = Field(default="development")
    services: Dict[str, str] = Field(default_factory=dict)


class SchemeEligibility(BaseModel):
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    gender: Optional[str] = None
    occupations: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    max_annual_income: Optional[int] = None
    landholding: Optional[str] = None
    housing_status: Optional[str] = None
    target_group: Optional[str] = None
    exclusions: Optional[List[str]] = None


class Scheme(BaseModel):
    id: str
    name: str
    category: str
    level: str
    state: str
    benefit_amount: str
    description: str
    eligibility: SchemeEligibility
    documents_required: List[str]
    application_mode: str
    official_url: str
    tags: List[str] = []


class CitizenProfile(BaseModel):
    age: Optional[int] = Field(None, ge=0, le=120)
    gender: Optional[str] = Field(None, description="Male, Female, Other")
    state: Optional[str] = Field("All India", description="State or Union Territory")
    occupation: Optional[str] = Field(None, description="e.g. Farmer, Student, Informal Worker, Artisan")
    category: Optional[str] = Field(None, description="General, OBC, SC, ST, EWS")
    annual_income: Optional[int] = Field(None, ge=0, description="Annual household income in INR")
    landholding_acres: Optional[float] = Field(None, ge=0)
    owns_pucca_house: Optional[bool] = None


class EligibilityCheckRequest(BaseModel):
    profile: CitizenProfile
    scheme_ids: Optional[List[str]] = None


class SchemeMatchResult(BaseModel):
    scheme: Scheme
    is_eligible: bool
    match_score: int = Field(ge=0, le=100)
    reasons: List[str]
    missing_criteria: List[str] = []
    actionable_next_steps: List[str] = []


class EligibilityCheckResponse(BaseModel):
    total_scanned: int
    eligible_count: int
    matches: List[SchemeMatchResult]
