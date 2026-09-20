"""
CivicAid AI - Deterministic Rule Evaluation Package
"""
from backend.rules.eligibility_engine import (
    ConditionEvaluation,
    EligibilityEvaluationResult,
    ExplainableEligibilityEngine
)

__all__ = [
    "ConditionEvaluation",
    "EligibilityEvaluationResult",
    "ExplainableEligibilityEngine"
]
