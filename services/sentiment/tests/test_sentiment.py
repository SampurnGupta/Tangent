"""Tests for sentiment analysis service."""

import pytest
from httpx import ASGITransport, AsyncClient
from sentiment.main import app
from sentiment.models import HeadlineItem
from sentiment.rss_fetcher import RSSNewsFetcher, compute_content_hash
from sentiment.scorer import score_headlines


@pytest.mark.asyncio
async def test_sentiment_health_and_ready():
    """Verify sentiment health and ready endpoints."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        h_res = await ac.get("/health")
        assert h_res.status_code == 200
        assert h_res.json()["status"] == "ok"

        r_res = await ac.get("/ready")
        assert r_res.status_code == 200
        assert r_res.json()["status"] == "ready"


@pytest.mark.asyncio
async def test_rss_fetcher_fixture_fallback():
    """Verify RSS fetcher gracefully falls back to deterministic fixtures."""
    fetcher = RSSNewsFetcher(demo_mode=True)
    headlines = await fetcher.fetch_headlines_for_ticker("RELIANCE.NS", limit=3)
    assert len(headlines) == 3
    for h in headlines:
        assert h.title != ""
        assert h.content_hash != ""


def test_content_hashing():
    """Verify content hash is stable for identical text."""
    h1 = compute_content_hash("Quarterly earnings surge by 20 percent")
    h2 = compute_content_hash("Quarterly earnings surge by 20 percent")
    h3 = compute_content_hash("Different news headline")
    assert h1 == h2
    assert h1 != h3


def test_lexicon_scorer_logic():
    """Verify sentiment scoring detects bullish and bearish signals."""
    bull_items = [
        HeadlineItem(title="Company expands profits and secures record contract", content_hash="1"),
        HeadlineItem(
            title="Operating margins surge following robust sales growth", content_hash="2"
        ),
    ]
    bull_res = score_headlines("TEST.NS", bull_items)
    assert bull_res.score > 0.0
    assert bull_res.sentiment_label == "bullish"

    bear_items = [
        HeadlineItem(title="Earnings drop as inflation causes heavy deficit", content_hash="3"),
        HeadlineItem(title="Regulatory probe triggers sharp downgrade and fine", content_hash="4"),
    ]
    bear_res = score_headlines("TEST.NS", bear_items)
    assert bear_res.score < 0.0
    assert bear_res.sentiment_label == "bearish"


@pytest.mark.asyncio
async def test_batch_analyze_endpoint():
    """Verify POST /api/v1/sentiment/analyze returns structured sentiment for tickers."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/sentiment/analyze",
            json={"tickers": ["TCS.NS", "SBI_FD"], "limit_per_ticker": 2},
        )
    assert res.status_code == 200
    data = res.json()
    assert "results" in data
    assert "TCS.NS" in data["results"]
    assert "SBI_FD" in data["results"]
    assert "score" in data["results"]["TCS.NS"]
    assert "sentiment_label" in data["results"]["TCS.NS"]
