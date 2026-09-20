"""
CivicAid AI - Module 8 Test Suite: Application Copilot
Tests application guide generation across 7 structured sections, 5 guided workflow steps,
official portal validation, and API endpoints.
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from backend.services.application_copilot import ApplicationCopilotService
from backend.app.repositories.scheme_repo import get_scheme_repository
from fastapi.testclient import TestClient
from backend.app.main import app


def test_pm_kisan_guide_generation():
    """Test Application Copilot generation for PM-KISAN."""
    print("\n--- Test 1: PM-KISAN Application Guide Generation ---")
    repo = get_scheme_repository()
    scheme = repo.get_by_id("pm-kisan")
    assert scheme is not None, "PM-KISAN scheme must exist"

    guide = ApplicationCopilotService.generate_guide(scheme)
    print(f"Scheme: {guide.scheme_name}")
    print(f"Eligibility Summary: {guide.eligibility_summary}")
    print(f"Workflow Steps: {[s.title for s in guide.guided_workflow]}")
    print(f"Official URL: {guide.official_application_source['url']}")

    # Check 7 Sections
    assert len(guide.eligibility_summary) > 20, "Eligibility summary must be populated"
    assert len(guide.required_documents_details) >= 2, "Required documents must be detailed"
    assert len(guide.step_by_step_process) == 5, "Should have 5 process steps"
    assert "https://pmkisan.gov.in" in guide.official_application_source["url"], "Official portal link verified"
    assert len(guide.what_information_to_prepare) >= 4, "Information to prepare must be populated"
    assert len(guide.common_missing_information) >= 3, "Common missing info & pitfalls must be populated"
    assert len(guide.final_checklist) >= 4, "Final checklist must be populated"

    # Check 5 Guided Steps
    assert len(guide.guided_workflow) == 5, "Must have exactly 5 guided steps"
    assert guide.guided_workflow[0].title == "Confirm Eligibility"
    assert guide.guided_workflow[1].title == "Prepare Documents"
    assert guide.guided_workflow[2].title == "Open Official Application Source"
    assert guide.guided_workflow[3].title == "Complete Application"
    assert guide.guided_workflow[4].title == "Save Acknowledgement / Reference Number"

    # Safety disclaimer check
    assert "DO NOT submit applications to government servers" in guide.disclaimer
    print("[SUCCESS] Test 1 passed!")


def test_scholarship_guide_generation():
    """Test Application Copilot generation for NSP Scholarship."""
    print("\n--- Test 2: Scholarship Application Guide Generation ---")
    repo = get_scheme_repository()
    scheme = repo.get_by_id("nsp-post-matric-sc") or repo.get_by_id("nsp-post-matric-obc")
    assert scheme is not None, "Scholarship scheme must exist"

    guide = ApplicationCopilotService.generate_guide(scheme)
    print(f"Scheme: {guide.scheme_name}")
    print(f"Official Source: {guide.official_application_source['source_name']}")

    assert "scholarships.gov.in" in guide.official_application_source["url"]
    assert any("Bonafide" in d.format_guide or "Marksheet" in d.format_guide for d in guide.required_documents_details)
    print("[SUCCESS] Test 2 passed!")


def test_application_guide_api_endpoint():
    """Test GET /api/schemes/{id}/application-guide endpoint."""
    print("\n--- Test 3: Application Guide API Endpoint ---")
    client = TestClient(app)

    response = client.get("/api/v1/schemes/pm-kisan/application-guide")
    print(f"Status Code: {response.status_code}")
    data = response.json()

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    assert data["scheme_id"] == "pm-kisan"
    assert len(data["step_by_step_process"]) == 5
    assert len(data["guided_workflow"]) == 5
    assert "official_application_source" in data
    print("[SUCCESS] Test 3 passed!")


if __name__ == "__main__":
    test_pm_kisan_guide_generation()
    test_scholarship_guide_generation()
    test_application_guide_api_endpoint()
    print("\n==================================================")
    print("ALL MODULE 8 APPLICATION COPILOT TESTS PASSED!")
    print("==================================================")
