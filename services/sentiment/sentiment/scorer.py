"""Deterministic financial lexicon sentiment scorer."""

import re
from typing import Literal

from sentiment.models import HeadlineItem, TickerSentiment

BULLISH_KEYWORDS = {
    "expands",
    "surges",
    "growth",
    "record",
    "rebound",
    "robust",
    "bags",
    "wins",
    "profit",
    "guidance",
    "rises",
    "eases",
    "upgrade",
    "outperforms",
    "inflows",
    "sovereign",
    "preservation",
    "healthy",
    "gain",
    "dividend",
    "acquisition",
}

BEARISH_KEYWORDS = {
    "falls",
    "drops",
    "slumps",
    "downgrade",
    "probe",
    "fine",
    "loss",
    "deficit",
    "inflation",
    "underperforms",
    "fraud",
    "risk",
    "warning",
    "scandal",
    "cut",
    "recession",
    "drag",
    "npa",
    "headwind",
    "litigation",
    "default",
}


def score_headlines(ticker: str, headlines: list[HeadlineItem]) -> TickerSentiment:
    """Compute aggregate sentiment score for headlines using deterministic financial lexicon."""
    if not headlines:
        return TickerSentiment(
            ticker=ticker,
            score=0.0,
            sentiment_label="neutral",
            confidence=0.5,
            headlines=[],
        )

    pos_count = 0
    neg_count = 0
    total_words = 0

    for h in headlines:
        words = set(re.findall(r"\b[a-zA-Z]{3,}\b", h.title.lower()))
        pos_matches = words.intersection(BULLISH_KEYWORDS)
        neg_matches = words.intersection(BEARISH_KEYWORDS)

        pos_count += len(pos_matches)
        neg_count += len(neg_matches)
        total_words += len(words)

    net_score = (pos_count - neg_count) / max(1, (pos_count + neg_count))
    clamped_score = max(-1.0, min(1.0, round(net_score, 3)))

    if clamped_score > 0.15:
        label: Literal["bullish", "neutral", "bearish"] = "bullish"
    elif clamped_score < -0.15:
        label = "bearish"
    else:
        label = "neutral"

    # Confidence scales with number of headlines evaluated
    confidence = min(0.95, round(0.5 + (len(headlines) * 0.08), 2))

    return TickerSentiment(
        ticker=ticker,
        score=clamped_score,
        sentiment_label=label,
        confidence=confidence,
        headlines=headlines,
    )
