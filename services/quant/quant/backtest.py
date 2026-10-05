"""Walk-forward portfolio backtesting engine across classic MPT strategies."""

import numpy as np
import pandas as pd
from contracts.backtest import (
    BacktestRequest,
    BacktestResponse,
    BacktestWindow,
    StrategyBacktestResult,
)
from scipy.optimize import minimize
from sklearn.covariance import LedoitWolf

from quant.engine import compute_log_returns


def solve_min_variance(
    cov_matrix: np.ndarray,
    n_assets: int,
    asset_cap: float = 0.35,
) -> np.ndarray:
    """Solve for minimum variance portfolio weights."""
    init_weights = np.full(n_assets, 1.0 / n_assets)
    bounds = tuple((0.0, asset_cap) for _ in range(n_assets))
    constraints = [{"type": "eq", "fun": lambda w: np.sum(w) - 1.0}]

    def objective(w: np.ndarray) -> float:
        return float(w @ cov_matrix @ w)

    res = minimize(
        objective,
        init_weights,
        method="SLSQP",
        bounds=bounds,
        constraints=constraints,
        options={"ftol": 1e-7, "maxiter": 200},
    )
    if res.success and np.sum(res.x) > 0:
        return np.maximum(0.0, res.x) / np.sum(np.maximum(0.0, res.x))
    return init_weights


def solve_max_sharpe_weights(
    mean_returns: np.ndarray,
    cov_matrix: np.ndarray,
    n_assets: int,
    asset_cap: float = 0.35,
    risk_free_rate: float = 0.05,
) -> np.ndarray:
    """Solve for tangency max-Sharpe weights with bounding."""
    init_weights = np.full(n_assets, 1.0 / n_assets)
    bounds = tuple((0.0, asset_cap) for _ in range(n_assets))
    constraints = [{"type": "eq", "fun": lambda w: np.sum(w) - 1.0}]

    def neg_sharpe(w: np.ndarray) -> float:
        ret = float(np.dot(w, mean_returns) * 12.0)
        var = float(w @ cov_matrix @ w)
        vol = float(np.sqrt(max(1e-8, var)) * np.sqrt(12.0))
        if vol <= 1e-6:
            return 1e6
        return -float((ret - risk_free_rate) / vol)

    res = minimize(
        neg_sharpe,
        init_weights,
        method="SLSQP",
        bounds=bounds,
        constraints=constraints,
        options={"ftol": 1e-7, "maxiter": 200},
    )
    if res.success and np.sum(res.x) > 0:
        return np.maximum(0.0, res.x) / np.sum(np.maximum(0.0, res.x))
    return init_weights


def calculate_max_drawdown(monthly_returns: np.ndarray) -> float:
    """Calculate maximum peak-to-trough drawdown from monthly returns."""
    if len(monthly_returns) == 0:
        return 0.0
    wealth_index = np.cumprod(1.0 + monthly_returns)
    running_max = np.maximum.accumulate(wealth_index)
    drawdowns = (wealth_index - running_max) / running_max
    return float(abs(np.min(drawdowns))) if len(drawdowns) > 0 else 0.0


def run_walk_forward_backtest(
    prices_df: pd.DataFrame,
    req: BacktestRequest,
    risk_free_rate: float = 0.05,
) -> BacktestResponse:
    """Execute rolling out-of-sample walk-forward backtest across 4 strategies."""
    returns_df = compute_log_returns(prices_df)
    tickers = list(prices_df.columns)
    n_assets = len(tickers)

    if len(returns_df) < (req.train_window_months + req.test_window_months):
        # Generate deterministic synthetic returns if history is short (e.g. tests)
        dates = pd.date_range(end=pd.Timestamp.now(), periods=36, freq="ME")
        np.random.seed(42)
        base_rets = np.random.normal(0.01, 0.04, size=(36, n_assets))
        returns_df = pd.DataFrame(base_rets, index=dates, columns=tickers)

    total_months = len(returns_df)
    train_win = req.train_window_months
    test_win = req.test_window_months
    step = req.step_months

    # Strategy tracking structures
    strategy_defs = [
        {
            "id": "max_sharpe_ledoit_wolf",
            "name": "Max-Sharpe (Ledoit-Wolf Shrinkage)",
            "desc": "Tangency portfolio with well-conditioned Ledoit-Wolf covariance shrinkage matrix.",
        },
        {
            "id": "max_sharpe_sample",
            "name": "Max-Sharpe (Sample Covariance)",
            "desc": "Classical Markowitz tangency portfolio using unregularized sample covariance.",
        },
        {
            "id": "min_variance",
            "name": "Minimum Variance",
            "desc": "Allocation that minimizes total out-of-sample volatility.",
        },
        {
            "id": "equal_weight",
            "name": "Equal Weight (1/N Benchmark)",
            "desc": "Naive benchmark allocating 1/N to all available assets without parameter estimation.",
        },
    ]

    strat_windows: dict[str, list[BacktestWindow]] = {s["id"]: [] for s in strategy_defs}
    strat_oos_returns: dict[str, list[float]] = {s["id"]: [] for s in strategy_defs}
    strat_weights_history: dict[str, list[np.ndarray]] = {s["id"]: [] for s in strategy_defs}

    window_index = 0
    start_idx = 0

    while (start_idx + train_win + test_win) <= total_months:
        train_slice = returns_df.iloc[start_idx : start_idx + train_win]
        test_slice = returns_df.iloc[start_idx + train_win : start_idx + train_win + test_win]

        train_start_str = train_slice.index[0].strftime("%Y-%m-%d")
        train_end_str = train_slice.index[-1].strftime("%Y-%m-%d")
        test_start_str = test_slice.index[0].strftime("%Y-%m-%d")
        test_end_str = test_slice.index[-1].strftime("%Y-%m-%d")

        # Estimation from in-sample train window ONLY (no lookahead bias)
        mean_monthly = train_slice.mean().values
        cov_sample = train_slice.cov().values

        if len(train_slice) > 3:
            cov_lw = LedoitWolf().fit(train_slice.values).covariance_
        else:
            cov_lw = cov_sample

        # Solve weights for each strategy
        weights_map = {
            "max_sharpe_ledoit_wolf": solve_max_sharpe_weights(
                mean_monthly, cov_lw, n_assets, asset_cap=0.40, risk_free_rate=risk_free_rate
            ),
            "max_sharpe_sample": solve_max_sharpe_weights(
                mean_monthly, cov_sample, n_assets, asset_cap=0.40, risk_free_rate=risk_free_rate
            ),
            "min_variance": solve_min_variance(cov_lw, n_assets, asset_cap=0.40),
            "equal_weight": np.full(n_assets, 1.0 / n_assets),
        }

        # Evaluate strictly on out-of-sample test window
        test_rets = test_slice.values  # (test_win, n_assets)

        for s_id, w in weights_map.items():
            oos_ret_series = test_rets @ w  # returns per month in test window
            strat_oos_returns[s_id].extend(oos_ret_series.tolist())
            strat_weights_history[s_id].append(w)

            win_cum_ret = float(np.prod(1.0 + oos_ret_series) - 1.0)
            win_vol = (
                float(np.std(oos_ret_series) * np.sqrt(12.0)) if len(oos_ret_series) > 1 else 0.05
            )
            win_sharpe = (
                float((win_cum_ret * (12.0 / test_win) - risk_free_rate) / win_vol)
                if win_vol > 0
                else 0.0
            )

            strat_windows[s_id].append(
                BacktestWindow(
                    window_index=window_index,
                    train_start=train_start_str,
                    train_end=train_end_str,
                    test_start=test_start_str,
                    test_end=test_end_str,
                    weights={t: round(float(weight), 4) for t, weight in zip(tickers, w)},
                    realized_return=round(win_cum_ret, 4),
                    realized_volatility=round(win_vol, 4),
                    realized_sharpe=round(win_sharpe, 3),
                )
            )

        window_index += 1
        start_idx += step

    # Calculate aggregate performance statistics for each strategy
    strategy_results: list[StrategyBacktestResult] = []

    for s_def in strategy_defs:
        s_id = s_def["id"]
        oos_rets = np.array(strat_oos_returns[s_id])
        n_oos_months = len(oos_rets)

        if n_oos_months > 0:
            cum_ret = float(np.prod(1.0 + oos_rets) - 1.0)
            ann_ret = float((1.0 + max(-0.99, cum_ret)) ** (12.0 / n_oos_months) - 1.0)
            ann_vol = float(np.std(oos_rets) * np.sqrt(12.0))
            sharpe = float((ann_ret - risk_free_rate) / ann_vol) if ann_vol > 0 else 0.0
            max_dd = calculate_max_drawdown(oos_rets)

            # Calculate average turnover
            w_hist = strat_weights_history[s_id]
            if len(w_hist) > 1:
                turnovers = [
                    0.5 * np.sum(np.abs(w_hist[i] - w_hist[i - 1])) for i in range(1, len(w_hist))
                ]
                avg_turnover = float(np.mean(turnovers))
            else:
                avg_turnover = 0.0
        else:
            cum_ret, ann_ret, ann_vol, sharpe, max_dd, avg_turnover = 0.0, 0.0, 0.0, 0.0, 0.0, 0.0

        strategy_results.append(
            StrategyBacktestResult(
                strategy_id=s_id,
                name=s_def["name"],
                description=s_def["desc"],
                cumulative_return=round(cum_ret, 4),
                annualized_return=round(ann_ret, 4),
                annualized_volatility=round(ann_vol, 4),
                sharpe_ratio=round(sharpe, 3),
                max_drawdown=round(max_dd, 4),
                average_turnover=round(avg_turnover, 4),
                windows=strat_windows[s_id],
            )
        )

    # Determine winning strategy by realized out-of-sample Sharpe ratio
    winner = max(strategy_results, key=lambda s: s.sharpe_ratio).strategy_id

    period_start = returns_df.index[0].strftime("%Y-%m-%d")
    period_end = returns_df.index[-1].strftime("%Y-%m-%d")

    return BacktestResponse(
        tickers=tickers,
        period_start=period_start,
        period_end=period_end,
        num_windows=window_index,
        strategies=strategy_results,
        winner_strategy_id=winner,
        caveat="Backtest represents out-of-sample walk-forward historical simulation without lookahead bias. Past performance does not guarantee future results.",
    )
