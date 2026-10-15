"""Unit tests for RiskBot persona service."""

import pytest
from httpx import ASGITransport, AsyncClient
from risk.main import app
from risk.persona import MODEL_NAME, PERSONA_NAME


@pytest.mark.asyncio
async def test_risk_health():
    """Verify RiskBot health check returns model identity."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["persona"] == PERSONA_NAME
        assert data["model"] == MODEL_NAME


@pytest.mark.asyncio
async def test_risk_chat_session_lifecycle():
    """Verify conversational turn, Redis session persistence, and session clearance."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        session_id = "test-risk-sess-1"

        # Turn 1
        chat_resp = await client.post(
            "/chat",
            json={
                "session_id": session_id,
                "message": "Calculate VaR 95% and diversification score for my portfolio.",
                "context": {
                    "portfolio_weights": {"RELIANCE.NS": 0.5, "TCS.NS": 0.5},
                    "var_95": 42000.0,
                    "cvar_95": 58000.0,
                },
            },
        )
        assert chat_resp.status_code == 200
        data = chat_resp.json()
        assert data["persona"] == "risk"
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
