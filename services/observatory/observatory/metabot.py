"""MetaBot engine: Explains LLM performance benchmarks and architectural trade-offs."""

import json
from typing import Any

from llm.client import LLMConfig, LLMResponse, ResilientLLMClient

from observatory.metrics import ObservatoryService
from observatory.persona import METABOT_SYSTEM_PROMPT


class MetaBotEngine:
    """Conversational DevOps analyst that interprets Tangent LLM performance data."""

    def __init__(self, observatory: ObservatoryService) -> None:
        self.observatory = observatory
        self.llm_client = ResilientLLMClient(
            LLMConfig(
                primary_model="groq/llama-3.3-70b-versatile",
                secondary_model="gemini/gemini-2.0-flash",
                temperature=0.3,
            )
        )

    async def answer(self, question: str, session_id: str) -> dict[str, Any]:
        """Generate analysis citing current live metrics from the observatory."""
        leaderboard = await self.observatory.get_leaderboard()
        recent_calls = await self.observatory.redis_client.get_recent_calls(limit=10)

        context_data = {
            "leaderboard": leaderboard,
            "sample_recent_inferences": [
                {
                    "model": c.get("model"),
                    "persona": c.get("persona"),
                    "latency_ms": c.get("latency_ms"),
                    "tokens_in": c.get("tokens_in"),
                    "tokens_out": c.get("tokens_out"),
                    "cost_usd": c.get("cost_usd"),
                }
                for c in recent_calls
            ],
        }

        context_summary = json.dumps(context_data, indent=2)

        prompt = (
            f"[Live Telemetry Data from Redis]:\n{context_summary}\n\n"
            f"User Question: {question}\n\n"
            "Provide a rigorous, metric-backed analysis citing the exact latency, token, and cost data above."
        )

        resp: LLMResponse = await self.llm_client.complete(
            prompt=prompt,
            system_prompt=METABOT_SYSTEM_PROMPT,
            persona="metabot",
        )

        return {
            "reply": resp.text,
            "model_used": resp.model,
            "tokens_in": resp.tokens_in,
            "tokens_out": resp.tokens_out,
            "latency_ms": resp.latency_ms,
            "cost_usd": resp.cost_estimate_usd,
            "telemetry_snapshot": leaderboard,
        }
