"""Tests for Tangent evidence-first Agent service."""

import re

import pytest
from agent.critic import review_decision_brief
from agent.evidence import build_evidence_pack
from agent.main import app
from contracts.brief import Claim, ConfidenceRating, DecisionBrief
from httpx import ASGITransport, AsyncClient


@pytest.mark.asyncio
async def test_agent_health_and_ready():
    """Verify health and ready endpoints."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        h_res = await ac.get("/health")
        assert h_res.status_code == 200
        assert h_res.json()["status"] == "ok"

        r_res = await ac.get("/ready")
        assert r_res.status_code == 200
        assert r_res.json()["status"] == "ready"


def test_evidence_pack_generation_and_ids():
    """Verify evidence IDs strictly match regex ^E\\d+$."""
    pack = build_evidence_pack(
        ticker="INFY.NS",
        nominal_return=0.145,
        real_return=0.065,
        volatility=0.13,
        sharpe=0.50,
        marginal_sharpe_delta=0.025,
    )
    assert pack.ticker == "INFY.NS"
    assert len(pack.items) >= 7

    for item in pack.items:
        assert re.match(r"^E\d+$", item.id) is not None, f"Invalid evidence ID format: {item.id}"
        assert item.as_of != ""
        assert item.source_service in ("quant", "sentiment", "market-data")


def test_critic_review_valid_and_invalid():
    """Verify Critic scores groundedness accurately."""
    pack = build_evidence_pack(
        ticker="RELIANCE.NS",
        nominal_return=0.134,
        real_return=0.058,
        volatility=0.122,
        sharpe=0.475,
    )

    # Valid brief
    valid_brief = DecisionBrief(
        candidate_ticker="RELIANCE.NS",
        summary="Positive marginal addition.",
        bull_case=["Strong compounding."],
        bear_case=["Standard volatility."],
        risks=["Tax drag."],
        what_would_change_this=["Drop in margins."],
        confidence=ConfidenceRating(level="high", reason="Empirical covariance."),
        claims=[
            Claim(text="Nominal return is 13.40%.", evidence_ids=["E1"]),
            Claim(text="Real return is 5.80%.", evidence_ids=["E2"]),
        ],
    )
    good_review = review_decision_brief(valid_brief, pack)
    assert good_review.verdict == "approved"
    assert good_review.groundedness_score == 1.0

    # Invalid brief citing non-existent evidence
    invalid_brief = DecisionBrief(
        candidate_ticker="RELIANCE.NS",
        summary="Claim without evidence.",
        bull_case=["Unverified."],
        bear_case=["Unverified."],
        risks=["Unknown."],
        what_would_change_this=["None."],
        confidence=ConfidenceRating(level="low", reason="None."),
        claims=[
            Claim(text="Returns are high.", evidence_ids=["E999"]),
        ],
    )
    bad_review = review_decision_brief(invalid_brief, pack)
    assert bad_review.verdict in ("needs_revision", "rejected")
    assert bad_review.groundedness_score == 0.0


@pytest.mark.asyncio
async def test_trigger_agent_run_pipeline():
    """Verify POST /api/v1/agent/runs executes full multi-agent pipeline."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/agent/runs",
            json={
                "ticker": "TCS.NS",
                "nominal_return": 0.135,
                "real_return": 0.059,
                "volatility": 0.120,
                "sharpe": 0.490,
                "marginal_sharpe_delta": 0.040,
                "sentiment_score": 0.30,
            },
        )
    assert res.status_code == 200
    data = res.json()
    assert "run_id" in data
    assert data["ticker"] == "TCS.NS"
    assert len(data["brief"]["bull_case"]) > 0
    assert len(data["brief"]["bear_case"]) > 0
    assert data["critic_review"]["verdict"] in ("approved", "needs_revision")
    assert data["tokens_used"] > 0


@pytest.mark.asyncio
async def test_sse_streaming_events():
    """Verify SSE stream emits valid event chunks."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/agent/runs/stream/TCS.NS")
    assert res.status_code == 200
    assert "text/event-stream" in res.headers.get("content-type", "")
    assert "event: step_start" in res.text
    assert "event: final_brief" in res.text
