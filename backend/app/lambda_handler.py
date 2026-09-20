"""
CivicAid AI - AWS Lambda Mangum Handler (Module 9)
Adapter bridging ASGI FastAPI application to AWS Lambda and Amazon API Gateway HTTP API events.
"""
from backend.app.main import app

try:
    from mangum import Mangum
    # Initialize Mangum with lifespan turned off for fast serverless cold-start
    handler = Mangum(app, lifespan="off", api_gateway_base_path=None)
except ImportError:
    # Graceful fallback for local environments without mangum installed
    def handler(event, context):
        return {
            "statusCode": 500,
            "body": "Mangum library is not installed in local development. Install with: pip install mangum"
        }
