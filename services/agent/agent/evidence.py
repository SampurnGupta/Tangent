"""Evidence pack assembly from deterministic backend calculations."""

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Optional

from contracts.evidence import EvidenceItem, EvidencePack


def compute_evidence_hash(params: dict[str, Any]) -> str:
    """Create deterministic parameter fingerprint."""
    serialized = json.dumps(params, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]


def build_evidence_pack(
    ticker: str,
    nominal_return: float,
    real_return: float,
    volatility: float,
    sharpe: float,
    marginal_sharpe_delta: float = 0.0,
    equity_weight: float = 0.65,
    debt_weight: float = 0.25,
    sentiment_score: float = 0.0,
    regime_label: str = "Stable / Low Volatility",
    portfolio_hash: Optional[str] = None,
) -> EvidencePack:
    """Construct EvidencePack with deterministic items adhering to E<number> ID pattern."""
    now = datetime.now(timezone.utc).isoformat()
    p_hash = portfolio_hash or "port-ref-001"

    items = [
        EvidenceItem(
            id="E1",
            kind="metric",
            label="Annualized Nominal Return",
            value=round(nominal_return * 100, 2),
            unit="%",
            as_of=now,
            source_service="quant",
            params_hash=compute_evidence_hash({"metric": "nominal_return", "val": nominal_return}),
        ),
        EvidenceItem(
            id="E2",
            kind="metric",
            label="Real Return (Tax & 6% Inflation Adjusted)",
            value=round(real_return * 100, 2),
            unit="%",
            as_of=now,
            source_service="quant",
            params_hash=compute_evidence_hash({"metric": "real_return", "val": real_return}),
        ),
        EvidenceItem(
            id="E3",
            kind="metric",
            label="Annualized Portfolio Volatility",
            value=round(volatility * 100, 2),
            unit="%",
            as_of=now,
            source_service="quant",
            params_hash=compute_evidence_hash({"metric": "volatility", "val": volatility}),
        ),
        EvidenceItem(
            id="E4",
            kind="metric",
            label="Real Sharpe Ratio",
            value=round(sharpe, 3),
            unit="ratio",
            as_of=now,
            source_service="quant",
            params_hash=compute_evidence_hash({"metric": "sharpe", "val": sharpe}),
        ),
        EvidenceItem(
            id="E5",
            kind="metric",
            label="Marginal Sharpe Delta",
            value=round(marginal_sharpe_delta, 3),
            unit="delta",
            as_of=now,
            source_service="quant",
            params_hash=compute_evidence_hash(
                {"metric": "marginal_delta", "val": marginal_sharpe_delta}
            ),
        ),
        EvidenceItem(
            id="E6",
            kind="metric",
            label="Aggregate Equity Exposure",
            value=round(equity_weight * 100, 1),
            unit="%",
            as_of=now,
            source_service="quant",
            params_hash=compute_evidence_hash({"metric": "equity_weight", "val": equity_weight}),
        ),
        EvidenceItem(
            id="E7",
            kind="metric",
            label="Aggregate Debt / Fixed Income Exposure",
            value=round(debt_weight * 100, 1),
            unit="%",
            as_of=now,
            source_service="quant",
            params_hash=compute_evidence_hash({"metric": "debt_weight", "val": debt_weight}),
        ),
        EvidenceItem(
            id="E8",
            kind="news",
            label="News Sentiment Score",
            value=round(sentiment_score, 2),
            unit="score",
            as_of=now,
            source_service="sentiment",
            params_hash=compute_evidence_hash({"metric": "sentiment", "val": sentiment_score}),
        ),
        EvidenceItem(
            id="E9",
            kind="regime",
            label="Market Regime Context",
            value=regime_label,
            unit="category",
            as_of=now,
            source_service="market-data",
            params_hash=compute_evidence_hash({"metric": "regime", "val": regime_label}),
        ),
    ]

    return EvidencePack(
        pack_id=f"pack-{ticker.lower()}-{compute_evidence_hash({'ticker': ticker, 'date': now})}",
        ticker=ticker,
        portfolio_hash=p_hash,
        items=items,
        created_at=now,
    )
