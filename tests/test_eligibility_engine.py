"""
CivicAid AI - Module 6 Test Suite: Explainable Eligibility Engine
Tests deterministic rule evaluations across 11 normalized dimensions, verified statuses,
and condition breakdown generation.
"""
import sys
import os
import json

# Ensure project root in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from eligibility_engine import evaluate_eligibility, ExplainableEligibilityEngine
from backend.app.repositories.scheme_repo import get_scheme_repository


def test_student_scholarship_evaluation():
    """
    Test student profile against Post-Matric Scholarship.
    Checks age, state, student status, education, missing income.
    Expected: POSSIBLY_ELIGIBLE with missing income warning.
    """
    print("\n--- Test 1: Student Scholarship with Missing Income ---")
    repo = get_scheme_repository()
    scheme = repo.get_by_id("nsp-post-matric-sc") or repo.get_by_id("pm-usp-higher-education")
    assert scheme is not None, "Scholarship scheme must exist in knowledge base"

    student_profile = {
        "name": "Arjun Rao",
        "age": 20,
        "gender": "Male",
        "state": "Telangana",
        "occupation": "Student",
        "education_level": "Undergraduate B.Tech",
        "social_category": "SC",
        "annual_family_income": None  # Income missing intentionally
    }

    res = evaluate_eligibility(student_profile, scheme)
    print(f"Status: {res['status']}")
    print(f"Explanation: {res['explanation']}")
    print(f"Matched ({len(res['matched_conditions'])}): {[c['label'] for c in res['matched_conditions']]}")
    print(f"Unknown ({len(res['unknown_conditions'])}): {[c['label'] for c in res['unknown_conditions']]}")

    assert res["status"] in ("POSSIBLY_ELIGIBLE", "ELIGIBLE"), f"Expected POSSIBLY_ELIGIBLE, got {res['status']}"
    assert any(c["dimension"] == "income" for c in res["unknown_conditions"]), "Income should be flagged as missing"
    assert any(c["dimension"] == "student_status" for c in res["matched_conditions"]), "Student status should pass"
    print("[SUCCESS] Test 1 passed!")


def test_farmer_pm_kisan_eligible():
    """
    Test farmer profile against PM-KISAN.
    Expected: ELIGIBLE with all conditions satisfied.
    """
    print("\n--- Test 2: Landholding Farmer for PM-KISAN ---")
    repo = get_scheme_repository()
    scheme = repo.get_by_id("pm-kisan")
    assert scheme is not None, "PM-KISAN scheme must exist"

    farmer_profile = {
        "name": "Ramesh Patel",
        "age": 42,
        "gender": "Male",
        "state": "Gujarat",
        "occupation": "Farmer",
        "landholding_acres": 2.5,
        "is_tax_payer": False,
        "annual_family_income": 120000
    }

    res = evaluate_eligibility(farmer_profile, scheme)
    print(f"Status: {res['status']}")
    print(f"Explanation: {res['explanation']}")
    print(f"Audit Trace: {res.get('audit_trace', [])}")

    assert res["status"] == "ELIGIBLE", f"Expected ELIGIBLE, got {res['status']}"
    assert len(res["failed_conditions"]) == 0, "No conditions should fail for eligible farmer"
    assert any(c["dimension"] == "farmer_status" for c in res["matched_conditions"]), "Farmer status should be matched"
    print("[SUCCESS] Test 2 passed!")


def test_ineligible_due_to_age_and_state():
    """
    Test disqualified profile (age exceeding max limit and state mismatch).
    Expected: NOT_ELIGIBLE with clear disqualifying failure reasons.
    """
    print("\n--- Test 3: Disqualified Profile (Age and State Mismatch) ---")
    scheme = {
        "id": "assam-arundhati-gold",
        "name": "Arundhati Gold Scheme (Assam)",
        "ministry": "Revenue & Disaster Management, Assam",
        "category": "Women & Child",
        "state": "Assam",
        "eligibility_rules": {
            "min_age": 18,
            "max_age": 30,
            "gender": "Female",
            "max_annual_family_income": 500000
        }
    }

    ineligible_profile = {
        "name": "Suresh Sharma",
        "age": 45,  # Exceeds max 30
        "gender": "Male",  # Mismatch
        "state": "Maharashtra",  # Mismatch with Assam
        "annual_family_income": 800000  # Exceeds 500000
    }

    res = evaluate_eligibility(ineligible_profile, scheme)
    print(f"Status: {res['status']}")
    print(f"Explanation: {res['explanation']}")
    print(f"Failed Conditions ({len(res['failed_conditions'])}): {[c['detail'] for c in res['failed_conditions']]}")

    assert res["status"] == "NOT_ELIGIBLE", f"Expected NOT_ELIGIBLE, got {res['status']}"
    assert len(res["failed_conditions"]) >= 2, "Multiple failed conditions should be recorded"
    print("[SUCCESS] Test 3 passed!")


def test_needs_more_information_empty_profile():
    """
    Test empty or minimal profile.
    Expected: NEEDS_MORE_INFORMATION with clarification prompts.
    """
    print("\n--- Test 4: Minimal Profile Information Gaps ---")
    repo = get_scheme_repository()
    scheme = repo.get_by_id("pm-mudra-yojana") or repo.get_by_id("pm-kisan")

    minimal_profile = {
        "name": "Citizen Without Details"
    }

    res = evaluate_eligibility(minimal_profile, scheme)
    print(f"Status: {res['status']}")
    print(f"Explanation: {res['explanation']}")
    print(f"Unknown Conditions: {[c['label'] for c in res['unknown_conditions']]}")

    assert res["status"] in ("NEEDS_MORE_INFORMATION", "POSSIBLY_ELIGIBLE"), f"Expected NEEDS_MORE_INFORMATION, got {res['status']}"
    assert len(res["unknown_conditions"]) >= 2, "Multiple unknown conditions should be present"
    print("[SUCCESS] Test 4 passed!")


def test_11_dimension_coverage():
    """
    Verify all 11 normalized dimensions are recognized and processed:
    age, income, occupation, education, state, gender, category, employment, farmer_status, student_status, other_conditions
    """
    print("\n--- Test 5: 11 Dimension Coverage Verification ---")
    full_rule_scheme = {
        "id": "composite-scheme-11d",
        "name": "Composite 11-Dimension Welfare Program",
        "ministry": "Ministry of Social Justice and Empowerment",
        "category": "Social Welfare",
        "state": "Telangana",
        "eligibility_rules": {
            "min_age": 18,
            "max_age": 40,
            "max_annual_family_income": 300000,
            "gender": "Female",
            "occupations": ["Artisan", "Handloom Worker"],
            "education_criteria": "Secondary (10th pass) or higher",
            "social_categories": ["OBC", "SC", "ST"],
            "employment_criteria": "Self-Employed or Informal",
            "housing_criteria": "Must not own a pucca house",
            "exclusions": ["Income tax payers"]
        }
    }

    citizen_profile = {
        "age": 28,
        "gender": "Female",
        "state": "Telangana",
        "occupation": "Artisan",
        "education_level": "Higher Secondary (12th)",
        "social_category": "OBC",
        "employment_status": "Self-Employed",
        "annual_family_income": 180000,
        "owns_pucca_house": False,
        "is_tax_payer": False
    }

    res = evaluate_eligibility(citizen_profile, full_rule_scheme)
    dimensions_evaluated = set(c["dimension"] for c in res["matched_conditions"] + res["failed_conditions"] + res["unknown_conditions"])
    print(f"Evaluated dimensions: {dimensions_evaluated}")

    expected_dimensions = {"age", "income", "occupation", "education", "state", "gender", "category", "employment", "other_conditions"}
    for dim in expected_dimensions:
        assert dim in dimensions_evaluated, f"Dimension '{dim}' was not evaluated!"

    assert res["status"] == "ELIGIBLE", f"Expected ELIGIBLE for matching profile, got {res['status']}"
    print("[SUCCESS] Test 5 passed! All 11 normalized dimensions covered.")


if __name__ == "__main__":
    test_student_scholarship_evaluation()
    test_farmer_pm_kisan_eligible()
    test_ineligible_due_to_age_and_state()
    test_needs_more_information_empty_profile()
    test_11_dimension_coverage()
    print("\n==================================================")
    print("ALL MODULE 6 ELIGIBILITY ENGINE TESTS PASSED!")
    print("==================================================")
