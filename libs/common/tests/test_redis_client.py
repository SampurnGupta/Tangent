"""Unit tests for TangentRedisClient and its resilience fallbacks."""

import pytest
from common.redis_client import TangentRedisClient


@pytest.mark.asyncio
async def test_redis_session_memory_sliding_window():
    """Verify session memory stores messages, trims to window, and retrieves history."""
    client = TangentRedisClient(redis_url="redis://localhost:9999/0")  # will use fallback
    session_id = "test-session-123"
    persona = "macro"

    # Initially empty
    hist0 = await client.get_session_history(session_id, persona)
    assert len(hist0) == 0

    # Save 25 messages to test 20-message sliding window
    for i in range(25):
        await client.save_session_message(
            session_id=session_id,
            persona_id=persona,
            role="user" if i % 2 == 0 else "assistant",
            content=f"Message {i}",
        )

    hist = await client.get_session_history(session_id, persona, limit=20)
    assert len(hist) == 20
    # First message in history should be Message 5 (0-4 trimmed out)
    assert hist[0]["content"] == "Message 5"
    assert hist[-1]["content"] == "Message 24"

    # Clear session
    cleared = await client.clear_session_history(session_id, persona)
    assert cleared is True
    assert len(await client.get_session_history(session_id, persona)) == 0


@pytest.mark.asyncio
async def test_redis_price_cache_lifecycle():
    """Verify market prices are cached and retrievable."""
    client = TangentRedisClient(redis_url="redis://localhost:9999/0")
    ticker = "RELIANCE.NS"
    period = "2026-09"
    sample_prices = [
        {"price_date": "2026-09-01", "close_price": 2950.0},
        {"price_date": "2026-09-02", "close_price": 2980.5},
    ]

    # Cache miss
    miss = await client.get_cached_prices(ticker, period)
    assert miss is None

    # Cache set
    await client.set_cached_prices(ticker, period, sample_prices, ttl_seconds=3600)

    # Cache hit
    hit = await client.get_cached_prices(ticker, period)
    assert hit is not None
    assert len(hit) == 2
    assert hit[0]["close_price"] == 2950.0


@pytest.mark.asyncio
async def test_redis_llm_metrics_telemetry():
    """Verify LLM telemetry accumulates tokens, cost, and calculates latencies."""
    client = TangentRedisClient(redis_url="redis://localhost:9999/0")
    model = "groq/llama-3.3-70b-versatile"

    # Record 5 calls with varying latencies
    latencies = [150.0, 200.0, 250.0, 300.0, 500.0]
    for idx, lat in enumerate(latencies):
        await client.record_llm_metric(
            call_id=f"call_{idx}",
            model=model,
            persona="growth",
            latency_ms=lat,
            tokens_in=100,
            tokens_out=50,
            cost_usd=0.0001,
        )

    metrics = await client.get_model_metrics(model)
    assert metrics["call_count"] == 5
    assert metrics["tokens_in"] == 500
    assert metrics["tokens_out"] == 250
    assert abs(metrics["total_cost_usd"] - 0.0005) < 1e-6
    assert metrics["avg_latency_ms"] == 280.0
    assert metrics["p50_latency_ms"] == 250.0

    recent = await client.get_recent_calls(limit=10)
    assert len(recent) >= 5
    assert recent[0]["model"] == model
