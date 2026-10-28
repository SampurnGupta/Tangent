"""Market Data microservice API for Tangent."""

import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Optional

import sqlalchemy as sa
from common.config import BaseAppSettings
from common.logging import get_logger, setup_logging
from common.metrics import ServiceMetricsTracker
from common.middleware import RequestIdMiddleware
from common.redis_client import get_redis_client
from contracts.assets import AssetListResponse
from contracts.prices import (
    FXRateResponse,
    HistoricalPricesRequest,
    HistoricalPricesResponse,
    PricePoint,
)
from fastapi import FastAPI, Query, status
from fastapi.responses import JSONResponse

from market_data.provider import CompositeMarketDataProvider
from market_data.repository import MarketDataRepository

settings = BaseAppSettings(service_name="tangent-market-data")
setup_logging(
    service_name=settings.service_name,
    log_level=settings.log_level,
    json_logs=settings.json_logs,
)
logger = get_logger(settings.service_name)

repo: Optional[MarketDataRepository] = None
provider: Optional[CompositeMarketDataProvider] = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    global repo, provider
    logger.info("Starting up %s (demo_mode=%s)", settings.service_name, settings.demo_mode)
    try:
        repo = MarketDataRepository(settings.database_url)
        repo.seed_universe_if_empty()
    except Exception as exc:
        logger.warning("Database unavailable on startup (%s); will retry on request", exc)

    provider = CompositeMarketDataProvider(demo_mode=settings.demo_mode)
    yield
    logger.info("Shutting down %s", settings.service_name)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Tangent Market Data Service",
        description="Daily close prices, FX rates, asset metadata, and 24h caching.",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(RequestIdMiddleware)

    metrics = ServiceMetricsTracker(settings.service_name)
    metrics.set_custom_metric("tracked_universe_size", 74)
    metrics.set_custom_metric("redis_cache_status", "connected")

    @app.get("/health", status_code=status.HTTP_200_OK, tags=["monitoring"])
    async def health() -> dict[str, Any]:
        return {
            "status": "ok",
            "service": settings.service_name,
            "demo_mode": settings.demo_mode,
            "as_of": datetime.now(timezone.utc).isoformat(),
        }

    @app.get("/metrics", tags=["monitoring"])
    @app.get("/api/v1/market-data/metrics", tags=["monitoring"])
    async def get_metrics() -> dict[str, Any]:
        """Return standardized market data caching and asset pricing metrics."""
        return metrics.get_summary()

    @app.get("/ready", status_code=status.HTTP_200_OK, tags=["monitoring"])
    async def ready() -> JSONResponse:
        checks: dict[str, str] = {"service": "ok"}
        try:
            if repo:
                with repo.engine.connect() as conn:
                    conn.execute(sa.text("SELECT 1"))
                checks["database"] = "ok"
            else:
                checks["database"] = "not_initialized"
        except Exception:
            checks["database"] = "unreachable"

        is_ready = checks.get("database") == "ok" or settings.demo_mode
        return JSONResponse(
            content={"status": "ready" if is_ready else "degraded", "checks": checks},
            status_code=status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    @app.get("/api/v1/assets", response_model=AssetListResponse, tags=["assets"])
    async def list_assets(category: Optional[str] = Query(None)) -> AssetListResponse:
        """Discover available curated assets."""
        if repo:
            assets = repo.get_assets(category=category)
            return AssetListResponse(assets=assets, total=len(assets))

        # Fallback to in-memory universe if DB is unreachable
        from contracts.assets import Asset

        from market_data.universe import CURATED_ASSETS

        filtered = [
            Asset(**a) for a in CURATED_ASSETS if category is None or a["category"] == category
        ]
        return AssetListResponse(assets=filtered, total=len(filtered))

    @app.post("/api/v1/prices", response_model=HistoricalPricesResponse, tags=["prices"])
    async def get_historical_prices(req: HistoricalPricesRequest) -> HistoricalPricesResponse:
        """Fetch historical prices with 24h cache and optional USD->INR FX conversion."""
        now_iso = datetime.now(timezone.utc).isoformat()
        active_provider = provider or CompositeMarketDataProvider(demo_mode=settings.demo_mode)
        redis_c = get_redis_client()
        period_key = (
            f"{req.start_date or 'default'}_{req.end_date or 'latest'}_{req.convert_to_inr}"
        )

        # 1. Fast Redis cache check
        cached_series: dict[str, list[PricePoint]] = {}
        missing_tickers: list[str] = []

        for t in req.tickers:
            redis_cached = await redis_c.get_cached_prices(t, period_key)
            if redis_cached:
                cached_series[t] = [PricePoint(**p) for p in redis_cached]
            else:
                missing_tickers.append(t)

        stale_tickers = missing_tickers
        if repo and missing_tickers:
            try:
                stale_tickers = repo.get_stale_or_missing_tickers(missing_tickers, max_age_hours=24)
                db_cached = repo.load_cached_prices(missing_tickers, req.start_date, req.end_date)
                for t, pts in db_cached.items():
                    if pts:
                        cached_series[t] = pts
            except Exception as e:
                logger.warning("DB cache lookup failed (%s); fetching from provider", e)
                stale_tickers = missing_tickers

        # 2. Fetch missing or stale tickers
        if stale_tickers:
            logger.info(
                "Fetching fresh prices for %d stale tickers: %s", len(stale_tickers), stale_tickers
            )

            # FX series for conversion if foreign assets present
            usdinr_points: list[PricePoint] = []
            if req.convert_to_inr:
                usdinr_points = active_provider.fetch_usdinr_rates(req.start_date, req.end_date)
                usdinr_map = {p.price_date: p.close_price for p in usdinr_points}

            for ticker in stale_tickers:
                pts = active_provider.fetch_prices(ticker, req.start_date, req.end_date)
                # Convert foreign currencies (e.g. SPY, QQQ, BTC-USD) to INR if requested
                if req.convert_to_inr and ticker in ["SPY", "QQQ", "EEM", "BTC-USD"]:
                    converted = []
                    for p in pts:
                        fx_rate = usdinr_map.get(p.price_date, 83.50)
                        converted.append(
                            PricePoint(
                                price_date=p.price_date,
                                close_price=round(p.close_price * fx_rate, 2),
                                adjusted_close=round(
                                    (p.adjusted_close or p.close_price) * fx_rate, 2
                                ),
                            )
                        )
                    pts = converted

                cached_series[ticker] = pts

                # Save to 24h Redis cache
                if pts:
                    await redis_c.set_cached_prices(
                        ticker,
                        period_key,
                        [p.model_dump() for p in pts],
                        ttl_seconds=86400,
                    )

                if repo and pts:
                    try:
                        repo.save_prices_bulk(ticker, pts, currency="INR")
                    except Exception as e:
                        logger.warning("Failed saving %s to cache: %s", ticker, e)

        return HistoricalPricesResponse(
            series=cached_series,
            currency="INR",
            as_of=now_iso,
        )

    @app.get("/api/v1/fx", response_model=FXRateResponse, tags=["fx"])
    async def get_fx_rates(
        start_date: str = "2024-01-01",
        end_date: Optional[str] = None,
    ) -> FXRateResponse:
        """Get daily USD/INR FX closing exchange rates."""
        active_provider = provider or CompositeMarketDataProvider(demo_mode=settings.demo_mode)
        rates = active_provider.fetch_usdinr_rates(start_date, end_date)
        latest = rates[-1].close_price if rates else 83.50
        return FXRateResponse(
            pair="USDINR=X",
            series=rates,
            latest_rate=latest,
            as_of=datetime.now(timezone.utc).isoformat(),
        )

    @app.post("/api/v1/market-data/sync", tags=["prices"])
    async def sync_daily_prices(
        authorization: Optional[str] = None,
    ) -> dict[str, Any]:
        """Trigger daily settlement market sync after exchange close (e.g. from GitHub Actions)."""
        t0 = time.time()
        active_provider = provider or CompositeMarketDataProvider(demo_mode=settings.demo_mode)
        benchmark_tickers = [
            "RELIANCE.NS",
            "TCS.NS",
            "HDFCBANK.NS",
            "INFY.NS",
            "GOLDBEES.NS",
            "SPY",
            "QQQ",
        ]
        now_iso = datetime.now(timezone.utc).isoformat()
        redis_c = get_redis_client()

        synced = []
        for ticker in benchmark_tickers:
            try:
                pts = active_provider.fetch_prices(ticker, start_date="2025-01-01")
                if pts:
                    await redis_c.set_cached_prices(
                        ticker,
                        "default_latest_False",
                        [p.model_dump() for p in pts[-30:]],
                        ttl_seconds=86400,
                    )
                    synced.append(ticker)
            except Exception as ex:
                logger.warning("Sync failed for %s: %s", ticker, ex)

        elapsed_ms = round((time.time() - t0) * 1000.0, 2)
        payload_bytes = len(str(synced).encode("utf-8")) + 256
        metrics.record_request(latency_ms=elapsed_ms, bytes_transferred=payload_bytes)
        metrics.set_custom_metric("last_market_sync_utc", now_iso)
        metrics.set_custom_metric("synced_assets_count", len(synced))

        return {
            "status": "synchronized",
            "service": settings.service_name,
            "timestamp_utc": now_iso,
            "synced_tickers": synced,
            "synced_count": len(synced),
            "latency_ms": elapsed_ms,
            "source": "fixture" if settings.demo_mode else "yfinance",
        }

    return app


app = create_app()
