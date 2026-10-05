"""Unit and integration tests for market-data service."""

import pytest
from httpx import ASGITransport, AsyncClient
from market_data.main import create_app
from market_data.provider import CompositeMarketDataProvider, FixtureMarketDataProvider


@pytest.fixture
def app():
    return create_app()


@pytest.mark.asyncio
async def test_health_and_ready_endpoints(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_list_assets_curated_universe(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/assets")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] > 10
        tickers = [a["ticker"] for a in data["assets"]]
        assert "^NSEI" in tickers
        assert "RELIANCE.NS" in tickers
        assert "SBI_FD" in tickers


@pytest.mark.asyncio
async def test_fetch_prices_and_fx_conversion(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "tickers": ["RELIANCE.NS", "SPY"],
            "start_date": "2024-01-01",
            "end_date": "2024-01-15",
            "convert_to_inr": True,
        }
        resp = await client.post("/api/v1/prices", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "RELIANCE.NS" in data["series"]
        assert "SPY" in data["series"]
        assert len(data["series"]["RELIANCE.NS"]) > 0
        # SPY prices should be converted to INR (~40k+ instead of ~500 USD)
        spy_first = data["series"]["SPY"][0]["close_price"]
        assert spy_first > 1000.0


def test_provider_outage_fallback():
    """Verify that if primary fails, CompositeProvider cleanly falls back to fixtures."""
    composite = CompositeMarketDataProvider(demo_mode=False)

    # Force primary to fail
    def failing_fetch(*args, **kwargs):
        raise ConnectionError("Simulated YFinance API timeout")

    composite.primary.fetch_prices = failing_fetch

    # Should fall back cleanly without raising
    points = composite.fetch_prices("TCS.NS", "2024-01-01", "2024-01-10")
    assert len(points) > 0
    assert points[0].close_price > 0


def test_fixture_provider_deterministic_seed():
    """Verify same seed produces exact same price history."""
    p1 = FixtureMarketDataProvider(seed=42)
    p2 = FixtureMarketDataProvider(seed=42)

    series1 = p1.fetch_prices("INFY.NS", "2024-01-01", "2024-02-01")
    series2 = p2.fetch_prices("INFY.NS", "2024-01-01", "2024-02-01")

    assert len(series1) == len(series2)
    for pt1, pt2 in zip(series1, series2):
        assert pt1.price_date == pt2.price_date
        assert pt1.close_price == pt2.close_price
