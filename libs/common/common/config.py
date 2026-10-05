"""Base configuration classes for Tangent microservices using Pydantic Settings."""

from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class BaseAppSettings(BaseSettings):
    """Base settings shared across all Tangent services."""

    service_name: str = "tangent-service"
    app_env: Literal["development", "test", "production"] = "development"
    log_level: str = "INFO"
    json_logs: bool = True
    demo_mode: bool = False

    # Database and Cache
    database_url: str = (
        "postgresql://postgres:postgres@localhost:5432/tangent"  # pragma: allowlist secret
    )
    redis_url: str = "redis://localhost:6379/0"

    # Gateway & Security
    jwt_secret: str = "dev-secret-change-in-production-must-be-32-chars-min"
    jwt_expiry_minutes: int = 1440

    # LLM Settings
    groq_api_key: str = ""
    second_llm_api_key: str = ""
    llm_primary_model: str = "llama-3.3-70b-versatile"
    llm_secondary_model: str = "gemini-1.5-flash"
    llm_mode: Literal["live", "recorded"] = "live"

    # Quant engine defaults
    mc_paths: int = 10000
    mc_seed: int = 42

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )
