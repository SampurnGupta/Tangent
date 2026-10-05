"""Marginal impact analysis for Decision Studio."""

from typing import Optional

from pydantic import BaseModel, Field


class MarginalImpactRequest(BaseModel):
    """Evaluate portfolio metrics when candidate ticker is introduced."""

    candidate_ticker: str = Field(..., description="Ticker to test adding to existing portfolio")
    current_weights: dict[str, float] = Field(..., description="Baseline portfolio weights")
    risk_score: int = Field(default=6, ge=1, le=10)
    fixed_weight: Optional[float] = Field(
        default=None, ge=0.01, le=0.50, description="Force a specific test weight"
    )


class MetricDelta(BaseModel):
    """Before and after comparison of a single metric."""

    before: float
    after: float
    delta: float
    pct_change: float


class MarginalImpactResponse(BaseModel):
    """Measured quantitative impact of adding candidate asset to portfolio."""

    candidate_ticker: str
    reoptimized_weights: dict[str, float]
    sharpe_ratio: MetricDelta
    expected_return: MetricDelta
    annual_volatility: MetricDelta
    diversification_score: MetricDelta
    effective_n_assets: MetricDelta
    new_allocation: float
