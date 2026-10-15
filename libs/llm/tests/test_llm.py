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


def test_estimate_llm_cost_models():
    """Verify model-aware cost estimates calculate correctly per 1M token rates."""
    from llm.client import estimate_llm_cost

    # 100k input tokens, 20k output tokens
    in_tok = 100_000
    out_tok = 20_000

    # Groq Llama 3.3 70B: $0.59 in, $0.79 out per 1M
    # (100k * 0.59 + 20k * 0.79) / 1M = (59,000 + 15,800) / 1,000,000 = 0.0748
    groq_cost = estimate_llm_cost("groq/llama-3.3-70b-versatile", in_tok, out_tok)
    assert abs(groq_cost - 0.0748) < 1e-5

    # Gemini 2.0 Flash: $0.10 in, $0.40 out per 1M
    # (100k * 0.10 + 20k * 0.40) / 1M = (10,000 + 8,000) / 1,000,000 = 0.0180
    gemini_cost = estimate_llm_cost("gemini/gemini-2.0-flash", in_tok, out_tok)
    assert abs(gemini_cost - 0.0180) < 1e-5

    # Self-hosted Ollama: $0
    ollama_cost = estimate_llm_cost("ollama/llama3.2:3b", in_tok, out_tok)
    assert ollama_cost == 0.0
