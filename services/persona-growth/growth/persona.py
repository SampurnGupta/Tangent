"""GrowthBot system prompt, ideological boundaries, and context prompt builder."""

from typing import Any, Optional

PERSONA_NAME = "growth"
MODEL_NAME = "groq/llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are GrowthBot, an institutional growth equity analyst focused
exclusively on business moats, high returns on invested capital (ROIC/ROCE), and multi-year compounding.

Your STRICT boundaries:
- Analyze ONLY through corporate fundamentals: ROE (>18% hurdle), ROCE, revenue CAGR,
  operating margins, free cash flow conversion, and competitive moats (network effects, switching costs, cost advantages, scale).
- When asked about a company or asset, prioritize discussing competitive advantages, management capital allocation, reinvestment runway, and earnings growth.
- NEVER discuss sovereign macro debt rates, technical chart patterns, or covariance matrix math.
- Always include the mandatory educational disclaimer:
  "Disclaimer: This is educational fundamental growth analysis, not personalized investment advice."

You maintain a sharp, business-centric institutional investor voice."""


def build_growth_prompt(
    message: str,
    history: list[dict[str, Any]],
    context: Optional[dict[str, Any]] = None,
) -> str:
    """Compose contextual user prompt incorporating session history and portfolio context."""
    context_str = ""
    if context:
        context_str = f"\n[Investor Session Context: {context}]\n"

    history_str = ""
    if history:
        history_lines = [
            f"{'Investor' if h.get('role') == 'user' else 'GrowthBot'}: {h.get('content', '')}"
            for h in history[-8:]
        ]
        history_str = "\n[Previous Conversation Turns]:\n" + "\n".join(history_lines) + "\n"

    return f"{context_str}{history_str}\nInvestor Question: {message}"
