"""Tests for Tangent API Gateway auth, routing, and rate limiting."""

import pytest
from gateway.auth import create_access_token, decode_access_token
from gateway.config import GatewaySettings
from gateway.limiter import SlidingWindowRateLimiter
from gateway.main import app
from httpx import ASGITransport, AsyncClient


@pytest.mark.asyncio
async def test_gateway_health():
    """Verify gateway health endpoint returns 200."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "tangent-gateway"


@pytest.mark.asyncio
async def test_gateway_ready():
    """Verify gateway ready endpoint responds in demo/fallback mode."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/ready")
    assert resp.status_code in (200, 503)
    data = resp.json()
    assert "checks" in data


@pytest.mark.asyncio
async def test_guest_auth_lifecycle():
    """Verify guest JWT token issuance and subsequent verification."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Issue guest token
        guest_res = await ac.post("/api/v1/auth/guest")
        assert guest_res.status_code == 200
        guest_data = guest_res.json()
        assert "access_token" in guest_data
        assert guest_data["token_type"] == "bearer"
        assert guest_data["is_guest"] is True
        token = guest_data["access_token"]
        user_id = guest_data["user_id"]

        # 2. Verify /api/v1/auth/me with valid Bearer token
        me_res = await ac.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_res.status_code == 200
        me_data = me_res.json()
        assert me_data["user_id"] == user_id
        assert me_data["is_guest"] is True


@pytest.mark.asyncio
async def test_auth_me_rejects_missing_or_bad_token():
    """Verify unauthenticated requests to protected auth/me are rejected."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # No header
        res1 = await ac.get("/api/v1/auth/me")
        assert res1.status_code == 401

        # Invalid token
        res2 = await ac.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer not.a.valid.jwt.token"},
        )
        assert res2.status_code == 401


def test_sliding_window_rate_limiter():
    """Verify limiter enforces max requests within sliding window."""
    limiter = SlidingWindowRateLimiter(max_requests=3, window_seconds=10)
    key = "127.0.0.1"

    assert limiter.is_allowed(key) is True
    assert limiter.is_allowed(key) is True
    assert limiter.is_allowed(key) is True
    # 4th request must be rejected
    assert limiter.is_allowed(key) is False

    # Different key is still allowed
    assert limiter.is_allowed("192.168.1.1") is True


def test_token_codec_roundtrip():
    """Verify create_access_token and decode_access_token symmetry."""
    cfg = GatewaySettings()
    uid = "test-user-uuid-1234"
    tok = create_access_token(user_id=uid, settings=cfg, is_guest=False)
    decoded = decode_access_token(tok, cfg)
    assert decoded["sub"] == uid
    assert decoded["is_guest"] is False
    assert "exp" in decoded
