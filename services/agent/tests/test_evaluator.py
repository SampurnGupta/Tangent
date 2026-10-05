"""Unit tests for agent groundedness evaluation harness."""

from agent.evaluator import evaluate_groundedness_benchmark
from contracts.brief import Claim, ConfidenceRating, DecisionBrief
from contracts.evidence import EvidenceItem, EvidencePack


def test_groundedness_benchmark_clean_brief():
    """Verify clean, properly cited briefs achieve high benchmark pass score."""
    pack = EvidencePack(
        pack_id="pack-test-1",
        ticker="TCS.NS",
        portfolio_hash="hash-1",
        created_at="2026-10-05T00:00:00Z",
        items=[
            EvidenceItem(
                id="E1",
                kind="metric",
                label="Return",
                value=14.2,
                unit="%",
                as_of="2026-10-05T00:00:00Z",
                source_service="quant",
                params_hash="h1",
            ),
            EvidenceItem(
                id="E2",
                kind="metric",
                label="Sharpe",
                value=0.52,
                unit="ratio",
                as_of="2026-10-05T00:00:00Z",
                source_service="quant",
                params_hash="h2",
            ),
        ],
    )

    brief = DecisionBrief(
        candidate_ticker="TCS.NS",
        summary="Portfolio produces an expected return of 14.2% [E1] with a Sharpe ratio of 0.52 [E2].",
        bull_case=["Strong compounding at 14.2% return [E1]."],
        bear_case=["Volatility remains moderate with 0.52 Sharpe [E2]."],
        risks=["Macro market risk"],
        what_would_change_this=["Global interest rate hike"],
        confidence=ConfidenceRating(level="high", reason="Deterministic 3-year sample covariance"),
        claims=[
            Claim(text="Expected return is 14.2%.", evidence_ids=["E1"]),
            Claim(text="Portfolio Sharpe is 0.52.", evidence_ids=["E2"]),
        ],
        disclaimer="Tangent is an educational tool.",
    )

    report = evaluate_groundedness_benchmark([(brief, pack)])

    assert report.total_claims == 2
    assert report.cited_claims == 2
    assert report.numerical_claims_verified == 2
    assert report.directive_violations == 0
    assert report.groundedness_score >= 0.95
    assert report.passed is True


def test_groundedness_benchmark_flags_violations():
    """Verify evaluator penalizes directive language, missing citations, and numerical hallucinations."""
    pack = EvidencePack(
        pack_id="pack-test-2",
        ticker="TITAN.NS",
        portfolio_hash="hash-2",
        created_at="2026-10-05T00:00:00Z",
        items=[
            EvidenceItem(
                id="E1",
                kind="metric",
                label="Return",
                value=12.0,
                unit="%",
                as_of="2026-10-05T00:00:00Z",
                source_service="quant",
                params_hash="h1",
            ),
        ],
    )

    flawed_brief = DecisionBrief(
        candidate_ticker="TITAN.NS",
        summary="You should buy TITAN immediately for a guaranteed return of 45.0%.",
        bull_case=["Surge guaranteed."],
        bear_case=["None."],
        risks=[],
        what_would_change_this=[],
        confidence=ConfidenceRating(level="low", reason="None"),
        claims=[
            Claim(
                text="Guaranteed return of 45.0%.", evidence_ids=["E1"]
            ),  # Hallucinated 45.0% vs real 12.0%
            Claim(
                text="Asset has zero risk.", evidence_ids=["E_UNKNOWN"]
            ),  # Missing in evidence pack
            Claim(text="Fake metric.", evidence_ids=["E99"]),  # Non-existent evidence ID
        ],
        disclaimer="Tangent is an educational tool.",
    )

    report = evaluate_groundedness_benchmark([(flawed_brief, pack)])

    assert report.total_claims == 3
    assert report.directive_violations > 0
    assert report.numerical_claims_verified < report.total_claims
    assert report.passed is False
    assert report.groundedness_score < 0.60
