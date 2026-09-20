import json
import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Optional
from fastapi import APIRouter, HTTPException, status
from backend.app.core.config import settings
from backend.app.models.profile import (
    UserProfileInput,
    UserProfileNormalized,
    ProfileSaveResponse
)

router = APIRouter(tags=["User Profile Intelligence"])

# In-memory fast cache + persistent file storage
PROFILES_CACHE: Dict[str, UserProfileNormalized] = {}
PROFILES_DIR = os.path.join(settings.LOCAL_DATA_DIR, "profiles")
os.makedirs(PROFILES_DIR, exist_ok=True)


def compute_income_slab(income: int) -> str:
    """Classifies annual family income into standardized Indian welfare brackets."""
    if income <= 100000:
        return "Antyodaya / Ultra-Low Income (<= ₹1 Lakh)"
    elif income <= 250000:
        return "BPL / Lower Income Group (₹1L - ₹2.5 Lakhs)"
    elif income <= 500000:
        return "EWS / Low Income Group (₹2.5L - ₹5 Lakhs)"
    elif income <= 800000:
        return "Middle Income Group - I (₹5L - ₹8 Lakhs - Non-Creamy Layer Boundary)"
    elif income <= 1500000:
        return "Middle Income Group - II (₹8L - ₹15 Lakhs)"
    else:
        return "Higher Income Group (> ₹15 Lakhs)"


def normalize_profile(raw: UserProfileInput, profile_id: Optional[str] = None) -> UserProfileNormalized:
    """Transforms raw wizard inputs into a structured normalized schema."""
    now_iso = datetime.now(timezone.utc).isoformat()
    pid = profile_id or f"CA-PROF-{uuid.uuid4().hex[:8].upper()}"

    income_slab = compute_income_slab(raw.annual_family_income)

    return UserProfileNormalized(
        id=pid,
        created_at=now_iso,
        updated_at=now_iso,
        version="1.0.0",
        location={
            "state": raw.state.strip(),
            "district": raw.district.strip(),
            "area_type": raw.area_type.strip(),
        },
        demographics={
            "age": raw.age,
            "gender": raw.gender.strip(),
            "social_category": raw.social_category.strip(),
            "disability": {
                "status": raw.disability_status,
                "percentage": raw.disability_percentage if raw.disability_status else None
            }
        },
        socio_economic={
            "annual_family_income": raw.annual_family_income,
            "occupation": raw.occupation.strip(),
            "education_level": raw.education_level.strip(),
            "employment_status": raw.employment_status.strip()
        },
        special_circumstances=raw.special_circumstances,
        goals=raw.goals,
        income_slab=income_slab,
        is_minor=raw.age < 18,
        is_senior_citizen=raw.age >= 60,
        profile_completion_percentage=100
    )


def save_profile_to_disk(profile: UserProfileNormalized) -> None:
    """Persists normalized profile JSON to data/profiles directory."""
    file_path = os.path.join(PROFILES_DIR, f"{profile.id}.json")
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(profile.model_dump(), f, indent=2)


def load_profile_from_disk(profile_id: str) -> Optional[UserProfileNormalized]:
    """Retrieves profile JSON from disk if not found in memory cache."""
    file_path = os.path.join(PROFILES_DIR, f"{profile_id}.json")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return UserProfileNormalized(**data)
    return None


@router.post(
    "",
    response_model=ProfileSaveResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or update citizen profile"
)
def save_user_profile(payload: UserProfileInput) -> ProfileSaveResponse:
    """
    Ingests raw wizard input from citizen, validates all 13 attributes,
    normalizes data format, derives socio-economic categories, and persists the record.
    """
    try:
        normalized = normalize_profile(payload)
        
        # Save to memory and disk
        PROFILES_CACHE[normalized.id] = normalized
        save_profile_to_disk(normalized)

        return ProfileSaveResponse(
            success=True,
            message="Citizen profile normalized and stored successfully",
            profile=normalized
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Profile processing failed: {str(e)}"
        )


@router.get(
    "/{profile_id}",
    response_model=UserProfileNormalized,
    summary="Retrieve citizen profile by ID"
)
def get_user_profile(profile_id: str) -> UserProfileNormalized:
    """
    Fetches the normalized profile by unique ID (e.g. CA-PROF-XXXX).
    """
    # Check cache first
    if profile_id in PROFILES_CACHE:
        return PROFILES_CACHE[profile_id]

    # Check disk storage
    disk_profile = load_profile_from_disk(profile_id)
    if disk_profile:
        PROFILES_CACHE[profile_id] = disk_profile
        return disk_profile

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Profile with ID '{profile_id}' was not found"
    )
