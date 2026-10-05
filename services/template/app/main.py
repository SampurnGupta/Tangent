"""Template service entry point with standard health and readiness endpoints."""

from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

from common.config import BaseAppSettings
from common.logging import get_logger, setup_logging
from common.middleware import RequestIdMiddleware
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse

settings = BaseAppSettings(service_name="tangent-template")
setup_logging(
    service_name=settings.service_name,
    log_level=settings.log_level,
    json_logs=settings.json_logs,
)
logger = get_logger(settings.service_name)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Service starting up: %s (env=%s)", settings.service_name, settings.app_env)
    yield
    logger.info("Service shutting down: %s", settings.service_name)


def create_app() -> FastAPI:
    app = FastAPI(
        title=f"Tangent — {settings.service_name}",
        description="Tangent portfolio service",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(RequestIdMiddleware)

    @app.get("/health", status_code=status.HTTP_200_OK, tags=["monitoring"])
    async def health() -> dict[str, Any]:
        """Liveness probe: verifies service process is running and accepting traffic."""
        return {
            "status": "ok",
            "service": settings.service_name,
            "env": settings.app_env,
        }

    @app.get("/ready", status_code=status.HTTP_200_OK, tags=["monitoring"])
    async def ready() -> JSONResponse:
        """Readiness probe: verifies service can reach required dependencies."""
        checks: dict[str, str] = {
            "service": "ok",
        }
        # In concrete services, verify DB / Redis / upstream connectivity here
        return JSONResponse(
            content={"status": "ready", "checks": checks},
            status_code=status.HTTP_200_OK,
        )

    return app


app = create_app()
