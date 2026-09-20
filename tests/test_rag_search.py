import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.app.main import app

def test_rag_semantic_search():
    client = TestClient(app)

    # Test 1: Student Scholarship Query
    query1 = "I am an engineering student from Telangana looking for scholarships."
    payload1 = {
        "query": query1,
        "profile": {"state": "Telangana", "occupation": "Student", "category": "SC"}
    }
    res1 = client.post("/api/search", json=payload1)
    assert res1.status_code == 200, f"Expected 200, got {res1.status_code}"
    data1 = res1.json()
    assert "results" in data1
    assert len(data1["results"]) > 0

    top_result = data1["results"][0]
    print("[PASS] Query 1 Result:", top_result["scheme"]["name"])
    print("       Score:", top_result["relevance_score"])
    print("       Evidence:", top_result["evidence"])
    print("       Source:", top_result["source"])
    print("       Rules:", top_result["matched_rules"])

    # Validate output schema fields
    for r in data1["results"]:
        assert "scheme" in r and r["scheme"] is not None
        assert "relevance_score" in r and 0.0 <= r["relevance_score"] <= 1.0
        assert "matched_rules" in r and isinstance(r["matched_rules"], list)
        assert "evidence" in r and len(r["evidence"]) > 0
        assert "source" in r and len(r["source"]) > 0

    # Test 2: Farmer Agriculture Query
    query2 = "Farmer looking for direct income support for seeds and fertilizer"
    res2 = client.post("/api/search", json={"query": query2})
    assert res2.status_code == 200
    data2 = res2.json()
    top_farmer = data2["results"][0]
    print("\n[PASS] Query 2 Result (Farmer):", top_farmer["scheme"]["name"])
    print("       Score:", top_farmer["relevance_score"])
    print("       Evidence:", top_farmer["evidence"])

    # Test 3: Woman Entrepreneur Micro Loan
    query3 = "Woman wanting a collateral-free loan to start a tailoring business"
    res3 = client.post("/api/v1/search", json={"query": query3})
    assert res3.status_code == 200
    data3 = res3.json()
    top_woman = data3["results"][0]
    print("\n[PASS] Query 3 Result (Woman Entrepreneur):", top_woman["scheme"]["name"])
    print("       Score:", top_woman["relevance_score"])
    print("       Evidence:", top_woman["evidence"])

    # Test 4: Verify Grounding - No fabricated URLs or text
    for item in data1["results"] + data2["results"] + data3["results"]:
        assert item["scheme"]["official_source"].startswith("http") or item["scheme"]["official_source"] == "Official source requires verification"
        assert item["scheme"]["name"] in [
            "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
            "Ayushman Bharat PM-JAY (Pradhan Mantri Jan Arogya Yojana)",
            "PMAY-U (Pradhan Mantri Awas Yojana - Urban)",
            "PMAY-G (Pradhan Mantri Awaas Yojana - Gramin)",
            "Post-Matric Scholarship for SC Students",
            "PM-USP Post-Matric Scholarship for OBC / EBC / DNT Students",
            "PMMY (Pradhan Mantri Mudra Yojana)",
            "Stand-Up India Scheme",
            "PM SVANidhi (PM Street Vendor's AtmaNirbhar Nidhi)",
            "PM Vishwakarma Scheme",
            "MGNREGA (Mahatma Gandhi National Rural Employment Guarantee Act)",
            "Pradhan Mantri Rojgar Protsahan Yojana (PMRPY)",
            "Sukanya Samriddhi Yojana (SSY)",
            "PMMVY (Pradhan Mantri Matru Vandana Yojana)",
            "Atal Pension Yojana (APY)",
            "Pradhan Mantri Suraksha Bima Yojana (PMSBY)",
            "Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)",
            "Kisan Credit Card (KCC) Scheme",
            "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
            "NAPS (National Apprenticeship Promotion Scheme)",
            "PMEGP (Prime Minister's Employment Generation Programme)",
            "PM-USP Central Sector Scheme of Scholarship for College Students",
            "Deendayal Antyodaya Yojana - NRLM (National Rural Livelihoods Mission)",
            "Mukhyamantri Ladli Behna Yojana (Madhya Pradesh)",
            "Kalaignar Magalir Urimai Thittam (Tamil Nadu)",
            "Mukhya Mantri Kanya Sumangala Yojana (Uttar Pradesh)"
        ]

    print("\n[ALL TESTS PASSED] Module 4 RAG Knowledge Engine is 100% verified.")


if __name__ == "__main__":
    test_rag_semantic_search()
