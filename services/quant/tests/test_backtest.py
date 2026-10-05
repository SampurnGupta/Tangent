"""Unit tests for walk-forward backtest engine and strategy comparison."""

import numpy as np
import pandas as pd
import pytest
from contracts.backtest import BacktestRequest
from httpx import ASGITransport, AsyncClient
from quant.backtest import run_walk_forward_backtest
from quant.main import app


def test_walk_forward_backtest_all_strategies():
    """Verify backtest executes rolling windows across all 4 strategies."""
    # Build 36-month deterministic return series
    dates = pd.date_range(start="2021-01-01", periods=36, freq="ME")
    tickers = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "GOLDBEES.NS"]

    np.random.seed(42)
    # Asset returns with known distinct characteristics
    r1 = np.random.normal(0.015, 0.04, 36)  # High return, moderate vol
    r2 = np.random.normal(0.010, 0.03, 36)
    r3 = np.random.normal(0.012, 0.05, 36)
    r4 = np.random.normal(0.005, 0.01, 36)  # Low return, very low vol (Gold)

    prices_df = pd.DataFrame(
        {
            "RELIANCE.NS": 100.0 * np.exp(np.cumsum(r1)),
            "TCS.NS": 100.0 * np.exp(np.cumsum(r2)),
            "HDFCBANK.NS": 100.0 * np.exp(np.cumsum(r3)),
            "GOLDBEES.NS": 100.0 * np.exp(np.cumsum(r4)),
        },
        index=dates,
    )

    req = BacktestRequest(
        tickers=tickers,
        train_window_months=12,
        test_window_months=3,
        step_months=3,
    )

    resp = run_walk_forward_backtest(prices_df, req)

    assert resp.num_windows > 0
    assert len(resp.strategies) == 4

    strategy_ids = [s.strategy_id for s in resp.strategies]
    assert "max_sharpe_ledoit_wolf" in strategy_ids
    assert "max_sharpe_sample" in strategy_ids
    assert "min_variance" in strategy_ids
    assert "equal_weight" in strategy_ids

    # Verify no lookahead bias across windows
    for strat in resp.strategies:
        assert len(strat.windows) == resp.num_windows
        for win in strat.windows:
            train_end = pd.Timestamp(win.train_end)
            test_start = pd.Timestamp(win.test_start)
            # Test window must be strictly after train window
            assert train_end < test_start
            # Weights must sum to 1.0 within numerical precision
            assert abs(sum(win.weights.values()) - 1.0) < 1e-3

    # Check metrics existence
    for strat in resp.strategies:
        assert isinstance(strat.cumulative_return, float)
        assert isinstance(strat.annualized_volatility, float)
        assert strat.annualized_volatility >= 0.0
        assert 0.0 <= strat.max_drawdown <= 1.0
        assert 0.0 <= strat.average_turnover <= 2.0

    # Winner must match one of the strategy IDs
    assert resp.winner_strategy_id in strategy_ids


@pytest.mark.asyncio
async def test_quant_backtest_api_endpoint():
    """Verify POST /api/v1/backtest endpoint returns 200 and valid schema."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        req_body = {
            "tickers": ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS"],
            "train_window_months": 12,
            "test_window_months": 3,
            "step_months": 3,
        }
        res = await ac.post("/api/v1/backtest", json=req_body)

    assert res.status_code == 200
    data = res.json()
    assert "strategies" in data
    assert len(data["strategies"]) == 4
    assert "winner_strategy_id" in data
    assert "caveat" in data
