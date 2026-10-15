"""Unit tests for MacroBot persona service."""

import pytest
from httpx import ASGITransport, AsyncClient
from macro.main import app
from macro.persona import MODEL_NAME, PERSONA_NAME


@pytest.mark.asyncio
async def test_macro_health():
    """Verify MacroBot health check returns model identity."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["persona"] == PERSONA_NAME
        assert data["model"] == MODEL_NAME


@pytest.mark.asyncio
async def test_macro_chat_session_lifecycle():
    """Verify conversational turn, Redis session persistence, and session clearance."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        session_id = "test-macro-sess-1"

        # Turn 1
        chat_resp = await client.post(
            "/chat",
            json={
                "session_id": session_id,
                "message": "What is the impact of RBI rate hikes on debt allocation?",
                "context": {"horizon_years": 10},
            },
        )
        assert chat_resp.status_code == 200
        data = chat_resp.json()
        assert data["persona"] == "macro"
        assert len(data["reply"]) > 0
        assert data["session_message_count"] == 2  # user + assistant

        # Check session retrieval
        sess_resp = await client.get(f"/session/{session_id}")
        assert sess_resp.status_code == 200
        sess_data = sess_resp.json()
        assert sess_data["message_count"] == 2

        # Clear session
        del_resp = await client.delete(f"/session/{session_id}")
        assert del_resp.status_code == 200
        assert del_resp.json()["cleared"] is True

        # Verify cleared
        sess_resp2 = await client.get(f"/session/{session_id}")
        assert sess_resp2.json()["message_count"] == 0
