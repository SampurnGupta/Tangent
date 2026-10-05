"""Data models for news headlines and sentiment results."""

from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field


class HeadlineItem(BaseModel):
    """Normalized news headline item."""

    title: str
    source: str = "RSS"
    url: Optional[str] = None
    published_at: Optional[str] = None
    content_hash: str


class TickerSentiment(BaseModel):
    """Computed sentiment score and headlines for a single ticker."""

    ticker: str
    score: float = Field(
        ..., ge=-1.0, le=1.0, description="Sentiment score from -1.0 (bearish) to +1.0 (bullish)"
    )
    sentiment_label: Literal["bullish", "neutral", "bearish"]
    confidence: float = Field(..., ge=0.0, le=1.0)
    headlines: list[HeadlineItem] = Field(default_factory=list)


class SentimentAnalyzeRequest(BaseModel):
    """Request payload for sentiment analysis across multiple tickers."""

    tickers: list[str] = Field(..., min_length=1)
    limit_per_ticker: int = Field(default=5, ge=1, le=20)


class SentimentAnalyzeResponse(BaseModel):
    """Aggregate sentiment analysis response."""

    results: dict[str, TickerSentiment]
    as_of: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
