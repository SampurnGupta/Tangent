"""Risk profiling, asset-class bounds mapping, and parametric VaR/CVaR."""

from typing import Any

import numpy as np
from contracts.portfolio import RiskProfile
from scipy import stats


def get_risk_profile_by_score(score: int, horizon_years: int = 10) -> RiskProfile:
    """Return RiskProfile bounds based on a 1-10 risk tolerance score."""
    clamped_score = max(1, min(10, score))

    if clamped_score <= 2:
        return RiskProfile(
            score=clamped_score,
            name="Very Conservative",
            horizon_years=horizon_years,
            equity_min=0.05,
            equity_max=0.20,
            debt_min=0.70,
            debt_max=0.90,
            commodity_max=0.05,
            alt_max=0.10,
        )
    elif clamped_score <= 4:
        return RiskProfile(
            score=clamped_score,
            name="Conservative",
            horizon_years=horizon_years,
            equity_min=0.10,
            equity_max=0.40,
            debt_min=0.50,
            debt_max=0.80,
            commodity_max=0.10,
            alt_max=0.15,
        )
    elif clamped_score <= 7:
        return RiskProfile(
            score=clamped_score,
            name="Moderate",
            horizon_years=horizon_years,
            equity_min=0.40,
            equity_max=0.70,
            debt_min=0.20,
            debt_max=0.50,
            commodity_max=0.15,
            alt_max=0.15,
        )
    else:
        return RiskProfile(
            score=clamped_score,
            name="Aggressive",
            horizon_years=horizon_years,
            equity_min=0.60,
            equity_max=0.90,
            debt_min=0.05,
            debt_max=0.30,
            commodity_max=0.20,
            alt_max=0.20,
        )


def compute_risk_score(age: int, horizon_years: int) -> int:
    """Derive 1-10 risk score from age and investment horizon."""
    if age < 30:
        base = 8
    elif age < 45:
        base = 6
    elif age < 60:
        base = 4
    else:
        base = 2

    # Horizon adjustment
    if horizon_years >= 15:
        base = min(10, base + 2)
    elif horizon_years <= 3:
        base = max(1, base - 2)

    return base


def compute_var_cvar(
    weights: np.ndarray,
    mean_monthly_returns: np.ndarray,
    cov_monthly: np.ndarray,
    confidence: float = 0.95,
    horizon_days: int = 252,
    portfolio_value: float = 1_000_000.0,
) -> dict[str, Any]:
    """Parametric Value at Risk (VaR) and Conditional VaR (Expected Shortfall).

    Assumes normal distribution over the horizon.
    - VaR: Maximum loss at the specified confidence level.
    - CVaR: Expected loss given that loss exceeds VaR.
    """
    w = np.asarray(weights, dtype=float)
    port_ret = float(np.dot(w, mean_monthly_returns) * 12.0)
    port_vol = float(np.sqrt(w @ cov_monthly @ w) * np.sqrt(12.0))

    daily_mu = port_ret / 252.0
    daily_vol = port_vol / np.sqrt(252.0)

    h_mu = daily_mu * horizon_days
    h_vol = daily_vol * np.sqrt(horizon_days)

    z = float(stats.norm.ppf(1.0 - confidence))

    var_pct = -(h_mu + z * h_vol)
    cvar_pct = -(h_mu - h_vol * float(stats.norm.pdf(z)) / (1.0 - confidence))

    var_amt = var_pct * portfolio_value
    cvar_amt = cvar_pct * portfolio_value

    return {
        "var": round(max(0.0, var_amt), 2),
        "cvar": round(max(0.0, cvar_amt), 2),
        "var_pct": round(max(0.0, var_pct), 4),
        "cvar_pct": round(max(0.0, cvar_pct), 4),
        "confidence": confidence,
        "horizon_days": horizon_days,
        "portfolio_value": portfolio_value,
    }
