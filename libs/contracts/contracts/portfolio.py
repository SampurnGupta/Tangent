"""Portfolio optimization, weights, and efficient frontier contracts."""

from typing import Optional

from pydantic import BaseModel, Field


class RiskProfile(BaseModel):
    """Investor risk profile and derived asset-class bounds."""

    score: int = Field(
        ..., ge=1, le=10, description="Risk tolerance score 1 (conservative) to 10 (aggressive)"
    )
    name: str = Field(..., description="Profile label (e.g. Conservative, Moderate, Aggressive)")
    horizon_years: int = Field(..., ge=1, le=50, description="Investment horizon in years")
    equity_min: float = Field(..., ge=0.0, le=1.0)
    equity_max: float = Field(..., ge=0.0, le=1.0)
    debt_min: float = Field(..., ge=0.0, le=1.0)
    debt_max: float = Field(..., ge=0.0, le=1.0)
    commodity_max: float = Field(default=0.20, ge=0.0, le=1.0)
    alt_max: float = Field(default=0.10, ge=0.0, le=1.0)


class OptimizationRequest(BaseModel):
    """Parameters for running max-Sharpe optimization."""

    tickers: list[str] = Field(..., min_length=2, description="Candidate asset tickers")
    risk_score: int = Field(default=6, ge=1, le=10, description="Risk tolerance score")
    asset_cap: float = Field(
        default=0.15, ge=0.01, le=1.0, description="Maximum allocation to any single asset"
    )
    sector_cap: float = Field(
        default=0.25, ge=0.01, le=1.0, description="Maximum allocation to any single sector"
    )
    use_shrinkage: bool = Field(
        default=True, description="Use Ledoit-Wolf covariance shrinkage instead of sample cov"
    )
    start_date: Optional[str] = Field(default=None, description="Lookback start date (YYYY-MM-DD)")
    rebalancing_cost: float = Field(
        default=0.005, description="Turnover slippage/fee penalty (default 0.5%)"
    )
    inflation_rate: float = Field(
        default=0.06, description="Annual inflation rate assumption (default 6.0%)"
    )
    equity_tax_rate: float = Field(
        default=0.125, description="Indian LTCG equity tax rate (default 12.5%)"
    )
    debt_tax_rate: float = Field(default=0.30, description="Debt slab tax rate (default 30.0%)")


class OptimizationResponse(BaseModel):
    """Result of max-Sharpe portfolio optimization."""

    weights: dict[str, float] = Field(
        ..., description="Ticker to portfolio weight mapping (sums to 1.0)"
    )
    expected_return_nominal: float = Field(
        ..., description="Annualized expected nominal log return"
    )
    expected_return_real: float = Field(
        ..., description="Annualized return after tax and inflation adjustments"
    )
    annual_volatility: float = Field(
        ..., description="Annualized portfolio volatility (standard deviation)"
    )
    sharpe_ratio: float = Field(
        ..., description="Real Sharpe ratio = (Real Return - 0) / Volatility"
    )
    diversification_score: float = Field(
        ..., description="Saturation metric on 0-10 scale based on ENC"
    )
    effective_n_assets: float = Field(
        ..., description="Effective Number of Constituents via inverse HHI"
    )
    sector_allocations: dict[str, float] = Field(..., description="Allocation percentage by sector")
    asset_class_allocations: dict[str, float] = Field(
        ..., description="Allocation percentage by asset class"
    )
    tax_drag: float = Field(
        ..., description="Estimated annualized percentage reduction from blended tax"
    )
    inflation_rate: float = Field(default=0.06, description="Inflation assumption applied")
    as_of: str = Field(..., description="Timestamp of optimization calculation")


class EfficientFrontierPoint(BaseModel):
    """A single portfolio point on the efficient frontier cloud or curve."""

    expected_return: float
    volatility: float
    sharpe_ratio: float
    weights: Optional[dict[str, float]] = None


class EfficientFrontierResponse(BaseModel):
    """Sampled frontier cloud and max-Sharpe tangency portfolio."""

    cloud: list[EfficientFrontierPoint] = Field(
        ..., description="Sampled Monte Carlo portfolio points"
    )
    optimal: EfficientFrontierPoint = Field(..., description="Max-Sharpe tangency portfolio")
    min_volatility: EfficientFrontierPoint = Field(..., description="Minimum variance portfolio")
    seed: int = Field(..., description="RNG seed used for sampling")
