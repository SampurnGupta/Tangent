"""Unit tests for portfolio service."""

import pytest
from httpx import ASGITransport, AsyncClient
from portfolio.main import create_app


@pytest.fixture
def app():
    return create_app()


@pytest.mark.asyncio
async def test_health_endpoint(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_guest_user_creation_and_portfolio_saving(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create guest user
        resp = await client.post("/api/v1/users/guest")
        assert resp.status_code == 200
        data = resp.json()
        assert "user_id" in data
        assert data["user_id"].startswith("guest_")
        uid = data["user_id"]

        # Save portfolio
        port_payload = {
            "user_id": uid,
            "name": "My Growth Portfolio",
            "risk_score": 7,
            "weights": {"RELIANCE.NS": 0.15, "TCS.NS": 0.15, "SBI_FD": 0.70},
            "expected_return": 0.085,
            "annual_volatility": 0.09,
            "sharpe_ratio": 0.94,
        }
        p_resp = await client.post("/api/v1/portfolios", json=port_payload)
        assert p_resp.status_code == 200
        assert "portfolio_id" in p_resp.json()

        # List portfolios
        list_resp = await client.get(f"/api/v1/portfolios?user_id={uid}")
        assert list_resp.status_code == 200
        ports = list_resp.json()
        assert len(ports) >= 1
        assert ports[0]["name"] == "My Growth Portfolio"

        # Record audit run
        run_payload = {
            "user_id": uid,
            "risk_score": 7,
            "weights": port_payload["weights"],
            "metrics": {"sharpe": 0.94, "real_return": 0.085},
            "assumptions_hash": "hash_12345",
            "mc_seed": 42,
        }
        r_resp = await client.post("/api/v1/runs", json=run_payload)
        assert r_resp.status_code == 200
        assert "run_id" in r_resp.json()
