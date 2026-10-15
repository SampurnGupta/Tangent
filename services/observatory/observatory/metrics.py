"""Observatory metrics aggregator and model leaderboard calculator."""

from typing import Any

from common.redis_client import TangentRedisClient, get_redis_client


class ObservatoryService:
    """Aggregates LLM metrics from Redis and calculates performance leaderboards."""

    def __init__(self, redis_client: TangentRedisClient | None = None) -> None:
        self.redis_client = redis_client or get_redis_client()

    async def get_raw_metrics(self) -> dict[str, dict[str, Any]]:
        """Return metrics across all monitored LLM models."""
        return await self.redis_client.get_all_metrics()

    async def get_leaderboard(self) -> list[dict[str, Any]]:
        """Calculate sorted model leaderboard ranked by latency and efficiency."""
        metrics_dict = await self.get_raw_metrics()
        leaderboard = []

        for model, m in metrics_dict.items():
            calls = m.get("call_count", 0)
            avg_lat = m.get("avg_latency_ms", 0.0)
            p50_lat = m.get("p50_latency_ms", 0.0)
            p95_lat = m.get("p95_latency_ms", 0.0)
            tokens_in = m.get("tokens_in", 0)
            tokens_out = m.get("tokens_out", 0)
            total_cost = m.get("total_cost_usd", 0.0)

            # Estimated cost per 1k calls
            cost_per_1k = round((total_cost / calls * 1000.0), 4) if calls > 0 else 0.0
            avg_out_tokens = round(tokens_out / calls, 1) if calls > 0 else 0.0

            # Friendly alias
            display_name = model.split("/")[-1].replace("-versatile", "").upper()
            provider = model.split("/")[0].title()

            leaderboard.append(
                {
                    "model": model,
                    "display_name": display_name,
                    "provider": provider,
                    "call_count": calls,
                    "avg_latency_ms": avg_lat,
                    "p50_latency_ms": p50_lat,
                    "p95_latency_ms": p95_lat,
                    "tokens_in": tokens_in,
                    "tokens_out": tokens_out,
                    "avg_tokens_per_response": avg_out_tokens,
                    "total_cost_usd": total_cost,
                    "cost_per_1k_calls": cost_per_1k,
                }
            )

        # Sort primarily by p50 latency (fastest first, uncalled models last)
        leaderboard.sort(
            key=lambda x: (
                0 if x["call_count"] > 0 else 1,
                x["p50_latency_ms"] if x["call_count"] > 0 else 999999,
            )
        )
        return leaderboard
