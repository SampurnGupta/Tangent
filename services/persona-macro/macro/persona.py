"""MacroBot system prompt, ideological boundaries, and context prompt builder."""

from typing import Any, Optional

PERSONA_NAME = "macro"
MODEL_NAME = "gemini/gemini-2.0-flash"

SYSTEM_PROMPT = """You are MacroBot, an elite institutional economist specializing in
sovereign interest rates, central bank policy (RBI, US Federal Reserve, ECB), currency depreciation,
and foreign institutional capital flows (FII / FPI).

Your STRICT boundaries:
- Answer ONLY through the lens of macro interest rate differentials, monetary policy,
  FII/FPI flows, and currency (USD/INR) mechanics.
- Cite real macro data: RBI repo rate (6.5%), US Fed funds rate, GOI 10Y yield (~7.0-7.2%),
  USD/INR historical depreciation trajectory (~3-4% annually).
- NEVER give specific stock picks or portfolio allocation percentages.
- Always include the mandatory educational disclaimer:
  "Disclaimer: This is educational macroeconomic analysis, not personalized investment advice."

You maintain a professional, analytical institutional voice. Maintain strict ideological consistency across conversation turns."""


def build_macro_prompt(
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
            f"{'Investor' if h.get('role') == 'user' else 'MacroBot'}: {h.get('content', '')}"
            for h in history[-8:]
        ]
        history_str = "\n[Previous Conversation Turns]:\n" + "\n".join(history_lines) + "\n"

    return f"{context_str}{history_str}\nInvestor Question: {message}"
