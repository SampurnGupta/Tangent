"""RiskBot independent persona service API."""

from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

from common.config import BaseAppSettings
from common.logging import get_logger, setup_logging
from common.metrics import ServiceMetricsTracker
from common.middleware import RequestIdMiddleware
from common.redis_client import get_redis_client
from contracts.agent import PersonaChatRequest, PersonaChatResponse
from fastapi import FastAPI, Path, status
from fastapi.middleware.cors import CORSMiddleware
from llm.client import LLMConfig, ResilientLLMClient

from risk.persona import MODEL_NAME, PERSONA_NAME, SYSTEM_PROMPT, build_risk_prompt

settings = BaseAppSettings(service_name="tangent-persona-risk")
setup_logging(
    service_name=settings.service_name,
    log_level=settings.log_level,
    json_logs=settings.json_logs,
)
logger = get_logger(settings.service_name)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("RiskBot service starting up (Model: %s)", MODEL_NAME)
    yield
    logger.info("RiskBot service shutting down")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Tangent RiskBot Persona Service",
        description="Independent expert chatbot specializing in quantitative portfolio risk, VaR, CVaR, and MPT.",
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
    llm_client = ResilientLLMClient(
        LLMConfig(
            primary_model=MODEL_NAME,
            secondary_model="groq/llama-3.1-8b-instant",
            temperature=0.1,
            demo_mode=settings.demo_mode,
        )
    )
    redis_client = get_redis_client()
    metrics = ServiceMetricsTracker(settings.service_name)
    metrics.set_custom_metric("persona", PERSONA_NAME)
    metrics.set_custom_metric("model", MODEL_NAME)
    metrics.set_custom_metric("provider", "Cloudflare Workers AI")
    metrics.set_custom_metric("total_tokens_in", 0)
    metrics.set_custom_metric("total_tokens_out", 0)
    metrics.set_custom_metric("total_cost_usd", 0.0)

    @app.get("/health", status_code=status.HTTP_200_OK, tags=["monitoring"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "persona": PERSONA_NAME, "model": MODEL_NAME}

    @app.get("/metrics", tags=["monitoring"])
    @app.get("/api/v1/risk/metrics", tags=["monitoring"])
    async def get_metrics() -> dict[str, Any]:
        """Return standardized microservice performance and LLM inference metrics."""
        return metrics.get_summary()

    @app.post("/chat", response_model=PersonaChatResponse, tags=["chat"])
    async def chat(req: PersonaChatRequest) -> PersonaChatResponse:
        """Process conversational turn with Redis-backed session memory."""
        # 1. Load session history from Redis
        history = await redis_client.get_session_history(req.session_id, PERSONA_NAME, limit=20)

        # 2. Save user message to Redis session
        await redis_client.save_session_message(
            session_id=req.session_id,
            persona_id=PERSONA_NAME,
            role="user",
            content=req.message,
            meta={"context": req.context},
        )

        # 3. Build ideologically grounded prompt
        prompt = build_risk_prompt(
            message=req.message,
            history=history,
            context=req.context,
        )

        # 4. Invoke LLM with telemetry
        resp = await llm_client.complete(
            prompt=prompt,
            system_prompt=SYSTEM_PROMPT,
            model_override=MODEL_NAME,
            persona=PERSONA_NAME,
        )

        # Update metrics
        metrics.record_request(latency_ms=resp.latency_ms)
        metrics.increment_custom_metric("total_tokens_in", resp.tokens_in)
        metrics.increment_custom_metric("total_tokens_out", resp.tokens_out)
        metrics.set_custom_metric(
            "total_cost_usd",
            round(metrics.custom_metrics.get("total_cost_usd", 0.0) + resp.cost_estimate_usd, 6),
        )

        # 5. Save assistant reply to Redis session
        updated_history = await redis_client.save_session_message(
            session_id=req.session_id,
            persona_id=PERSONA_NAME,
            role="assistant",
            content=resp.text,
            meta={"model": resp.model, "cost_usd": resp.cost_estimate_usd},
        )

        return PersonaChatResponse(
            reply=resp.text,
            persona=PERSONA_NAME,
            model=resp.model,
            tokens_in=resp.tokens_in,
            tokens_out=resp.tokens_out,
            latency_ms=resp.latency_ms,
            cost_usd=resp.cost_estimate_usd,
            session_message_count=len(updated_history),
        )

    @app.get("/session/{session_id}", tags=["session"])
    async def get_session(session_id: str = Path(...)) -> dict[str, Any]:
        """Retrieve recent session conversation history."""
        history = await redis_client.get_session_history(session_id, PERSONA_NAME, limit=20)
        return {
            "session_id": session_id,
            "persona": PERSONA_NAME,
            "history": history,
            "message_count": len(history),
        }

    @app.delete("/session/{session_id}", tags=["session"])
    async def clear_session(session_id: str = Path(...)) -> dict[str, Any]:
        """Clear session conversation history."""
        cleared = await redis_client.clear_session_history(session_id, PERSONA_NAME)
        return {"session_id": session_id, "persona": PERSONA_NAME, "cleared": cleared}

    return app


app = create_app()
