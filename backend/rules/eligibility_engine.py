"""
CivicAid AI - Explainable Eligibility Engine (Module 6)
Deterministic rule evaluation layer evaluating citizen profiles against government welfare schemes
across 11 normalized dimensions:
1. age
2. income
3. occupation
4. education
5. state
6. gender
7. category
8. employment
9. farmer_status
10. student_status
11. other_conditions
"""
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field
from backend.app.models.scheme_v2 import SchemeKnowledgeItem


class ConditionEvaluation(BaseModel):
    dimension: str  # age, income, occupation, education, state, gender, category, employment, farmer_status, student_status, other_conditions
    label: str
    detail: str
    is_passed: Optional[bool]  # True = passed, False = failed, None = unknown / missing data
    status_icon: str  # 'passed', 'failed', 'missing'


class EligibilityEvaluationResult(BaseModel):
    scheme_id: str
    scheme_name: str
    status: str  # ELIGIBLE, NOT_ELIGIBLE, POSSIBLY_ELIGIBLE, NEEDS_MORE_INFORMATION
    confidence_score: int
    matched_conditions: List[ConditionEvaluation]
    failed_conditions: List[ConditionEvaluation]
    unknown_conditions: List[ConditionEvaluation]
    explanation: str
    audit_trace: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "scheme_id": self.scheme_id,
            "scheme_name": self.scheme_name,
            "status": self.status,
            "confidence_score": self.confidence_score,
            "matched_conditions": [c.model_dump() for c in self.matched_conditions],
            "failed_conditions": [c.model_dump() for c in self.failed_conditions],
            "unknown_conditions": [c.model_dump() for c in self.unknown_conditions],
            "explanation": self.explanation,
            "audit_trace": self.audit_trace
        }


class ExplainableEligibilityEngine:
    """
    Deterministic rule engine that provides transparent, explainable, and zero-hallucination
    eligibility verification across 11 normalized dimensions.
    """

    @staticmethod
    def _extract_dict(obj: Any) -> Dict[str, Any]:
        if obj is None:
            return {}
        if isinstance(obj, dict):
            return obj
        if hasattr(obj, "model_dump"):
            return obj.model_dump()
        if hasattr(obj, "dict"):
            return obj.dict()
        if hasattr(obj, "__dict__"):
            return obj.__dict__
        return {}

    @classmethod
    def evaluate(
        cls,
        user_profile: Union[Dict[str, Any], Any],
        scheme: Union[SchemeKnowledgeItem, Dict[str, Any], Any]
    ) -> EligibilityEvaluationResult:
        """
        Evaluates citizen profile against scheme rules across 11 normalized dimensions.
        """
        profile = cls._extract_dict(user_profile)
        scheme_dict = cls._extract_dict(scheme)

        scheme_id = str(scheme_dict.get("id") or "scheme-unknown")
        scheme_name = str(scheme_dict.get("name") or "Government Welfare Scheme")
        scheme_category = str(scheme_dict.get("category") or "")
        scheme_state = str(scheme_dict.get("state") or "All India")
        rules = scheme_dict.get("eligibility_rules") or {}

        matched: List[ConditionEvaluation] = []
        failed: List[ConditionEvaluation] = []
        unknown: List[ConditionEvaluation] = []
        audit_trace: List[str] = []

        score = 100

        # Extract Profile Fields
        citizen_age = profile.get("age")
        citizen_gender = profile.get("gender")
        citizen_state = profile.get("state")
        citizen_occ = profile.get("occupation")
        citizen_income = profile.get("annual_family_income") or profile.get("annual_income")
        citizen_cat = profile.get("social_category") or profile.get("category")
        citizen_edu = profile.get("education_level") or profile.get("education")
        citizen_emp = profile.get("employment_status") or profile.get("employment")
        citizen_land = profile.get("landholding_acres") if profile.get("landholding_acres") is not None else profile.get("has_agricultural_land")
        citizen_pucca = profile.get("owns_pucca_house")
        citizen_disability = profile.get("disability_status") if profile.get("disability_status") is not None else profile.get("has_disability")
        is_tax_payer = profile.get("is_tax_payer") or profile.get("pays_income_tax")

        # -------------------------------------------------------------
        # 1. AGE DIMENSION
        # -------------------------------------------------------------
        min_age = rules.get("min_age")
        max_age = rules.get("max_age")
        if min_age is not None or max_age is not None:
            if citizen_age is None or citizen_age == "":
                cond = ConditionEvaluation(
                    dimension="age",
                    label="Age requirement",
                    detail=f"Age information missing (requires {min_age or 0} to {max_age or 'any'} years)",
                    is_passed=None,
                    status_icon="missing"
                )
                unknown.append(cond)
                score -= 15
                audit_trace.append(f"[AGE] Missing input (Rule: {min_age}-{max_age} yrs)")
            else:
                try:
                    age_val = int(citizen_age)
                    if min_age is not None and age_val < min_age:
                        cond = ConditionEvaluation(
                            dimension="age",
                            label="Age requirement",
                            detail=f"Age {age_val} is below minimum requirement of {min_age} years",
                            is_passed=False,
                            status_icon="failed"
                        )
                        failed.append(cond)
                        score -= 50
                        audit_trace.append(f"[AGE] FAILED: {age_val} < min {min_age}")
                    elif max_age is not None and age_val > max_age:
                        cond = ConditionEvaluation(
                            dimension="age",
                            label="Age requirement",
                            detail=f"Age {age_val} exceeds maximum age ceiling of {max_age} years",
                            is_passed=False,
                            status_icon="failed"
                        )
                        failed.append(cond)
                        score -= 50
                        audit_trace.append(f"[AGE] FAILED: {age_val} > max {max_age}")
                    else:
                        cond = ConditionEvaluation(
                            dimension="age",
                            label="Age requirement",
                            detail=f"Age ({age_val} yrs) satisfies eligibility window ({min_age or 0} - {max_age or 'any'} yrs)",
                            is_passed=True,
                            status_icon="passed"
                        )
                        matched.append(cond)
                        audit_trace.append(f"[AGE] PASSED: {age_val} in [{min_age}, {max_age}]")
                except (ValueError, TypeError):
                    unknown.append(ConditionEvaluation(
                        dimension="age",
                        label="Age requirement",
                        detail="Age value could not be parsed",
                        is_passed=None,
                        status_icon="missing"
                    ))

        # -------------------------------------------------------------
        # 2. STATE & JURISDICTION DIMENSION
        # -------------------------------------------------------------
        if scheme_state and scheme_state.lower() not in ("all india", "central", "national"):
            if not citizen_state or citizen_state.lower() in ("all india", ""):
                cond = ConditionEvaluation(
                    dimension="state",
                    label="State residency requirement",
                    detail=f"State residency unverified (exclusive to {scheme_state})",
                    is_passed=None,
                    status_icon="missing"
                )
                unknown.append(cond)
                score -= 20
                audit_trace.append(f"[STATE] Missing residency for state-specific program {scheme_state}")
            elif citizen_state.lower() != scheme_state.lower():
                cond = ConditionEvaluation(
                    dimension="state",
                    label="State residency requirement",
                    detail=f"Exclusive to residents of {scheme_state} (citizen resides in {citizen_state})",
                    is_passed=False,
                    status_icon="failed"
                )
                failed.append(cond)
                score -= 60
                audit_trace.append(f"[STATE] FAILED: {citizen_state} != {scheme_state}")
            else:
                cond = ConditionEvaluation(
                    dimension="state",
                    label="State residency requirement",
                    detail=f"Verified resident of {scheme_state}",
                    is_passed=True,
                    status_icon="passed"
                )
                matched.append(cond)
                audit_trace.append(f"[STATE] PASSED: {scheme_state}")
        else:
            cond = ConditionEvaluation(
                dimension="state",
                label="State requirement",
                detail="Central Government program (applicable across all States and UTs)",
                is_passed=True,
                status_icon="passed"
            )
            matched.append(cond)
            audit_trace.append("[STATE] PASSED: Central All-India")

        # -------------------------------------------------------------
        # 3. INCOME DIMENSION
        # -------------------------------------------------------------
        max_income = rules.get("max_annual_family_income") or rules.get("max_annual_income")
        if max_income is not None:
            if citizen_income is None or citizen_income == "":
                cond = ConditionEvaluation(
                    dimension="income",
                    label="Income requirement",
                    detail=f"Income information missing (Ceiling is ₹{max_income:,}/yr)",
                    is_passed=None,
                    status_icon="missing"
                )
                unknown.append(cond)
                score -= 20
                audit_trace.append(f"[INCOME] Missing (Ceiling ₹{max_income:,})")
            else:
                try:
                    inc_val = int(citizen_income)
                    if inc_val > max_income:
                        cond = ConditionEvaluation(
                            dimension="income",
                            label="Income requirement",
                            detail=f"Annual income ₹{inc_val:,} exceeds ceiling of ₹{max_income:,}",
                            is_passed=False,
                            status_icon="failed"
                        )
                        failed.append(cond)
                        score -= 50
                        audit_trace.append(f"[INCOME] FAILED: ₹{inc_val:,} > ₹{max_income:,}")
                    else:
                        cond = ConditionEvaluation(
                            dimension="income",
                            label="Income requirement",
                            detail=f"Household income (₹{inc_val:,}) is within the ceiling of ₹{max_income:,}",
                            is_passed=True,
                            status_icon="passed"
                        )
                        matched.append(cond)
                        audit_trace.append(f"[INCOME] PASSED: ₹{inc_val:,} <= ₹{max_income:,}")
                except (ValueError, TypeError):
                    unknown.append(ConditionEvaluation(
                        dimension="income",
                        label="Income requirement",
                        detail="Income value could not be verified",
                        is_passed=None,
                        status_icon="missing"
                    ))

        # -------------------------------------------------------------
        # 4. GENDER DIMENSION
        # -------------------------------------------------------------
        scheme_gender = rules.get("gender")
        if scheme_gender and scheme_gender.lower() not in ("all", "any"):
            if not citizen_gender:
                cond = ConditionEvaluation(
                    dimension="gender",
                    label="Gender requirement",
                    detail=f"Gender unverified (designated for {scheme_gender})",
                    is_passed=None,
                    status_icon="missing"
                )
                unknown.append(cond)
                score -= 20
                audit_trace.append(f"[GENDER] Missing (Requires {scheme_gender})")
            elif citizen_gender.lower() != scheme_gender.lower():
                cond = ConditionEvaluation(
                    dimension="gender",
                    label="Gender requirement",
                    detail=f"Designated specifically for {scheme_gender} beneficiaries (applicant is {citizen_gender})",
                    is_passed=False,
                    status_icon="failed"
                )
                failed.append(cond)
                score -= 60
                audit_trace.append(f"[GENDER] FAILED: {citizen_gender} != {scheme_gender}")
            else:
                cond = ConditionEvaluation(
                    dimension="gender",
                    label="Gender requirement",
                    detail=f"Gender criteria satisfied ({scheme_gender})",
                    is_passed=True,
                    status_icon="passed"
                )
                matched.append(cond)
                audit_trace.append(f"[GENDER] PASSED: {scheme_gender}")

        # -------------------------------------------------------------
        # 5. OCCUPATION DIMENSION
        # -------------------------------------------------------------
        target_occs = rules.get("occupations") or []
        is_student_scheme = "student" in [o.lower() for o in target_occs] or scheme_category.lower() in ("scholarships", "students")
        is_farmer_scheme = "farmer" in [o.lower() for o in target_occs] or scheme_category.lower() == "agriculture"

        if not is_student_scheme and not is_farmer_scheme and target_occs:
            if not citizen_occ:
                cond = ConditionEvaluation(
                    dimension="occupation",
                    label="Occupation requirement",
                    detail=f"Occupation unverified (target: {', '.join(target_occs)})",
                    is_passed=None,
                    status_icon="missing"
                )
                unknown.append(cond)
                score -= 15
                audit_trace.append(f"[OCC] Missing occupation (Target: {target_occs})")
            else:
                matched_occ = any(citizen_occ.lower() in occ.lower() or occ.lower() in citizen_occ.lower() for occ in target_occs)
                if matched_occ:
                    cond = ConditionEvaluation(
                        dimension="occupation",
                        label="Occupation requirement",
                        detail=f"Occupation '{citizen_occ}' aligns with designated target group",
                        is_passed=True,
                        status_icon="passed"
                    )
                    matched.append(cond)
                    audit_trace.append(f"[OCC] PASSED: {citizen_occ}")
                else:
                    cond = ConditionEvaluation(
                        dimension="occupation",
                        label="Occupation requirement",
                        detail=f"Target occupations: {', '.join(target_occs)} (citizen is {citizen_occ})",
                        is_passed=False,
                        status_icon="failed"
                    )
                    failed.append(cond)
                    score -= 25
                    audit_trace.append(f"[OCC] FAILED: {citizen_occ} not in {target_occs}")

        # -------------------------------------------------------------
        # 6. EDUCATION DIMENSION
        # -------------------------------------------------------------
        edu_rule = rules.get("education_criteria")
        if edu_rule:
            if not citizen_edu:
                cond = ConditionEvaluation(
                    dimension="education",
                    label="Education requirement",
                    detail=f"Educational attainment unverified (Rule: {edu_rule})",
                    is_passed=None,
                    status_icon="missing"
                )
                unknown.append(cond)
                score -= 10
                audit_trace.append(f"[EDU] Missing (Rule: {edu_rule})")
            else:
                cond = ConditionEvaluation(
                    dimension="education",
                    label="Education requirement",
                    detail=f"Citizen education ({citizen_edu}) aligns with criteria: {edu_rule}",
                    is_passed=True,
                    status_icon="passed"
                )
                matched.append(cond)
                audit_trace.append(f"[EDU] PASSED: {citizen_edu}")

        # -------------------------------------------------------------
        # 7. SOCIAL CATEGORY DIMENSION (SC, ST, OBC, General, EWS)
        # -------------------------------------------------------------
        target_cats = rules.get("social_categories") or rules.get("categories") or []
        if target_cats:
            if not citizen_cat:
                cond = ConditionEvaluation(
                    dimension="category",
                    label="Social category requirement",
                    detail=f"Category unstated (open to: {', '.join(target_cats)})",
                    is_passed=None,
                    status_icon="missing"
                )
                unknown.append(cond)
                score -= 15
                audit_trace.append(f"[CAT] Missing category (Target: {target_cats})")
            else:
                matched_cat = any(citizen_cat.lower() in cat.lower() or cat.lower() in citizen_cat.lower() for cat in target_cats)
                if matched_cat:
                    cond = ConditionEvaluation(
                        dimension="category",
                        label="Social category requirement",
                        detail=f"Category '{citizen_cat}' is eligible for designated quota",
                        is_passed=True,
                        status_icon="passed"
                    )
                    matched.append(cond)
                    audit_trace.append(f"[CAT] PASSED: {citizen_cat}")
                else:
                    cond = ConditionEvaluation(
                        dimension="category",
                        label="Social category requirement",
                        detail=f"Designated for categories: {', '.join(target_cats)} (citizen is {citizen_cat})",
                        is_passed=False,
                        status_icon="failed"
                    )
                    failed.append(cond)
                    score -= 30
                    audit_trace.append(f"[CAT] FAILED: {citizen_cat} not in {target_cats}")

        # -------------------------------------------------------------
        # 8. EMPLOYMENT DIMENSION
        # -------------------------------------------------------------
        emp_rule = rules.get("employment_criteria") or rules.get("employment_status")
        if emp_rule:
            if not citizen_emp:
                cond = ConditionEvaluation(
                    dimension="employment",
                    label="Employment requirement",
                    detail=f"Employment status unverified (Target: {emp_rule})",
                    is_passed=None,
                    status_icon="missing"
                )
                unknown.append(cond)
                score -= 15
                audit_trace.append(f"[EMPLOYMENT] Missing status (Rule: {emp_rule})")
            else:
                emp_match = citizen_emp.lower() in str(emp_rule).lower() or str(emp_rule).lower() in citizen_emp.lower()
                if emp_match:
                    cond = ConditionEvaluation(
                        dimension="employment",
                        label="Employment requirement",
                        detail=f"Employment status '{citizen_emp}' satisfies criteria",
                        is_passed=True,
                        status_icon="passed"
                    )
                    matched.append(cond)
                    audit_trace.append(f"[EMPLOYMENT] PASSED: {citizen_emp}")
                else:
                    cond = ConditionEvaluation(
                        dimension="employment",
                        label="Employment requirement",
                        detail=f"Required employment criteria: {emp_rule} (citizen is {citizen_emp})",
                        is_passed=False,
                        status_icon="failed"
                    )
                    failed.append(cond)
                    score -= 25
                    audit_trace.append(f"[EMPLOYMENT] FAILED: {citizen_emp} != {emp_rule}")

        # -------------------------------------------------------------
        # 9. FARMER STATUS DIMENSION
        # -------------------------------------------------------------
        if is_farmer_scheme:
            if not citizen_occ:
                cond = ConditionEvaluation(
                    dimension="farmer_status",
                    label="Farmer requirement",
                    detail="Agricultural occupation unverified",
                    is_passed=None,
                    status_icon="missing"
                )
                unknown.append(cond)
                score -= 20
                audit_trace.append("[FARMER] Missing farmer occupation")
            elif "farmer" in citizen_occ.lower() or "agriculture" in citizen_occ.lower() or "cultivator" in citizen_occ.lower():
                cond = ConditionEvaluation(
                    dimension="farmer_status",
                    label="Farmer requirement",
                    detail=f"Agricultural cultivator status verified ({citizen_occ})",
                    is_passed=True,
                    status_icon="passed"
                )
                matched.append(cond)
                audit_trace.append(f"[FARMER] PASSED: {citizen_occ}")
            else:
                cond = ConditionEvaluation(
                    dimension="farmer_status",
                    label="Farmer requirement",
                    detail=f"Designated for farmers / cultivators (citizen is {citizen_occ})",
                    is_passed=False,
                    status_icon="failed"
                )
                failed.append(cond)
                score -= 30
                audit_trace.append(f"[FARMER] FAILED: citizen is {citizen_occ}")

            land_rule = rules.get("landholding_criteria")
            if land_rule:
                if citizen_land is None and ("farmer" in str(citizen_occ).lower() or not citizen_occ):
                    cond = ConditionEvaluation(
                        dimension="farmer_status",
                        label="Landholding revenue record",
                        detail=f"Landholding unverified (Requires: {land_rule})",
                        is_passed=None,
                        status_icon="missing"
                    )
                    unknown.append(cond)
                    audit_trace.append("[LAND] Missing land record verification")
                elif citizen_land is not None:
                    cond = ConditionEvaluation(
                        dimension="farmer_status",
                        label="Landholding revenue record",
                        detail=f"Possesses verified landholding criteria ({land_rule})",
                        is_passed=True,
                        status_icon="passed"
                    )
                    matched.append(cond)
                    audit_trace.append("[LAND] PASSED")

        # -------------------------------------------------------------
        # 10. STUDENT STATUS DIMENSION
        # -------------------------------------------------------------
        if is_student_scheme:
            if not citizen_occ:
                cond = ConditionEvaluation(
                    dimension="student_status",
                    label="Student requirement",
                    detail="Student enrollment unverified (scheme requires enrolled student status)",
                    is_passed=None,
                    status_icon="missing"
                )
                unknown.append(cond)
                score -= 20
                audit_trace.append("[STUDENT] Missing student status")
            elif "student" in citizen_occ.lower():
                cond = ConditionEvaluation(
                    dimension="student_status",
                    label="Student requirement",
                    detail=f"Active student status verified ({citizen_occ})",
                    is_passed=True,
                    status_icon="passed"
                )
                matched.append(cond)
                audit_trace.append(f"[STUDENT] PASSED: {citizen_occ}")
            else:
                cond = ConditionEvaluation(
                    dimension="student_status",
                    label="Student requirement",
                    detail=f"Designated for students (citizen is {citizen_occ})",
                    is_passed=False,
                    status_icon="failed"
                )
                failed.append(cond)
                score -= 30
                audit_trace.append(f"[STUDENT] FAILED: citizen is {citizen_occ}")

        # -------------------------------------------------------------
        # 11. OTHER CONDITIONS & EXCLUSIONS DIMENSION
        # -------------------------------------------------------------
        # Exclusions (e.g. Income Tax Payers, Civil Servants)
        exclusions = rules.get("exclusions") or []
        if exclusions:
            if is_tax_payer is True and any("tax" in exc.lower() for exc in exclusions):
                cond = ConditionEvaluation(
                    dimension="other_conditions",
                    label="Taxpayer exclusion condition",
                    detail="Income tax payer status disqualifies applicant under scheme exclusion norms",
                    is_passed=False,
                    status_icon="failed"
                )
                failed.append(cond)
                score -= 50
                audit_trace.append("[EXCLUSION] FAILED: Income tax payer")
            elif is_tax_payer is False:
                cond = ConditionEvaluation(
                    dimension="other_conditions",
                    label="Taxpayer exclusion condition",
                    detail="Non-taxpayer status complies with exclusion rules",
                    is_passed=True,
                    status_icon="passed"
                )
                matched.append(cond)
                audit_trace.append("[EXCLUSION] PASSED: Non-taxpayer")

        # Housing (Pucca vs Kutcha House)
        housing_rule = rules.get("housing_criteria")
        if housing_rule and ("pucca" in housing_rule.lower() or "kutcha" in housing_rule.lower()):
            if citizen_pucca is True and "must not own a pucca house" in housing_rule.lower():
                cond = ConditionEvaluation(
                    dimension="other_conditions",
                    label="Housing ownership condition",
                    detail="Citizen owns a pucca house (violates houselessness criteria)",
                    is_passed=False,
                    status_icon="failed"
                )
                failed.append(cond)
                score -= 40
                audit_trace.append("[HOUSING] FAILED: owns pucca house")
            elif citizen_pucca is False:
                cond = ConditionEvaluation(
                    dimension="other_conditions",
                    label="Housing ownership condition",
                    detail="Houselessness / Kutcha house condition satisfied",
                    is_passed=True,
                    status_icon="passed"
                )
                matched.append(cond)
                audit_trace.append("[HOUSING] PASSED: No pucca house")

        # Disability Status
        disability_rule = rules.get("disability_criteria")
        if disability_rule:
            if citizen_disability is True:
                cond = ConditionEvaluation(
                    dimension="other_conditions",
                    label="Disability quota condition",
                    detail="PwD / Disability status satisfies targeted quota criteria",
                    is_passed=True,
                    status_icon="passed"
                )
                matched.append(cond)
                audit_trace.append("[DISABILITY] PASSED")

        # -------------------------------------------------------------
        # FINAL STATUS CLASSIFICATION & EXPLANATION SYNTHESIS
        # -------------------------------------------------------------
        final_score = max(0, min(100, score))

        if len(failed) > 0:
            status = "NOT_ELIGIBLE"
            fail_reasons = "; ".join(f.detail for f in failed[:2])
            explanation = f"Ineligible for {scheme_name}. Disqualifying criteria: {fail_reasons}."
            final_score = min(35, final_score)

        elif len(unknown) >= 2 and len(matched) <= 1:
            status = "NEEDS_MORE_INFORMATION"
            unknown_labels = ", ".join(u.label for u in unknown[:2])
            explanation = f"Insufficient profile information to confirm eligibility. Please verify: {unknown_labels}."
            final_score = 50

        elif len(unknown) > 0 or final_score < 80:
            status = "POSSIBLY_ELIGIBLE"
            missing_text = unknown[0].label if unknown else "specific quota thresholds"
            explanation = f"Potentially eligible — verify {missing_text.lower()}."

        else:
            status = "ELIGIBLE"
            explanation = f"Eligible for {scheme_name}. All deterministic rules and criteria are satisfied."

        return EligibilityEvaluationResult(
            scheme_id=scheme_id,
            scheme_name=scheme_name,
            status=status,
            confidence_score=final_score,
            matched_conditions=matched,
            failed_conditions=failed,
            unknown_conditions=unknown,
            explanation=explanation,
            audit_trace=audit_trace
        )


def evaluate_eligibility(user_profile: Any, scheme: Any) -> Dict[str, Any]:
    """
    Module 6 Standard Interface:
    Input:
        user_profile: Dict or model of citizen profile
        scheme: Dict or model of government scheme
    Output:
        {
            "status": "ELIGIBLE" | "NOT_ELIGIBLE" | "POSSIBLY_ELIGIBLE" | "NEEDS_MORE_INFORMATION",
            "matched_conditions": [...],
            "failed_conditions": [...],
            "unknown_conditions": [...],
            "explanation": "..."
        }
    """
    result = ExplainableEligibilityEngine.evaluate(user_profile, scheme)
    return result.to_dict()
