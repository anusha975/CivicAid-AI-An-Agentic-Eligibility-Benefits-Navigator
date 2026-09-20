from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class GenderEnum(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    TRANSGENDER = "Transgender"
    OTHER = "Other"
    PREFER_NOT_TO_SAY = "Prefer not to say"


class OccupationEnum(str, Enum):
    STUDENT = "Student"
    WORKING = "Working"
    UNEMPLOYED = "Unemployed"
    FARMER = "Farmer"
    ENTREPRENEUR = "Entrepreneur"
    OTHER = "Other"


class EducationLevelEnum(str, Enum):
    NO_FORMAL_EDUCATION = "No formal education"
    PRIMARY = "Primary (Up to 5th)"
    MIDDLE = "Middle School (6th - 8th)"
    SECONDARY = "Secondary / 10th Pass"
    HIGHER_SECONDARY = "Higher Secondary / 12th Pass"
    DIPLOMA = "Diploma / ITI / Vocational"
    GRADUATE = "Graduate / Bachelor's Degree"
    POST_GRADUATE = "Post Graduate / Master's / Doctorate"


class SocialCategoryEnum(str, Enum):
    GENERAL = "General"
    OBC = "OBC (Other Backward Classes)"
    SC = "SC (Scheduled Caste)"
    ST = "ST (Scheduled Tribe)"
    EWS = "EWS (Economically Weaker Section)"


class AreaTypeEnum(str, Enum):
    RURAL = "Rural"
    URBAN = "Urban"
    SEMI_URBAN = "Semi-Urban"


class EmploymentStatusEnum(str, Enum):
    SALARIED_PRIVATE = "Salaried (Private)"
    SALARIED_GOVERNMENT = "Salaried (Government / PSU)"
    SELF_EMPLOYED = "Self-Employed / Business"
    DAILY_WAGE_CASUAL = "Daily Wage / Casual Labor"
    AGRICULTURAL_LABOR = "Agricultural Labor"
    UNEMPLOYED = "Unemployed (Seeking Work)"
    STUDENT = "Student"
    HOMEMAKER = "Homemaker"
    RETIRED = "Retired / Pensioner"


class WelfareGoalEnum(str, Enum):
    SCHOLARSHIP = "scholarship"
    EDUCATION = "education"
    EMPLOYMENT = "employment"
    ENTREPRENEURSHIP = "entrepreneurship"
    AGRICULTURE = "agriculture"
    HOUSING = "housing"
    HEALTHCARE = "healthcare"
    FINANCIAL_ASSISTANCE = "financial assistance"


class UserProfileInput(BaseModel):
    """Raw user input from the multi-step Profile Wizard"""
    state: str = Field(..., min_length=2, description="Indian State or Union Territory")
    district: str = Field(..., min_length=2, description="District name")
    age: int = Field(..., ge=0, le=120, description="Age in years")
    gender: str = Field(..., description="Gender identity")
    occupation: str = Field(..., description="Primary occupational grouping")
    education_level: str = Field(..., description="Highest completed educational qualification")
    annual_family_income: int = Field(..., ge=0, description="Total annual family income in INR")
    social_category: str = Field(..., description="Social category (General/OBC/SC/ST/EWS)")
    disability_status: bool = Field(default=False, description="Person with disability (PwD)")
    disability_percentage: Optional[int] = Field(None, ge=0, le=100, description="Disability percentage if applicable")
    area_type: str = Field(..., description="Rural, Urban, or Semi-Urban")
    employment_status: str = Field(..., description="Current employment status")
    special_circumstances: List[str] = Field(default_factory=list, description="Special tags (e.g. Single Parent, Minority, BPL)")
    goals: List[str] = Field(default_factory=list, description="Target welfare benefits sought by citizen")

    @field_validator("state", "district")
    def strip_location_strings(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Location name must be at least 2 characters")
        return cleaned

    @field_validator("annual_family_income")
    def validate_income(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Annual income cannot be negative")
        return v


class UserProfileNormalized(BaseModel):
    """Normalized standardized profile ready for downstream AI agents"""
    id: str = Field(..., description="Unique CivicAid citizen profile identifier")
    created_at: str = Field(..., description="ISO 8601 UTC creation timestamp")
    updated_at: str = Field(..., description="ISO 8601 UTC update timestamp")
    version: str = Field(default="1.0.0")

    # Geographic Demographics
    location: dict = Field(..., description="Location hierarchy (state, district, area_type)")
    
    # Personal Identity
    demographics: dict = Field(..., description="Age, gender, social category, disability")

    # Socio-Economic & Work
    socio_economic: dict = Field(..., description="Income, occupation, employment status, education")

    # Tags & Preferences
    special_circumstances: List[str] = Field(default_factory=list)
    goals: List[str] = Field(default_factory=list)

    # Derived AI Matching Metadata
    income_slab: str = Field(..., description="Computed income bracket (e.g. Below Poverty Line, EWS, Low Income, Middle Income)")
    is_minor: bool = Field(..., description="True if age < 18")
    is_senior_citizen: bool = Field(..., description="True if age >= 60")
    profile_completion_percentage: int = Field(default=100)


class ProfileSaveResponse(BaseModel):
    success: bool
    message: str
    profile: UserProfileNormalized
