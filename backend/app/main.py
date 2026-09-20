import time
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.logging_config import logger
from backend.app.api.v1.health import router as health_router
from backend.app.api.v1.schemes import router as schemes_router
from backend.app.api.v1.profile import router as profile_router
from backend.app.api.v1.search import router as search_router
from backend.app.api.v1.agent import router as agent_router
from backend.app.api.v1.documents import router as documents_router


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="CivicAid AI - An Agentic Eligibility & Benefits Navigator for Indian Citizens",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS configuration with regex reflection to support all cloud and preview domains
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_origin_regex=r".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    # Request Execution Timing & Correlation ID Middleware
    @app.middleware("http")
    async def process_time_middleware(request: Request, call_next):
        req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        start_time = time.time()

        response = await call_next(request)

        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.4f}s"
        response.headers["X-Request-ID"] = req_id

        # Structured request log
        if request.url.path not in ("/health", "/"):
            logger.info(
                f"{request.method} {request.url.path} completed in {process_time*1000:.2f}ms",
                extra={
                    "request_id": req_id,
                    "path": request.url.path,
                    "method": request.method,
                    "status_code": response.status_code,
                    "process_time_ms": round(process_time * 1000, 2)
                }
            )

        return response

    # Global Exception Handler Middleware
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        req_id = str(uuid.uuid4())
        logger.error(
            f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}",
            exc_info=True,
            extra={
                "request_id": req_id,
                "path": request.url.path,
                "method": request.method
            }
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal Server Error",
                "message": "An unexpected error occurred while processing your request.",
                "request_id": req_id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )

    # Include routers
    app.include_router(health_router)
    app.include_router(health_router, prefix="/api/v1")
    app.include_router(schemes_router, prefix="/api")
    app.include_router(schemes_router, prefix="/api/v1")
    
    # Mount profile router both at /api/profile and /api/v1/profile
    app.include_router(profile_router, prefix="/api/profile")
    app.include_router(profile_router, prefix="/api/v1/profile")

    # Mount semantic search router both at /api and /api/v1
    app.include_router(search_router, prefix="/api")
    app.include_router(search_router, prefix="/api/v1")

    # Mount multi-agent orchestrator router both at /api/agent and /api/v1/agent
    app.include_router(agent_router, prefix="/api/agent")
    app.include_router(agent_router, prefix="/api/v1/agent")

    # Mount document readiness router both at /api and /api/v1
    app.include_router(documents_router, prefix="/api")
    app.include_router(documents_router, prefix="/api/v1")

    @app.get("/")
    def root_endpoint():
        return {
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "online",
            "environment": settings.ENVIRONMENT,
            "documentation": "/docs",
            "health": "/health",
            "api_v1": "/api/v1",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    return app


app = create_application()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
