"""Unit tests for GrowthBot persona service."""

import pytest
from growth.main import app
from growth.persona import MODEL_NAME, PERSONA_NAME
from httpx import ASGITransport, AsyncClient


@pytest.mark.asyncio
async def test_growth_health():
    """Verify GrowthBot health check returns model identity."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["persona"] == PERSONA_NAME
        assert data["model"] == MODEL_NAME


@pytest.mark.asyncio
async def test_growth_chat_session_lifecycle():
    """Verify conversational turn, Redis session persistence, and session clearance."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        session_id = "test-growth-sess-1"

        # Turn 1
        chat_resp = await client.post(
            "/chat",
            json={
                "session_id": session_id,
                "message": "Analyze TCS's return on capital and competitive moat.",
                "context": {"portfolio_weights": {"TCS.NS": 0.20}},
            },
        )
        assert chat_resp.status_code == 200
        data = chat_resp.json()
        assert data["persona"] == "growth"
        assert len(data["reply"]) > 0
        assert data["session_message_count"] == 2

        # Check session retrieval
        sess_resp = await client.get(f"/session/{session_id}")
        assert sess_resp.status_code == 200
        sess_data = sess_resp.json()
        assert sess_data["message_count"] == 2

        # Clear session
        del_resp = await client.delete(f"/session/{session_id}")
        assert del_resp.status_code == 200
        assert del_resp.json()["cleared"] is True
