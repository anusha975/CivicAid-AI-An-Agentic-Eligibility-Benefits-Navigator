"""
CivicAid AI - Automated Tests for Module 5 Multi-Agent System
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.app.main import app


def test_multi_agent_system():
    client = TestClient(app)

    # Test 1: Complete Farmer Profile
    payload1 = {
        "profile": {
            "age": 42,
            "gender": "Male",
            "state": "Madhya Pradesh",
            "occupation": "Farmer",
            "annual_family_income": 120000,
            "social_category": "OBC",
            "has_agricultural_land": True
        },
        "query": "Looking for income support and agricultural welfare"
    }

    res1 = client.post("/api/agent/analyze", json=payload1)
    assert res1.status_code == 200, f"Expected 200, got {res1.status_code}"
    data1 = res1.json()

    # Validate output schema
    assert "summary" in data1
    assert "recommendations" in data1
    assert "eligibility" in data1
    assert "missing_information" in data1
    assert "documents" in data1
    assert "application_steps" in data1
    assert "evidence" in data1
    assert "sources" in data1

    # Check 4 status classifications
    valid_statuses = {"ELIGIBLE", "NOT_ELIGIBLE", "POSSIBLY_ELIGIBLE", "INSUFFICIENT_INFORMATION"}
    for item in data1["eligibility"]:
        assert item["status"] in valid_statuses, f"Invalid status: {item['status']}"
        assert 0 <= item["confidence_score"] <= 100
        assert len(item["reasons"]) > 0

    print("[PASS] Test 1: Full Farmer Profile analyzed successfully.")
    print("       Summary:", data1["summary"][:100], "...")
    print("       Eligible Schemes:", [e["scheme_name"] for e in data1["eligibility"] if e["status"] == "ELIGIBLE"])
    print("       Evidence Count:", len(data1["evidence"]))
    print("       Sources Count:", len(data1["sources"]))

    # Test 2: Incomplete Profile (Triggers INSUFFICIENT_INFORMATION / Questions)
    payload2 = {
        "profile": {
            "state": "Uttar Pradesh"
            # Missing age, gender, occupation, income, category
        },
        "query": "What schemes can I apply for?"
    }

    res2 = client.post("/api/agent/analyze", json=payload2)
    assert res2.status_code == 200
    data2 = res2.json()

    assert len(data2["missing_information"]) > 0
    print("\n[PASS] Test 2: Incomplete Profile detected missing information correctly.")
    print("       Missing Questions Count:", len(data2["missing_information"]))
    for q in data2["missing_information"][:3]:
        print("       -", q["field"], ":", q["question"])

    # Test 3: Student Scholarship Profile
    payload3 = {
        "profile": {
            "age": 20,
            "gender": "Female",
            "state": "Telangana",
            "occupation": "Student",
            "annual_family_income": 180000,
            "social_category": "SC"
        },
        "query": "I am an engineering student looking for scholarships"
    }

    res3 = client.post("/api/v1/agent/analyze", json=payload3)
    assert res3.status_code == 200
    data3 = res3.json()

    eligible_scholarships = [e for e in data3["eligibility"] if e["status"] == "ELIGIBLE"]
    assert len(eligible_scholarships) > 0
    print("\n[PASS] Test 3: Student Profile matched eligible scholarships:")
    for es in eligible_scholarships:
        print(f"       * {es['scheme_name']} (Confidence: {es['confidence_score']}%)")

    print("\n[ALL TESTS PASSED] Module 5 Multi-Agent Eligibility System verified 100%.")


if __name__ == "__main__":
    test_multi_agent_system()
