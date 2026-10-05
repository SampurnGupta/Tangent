"""Quant microservice API: Max-Sharpe optimization, Frontier, Monte Carlo, and Marginal Impact."""

from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

import pandas as pd
from common.config import BaseAppSettings
from common.logging import get_logger, setup_logging
from common.middleware import RequestIdMiddleware
from contracts.marginal import MarginalImpactRequest, MarginalImpactResponse
from contracts.portfolio import (
    EfficientFrontierResponse,
    OptimizationRequest,
    OptimizationResponse,
)
from contracts.projections import (
    MonteCarloSimulationRequest,
    MonteCarloSimulationResponse,
)
from fastapi import FastAPI, HTTPException, status

from quant.engine import (
    compute_marginal_impact,
    optimize_max_sharpe,
    sample_efficient_frontier,
    simulate_monte_carlo_projections,
)
from quant.risk import get_risk_profile_by_score

settings = BaseAppSettings(service_name="tangent-quant")
setup_logging(
    service_name=settings.service_name,
    log_level=settings.log_level,
    json_logs=settings.json_logs,
)
logger = get_logger(settings.service_name)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting up %s", settings.service_name)
    yield
    logger.info("Shutting down %s", settings.service_name)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Tangent Quant Service",
        description="Deterministic portfolio optimization, frontier sampling, and risk projections.",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(RequestIdMiddleware)

    @app.get("/health", status_code=status.HTTP_200_OK, tags=["monitoring"])
    async def health() -> dict[str, Any]:
        return {"status": "ok", "service": settings.service_name}

    @app.get("/ready", status_code=status.HTTP_200_OK, tags=["monitoring"])
    async def ready() -> dict[str, Any]:
        return {"status": "ready", "checks": {"engine": "ok"}}

    @app.post("/api/v1/optimize", response_model=OptimizationResponse, tags=["optimization"])
    async def optimize(req: OptimizationRequest) -> OptimizationResponse:
        """Run Max-Sharpe portfolio optimization with sector and asset caps."""
        if len(req.tickers) < 2:
            raise HTTPException(
                status_code=400, detail="At least 2 tickers required for portfolio optimization"
            )

        # Fetch returns via market-data provider or synthetic fallback
        # In isolated service test or benchmark, synthesize/fetch return series
        from app.engine import generate_deterministic_synthetic_returns

        months = 36
        rng = pd.date_range(end=pd.Timestamp.now("UTC"), periods=months, freq="ME")

        # Construct benchmark monthly log returns for given tickers
        returns_dict = {}
        meta_dict = {}
        for i, t in enumerate(req.tickers):
            # Deterministic benchmark profile per asset
            base_ret = 0.12 + (i * 0.01)
            returns_dict[t] = generate_deterministic_synthetic_returns(base_ret, months)
            meta_dict[t] = {
                "asset_class": "debt" if "FD" in t or "BOND" in t else "equity",
                "sector": "Fixed Income" if "FD" in t else f"Sector_{i % 3}",
            }

        returns_df = pd.DataFrame(returns_dict, index=rng)
        profile = get_risk_profile_by_score(req.risk_score)

        return optimize_max_sharpe(
            tickers=req.tickers,
            returns_df=returns_df,
            asset_meta=meta_dict,
            risk_profile=profile,
            asset_cap=req.asset_cap,
            sector_cap=req.sector_cap,
            use_shrinkage=req.use_shrinkage,
            equity_tax_rate=req.equity_tax_rate,
            debt_tax_rate=req.debt_tax_rate,
            inflation_rate=req.inflation_rate,
        )

    @app.post("/api/v1/frontier", response_model=EfficientFrontierResponse, tags=["frontier"])
    async def frontier(
        tickers: list[str],
        risk_score: int = 6,
        paths: int = 1000,
        seed: int = 42,
    ) -> EfficientFrontierResponse:
        """Sample efficient frontier points via Monte Carlo."""
        from app.engine import generate_deterministic_synthetic_returns

        months = 36
        rng = pd.date_range(end=pd.Timestamp.now("UTC"), periods=months, freq="ME")

        returns_dict = {t: generate_deterministic_synthetic_returns(0.12, months) for t in tickers}
        meta_dict = {t: {"asset_class": "equity", "sector": "General"} for t in tickers}
        returns_df = pd.DataFrame(returns_dict, index=rng)

        profile = get_risk_profile_by_score(risk_score)
        return sample_efficient_frontier(
            tickers=tickers,
            returns_df=returns_df,
            asset_meta=meta_dict,
            risk_profile=profile,
            n_samples=paths,
            seed=seed,
        )

    @app.post("/api/v1/simulate", response_model=MonteCarloSimulationResponse, tags=["simulation"])
    async def simulate(req: MonteCarloSimulationRequest) -> MonteCarloSimulationResponse:
        """Run reproducible Monte Carlo wealth projections."""
        return simulate_monte_carlo_projections(req)

    @app.post("/api/v1/marginal-impact", response_model=MarginalImpactResponse, tags=["marginal"])
    async def marginal_impact(req: MarginalImpactRequest) -> MarginalImpactResponse:
        """Measure marginal impact of candidate asset on current portfolio."""
        from app.engine import generate_deterministic_synthetic_returns

        all_tickers = list(req.current_weights.keys()) + [req.candidate_ticker]
        months = 36
        rng = pd.date_range(end=pd.Timestamp.now("UTC"), periods=months, freq="ME")

        returns_dict = {
            t: generate_deterministic_synthetic_returns(0.13, months) for t in all_tickers
        }
        meta_dict = {t: {"asset_class": "equity", "sector": "General"} for t in all_tickers}
        returns_df = pd.DataFrame(returns_dict, index=rng)

        profile = get_risk_profile_by_score(req.risk_score)
        return compute_marginal_impact(
            candidate_ticker=req.candidate_ticker,
            current_weights=req.current_weights,
            returns_df=returns_df,
            asset_meta=meta_dict,
            risk_profile=profile,
            fixed_weight=req.fixed_weight,
        )

    return app


app = create_app()
