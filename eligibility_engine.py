"""
CivicAid AI - Module 6: Explainable Eligibility Engine
Deterministic rule evaluation layer that evaluates citizen profiles against government welfare schemes.

Interface:
Input:
    user_profile
    scheme

Output:
{
    "status": "ELIGIBLE" | "NOT_ELIGIBLE" | "POSSIBLY_ELIGIBLE" | "NEEDS_MORE_INFORMATION",
    "matched_conditions": [...],
    "failed_conditions": [...],
    "unknown_conditions": [...],
    "explanation": "..."
}
"""
from typing import Dict, Any, Union
from backend.rules.eligibility_engine import (
    ExplainableEligibilityEngine,
    ConditionEvaluation,
    EligibilityEvaluationResult,
    evaluate_eligibility as _backend_evaluate
)


def evaluate_eligibility(user_profile: Union[Dict[str, Any], Any], scheme: Union[Dict[str, Any], Any]) -> Dict[str, Any]:
    """
    Evaluates citizen profile against scheme deterministic rules.
    Returns:
    {
        "status": str,
        "matched_conditions": list,
        "failed_conditions": list,
        "unknown_conditions": list,
        "explanation": str
    }
    """
    return _backend_evaluate(user_profile, scheme)


# Alias for direct class usage
EligibilityEngine = ExplainableEligibilityEngine

if __name__ == "__main__":
    import json
    # Example direct CLI test
    sample_profile = {
        "name": "Ravi Kumar",
        "age": 21,
        "state": "Telangana",
        "occupation": "Student",
        "education_level": "Undergraduate B.Tech",
        "annual_family_income": None  # Missing income
    }
    sample_scheme = {
        "id": "post-matric-sc",
        "name": "Post Matric Scholarship for SC Students",
        "ministry": "Ministry of Social Justice and Empowerment",
        "category": "Scholarships",
        "state": "All India",
        "eligibility_rules": {
            "min_age": 16,
            "max_age": 35,
            "occupations": ["Student"],
            "social_categories": ["SC"],
            "education_criteria": "Post-Matriculation / Higher Secondary onwards",
            "max_annual_family_income": 250000
        }
    }
    result = evaluate_eligibility(sample_profile, sample_scheme)
    print(json.dumps(result, indent=2))
