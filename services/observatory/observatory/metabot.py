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
                primary_model="groq/qwen3.8-27b",
                secondary_model="gemini/gemini-flash-lite-latest",
                temperature=0.3,
            )
        )

    async def _select_best_model(self) -> str:
        """Dynamically pick the best performing model from the observatory leaderboard.

        Evaluates active models ranked by lowest p50/average latency and error rate.
        Falls back to groq/qwen3.8-27b if telemetry is insufficient.
        """
        try:
            leaderboard = await self.observatory.get_leaderboard()
            active_models = [m for m in leaderboard if m.get("call_count", 0) > 0]
            if active_models:
                best = active_models[0].get("model")
                if best and "fixture" not in str(best):
                    return str(best)
        except Exception:
            pass
        return "groq/qwen3.8-27b"

    async def answer(self, question: str, session_id: str) -> dict[str, Any]:
        """Generate analysis citing current live metrics from the observatory."""
        leaderboard = await self.observatory.get_leaderboard()
        microservices = await self.observatory.get_microservices_metrics()
        recent_calls = (await self.observatory.redis_client.get_recent_calls(limit=10)) or []
        selected_model = await self._select_best_model()

        context_data = {
            "selected_model_for_synthesis": selected_model,
            "leaderboard": leaderboard,
            "deterministic_microservices": microservices,
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
            "Directly and concisely answer the User Question above. Cite only the specific metrics relevant to the question. Do not append unrelated boilerplate sections or unprompted fleet summaries."
        )

        resp: LLMResponse = await self.llm_client.complete(
            prompt=prompt,
            system_prompt=METABOT_SYSTEM_PROMPT,
            model_override=selected_model,
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
