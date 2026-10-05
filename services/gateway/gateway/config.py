"""Gateway service configuration."""

from common.config import BaseAppSettings


class GatewaySettings(BaseAppSettings):
    """Configuration settings for the Tangent API Gateway."""

    service_name: str = "tangent-gateway"
    jwt_secret: str = (
        "tangent-insecure-dev-jwt-secret-key-change-in-prod"  # pragma: allowlist secret
    )
    jwt_algorithm: str = "HS256"
    jwt_exp_hours: int = 24
    rate_limit_per_minute: int = 120

    market_data_url: str = "http://localhost:8001"
    quant_url: str = "http://localhost:8002"
    portfolio_url: str = "http://localhost:8003"
    sentiment_url: str = "http://localhost:8004"
    agent_url: str = "http://localhost:8005"

    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
