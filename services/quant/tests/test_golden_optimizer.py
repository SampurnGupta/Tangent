"""Golden tests and constraint validation for quant service."""

import numpy as np
import pandas as pd
from contracts.projections import MonteCarloSimulationRequest
from quant.engine import (
    compute_diversification_metrics,
    compute_portfolio_stats,
    optimize_max_sharpe,
    simulate_monte_carlo_projections,
)
from quant.risk import get_risk_profile_by_score


def test_constraints_and_caps_respected():
    """Verify weights sum to 1.0, per-asset <= 15%, per-sector <= 25%, and risk bounds held."""
    tickers = [
        "RELIANCE.NS",
        "TCS.NS",
        "HDFCBANK.NS",
        "INFY.NS",
        "ICICIBANK.NS",
        "HINDUNILVR.NS",
        "WIPRO.NS",
        "SUNPHARMA.NS",
        "MARUTI.NS",
        "SBI_FD",
        "INDIA_GOVT_10Y",
    ]
    months = 36
    dates = pd.date_range("2021-01-01", periods=months, freq="ME")

    rng = np.random.default_rng(101)
    ret_matrix = rng.normal(0.01, 0.04, size=(months, len(tickers)))
    returns_df = pd.DataFrame(ret_matrix, index=dates, columns=tickers)

    asset_meta = {
        "RELIANCE.NS": {"asset_class": "equity", "sector": "Energy"},
        "TCS.NS": {"asset_class": "equity", "sector": "Tech"},
        "HDFCBANK.NS": {"asset_class": "equity", "sector": "Finance"},
        "INFY.NS": {"asset_class": "equity", "sector": "Tech"},
        "ICICIBANK.NS": {"asset_class": "equity", "sector": "Finance"},
        "HINDUNILVR.NS": {"asset_class": "equity", "sector": "Consumer"},
        "WIPRO.NS": {"asset_class": "equity", "sector": "Tech"},
        "SUNPHARMA.NS": {"asset_class": "equity", "sector": "Healthcare"},
        "MARUTI.NS": {"asset_class": "equity", "sector": "Consumer"},
        "SBI_FD": {"asset_class": "debt", "sector": "Fixed Income"},
        "INDIA_GOVT_10Y": {"asset_class": "debt", "sector": "Fixed Income"},
    }

    # Moderate profile: equity (40-70%), debt (20-50%)
    profile = get_risk_profile_by_score(6)
    opt = optimize_max_sharpe(
        tickers=tickers,
        returns_df=returns_df,
        asset_meta=asset_meta,
        risk_profile=profile,
        asset_cap=0.15,
        sector_cap=0.25,
    )

    weights = opt.weights
    total_w = sum(weights.values())
    assert abs(total_w - 1.0) < 1e-3, f"Weights sum to {total_w}, expected 1.0"

    # Per-asset cap: max 15%
    for t, w in weights.items():
        assert w <= 0.155, f"Asset {t} exceeds 15% cap: {w}"

    # Per-sector cap: max 25% for equity industry sectors
    for s, alloc in opt.sector_allocations.items():
        if s in ("Fixed Income", "Cash", "Commodities"):
            continue
        assert alloc <= 0.255, f"Sector {s} exceeds 25% cap: {alloc}"

    # Asset class bounds from RiskProfile
    eq_total = opt.asset_class_allocations.get("equity", 0.0)
    debt_total = opt.asset_class_allocations.get("debt", 0.0)
    assert eq_total >= profile.equity_min - 0.01, (
        f"Equity {eq_total} below min {profile.equity_min}"
    )
    assert eq_total <= profile.equity_max + 0.01, (
        f"Equity {eq_total} above max {profile.equity_max}"
    )
    assert debt_total >= profile.debt_min - 0.01, f"Debt {debt_total} below min {profile.debt_min}"


def test_seed_reproducibility_monte_carlo():
    """Verify that identical seeds produce identical Monte Carlo wealth percentiles."""
    req1 = MonteCarloSimulationRequest(
        initial_investment=500000.0,
        monthly_sip=25000.0,
        horizon_years=10,
        expected_annual_return=0.10,
        annual_volatility=0.15,
        paths=5000,
        seed=12345,
    )
    req2 = MonteCarloSimulationRequest(
        initial_investment=500000.0,
        monthly_sip=25000.0,
        horizon_years=10,
        expected_annual_return=0.10,
        annual_volatility=0.15,
        paths=5000,
        seed=12345,
    )

    res1 = simulate_monte_carlo_projections(req1)
    res2 = simulate_monte_carlo_projections(req2)

    assert res1.terminal_median == res2.terminal_median
    assert res1.terminal_worst_case_5th == res2.terminal_worst_case_5th
    assert res1.max_drawdown_median == res2.max_drawdown_median
    for y1, y2 in zip(res1.trajectory, res2.trajectory):
        assert y1.median == y2.median
        assert y1.ci_lower_95 == y2.ci_lower_95
        assert y1.ci_upper_95 == y2.ci_upper_95


def test_golden_legacy_math_equivalence():
    """Golden comparison against legacy _portfolio_stats mathematical model.

    Legacy formula:
    raw_ret = w @ mu * 12
    blended_tax = eq_w * 0.125 + debt_w * 0.30
    tax_adj_ret = raw_ret * (1 - blended_tax)
    real_ret = tax_adj_ret - turnover_penalty - inflation_rate (6%)
    vol = sqrt(w @ cov @ w) * sqrt(12)
    sharpe = (real_ret - 0) / vol
    """
    weights = np.array([0.5, 0.5])
    mu_monthly = np.array([0.015, 0.006])  # Asset A ~18% p.a., Asset B ~7.2% p.a.
    cov_monthly = np.array([[0.003, 0.0001], [0.0001, 0.00005]])
    classes = ["equity", "debt"]

    # Manual golden calculations
    expected_raw = (0.5 * 0.015 + 0.5 * 0.006) * 12.0  # 0.0105 * 12 = 0.126 (12.6%)
    expected_blended_tax = (0.5 * 0.125) + (0.5 * 0.30)  # 0.0625 + 0.15 = 0.2125
    expected_tax_drag = expected_raw * expected_blended_tax  # 0.126 * 0.2125 = 0.026775
    expected_real = expected_raw - expected_tax_drag - 0.06  # 0.126 - 0.026775 - 0.06 = 0.039225

    var = float(weights @ cov_monthly @ weights)
    expected_vol = np.sqrt(var) * np.sqrt(12.0)
    expected_sharpe = expected_real / expected_vol

    nom_ret, real_ret, vol, sharpe, tax_drag = compute_portfolio_stats(
        weights, mu_monthly, cov_monthly, classes
    )

    assert abs(nom_ret - expected_raw) < 1e-4
    assert abs(real_ret - expected_real) < 1e-4
    assert abs(vol - expected_vol) < 1e-4
    assert abs(sharpe - expected_sharpe) < 1e-4
    assert abs(tax_drag - expected_tax_drag) < 1e-4


def test_diversification_score_saturation():
    """Verify saturation metric reaches 10/10 at 10 equal assets."""
    # 1 asset: HHI = 1, ENC = 1 -> score = 1.0
    s1, enc1 = compute_diversification_metrics(np.array([1.0]))
    assert s1 == 1.0
    assert enc1 == 1.0

    # 10 equal assets: HHI = 0.10, ENC = 10 -> score = 10.0
    s10, enc10 = compute_diversification_metrics(np.ones(10) / 10.0)
    assert s10 == 10.0
    assert enc10 == 10.0

    # 20 equal assets: ENC = 20 -> saturates at 10.0
    s20, enc20 = compute_diversification_metrics(np.ones(20) / 20.0)
    assert s20 == 10.0
    assert enc20 == 20.0
