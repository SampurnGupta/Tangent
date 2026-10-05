"""Monte Carlo wealth projections and risk simulation contracts."""

from typing import Optional

from pydantic import BaseModel, Field


class MonteCarloSimulationRequest(BaseModel):
    """Parameters for wealth projection Monte Carlo simulation."""

    initial_investment: float = Field(
        default=500000.0, ge=0.0, description="Lump sum initial corpus in INR"
    )
    monthly_sip: float = Field(
        default=25000.0, ge=0.0, description="Monthly systematic investment in INR"
    )
    horizon_years: int = Field(default=10, ge=1, le=40, description="Horizon in years")
    target_wealth: Optional[float] = Field(
        default=None, ge=0.0, description="Goal target wealth in INR"
    )
    expected_annual_return: float = Field(
        ..., description="Annual expected real return (e.g. 0.08 for 8%)"
    )
    annual_volatility: float = Field(..., gt=0.0, description="Annual portfolio volatility")
    paths: int = Field(
        default=10000, ge=100, le=50000, description="Number of simulated geometric paths"
    )
    seed: int = Field(default=42, description="RNG seed for reproducible simulations")


class ProjectionYear(BaseModel):
    """Annual percentiles for wealth trajectory fan chart."""

    year: int
    median: float
    ci_lower_95: float
    ci_upper_95: float
    ci_lower_75: float
    ci_upper_75: float


class MonteCarloSimulationResponse(BaseModel):
    """Simulation results containing percentiles, drawdowns, and goal probability."""

    trajectory: list[ProjectionYear]
    terminal_median: float
    terminal_worst_case_5th: float
    max_drawdown_median: float
    max_drawdown_worst_5th: float
    probability_goal_achieved: Optional[float] = None
    paths: int
    seed: int
