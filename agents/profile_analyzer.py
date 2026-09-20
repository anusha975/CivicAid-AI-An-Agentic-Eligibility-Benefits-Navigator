"""
CivicAid AI - Profile Analyzer Agent
First stage agent: Analyzes citizen profile inputs, normalizes demographic/socio-economic parameters,
and detects missing attributes without making assumptions.
"""
from typing import Dict, Any, List
from agents.base import BaseAgent


class ProfileAnalyzerAgent(BaseAgent):
    """
    Analyzes raw citizen profile data and natural language queries to extract normalized profile facts
    and formulate targeted clarification questions for unstated critical fields.
    """

    def __init__(self):
        super().__init__(
            name="Profile Analyzer Agent",
            description="Extracts normalized attributes, assesses data completeness, and flags information gaps."
        )

    def analyze_profile(self, profile: Dict[str, Any], query: str = "") -> Dict[str, Any]:
        """
        Normalizes profile fields and computes missing information items.
        """
        normalized = dict(profile or {})
        missing_fields: List[Dict[str, str]] = []

        # Check essential attributes for Indian welfare assessment
        age = normalized.get("age")
        if age is None or age == "":
            missing_fields.append({
                "field": "age",
                "importance": "High",
                "question": "What is the applicant's age? (Determines youth, adult, and senior citizen quotas)"
            })

        gender = normalized.get("gender")
        if not gender:
            missing_fields.append({
                "field": "gender",
                "importance": "Medium",
                "question": "What is the applicant's gender? (Identifies exclusive women/maternity programs)"
            })

        income = normalized.get("annual_family_income") or normalized.get("annual_income")
        if income is None or income == "":
            missing_fields.append({
                "field": "annual_family_income",
                "importance": "Critical",
                "question": "What is the approximate annual household income? (BPL/EWS ceiling verification)"
            })

        state = normalized.get("state")
        if not state:
            missing_fields.append({
                "field": "state",
                "importance": "High",
                "question": "Which State or Union Territory is the permanent residence of the citizen?"
            })

        occupation = normalized.get("occupation")
        if not occupation:
            missing_fields.append({
                "field": "occupation",
                "importance": "High",
                "question": "What is the applicant's primary livelihood or occupation? (e.g. Farmer, Student, Informal Worker, Artisan)"
            })

        category = normalized.get("social_category") or normalized.get("category")
        if not category:
            missing_fields.append({
                "field": "social_category",
                "importance": "Medium",
                "question": "What is the social category of the applicant? (General, OBC, SC, ST, EWS)"
            })

        # Calculate completeness ratio
        total_checks = 6
        provided = total_checks - len(missing_fields)
        completeness_pct = round((provided / total_checks) * 100)

        summary_text = (
            f"Citizen profile analyzed for resident of {state or 'All India'}. "
            f"Occupation: {occupation or 'Unspecified'}, Age: {age or 'Unspecified'}. "
            f"Profile data completeness: {completeness_pct}%."
        )

        return {
            "normalized_profile": normalized,
            "completeness_percentage": completeness_pct,
            "missing_fields": missing_fields,
            "summary": summary_text
        }

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        profile = context.get("profile", {})
        query = context.get("query", "")
        return self.analyze_profile(profile, query)
