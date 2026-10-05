"""Risk profiling and asset-class bounds mapping."""

from contracts.portfolio import RiskProfile


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
