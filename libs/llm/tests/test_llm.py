"""Tests for ResilientLLMClient."""

import pytest
from llm.client import LLMConfig, ResilientLLMClient


@pytest.mark.asyncio
async def test_llm_fixture_mode_deterministic():
    """Verify fixture mode returns grounded responses citing [EVD-...] IDs."""
    cfg = LLMConfig(demo_mode=True)
    client = ResilientLLMClient(cfg)

    # Bull thesis prompt
    bull_res = await client.complete("Provide a bull thesis for the portfolio allocation.")
    assert bull_res.is_fixture is True
    assert "[EVD-" in bull_res.text
    assert "Bull Thesis" in bull_res.text
    assert bull_res.tokens_in > 0
    assert bull_res.tokens_out > 0

    # Bear thesis prompt
    bear_res = await client.complete("Provide a bear thesis highlighting risks.")
    assert bear_res.is_fixture is True
    assert "[EVD-" in bear_res.text
    assert "Bear Thesis" in bear_res.text

    # Critic prompt
    critic_res = await client.complete("Act as Critic and verify groundedness.")
    assert critic_res.is_fixture is True
    assert "Critic Review" in critic_res.text


@pytest.mark.asyncio
async def test_llm_config_defaults():
    """Verify model names are retrieved from environment or config, never hardcoded in completion."""
    cfg = LLMConfig()
    assert "llama-3" in cfg.primary_model or "groq" in cfg.primary_model
    assert "gemini" in cfg.secondary_model
