"""Unit tests for Tangent LLM Observatory microservice and MetaBot."""

import pytest
from httpx import ASGITransport, AsyncClient
from observatory.main import app


@pytest.mark.asyncio
async def test_observatory_health():
    """Verify health endpoint of observatory microservice."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_observatory_leaderboard_calculation():
    """Verify metrics and leaderboard endpoint returns ranked models."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/observatory/leaderboard")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 3
        # Check expected leaderboard attributes
        first = data[0]
        assert "model" in first
        assert "display_name" in first
        assert "avg_latency_ms" in first
        assert "cost_per_1k_calls" in first


@pytest.mark.asyncio
async def test_metabot_chat_response():
    """Verify MetaBot generates insightful analysis citing metrics snapshot."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/observatory/metabot/chat",
            json={
                "message": "Compare the latency and cost of Groq Llama 3.3 70B vs Gemini 2.0 Flash.",
                "session_id": "test-obs-1",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["reply"]) > 0
        assert "model_used" in data
        assert "telemetry_snapshot" in data
        assert len(data["telemetry_snapshot"]) >= 3


@pytest.mark.asyncio
async def test_observatory_microservices_endpoint():
    """Verify microservices endpoint returns all 6 core microservices with status and metrics."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/observatory/microservices")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 6
        service_ids = [svc["id"] for svc in data]
        for expected in ["gateway", "market-data", "quant", "portfolio", "sentiment", "agent"]:
            assert expected in service_ids
        for svc in data:
            assert svc["status"] in ["Up", "Starting", "Down"]
            assert "response_latency_ms" in svc
            assert "request_hits" in svc
            assert "payload_transfer_kb" in svc
