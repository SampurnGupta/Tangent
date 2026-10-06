"""Deterministic quantitative optimization, risk math, and Monte Carlo engine."""

from typing import Any, Optional

import numpy as np
import pandas as pd
from contracts.marginal import MarginalImpactResponse, MetricDelta
from contracts.portfolio import (
    EfficientFrontierPoint,
    EfficientFrontierResponse,
    OptimizationResponse,
    RiskProfile,
)
from contracts.projections import (
    MonteCarloSimulationRequest,
    MonteCarloSimulationResponse,
    ProjectionYear,
)
from scipy.optimize import minimize
from sklearn.covariance import LedoitWolf


def compute_log_returns(prices_df: pd.DataFrame) -> pd.DataFrame:
    """Resample daily prices to calendar month-end and compute log returns."""
    if prices_df.empty:
        return pd.DataFrame()
    monthly = prices_df.resample("ME").last()
    log_rets = np.log(monthly / monthly.shift(1)).dropna(how="all")
    return log_rets.fillna(0.0)


def compute_covariance(returns_df: pd.DataFrame, use_shrinkage: bool = True) -> np.ndarray:
    """Compute annual covariance matrix using Ledoit-Wolf shrinkage or sample covariance."""
    if returns_df.empty:
        return np.array([[]])
    if use_shrinkage and len(returns_df) > 3:
        lw = LedoitWolf()
        cov_monthly = lw.fit(returns_df.values).covariance_
    else:
        cov_monthly = returns_df.cov().values
    return cov_monthly


def compute_portfolio_stats(
    weights: np.ndarray,
    mean_monthly_returns: np.ndarray,
    cov_monthly: np.ndarray,
    asset_classes: list[str],
    equity_tax_rate: float = 0.125,
    debt_tax_rate: float = 0.30,
    inflation_rate: float = 0.06,
    turnover_penalty: float = 0.0,
) -> tuple[float, float, float, float, float]:
    """Compute (nominal_return, real_return, volatility, real_sharpe, tax_drag)."""
    raw_annual_return = float(np.dot(weights, mean_monthly_returns) * 12.0)

    # Blended tax drag calculation
    eq_w = sum(w for w, ac in zip(weights, asset_classes) if ac == "equity")
    debt_w = sum(w for w, ac in zip(weights, asset_classes) if ac in ("debt", "synthetic"))
    other_w = max(0.0, 1.0 - eq_w - debt_w)

    blended_tax = (eq_w * equity_tax_rate) + (debt_w * debt_tax_rate) + (other_w * equity_tax_rate)
    tax_drag = raw_annual_return * blended_tax
    tax_adjusted_return = raw_annual_return - tax_drag

    real_return = tax_adjusted_return - turnover_penalty - inflation_rate

    # Annualized portfolio volatility
    var = float(weights @ cov_monthly @ weights)
    volatility = float(np.sqrt(max(1e-8, var)) * np.sqrt(12.0))

    sharpe = float(real_return / volatility) if volatility > 0 else 0.0
    return raw_annual_return, real_return, volatility, sharpe, tax_drag


def compute_diversification_metrics(weights: np.ndarray) -> tuple[float, float]:
    """Compute (saturation_score_0_10, effective_number_of_assets) using inverse HHI."""
    hhi = float(np.sum(weights**2))
    enc = float(1.0 / hhi) if hhi > 0 else 1.0
    score = round(min(10.0, enc), 2)
    return score, round(enc, 2)


def generate_deterministic_synthetic_returns(
    yield_annual: float,
    months: int,
    duration: float = 0.0,
    rate_shock_annual: float = 0.0,
) -> np.ndarray:
    """Deterministic yield-accrual returns for synthetic fixed income assets."""
    monthly_yield = np.log(1.0 + yield_annual) / 12.0
    capital_impact_monthly = -(duration * rate_shock_annual) / 12.0 if duration > 0 else 0.0
    return np.full(months, monthly_yield + capital_impact_monthly)


def optimize_max_sharpe(
    tickers: list[str],
    returns_df: pd.DataFrame,
    asset_meta: dict[str, dict[str, Any]],
    risk_profile: RiskProfile,
    asset_cap: float = 0.15,
    sector_cap: float = 0.25,
    use_shrinkage: bool = True,
    equity_tax_rate: float = 0.125,
    debt_tax_rate: float = 0.30,
    inflation_rate: float = 0.06,
    rebalancing_cost: float = 0.005,
) -> OptimizationResponse:
    """Run SciPy SLSQP optimization with real regulatory, sector, and risk constraints."""
    n = len(tickers)
    mu = returns_df[tickers].mean().values
    cov = compute_covariance(returns_df[tickers], use_shrinkage=use_shrinkage)
    classes = [asset_meta.get(t, {}).get("asset_class", "equity") for t in tickers]
    sectors = [asset_meta.get(t, {}).get("sector", "Other") for t in tickers]

    # Bounds: [0, asset_cap]
    bounds = tuple((0.0, min(1.0, asset_cap)) for _ in range(n))

    # Constraints
    eq_idx = [i for i, c in enumerate(classes) if c == "equity"]
    debt_idx = [i for i, c in enumerate(classes) if c in ("debt", "synthetic")]
    alt_idx = [i for i, c in enumerate(classes) if c in ("alternative", "commodity")]

    constraints = [
        {"type": "eq", "fun": lambda w: np.sum(w) - 1.0},
    ]

    # Asset class constraints from RiskProfile (clamped to universe feasibility)
    eff_eq_min = min(risk_profile.equity_min, len(eq_idx) * asset_cap)
    eff_debt_min = min(risk_profile.debt_min, len(debt_idx) * asset_cap)

    if eq_idx:
        constraints.append(
            {"type": "ineq", "fun": lambda w: sum(w[i] for i in eq_idx) - eff_eq_min}
        )
        constraints.append(
            {"type": "ineq", "fun": lambda w: risk_profile.equity_max - sum(w[i] for i in eq_idx)}
        )
    if debt_idx:
        constraints.append(
            {"type": "ineq", "fun": lambda w: sum(w[i] for i in debt_idx) - eff_debt_min}
        )
        constraints.append(
            {"type": "ineq", "fun": lambda w: risk_profile.debt_max - sum(w[i] for i in debt_idx)}
        )
    if alt_idx:
        constraints.append(
            {"type": "ineq", "fun": lambda w: risk_profile.alt_max - sum(w[i] for i in alt_idx)}
        )

    # Sector constraints: max sector_cap per equity sector
    unique_sectors = set(sectors)
    for s in unique_sectors:
        if s in ("Fixed Income", "Cash", "Commodities", "Other", "Unknown"):
            continue
        s_idx = [i for i, sec in enumerate(sectors) if sec == s]
        if len(s_idx) > 1:
            constraints.append(
                {"type": "ineq", "fun": lambda w, idx=s_idx: sector_cap - sum(w[i] for i in idx)}
            )

    # Objective: Minimize negative Sharpe
    def objective(w: np.ndarray) -> float:
        _, real_ret, vol, sharpe, _ = compute_portfolio_stats(
            w,
            mu,
            cov,
            classes,
            equity_tax_rate,
            debt_tax_rate,
            inflation_rate,
            turnover_penalty=0.0,
        )
        return -sharpe

    # Multi-start SLSQP
    best_weights = np.ones(n) / n
    best_sharpe = -1e9

    # Generate initial guesses: uniform first, then randomized sparse subsets
    initial_guesses = [np.ones(n) / n]
    for seed in range(5):
        rng = np.random.default_rng(seed)
        if n > 15:
            # Pick a subset of 8-12 candidate assets to encourage sparsity
            k = int(rng.integers(8, 13))
            indices = rng.choice(n, size=k, replace=False)
            w_init = np.zeros(n)
            raw = rng.uniform(0.04, min(1.0, asset_cap), size=k)
            w_init[indices] = raw / raw.sum()
            initial_guesses.append(w_init)
        else:
            raw = rng.uniform(0.01, min(1.0, asset_cap), size=n)
            initial_guesses.append(raw / raw.sum())

    for w0 in initial_guesses:
        res = minimize(
            objective,
            w0,
            method="SLSQP",
            bounds=bounds,
            constraints=constraints,
            options={"maxiter": 1000, "ftol": 1e-9},
        )
        if res.success:
            _, _, _, sh, _ = compute_portfolio_stats(
                res.x, mu, cov, classes, equity_tax_rate, debt_tax_rate, inflation_rate
            )
            if sh > best_sharpe:
                best_sharpe = sh
                best_weights = res.x

    # For large universes (n > 15), zero out insignificant dust weights (< 2.5%) and re-normalize
    if n > 15:
        best_weights = np.where(best_weights < 0.025, 0.0, best_weights)
        if best_weights.sum() > 0:
            best_weights = best_weights / best_weights.sum()
        else:
            best_weights = np.ones(n) / n
    else:
        best_weights = np.maximum(0.0, best_weights)
        best_weights = best_weights / best_weights.sum()

    nom_ret, real_ret, vol, sharpe, tax_drag = compute_portfolio_stats(
        best_weights, mu, cov, classes, equity_tax_rate, debt_tax_rate, inflation_rate
    )
    div_score, enc = compute_diversification_metrics(best_weights)

    weight_map = {t: round(float(w), 4) for t, w in zip(tickers, best_weights)}

    # Breakdown by sector & class
    sec_alloc: dict[str, float] = {}
    cls_alloc: dict[str, float] = {}
    for t, w in weight_map.items():
        s = asset_meta.get(t, {}).get("sector", "Other")
        c = asset_meta.get(t, {}).get("asset_class", "equity")
        sec_alloc[s] = round(sec_alloc.get(s, 0.0) + w, 4)
        cls_alloc[c] = round(cls_alloc.get(c, 0.0) + w, 4)

    return OptimizationResponse(
        weights=weight_map,
        expected_return_nominal=round(nom_ret, 4),
        expected_return_real=round(real_ret, 4),
        annual_volatility=round(vol, 4),
        sharpe_ratio=round(sharpe, 4),
        diversification_score=div_score,
        effective_n_assets=enc,
        sector_allocations=sec_alloc,
        asset_class_allocations=cls_alloc,
        tax_drag=round(tax_drag, 4),
        inflation_rate=inflation_rate,
        as_of=pd.Timestamp.now("UTC").isoformat(),
    )


def sample_efficient_frontier(
    tickers: list[str],
    returns_df: pd.DataFrame,
    asset_meta: dict[str, dict[str, Any]],
    risk_profile: RiskProfile,
    n_samples: int = 1000,
    seed: int = 42,
) -> EfficientFrontierResponse:
    """Sample feasible frontier portfolios using seeded Dirichlet Monte Carlo."""
    rng = np.random.default_rng(seed)
    n = len(tickers)
    mu = returns_df[tickers].mean().values
    cov = compute_covariance(returns_df[tickers])
    classes = [asset_meta.get(t, {}).get("asset_class", "equity") for t in tickers]

    points: list[EfficientFrontierPoint] = []
    best_sharpe_pt: Optional[EfficientFrontierPoint] = None
    min_vol_pt: Optional[EfficientFrontierPoint] = None

    min_vol = 1e9
    max_sharpe = -1e9

    for _ in range(n_samples):
        # For large universes (e.g. 74 assets), sample a realistic subset of 6 to 14 assets
        if n > 15:
            k = int(rng.integers(6, 15))
            chosen_indices = rng.choice(n, size=k, replace=False)
            sub_w = rng.dirichlet(np.ones(k) * 1.2)
            sub_w = np.clip(sub_w, 0.02, 0.15)
            sub_w = sub_w / sub_w.sum()
            w = np.zeros(n)
            w[chosen_indices] = sub_w
        else:
            w = rng.dirichlet(np.ones(n) * 0.8)
            w = np.clip(w, 0.0, 0.25)
            w_sum = w.sum()
            if w_sum == 0:
                continue
            w = w / w_sum

        _, real_ret, vol, sharpe, _ = compute_portfolio_stats(w, mu, cov, classes)

        pt = EfficientFrontierPoint(
            expected_return=round(real_ret, 4),
            volatility=round(vol, 4),
            sharpe_ratio=round(sharpe, 4),
        )
        points.append(pt)

        if sharpe > max_sharpe:
            max_sharpe = sharpe
            best_sharpe_pt = EfficientFrontierPoint(
                expected_return=round(real_ret, 4),
                volatility=round(vol, 4),
                sharpe_ratio=round(sharpe, 4),
                weights={t: round(float(wi), 4) for t, wi in zip(tickers, w)},
            )
        if vol < min_vol:
            min_vol = vol
            min_vol_pt = EfficientFrontierPoint(
                expected_return=round(real_ret, 4),
                volatility=round(vol, 4),
                sharpe_ratio=round(sharpe, 4),
                weights={t: round(float(wi), 4) for t, wi in zip(tickers, w)},
            )

    return EfficientFrontierResponse(
        cloud=points,
        optimal=best_sharpe_pt or points[0],
        min_volatility=min_vol_pt or points[0],
        seed=seed,
    )


def simulate_monte_carlo_projections(
    req: MonteCarloSimulationRequest,
) -> MonteCarloSimulationResponse:
    """Run geometric wealth accumulation paths with reproducible seeded RNG."""
    rng = np.random.default_rng(req.seed)
    n_months = req.horizon_years * 12
    monthly_mu = req.expected_annual_return / 12.0
    monthly_sigma = req.annual_volatility / np.sqrt(12.0)

    # Monthly return matrix: shape (paths, n_months)
    shocks = rng.normal(monthly_mu, monthly_sigma, size=(req.paths, n_months))

    paths = np.zeros((req.paths, n_months + 1))
    paths[:, 0] = req.initial_investment

    for m in range(n_months):
        paths[:, m + 1] = paths[:, m] * (1.0 + shocks[:, m]) + req.monthly_sip

    # Yearly percentiles
    year_indices = list(range(0, n_months + 1, 12))
    yearly_slices = paths[:, year_indices]

    trajectory: list[ProjectionYear] = []
    for y in range(req.horizon_years + 1):
        vals = yearly_slices[:, y]
        trajectory.append(
            ProjectionYear(
                year=y,
                median=round(float(np.percentile(vals, 50)), 2),
                ci_lower_95=round(float(np.percentile(vals, 5)), 2),
                ci_upper_95=round(float(np.percentile(vals, 95)), 2),
                ci_lower_75=round(float(np.percentile(vals, 25)), 2),
                ci_upper_75=round(float(np.percentile(vals, 75)), 2),
            )
        )

    # Max drawdowns per path
    drawdowns = []
    for i in range(req.paths):
        path = paths[i, :]
        peaks = np.maximum.accumulate(path)
        dd = (peaks - path) / np.maximum(peaks, 1.0)
        drawdowns.append(np.max(dd))

    terminal = paths[:, -1]
    prob_goal = None
    if req.target_wealth and req.target_wealth > 0:
        prob_goal = round(float(np.mean(terminal >= req.target_wealth)), 4)

    return MonteCarloSimulationResponse(
        trajectory=trajectory,
        terminal_median=round(float(np.percentile(terminal, 50)), 2),
        terminal_worst_case_5th=round(float(np.percentile(terminal, 5)), 2),
        max_drawdown_median=round(float(np.median(drawdowns)), 4),
        max_drawdown_worst_5th=round(float(np.percentile(drawdowns, 95)), 4),
        probability_goal_achieved=prob_goal,
        paths=req.paths,
        seed=req.seed,
    )


def compute_marginal_impact(
    candidate_ticker: str,
    current_weights: dict[str, float],
    returns_df: pd.DataFrame,
    asset_meta: dict[str, dict[str, Any]],
    risk_profile: RiskProfile,
    fixed_weight: Optional[float] = None,
) -> MarginalImpactResponse:
    """Measure exact delta on Sharpe, Vol, and Diversification when candidate asset is added."""
    # 1. Baseline metrics
    base_tickers = list(current_weights.keys())
    base_w = np.array([current_weights[t] for t in base_tickers])
    base_w = base_w / base_w.sum()

    base_mu = returns_df[base_tickers].mean().values
    base_cov = compute_covariance(returns_df[base_tickers])
    base_classes = [asset_meta.get(t, {}).get("asset_class", "equity") for t in base_tickers]

    _, base_ret, base_vol, base_sh, _ = compute_portfolio_stats(
        base_w, base_mu, base_cov, base_classes
    )
    base_div, base_enc = compute_diversification_metrics(base_w)

    # 2. Re-optimized metrics with candidate ticker
    new_tickers = list(set(base_tickers + [candidate_ticker]))
    reopt = optimize_max_sharpe(
        tickers=new_tickers,
        returns_df=returns_df,
        asset_meta=asset_meta,
        risk_profile=risk_profile,
        asset_cap=0.15,
    )

    new_alloc = reopt.weights.get(candidate_ticker, 0.0)

    def make_delta(before: float, after: float) -> MetricDelta:
        delta = round(after - before, 4)
        pct = round((delta / abs(before)) * 100.0, 2) if before != 0 else 0.0
        return MetricDelta(
            before=round(before, 4), after=round(after, 4), delta=delta, pct_change=pct
        )

    return MarginalImpactResponse(
        candidate_ticker=candidate_ticker,
        reoptimized_weights=reopt.weights,
        sharpe_ratio=make_delta(base_sh, reopt.sharpe_ratio),
        expected_return=make_delta(base_ret, reopt.expected_return_real),
        annual_volatility=make_delta(base_vol, reopt.annual_volatility),
        diversification_score=make_delta(base_div, reopt.diversification_score),
        effective_n_assets=make_delta(base_enc, reopt.effective_n_assets),
        new_allocation=new_alloc,
    )
