"""Walk-forward backtesting contracts and out-of-sample strategy comparison."""

from typing import Optional

from pydantic import BaseModel, Field


class BacktestWindow(BaseModel):
    """A single walk-forward train/test slice."""

    window_index: int
    train_start: str
    train_end: str
    test_start: str
    test_end: str
    weights: dict[str, float]
    realized_return: float = Field(..., description="Out-of-sample realized return for the window")
    realized_volatility: float = Field(..., description="Out-of-sample realized volatility")
    realized_sharpe: float = Field(..., description="Out-of-sample Sharpe ratio")


class StrategyBacktestResult(BaseModel):
    """Cumulative performance metrics for a specific portfolio strategy."""

    strategy_id: str = Field(..., description="Unique strategy identifier")
    name: str = Field(..., description="Human readable strategy name")
    description: str = Field(..., description="Strategy formulation summary")
    cumulative_return: float = Field(..., description="Total out-of-sample compounding return")
    annualized_return: float = Field(..., description="Annualized compounding geometric return")
    annualized_volatility: float = Field(..., description="Annualized out-of-sample volatility")
    sharpe_ratio: float = Field(..., description="Out-of-sample Sharpe ratio")
    max_drawdown: float = Field(..., description="Maximum peak-to-trough out-of-sample drawdown")
    average_turnover: float = Field(..., description="Mean turnover between rebalancing windows")
    windows: list[BacktestWindow] = Field(default_factory=list, description="Per-window results")


class BacktestRequest(BaseModel):
    """Parameters for rolling walk-forward backtest."""

    tickers: list[str] = Field(..., min_length=2, description="Universe of tickers to backtest")
    train_window_months: int = Field(
        default=12, ge=3, le=36, description="In-sample estimation window"
    )
    test_window_months: int = Field(
        default=3, ge=1, le=12, description="Out-of-sample holding period"
    )
    step_months: int = Field(default=3, ge=1, le=12, description="Window roll step size")
    start_date: Optional[str] = Field(default=None, description="Start date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(default=None, description="End date (YYYY-MM-DD)")


class BacktestResponse(BaseModel):
    """Comparative walk-forward backtest results across 4 classic MPT strategies."""

    tickers: list[str]
    period_start: str
    period_end: str
    num_windows: int
    strategies: list[StrategyBacktestResult]
    winner_strategy_id: str
    caveat: str = Field(
        default="Backtest represents out-of-sample walk-forward historical simulation without lookahead bias. Past performance does not guarantee future results."
    )


class GroundednessEvalItem(BaseModel):
    """Single claim evaluation record."""

    claim_text: str
    cited_evidence_ids: list[str]
    evidence_found: bool
    numerical_match: bool
    directive_language_detected: bool
    notes: str = ""


class GroundednessEvalReport(BaseModel):
    """Comprehensive benchmark evaluation report on agent groundedness and citation fidelity."""

    total_claims: int
    cited_claims: int
    numerical_claims_verified: int
    directive_violations: int
    groundedness_score: float = Field(..., ge=0.0, le=1.0)
    passed: bool
    eval_items: list[GroundednessEvalItem] = Field(default_factory=list)
