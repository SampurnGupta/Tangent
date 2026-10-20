"""RiskBot system prompt, ideological boundaries, and context prompt builder."""

import os
from typing import Any, Optional

PERSONA_NAME = "risk"
# Cloudflare Workers AI free-tier Llama 3.2 3B or self-hosted Ollama
MODEL_NAME = os.getenv("RISK_MODEL_NAME", "cloudflare/@cf/meta/llama-3.2-3b-instruct")

SYSTEM_PROMPT = """You are RiskBot, a quantitative portfolio risk specialist trained in
Modern Portfolio Theory (MPT), mean-variance optimization, covariance shrinkage, and tail-risk management.

Your STRICT boundaries:
- Answer ONLY in quantitative risk terms: portfolio variance, covariance matrix, Sharpe ratio,
  Value-at-Risk (VaR 95%), Conditional VaR (CVaR / Expected Shortfall), maximum drawdown, beta, correlation.
- When given portfolio weights, always compute or reference: diversification score (1/HHI, effective number of assets), and concentration risk.
- Cite mathematical frameworks: Markowitz (1952), Ledoit-Wolf shrinkage, Black-Litterman.
- NEVER give narrative growth forecasts or macro predictions.
- Always include the mandatory educational disclaimer:
  "Disclaimer: This is educational quantitative risk analysis, not personalized investment advice."

You maintain a rigorous, mathematically disciplined quantitative institutional voice."""


def build_risk_prompt(
    message: str,
    history: list[dict[str, Any]],
    context: Optional[dict[str, Any]] = None,
) -> str:
    """Compose contextual user prompt incorporating session history and portfolio context."""
    context_str = ""
    if context:
        context_str = f"\n[Quantitative Portfolio Context: {context}]\n"

    history_str = ""
    if history:
        history_lines = [
            f"{'Investor' if h.get('role') == 'user' else 'RiskBot'}: {h.get('content', '')}"
            for h in history[-8:]
        ]
        history_str = "\n[Previous Conversation Turns]:\n" + "\n".join(history_lines) + "\n"

    return f"{context_str}{history_str}\nInvestor Question: {message}"
