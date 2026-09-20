"""
CivicAid AI - Module 7 Test Suite: Document Readiness Checker
Tests document classification, requirement matching, field extraction, privacy masking,
and API endpoint validation.
"""
import sys
import os
import io

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from backend.documents.analyzer import DocumentAnalyzer
from fastapi.testclient import TestClient
from backend.app.main import app


def test_income_certificate_analysis():
    """Test classification and field extraction of an Income Certificate."""
    print("\n--- Test 1: Income Certificate Analysis ---")
    sample_text = """
    GOVERNMENT OF TELANGANA - REVENUE DEPARTMENT
    OFFICE OF THE TAHSILDAR, HYDERABAD URBAN
    INCOME CERTIFICATE
    Certificate No: IC-2025-982312
    This is to certify that Sri/Smt Ravi Kumar son of Ramesh Kumar, resident of Hyderabad,
    has an annual family income from all sources of Rs. 1,80,000 (Rupees One Lakh Eighty Thousand Only).
    Issued on 12-01-2025.
    """
    file_bytes = sample_text.encode("utf-8")
    filename = "Income_Certificate_2025.txt"
    required_docs = ["Aadhaar Card", "Income Certificate", "Bank Account details"]

    res = DocumentAnalyzer.analyze_document(file_bytes, filename, required_documents=required_docs)
    print(f"Detected Type: {res['document_type']}")
    print(f"Confidence: {res['confidence']}")
    print(f"Detected Fields: {res['detected_fields']}")
    print(f"Matched Requirement: {res['matched_requirement']}")

    assert res["document_type"] == "Income Certificate", f"Expected Income Certificate, got {res['document_type']}"
    assert res["confidence"] >= 0.70, f"Expected high confidence, got {res['confidence']}"
    assert res["matched_requirement"] == "Income Certificate", "Should match Income Certificate requirement"
    assert "1,80,000" in str(res["detected_fields"].get("stated_amount", "")), "Should extract stated amount"
    assert any("not be treated as officially verified" in w for w in res["warnings"]), "Must contain legal disclaimer"
    print("[SUCCESS] Test 1 passed!")


def test_aadhaar_card_masking():
    """Test Aadhaar identification and PII masking."""
    print("\n--- Test 2: Aadhaar Card Detection & PII Masking ---")
    sample_text = """
    Unique Identification Authority of India (UIDAI)
    Government of India
    Name: Ananya Sharma
    DOB: 14/08/2002
    Gender: Female
    9842 1290 8472
    Mera Aadhaar, Meri Pehchan
    """
    file_bytes = sample_text.encode("utf-8")
    filename = "Aadhaar_Document.pdf"
    required_docs = ["Aadhaar Card", "College / Student ID Card", "Income Certificate"]

    res = DocumentAnalyzer.analyze_document(file_bytes, filename, required_documents=required_docs)
    print(f"Detected Type: {res['document_type']}")
    print(f"Masked ID: {res['detected_fields'].get('masked_id')}")

    assert res["document_type"] == "Aadhaar Card", f"Expected Aadhaar Card, got {res['document_type']}"
    assert res["detected_fields"].get("masked_id") == "XXXX-XXXX-8472", "Aadhaar number must be masked"
    assert res["matched_requirement"] == "Aadhaar Card", "Should match Aadhaar requirement"
    print("[SUCCESS] Test 2 passed!")


def test_bank_passbook_analysis():
    """Test Bank Passbook recognition."""
    print("\n--- Test 3: Bank Passbook Identification ---")
    sample_text = """
    STATE BANK OF INDIA
    SAVINGS BANK PASSBOOK
    Account Number: 38921094812
    IFSC Code: SBIN0001234
    Branch: Hyderabad Main Branch
    Customer Name: Arjun Rao
    Aadhaar NPCI Seeding Status: Active
    """
    file_bytes = sample_text.encode("utf-8")
    filename = "Bank_Passbook.jpg"
    required_docs = ["Aadhaar Card", "Bank Account details linked with Aadhaar (NPCI mapped)"]

    res = DocumentAnalyzer.analyze_document(file_bytes, filename, required_documents=required_docs)
    print(f"Detected Type: {res['document_type']}")
    print(f"Matched Requirement: {res['matched_requirement']}")

    assert "Bank" in res["document_type"], f"Expected Bank document, got {res['document_type']}"
    assert res["matched_requirement"] == "Bank Account details linked with Aadhaar (NPCI mapped)"
    print("[SUCCESS] Test 3 passed!")


def test_documents_api_endpoint():
    """Test POST /api/documents/analyze via FastAPI TestClient."""
    print("\n--- Test 4: Document Analysis API Endpoint ---")
    client = TestClient(app)

    sample_content = b"COLLEGE STUDENT IDENTITY CARD - JNTU UNIVERSITY Roll No: 2024CSE101 Student Bonafide"
    response = client.post(
        "/api/documents/analyze",
        files={"file": ("student_id_card.txt", io.BytesIO(sample_content), "text/plain")},
        data={"required_documents": "Aadhaar Card,College / Student ID Card,Income Certificate"}
    )
    print(f"Status Code: {response.status_code}")
    data = response.json()
    print(f"Response: {data}")

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    assert data["document_type"] == "College ID / Student Bonafide"
    assert data["matched_requirement"] == "College / Student ID Card"
    assert len(data["warnings"]) >= 1
    print("[SUCCESS] Test 4 passed!")


if __name__ == "__main__":
    test_income_certificate_analysis()
    test_aadhaar_card_masking()
    test_bank_passbook_analysis()
    test_documents_api_endpoint()
    print("\n==================================================")
    print("ALL MODULE 7 DOCUMENT READINESS TESTS PASSED!")
    print("==================================================")
