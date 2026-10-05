"""Tests for BaseAppSettings."""

from common.config import BaseAppSettings


def test_base_settings_defaults():
    settings = BaseAppSettings(service_name="custom-service")
    assert settings.service_name == "custom-service"
    assert settings.app_env in ("development", "test", "production")
    assert settings.mc_paths == 10000
    assert settings.mc_seed == 42
    assert settings.database_url != ""
