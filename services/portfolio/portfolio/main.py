"""Portfolio microservice API for Tangent."""

from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator, Optional

import sqlalchemy as sa
from common.config import BaseAppSettings
from common.logging import get_logger, setup_logging
from common.middleware import RequestIdMiddleware
from fastapi import FastAPI, Query, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from portfolio.repository import PortfolioRepository

settings = BaseAppSettings(service_name="tangent-portfolio")
setup_logging(
    service_name=settings.service_name,
    log_level=settings.log_level,
    json_logs=settings.json_logs,
)
logger = get_logger(settings.service_name)

repo: Optional[PortfolioRepository] = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    global repo
    logger.info("Starting up %s", settings.service_name)
    try:
        repo = PortfolioRepository(settings.database_url)
    except Exception as exc:
        logger.warning("Database unavailable on startup (%s)", exc)
    yield
    logger.info("Shutting down %s", settings.service_name)


def get_repo() -> PortfolioRepository:
    global repo
    if repo is None:
        repo = PortfolioRepository(settings.database_url)
    return repo


class SavePortfolioRequest(BaseModel):
    user_id: str
    name: str
    risk_score: int
    weights: dict[str, float]
    expected_return: Optional[float] = None
    annual_volatility: Optional[float] = None
    sharpe_ratio: Optional[float] = None


class RecordRunRequest(BaseModel):
    user_id: Optional[str] = None
    portfolio_id: Optional[str] = None
    risk_score: int
    weights: dict[str, float]
    metrics: dict[str, Any]
    assumptions_hash: str
    mc_seed: int


def create_app() -> FastAPI:
    app = FastAPI(
        title="Tangent Portfolio Service",
        description="Users, portfolios, and audit logging.",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(RequestIdMiddleware)

    @app.get("/health", status_code=status.HTTP_200_OK, tags=["monitoring"])
    async def health() -> dict[str, Any]:
        return {"status": "ok", "service": settings.service_name}

    @app.get("/ready", status_code=status.HTTP_200_OK, tags=["monitoring"])
    async def ready() -> JSONResponse:
        checks: dict[str, str] = {"service": "ok"}
        try:
            r = get_repo()
            with r.engine.connect() as conn:
                conn.execute(sa.text("SELECT 1"))
            checks["database"] = "ok"
        except Exception:
            checks["database"] = "unreachable"

        is_ready = checks.get("database") == "ok" or settings.demo_mode
        return JSONResponse(
            content={"status": "ready" if is_ready else "degraded", "checks": checks},
            status_code=status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    @app.post("/api/v1/users/guest", tags=["users"])
    async def create_guest() -> dict[str, str]:
        """Create anonymous guest identity."""
        r = get_repo()
        user_id = r.create_guest_user()
        return {"user_id": user_id, "is_guest": "true"}

    @app.post("/api/v1/portfolios", tags=["portfolios"])
    async def save_portfolio(req: SavePortfolioRequest) -> dict[str, str]:
        """Save a portfolio configuration."""
        r = get_repo()
        pid = r.save_portfolio(
            user_id=req.user_id,
            name=req.name,
            risk_score=req.risk_score,
            weights=req.weights,
            expected_return=req.expected_return,
            annual_volatility=req.annual_volatility,
            sharpe_ratio=req.sharpe_ratio,
        )
        return {"portfolio_id": pid}

    @app.get("/api/v1/portfolios", tags=["portfolios"])
    async def list_portfolios(user_id: str = Query(...)) -> list[dict[str, Any]]:
        """List user's saved portfolios."""
        r = get_repo()
        return r.list_portfolios_by_user(user_id)

    @app.post("/api/v1/runs", tags=["audit"])
    async def record_run(req: RecordRunRequest) -> dict[str, str]:
        """Record an optimization run in audit log."""
        r = get_repo()
        run_id = r.record_run_audit(
            user_id=req.user_id,
            portfolio_id=req.portfolio_id,
            risk_score=req.risk_score,
            weights=req.weights,
            metrics=req.metrics,
            assumptions_hash=req.assumptions_hash,
            mc_seed=req.mc_seed,
        )
        return {"run_id": run_id}

    @app.get("/api/v1/runs", tags=["audit"])
    async def list_runs(
        user_id: Optional[str] = Query(None), limit: int = 50
    ) -> list[dict[str, Any]]:
        """List audit history."""
        r = get_repo()
        return r.list_runs(user_id=user_id, limit=limit)

    return app


app = create_app()
