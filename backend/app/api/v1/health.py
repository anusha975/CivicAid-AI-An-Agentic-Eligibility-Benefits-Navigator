from datetime import datetime, timezone
from fastapi import APIRouter
from backend.app.core.config import settings
from backend.app.models.schemas import HealthResponse

router = APIRouter(tags=["Health & Status"])


@router.get("/health", response_model=HealthResponse)
def get_health_status() -> HealthResponse:
    """
    Health check endpoint reporting API health, version, timestamp, and core service status.
    """
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
        environment=settings.ENVIRONMENT,
        services={
            "database": "connected" if settings.STORAGE_BACKEND == "local" else "aws_dynamodb_ready",
            "llm_provider": settings.LLM_PROVIDER,
            "aws_readiness": "configured" if settings.AWS_REGION else "pending",
        }
    )
