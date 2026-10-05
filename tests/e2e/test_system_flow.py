"""End-to-End System Integration Flow Test.

Validates the complete user decision journey:
1. Guest onboarding & JWT session issuance
2. Asset universe discovery & categorization
3. Markowitz portfolio optimization with Ledoit-Wolf shrinkage
4. Monte Carlo wealth projection trajectories
5. Marginal delta impact evaluation
6. Rolling walk-forward backtest across 4 strategies
7. Traceable multi-agent decision brief with critic validation
"""

import pytest
from agent.evaluator import evaluate_groundedness_benchmark
from agent.orchestrator import DecisionStudioOrchestrator
from gateway.main import app as gateway_app
from httpx import ASGITransport, AsyncClient
from quant.main import app as quant_app


@pytest.mark.asyncio
async def test_full_system_decision_flow():
    """Execute complete end-to-end user portfolio workflow."""
    # ── Step 1: Onboard Guest & Obtain JWT Token ─────────────────────────────
    async with AsyncClient(
        transport=ASGITransport(app=gateway_app), base_url="http://gateway"
    ) as gw_client:
        auth_res = await gw_client.post("/api/v1/auth/guest")
        assert auth_res.status_code == 200
        auth_data = auth_res.json()
        token = auth_data["access_token"]
        user_id = auth_data["user_id"]

        # Validate token with Gateway
        me_res = await gw_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_res.status_code == 200
        assert me_res.json()["user_id"] == user_id

    # ── Step 2: Quant Optimization & Efficient Frontier ──────────────────────
    async with AsyncClient(
        transport=ASGITransport(app=quant_app), base_url="http://quant"
    ) as quant_client:
        # Run optimization
        opt_req = {
            "tickers": ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "SBI_FD"],
            "risk_score": 6,
            "asset_cap": 0.35,
            "sector_cap": 0.50,
            "use_shrinkage": True,
            "inflation_rate": 0.06,
        }
        opt_res = await quant_client.post("/api/v1/optimize", json=opt_req)
        assert opt_res.status_code == 200
        opt_data = opt_res.json()
        assert "weights" in opt_data
        assert abs(sum(opt_data["weights"].values()) - 1.0) < 1e-4
        assert opt_data["sharpe_ratio"] > 0
        assert opt_data["diversification_score"] > 0

        # Sample frontier
        frontier_res = await quant_client.post(
            "/api/v1/frontier",
            json={"tickers": ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS"], "paths": 100, "seed": 42},
        )
        assert frontier_res.status_code == 200
        assert len(frontier_res.json()["cloud"]) == 100

        # Run Monte Carlo SIP projection
        mc_req = {
            "initial_investment": 500000.0,
            "monthly_sip": 25000.0,
            "horizon_years": 10,
            "expected_annual_return": opt_data["expected_return_nominal"],
            "annual_volatility": opt_data["annual_volatility"],
            "paths": 1000,
            "seed": 42,
        }
        mc_res = await quant_client.post("/api/v1/simulate", json=mc_req)
        assert mc_res.status_code == 200
        mc_data = mc_res.json()
        assert mc_data["terminal_median"] > 500000.0
        assert len(mc_data["trajectory"]) == 11  # Year 0 through Year 10

        # ── Step 3: Marginal Delta Impact Inspection ─────────────────────────
        marginal_req = {
            "current_weights": opt_data["weights"],
            "candidate_ticker": "GOLDBEES.NS",
            "risk_score": 6,
        }
        marg_res = await quant_client.post("/api/v1/marginal-impact", json=marginal_req)
        assert marg_res.status_code == 200
        marg_data = marg_res.json()
        assert "candidate_ticker" in marg_data
        assert "sharpe_ratio" in marg_data

        # ── Step 4: Walk-Forward Backtest Across 4 Strategies ─────────────────
        bt_req = {
            "tickers": ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "GOLDBEES.NS"],
            "train_window_months": 12,
            "test_window_months": 3,
            "step_months": 3,
        }
        bt_res = await quant_client.post("/api/v1/backtest", json=bt_req)
        assert bt_res.status_code == 200
        bt_data = bt_res.json()
        assert len(bt_data["strategies"]) == 4
        assert bt_data["winner_strategy_id"] in [
            "max_sharpe_ledoit_wolf",
            "max_sharpe_sample",
            "min_variance",
            "equal_weight",
        ]

    # ── Step 5: Evidence-First Multi-Agent Decision Brief & Benchmark ─────────
    orchestrator = DecisionStudioOrchestrator()
    run_result = await orchestrator.run_pipeline(
        ticker="GOLDBEES.NS",
        nominal_return=opt_data["expected_return_nominal"],
        real_return=opt_data["expected_return_real"],
        volatility=opt_data["annual_volatility"],
        sharpe=opt_data["sharpe_ratio"],
        marginal_sharpe_delta=marg_data["sharpe_ratio"]["delta"],
        sentiment_score=0.35,
    )

    pack = run_result.evidence
    brief = run_result.brief
    review = run_result.review

    assert review.verdict == "approved"
    assert review.groundedness_score >= 0.85
    assert len(brief.claims) >= 3

    # Groundedness Benchmark Report
    eval_report = evaluate_groundedness_benchmark([(brief, pack)])
    assert eval_report.passed is True
    assert eval_report.directive_violations == 0
    assert eval_report.groundedness_score >= 0.85
