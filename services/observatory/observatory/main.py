"""LLM Observatory and MetaBot FastAPI microservice."""

from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

from common.config import BaseAppSettings
from common.logging import get_logger, setup_logging
from common.middleware import RequestIdMiddleware
from common.redis_client import get_redis_client
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from observatory.metabot import MetaBotEngine
from observatory.metrics import ObservatoryService

settings = BaseAppSettings(service_name="tangent-observatory")
setup_logging(
    service_name=settings.service_name,
    log_level=settings.log_level,
    json_logs=settings.json_logs,
)
logger = get_logger(settings.service_name)


class MetaBotChatRequest(BaseModel):
    message: str = Field(
        ..., min_length=1, description="Question about model performance or trade-offs"
    )
    session_id: str = Field(default="observatory-default", description="Session identifier")


class MetaBotChatResponse(BaseModel):
    reply: str
    model_used: str
    tokens_in: int
    tokens_out: int
    latency_ms: float
    cost_usd: float
    telemetry_snapshot: list[dict[str, Any]]


class TelemetryRecordRequest(BaseModel):
    model: str
    persona: str = "generic"
    latency_ms: float
    tokens_in: int = 150
    tokens_out: int = 250
    cost_usd: float = 0.0


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Observatory service starting up")
    yield
    logger.info("Observatory service shutting down")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Tangent LLM Observatory & MetaBot Service",
        description="Cross-model telemetry aggregation, performance leaderboard, and MetaBot analytics assistant.",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestIdMiddleware)

    redis_c = get_redis_client()
    observatory = ObservatoryService(redis_client=redis_c)
    metabot = MetaBotEngine(observatory=observatory)

    @app.get("/health", status_code=status.HTTP_200_OK, tags=["monitoring"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": "tangent-observatory"}

    @app.get("/metrics", tags=["monitoring"])
    @app.get("/api/v1/observatory/metrics", tags=["observatory"])
    async def get_metrics() -> dict[str, Any]:
        """Fetch raw model telemetry metrics and leaderboard from Redis."""
        raw = await observatory.get_raw_metrics()
        board = await observatory.get_leaderboard()
        total_calls = sum(item.get("call_count", 0) for item in board)
        total_cost = sum(item.get("total_cost_usd", 0.0) for item in board)
        return {
            "service": "tangent-observatory",
            "status": "healthy",
            "monitored_models_count": len(board),
            "total_inferences": total_calls,
            "total_cost_usd": round(total_cost, 6),
            "leaderboard": board,
            "raw_metrics": raw,
        }

    @app.get("/api/v1/observatory/leaderboard", tags=["observatory"])
    async def get_leaderboard() -> list[dict[str, Any]]:
        """Fetch model performance leaderboard ranked by p50 latency and efficiency."""
        return await observatory.get_leaderboard()

    @app.get("/api/v1/observatory/microservices", tags=["observatory"])
    async def get_microservices() -> list[dict[str, Any]]:
        """Fetch real-time metrics for the 6 deterministic core microservices."""
        return await observatory.get_microservices_metrics()

    @app.post("/api/v1/observatory/telemetry", tags=["observatory"])
    async def record_telemetry(req: TelemetryRecordRequest) -> dict[str, str]:
        """Record model invocation metrics into Redis telemetry."""
        import uuid

        await redis_c.record_llm_metric(
            call_id=f"call_{uuid.uuid4().hex[:12]}",
            model=req.model,
            persona=req.persona,
            latency_ms=req.latency_ms,
            tokens_in=req.tokens_in,
            tokens_out=req.tokens_out,
            cost_usd=req.cost_usd,
        )
        return {"status": "recorded", "model": req.model}

    @app.post("/api/v1/observatory/reset", tags=["observatory"])
    async def reset_telemetry() -> dict[str, str]:
        """Clear cached telemetry and latency sorted sets from Redis to purge cold starts."""
        await redis_c.reset_llm_metrics()
        return {"status": "cleared", "message": "Telemetry metrics cache reset successfully"}

    @app.post(
        "/api/v1/observatory/metabot/chat",
        response_model=MetaBotChatResponse,
        tags=["metabot"],
    )
    async def chat_with_metabot(req: MetaBotChatRequest) -> MetaBotChatResponse:
        """Ask MetaBot to explain model latency, token economy, or architectural trade-offs."""
        result = await metabot.answer(question=req.message, session_id=req.session_id)
        return MetaBotChatResponse(**result)

    return app


app = create_app()
