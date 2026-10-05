"""Unit tests for Pydantic contracts."""

import pytest
from contracts.assets import Asset
from contracts.brief import Claim, ConfidenceRating, DecisionBrief
from contracts.evidence import EvidenceItem
from contracts.portfolio import OptimizationRequest
from pydantic import ValidationError


def test_asset_contract_valid():
    asset = Asset(
        ticker="RELIANCE.NS",
        name="Reliance Industries Ltd",
        asset_class="equity",
        sector="Energy",
        category="indian_equity",
        currency="INR",
        annual_return=0.15,
        annual_volatility=0.22,
    )
    assert asset.ticker == "RELIANCE.NS"
    assert asset.is_synthetic is False


def test_evidence_item_id_pattern():
    item = EvidenceItem(
        id="E1",
        kind="metric",
        label="Historical Sharpe",
        value=1.42,
        unit="ratio",
        as_of="2026-10-05T00:00:00Z",
        source_service="quant",
        params_hash="abc12345",
    )
    assert item.id == "E1"

    # Invalid ID pattern must fail
    with pytest.raises(ValidationError):
        EvidenceItem(
            id="INVALID_ID",
            kind="metric",
            label="Historical Sharpe",
            value=1.42,
            as_of="2026-10-05T00:00:00Z",
            source_service="quant",
            params_hash="abc12345",
        )


def test_decision_brief_schema():
    brief = DecisionBrief(
        summary="Adding RELIANCE increases Sharpe ratio from 1.12 to 1.25.",
        candidate_ticker="RELIANCE.NS",
        bull_case=["Strong domestic market position", "Positive margin expansion"],
        bear_case=["High capital expenditure in retail/telecom"],
        currency_view="Local INR asset, zero FX drag",
        sentiment_view="70% positive headlines in last 30 days",
        regime_view="Favorable interest rate environment",
        risks=["Commodity cycle downturn"],
        what_would_change_this=["Global oil crash"],
        confidence=ConfidenceRating(level="high", reason="Extensive historical financial data"),
        claims=[Claim(text="Sharpe improves to 1.25", evidence_ids=["E1", "E2"])],
    )
    assert brief.candidate_ticker == "RELIANCE.NS"
    assert len(brief.claims) == 1
    assert "educational" in brief.disclaimer.lower()


def test_optimization_request_validation():
    req = OptimizationRequest(
        tickers=["RELIANCE.NS", "TCS.NS"],
        risk_score=7,
        asset_cap=0.20,
    )
    assert req.risk_score == 7
    assert req.use_shrinkage is True

    # Risk score > 10 should fail
    with pytest.raises(ValidationError):
        OptimizationRequest(
            tickers=["RELIANCE.NS", "TCS.NS"],
            risk_score=11,
        )
