"""Tangent API Gateway main application."""

from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator, Optional

import httpx
from common.logging import get_logger, setup_logging
from common.middleware import RequestIdMiddleware
from fastapi import Depends, FastAPI, Header, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from gateway.auth import (
    create_access_token,
    decode_access_token,
    extract_bearer_token,
    generate_guest_id,
    get_current_user_id,
)
from gateway.config import GatewaySettings
from gateway.limiter import SlidingWindowRateLimiter
from gateway.proxy import forward_request

settings = GatewaySettings()
setup_logging(
    service_name=settings.service_name,
    log_level=settings.log_level,
    json_logs=settings.json_logs,
)
logger = get_logger(settings.service_name)

limiter = SlidingWindowRateLimiter(max_requests=settings.rate_limit_per_minute, window_seconds=60)
http_client: Optional[httpx.AsyncClient] = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage lifecycle of shared HTTP proxy client."""
    global http_client
    logger.info("Initializing %s HTTP client pool", settings.service_name)
    http_client = httpx.AsyncClient(timeout=30.0)
    yield
    logger.info("Closing %s HTTP client pool", settings.service_name)
    if http_client:
        await http_client.aclose()


def create_app() -> FastAPI:
    """FastAPI application factory for Tangent API Gateway."""
    app = FastAPI(
        title="Tangent API Gateway",
        description="Unified front-door reverse proxy, auth provider, and router for Tangent services.",
        version="0.1.0",
        lifespan=lifespan,
    )

    # Middlewares
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if settings.demo_mode else settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestIdMiddleware)

    # Middleware: Rate Limiting
    @app.middleware("http")
    async def rate_limit_middleware(request: Request, call_next):
        # Exclude /health and /ready from rate limits
        if request.url.path not in ("/health", "/ready"):
            client_ip = request.client.host if request.client else "unknown"
            if not limiter.is_allowed(client_ip):
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": "Too many requests. Please slow down."},
                )
        return await call_next(request)

    # Health & Readiness
    @app.get("/health", status_code=status.HTTP_200_OK, tags=["monitoring"])
    async def health() -> dict[str, Any]:
        return {"status": "ok", "service": settings.service_name}

    @app.get("/ready", status_code=status.HTTP_200_OK, tags=["monitoring"])
    async def ready() -> JSONResponse:
        checks: dict[str, str] = {"gateway": "ok"}
        if settings.demo_mode or not http_client:
            return JSONResponse(content={"status": "ready", "checks": checks})

        # Check downstream core services
        for name, url in [
            ("market-data", settings.market_data_url),
            ("quant", settings.quant_url),
            ("portfolio", settings.portfolio_url),
        ]:
            try:
                resp = await http_client.get(f"{url}/health", timeout=2.0)
                checks[name] = "ok" if resp.status_code == 200 else "degraded"
            except Exception:
                checks[name] = "unreachable"

        is_ready = all(v == "ok" for v in checks.values()) or settings.demo_mode
        return JSONResponse(
            status_code=status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "ready" if is_ready else "degraded", "checks": checks},
        )

    # Auth Endpoints
    class GuestTokenResponse(BaseModel):
        access_token: str
        token_type: str = "bearer"
        user_id: str
        is_guest: bool = True

    @app.post("/api/v1/auth/guest", response_model=GuestTokenResponse, tags=["auth"])
    async def auth_guest() -> GuestTokenResponse:
        """Create guest identity and issue signed JWT."""
        user_id = generate_guest_id()
        token = create_access_token(user_id=user_id, settings=settings, is_guest=True)
        return GuestTokenResponse(access_token=token, user_id=user_id, is_guest=True)

    @app.get("/api/v1/auth/me", tags=["auth"])
    async def auth_me(authorization: Optional[str] = Header(None)) -> dict[str, Any]:
        """Verify token and return caller profile."""
        token = extract_bearer_token(authorization)
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing Authorization header",
            )
        payload = decode_access_token(token, settings)
        return {
            "user_id": payload.get("sub"),
            "is_guest": payload.get("is_guest", True),
            "exp": payload.get("exp"),
        }

    # Proxy: Market Data
    @app.get("/api/v1/assets", tags=["market-data"])
    async def proxy_assets(request: Request) -> Response:
        target = f"{settings.market_data_url}/api/v1/assets"
        return await forward_request(http_client, target, request)

    @app.post("/api/v1/prices", tags=["market-data"])
    async def proxy_prices(request: Request) -> Response:
        target = f"{settings.market_data_url}/api/v1/prices"
        return await forward_request(http_client, target, request)

    @app.get("/api/v1/fx", tags=["market-data"])
    async def proxy_fx(request: Request) -> Response:
        target = f"{settings.market_data_url}/api/v1/fx"
        return await forward_request(http_client, target, request)

    # Proxy: Quant
    @app.post("/api/v1/optimize", tags=["quant"])
    async def proxy_optimize(request: Request) -> Response:
        target = f"{settings.quant_url}/api/v1/optimize"
        return await forward_request(http_client, target, request)

    @app.post("/api/v1/frontier", tags=["quant"])
    async def proxy_frontier(request: Request) -> Response:
        target = f"{settings.quant_url}/api/v1/frontier"
        return await forward_request(http_client, target, request)

    @app.post("/api/v1/projections", tags=["quant"])
    async def proxy_projections(request: Request) -> Response:
        target = f"{settings.quant_url}/api/v1/projections"
        return await forward_request(http_client, target, request)

    @app.post("/api/v1/marginal-impact", tags=["quant"])
    async def proxy_marginal_impact(request: Request) -> Response:
        target = f"{settings.quant_url}/api/v1/marginal-impact"
        return await forward_request(http_client, target, request)

    # Proxy: Portfolio (Authenticated with user_id header propagation)
    @app.get("/api/v1/portfolios", tags=["portfolio"])
    async def proxy_list_portfolios(
        request: Request,
        user_id: str = Depends(get_current_user_id),
    ) -> Response:
        target = f"{settings.portfolio_url}/api/v1/portfolios"
        return await forward_request(
            http_client,
            target,
            request,
            extra_headers={"X-User-Id": user_id},
        )

    @app.post("/api/v1/portfolios", tags=["portfolio"])
    async def proxy_save_portfolio(
        request: Request,
        user_id: str = Depends(get_current_user_id),
    ) -> Response:
        target = f"{settings.portfolio_url}/api/v1/portfolios"
        return await forward_request(
            http_client,
            target,
            request,
            extra_headers={"X-User-Id": user_id},
        )

    # Proxy: Sentiment
    @app.post("/api/v1/sentiment/analyze", tags=["sentiment"])
    async def proxy_sentiment_analyze(request: Request) -> Response:
        target = f"{settings.sentiment_url}/api/v1/sentiment/analyze"
        return await forward_request(http_client, target, request)

    @app.get("/api/v1/sentiment/{ticker}", tags=["sentiment"])
    async def proxy_ticker_sentiment(request: Request, ticker: str) -> Response:
        target = f"{settings.sentiment_url}/api/v1/sentiment/{ticker}"
        return await forward_request(http_client, target, request)

    # Proxy: Agent (Decision Studio & SSE)
    @app.post("/api/v1/agent/runs", tags=["agent"])
    async def proxy_agent_run(request: Request) -> Response:
        target = f"{settings.agent_url}/api/v1/agent/runs"
        return await forward_request(http_client, target, request)

    @app.get("/api/v1/agent/runs/{run_id}", tags=["agent"])
    async def proxy_get_agent_run(request: Request, run_id: str) -> Response:
        target = f"{settings.agent_url}/api/v1/agent/runs/{run_id}"
        return await forward_request(http_client, target, request)

    @app.get("/api/v1/agent/runs/stream/{ticker}", tags=["agent"])
    async def proxy_stream_agent_run(request: Request, ticker: str) -> Response:
        target = f"{settings.agent_url}/api/v1/agent/runs/stream/{ticker}"
        return await forward_request(http_client, target, request)

    return app


app = create_app()
