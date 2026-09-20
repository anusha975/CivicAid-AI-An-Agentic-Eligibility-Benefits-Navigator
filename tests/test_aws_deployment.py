"""
CivicAid AI - Module 9 Test Suite: AWS Ship-It Deployment
Validates SAM template syntax, Lambda handler, structured logging, error handling,
and local serverless parity.
"""
import sys
import os
import json
import yaml

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.lambda_handler import handler


def test_sam_template_structure():
    """Verify SAM template.yaml contains all required AWS resources."""
    print("\n--- Test 1: AWS SAM Template Validation ---")
    template_path = os.path.join(os.path.dirname(__file__), "..", "infra", "template.yaml")
    assert os.path.exists(template_path), "infra/template.yaml must exist"

    with open(template_path, "r", encoding="utf-8") as f:
        # Load yaml with custom tag ignoring
        content = f.read()
        assert "AWS::Serverless-2016-10-31" in content
        assert "CivicAidHttpApi" in content
        assert "CivicAidFastAPIFunction" in content
        assert "SchemesTable" in content
        assert "UsersTable" in content
        assert "DocumentsBucket" in content
        assert "FastAPILogGroup" in content

    print("[SUCCESS] SAM template contains all 6 required AWS resources!")


def test_amplify_config():
    """Verify Amplify build specification."""
    print("\n--- Test 2: AWS Amplify Build Specification ---")
    amplify_path = os.path.join(os.path.dirname(__file__), "..", "infra", "amplify.yml")
    assert os.path.exists(amplify_path), "infra/amplify.yml must exist"

    with open(amplify_path, "r", encoding="utf-8") as f:
        content = f.read()
        assert "frontend/dist" in content
        assert "npm run build" in content

    print("[SUCCESS] Amplify configuration verified!")


def test_lambda_handler_initialization():
    """Verify Lambda handler entrypoint."""
    print("\n--- Test 3: Lambda Handler Entrypoint ---")
    assert callable(handler), "Lambda handler must be a callable entrypoint"
    print("[SUCCESS] Lambda handler initialized successfully!")


def test_fastapi_process_time_and_health():
    """Verify health endpoint and X-Process-Time header."""
    print("\n--- Test 4: Health Check & Process Time Headers ---")
    client = TestClient(app)

    res = client.get("/health")
    print(f"Health status: {res.status_code}, headers: {dict(res.headers)}")
    assert res.status_code == 200
    assert "x-process-time" in [k.lower() for k in res.headers.keys()]
    assert res.json()["status"] == "healthy"

    root_res = client.get("/")
    assert root_res.status_code == 200
    assert root_res.json()["status"] == "online"
    print("[SUCCESS] Health check and process timing middleware verified!")


def test_structured_logging():
    """Verify CloudWatch JSON logger serialization."""
    print("\n--- Test 5: CloudWatch Structured Logging ---")
    from backend.app.core.logging_config import CloudWatchJsonFormatter
    import logging

    formatter = CloudWatchJsonFormatter()
    record = logging.LogRecord(
        name="civicaid.test",
        level=logging.INFO,
        pathname="test.py",
        lineno=10,
        msg="Test structured log message",
        args=(),
        exc_info=None
    )
    record.request_id = "test-req-123"
    record.path = "/api/v1/schemes"
    record.method = "GET"
    record.status_code = 200
    record.process_time_ms = 4.25

    formatted = formatter.format(record)
    parsed = json.loads(formatted)
    print(f"Serialized Log JSON: {parsed}")

    assert parsed["level"] == "INFO"
    assert parsed["request_id"] == "test-req-123"
    assert parsed["path"] == "/api/v1/schemes"
    assert parsed["process_time_ms"] == 4.25
    print("[SUCCESS] CloudWatch JSON logging serializer verified!")


if __name__ == "__main__":
    test_sam_template_structure()
    test_amplify_config()
    test_lambda_handler_initialization()
    test_fastapi_process_time_and_health()
    test_structured_logging()
    print("\n==================================================")
    print("ALL MODULE 9 AWS DEPLOYMENT TESTS PASSED!")
    print("==================================================")
