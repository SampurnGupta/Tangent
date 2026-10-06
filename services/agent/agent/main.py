"""Agent microservice API for Tangent Decision Studio."""

from typing import Any

from common.config import BaseAppSettings
from common.logging import get_logger, setup_logging
from common.middleware import RequestIdMiddleware
from contracts.brief import CriticReview, DecisionBrief
from contracts.evidence import EvidencePack
from fastapi import FastAPI, HTTPException, Path, status
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from agent.orchestrator import DecisionStudioOrchestrator

settings = BaseAppSettings(service_name="tangent-agent")
setup_logging(
    service_name=settings.service_name,
    log_level=settings.log_level,
    json_logs=settings.json_logs,
)
logger = get_logger(settings.service_name)

orchestrator = DecisionStudioOrchestrator()
# In-memory run cache
completed_runs: dict[str, dict[str, Any]] = {}


class TriggerRunRequest(BaseModel):
    """Payload to trigger an agent decision brief run."""

    ticker: str = Field(..., description="Target candidate ticker e.g. TCS.NS")
    nominal_return: float = 0.134
    real_return: float = 0.058
    volatility: float = 0.122
    sharpe: float = 0.475
    marginal_sharpe_delta: float = 0.038
    sentiment_score: float = 0.22


class TriggerRunResponse(BaseModel):
    """Result of agent decision brief run."""

    run_id: str
    ticker: str
    evidence_pack: EvidencePack
    brief: DecisionBrief
    critic_review: CriticReview
    tokens_used: int
    cost_usd: float


def create_app() -> FastAPI:
    app = FastAPI(
        title="Tangent Agent Service",
        description="Evidence-first multi-agent Decision Studio service with traceable citations and SSE.",
        version="0.1.0",
    )
    app.add_middleware(RequestIdMiddleware)

    @app.get("/health", status_code=status.HTTP_200_OK, tags=["monitoring"])
    async def health() -> dict[str, Any]:
        return {"status": "ok", "service": settings.service_name}

    @app.get("/ready", status_code=status.HTTP_200_OK, tags=["monitoring"])
    async def ready() -> JSONResponse:
        return JSONResponse(
            content={"status": "ready", "service": settings.service_name},
            status_code=status.HTTP_200_OK,
        )

    @app.post("/api/v1/agent/runs", response_model=TriggerRunResponse, tags=["agent"])
    async def trigger_run(payload: TriggerRunRequest) -> TriggerRunResponse:
        """Trigger an evidence-first multi-agent run and return completed brief."""
        res = await orchestrator.run_pipeline(
            ticker=payload.ticker,
            nominal_return=payload.nominal_return,
            real_return=payload.real_return,
            volatility=payload.volatility,
            sharpe=payload.sharpe,
            marginal_sharpe_delta=payload.marginal_sharpe_delta,
            sentiment_score=payload.sentiment_score,
        )

        response_data = TriggerRunResponse(
            run_id=res.run_id,
            ticker=payload.ticker,
            evidence_pack=res.evidence,
            brief=res.brief,
            critic_review=res.review,
            tokens_used=res.tokens_used,
            cost_usd=res.cost_usd,
        )

        # Cache completed run
        completed_runs[res.run_id] = response_data.model_dump()
        return response_data

    @app.get("/api/v1/agent/runs/{run_id}", tags=["agent"])
    async def get_run(run_id: str = Path(...)) -> dict[str, Any]:
        """Fetch previously executed run details."""
        if run_id not in completed_runs:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
        return completed_runs[run_id]

    class ChatRequest(BaseModel):
        message: str
        history: list[dict[str, str]] = []
        context: dict[str, Any] = {}

    @app.post("/api/v1/agent/chat", tags=["agent"])
    async def chat_concierge(payload: ChatRequest) -> dict[str, Any]:
        """Interactive conversational financial assistant with full portfolio context."""
        return await orchestrator.chat_concierge(
            message=payload.message,
            history=payload.history,
            context=payload.context,
        )

    @app.get("/api/v1/agent/runs/stream/{ticker}", tags=["agent"])
    async def stream_run(ticker: str = Path(...)) -> StreamingResponse:
        """Stream real-time SSE progress events for Decision Studio."""
        return StreamingResponse(
            orchestrator.stream_pipeline(ticker=ticker),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    return app


app = create_app()
