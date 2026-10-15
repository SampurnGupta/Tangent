"""Scoped Redis client for Tangent: session memory, price caching, and LLM telemetry.

Falls back gracefully to in-memory storage if Redis is unreachable, ensuring
deterministic offline development and unit tests.
"""

from __future__ import annotations

import json
import os
import time
from typing import Any, Optional

import redis.asyncio as aioredis

from common.logging import get_logger

logger = get_logger("tangent-redis")


class InMemoryFallbackStorage:
    """Thread-safe in-memory fallback mimicking Redis when connection is absent or offline."""

    def __init__(self) -> None:
        self._sessions: dict[str, list[dict[str, Any]]] = {}
        self._prices: dict[str, tuple[float, list[dict[str, Any]]]] = {}
        self._metrics: dict[str, dict[str, Any]] = {}
        self._calls: list[dict[str, Any]] = []

    def push_session(
        self, key: str, message: dict[str, Any], max_items: int = 20
    ) -> list[dict[str, Any]]:
        if key not in self._sessions:
            self._sessions[key] = []
        self._sessions[key].append(message)
        if len(self._sessions[key]) > max_items:
            self._sessions[key] = self._sessions[key][-max_items:]
        return list(self._sessions[key])

    def get_session(self, key: str) -> list[dict[str, Any]]:
        return list(self._sessions.get(key, []))

    def clear_session(self, key: str) -> bool:
        if key in self._sessions:
            del self._sessions[key]
            return True
        return False

    def set_price(self, key: str, prices: list[dict[str, Any]], ttl: int = 86400) -> None:
        expiry = time.time() + ttl
        self._prices[key] = (expiry, prices)

    def get_price(self, key: str) -> Optional[list[dict[str, Any]]]:
        item = self._prices.get(key)
        if not item:
            return None
        expiry, data = item
        if time.time() > expiry:
            del self._prices[key]
            return None
        return data

    def record_metric(self, model: str, call: dict[str, Any]) -> None:
        self._calls.insert(0, call)
        if len(self._calls) > 500:
            self._calls.pop()

        if model not in self._metrics:
            self._metrics[model] = {
                "call_count": 0,
                "tokens_in": 0,
                "tokens_out": 0,
                "total_cost_usd": 0.0,
                "total_latency_ms": 0.0,
                "latencies": [],
            }
        m = self._metrics[model]
        m["call_count"] += 1
        m["tokens_in"] += call.get("tokens_in", 0)
        m["tokens_out"] += call.get("tokens_out", 0)
        m["total_cost_usd"] += call.get("cost_usd", 0.0)
        lat = call.get("latency_ms", 0.0)
        m["total_latency_ms"] += lat
        m["latencies"].append(lat)
        if len(m["latencies"]) > 200:
            m["latencies"].pop(0)

    def get_model_metrics(self, model: str) -> dict[str, Any]:
        m = self._metrics.get(model)
        if not m or m["call_count"] == 0:
            return {
                "model": model,
                "call_count": 0,
                "tokens_in": 0,
                "tokens_out": 0,
                "total_cost_usd": 0.0,
                "avg_latency_ms": 0.0,
                "p50_latency_ms": 0.0,
                "p95_latency_ms": 0.0,
            }
        latencies = sorted(m["latencies"])
        n = len(latencies)
        p50 = latencies[int(n * 0.50)] if n > 0 else 0.0
        p95 = latencies[min(n - 1, int(n * 0.95))] if n > 0 else 0.0
        return {
            "model": model,
            "call_count": m["call_count"],
            "tokens_in": m["tokens_in"],
            "tokens_out": m["tokens_out"],
            "total_cost_usd": round(m["total_cost_usd"], 6),
            "avg_latency_ms": round(m["total_latency_ms"] / m["call_count"], 1),
            "p50_latency_ms": round(p50, 1),
            "p95_latency_ms": round(p95, 1),
        }

    def get_all_metrics(self) -> dict[str, dict[str, Any]]:
        return {model: self.get_model_metrics(model) for model in self._metrics}

    def get_recent_calls(self, limit: int = 50) -> list[dict[str, Any]]:
        return list(self._calls[:limit])


class TangentRedisClient:
    """Async Redis manager with targeted scopes: session memory, prices, and LLM metrics."""

    def __init__(self, redis_url: Optional[str] = None) -> None:
        self.redis_url = (
            redis_url
            or os.getenv("UPSTASH_REDIS_URL")
            or os.getenv("REDIS_URL")
            or "redis://localhost:6379/0"
        )
        self._client: Optional[aioredis.Redis] = None
        self._fallback = InMemoryFallbackStorage()
        self._connected: Optional[bool] = None

    async def _get_client(self) -> Optional[aioredis.Redis]:
        """Lazy initialization of async Redis client."""
        if self._client is not None:
            return self._client
        try:
            client = aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=1.5,
                socket_timeout=1.5,
            )
            # Probe connection
            await client.ping()
            self._client = client
            self._connected = True
            logger.info("Connected to Redis at %s", self.redis_url.split("@")[-1])
            return self._client
        except Exception as e:
            logger.warning(
                "Redis unavailable at %s (%s). Using in-memory fallback storage.",
                self.redis_url.split("@")[-1],
                str(e),
            )
            self._connected = False
            return None

    # ───────────────────────────────────────────────────────────────────────────
    # 1. Use Case 1: Persona Chat Session Memory
    # ───────────────────────────────────────────────────────────────────────────
    async def save_session_message(
        self,
        session_id: str,
        persona_id: str,
        role: str,
        content: str,
        meta: Optional[dict[str, Any]] = None,
        ttl_seconds: int = 7200,
    ) -> list[dict[str, Any]]:
        """Append message to session history (sliding window 20 turns) with 2-hour TTL."""
        key = f"session:{session_id}:{persona_id}"
        message = {
            "role": role,
            "content": content,
            "timestamp": time.time(),
            "meta": meta or {},
        }
        client = await self._get_client()
        if client:
            try:
                raw_msg = json.dumps(message)
                pipe = client.pipeline()
                pipe.rpush(key, raw_msg)
                pipe.ltrim(key, -20, -1)  # Keep last 20 messages
                pipe.expire(key, ttl_seconds)
                await pipe.execute()
                items = await client.lrange(key, 0, -1)
                return [json.loads(item) for item in items]
            except Exception as ex:
                logger.warning("Redis save_session_message error: %s. Using fallback.", ex)
        return self._fallback.push_session(key, message, max_items=20)

    async def get_session_history(
        self, session_id: str, persona_id: str, limit: int = 20
    ) -> list[dict[str, Any]]:
        """Retrieve recent messages for the given session and persona."""
        key = f"session:{session_id}:{persona_id}"
        client = await self._get_client()
        if client:
            try:
                items = await client.lrange(key, -limit, -1)
                return [json.loads(item) for item in items]
            except Exception as ex:
                logger.warning("Redis get_session_history error: %s. Using fallback.", ex)
        return self._fallback.get_session(key)[-limit:]

    async def clear_session_history(self, session_id: str, persona_id: str) -> bool:
        """Clear conversation history for a given session."""
        key = f"session:{session_id}:{persona_id}"
        client = await self._get_client()
        if client:
            try:
                await client.delete(key)
                return True
            except Exception as ex:
                logger.warning("Redis clear_session_history error: %s", ex)
        return self._fallback.clear_session(key)

    # ───────────────────────────────────────────────────────────────────────────
    # 2. Use Case 2: Market Price Cache (24-hour TTL)
    # ───────────────────────────────────────────────────────────────────────────
    async def get_cached_prices(
        self, ticker: str, period_key: str
    ) -> Optional[list[dict[str, Any]]]:
        """Fetch cached OHLC / daily close prices for ticker."""
        key = f"prices:{ticker}:{period_key}"
        client = await self._get_client()
        if client:
            try:
                data = await client.get(key)
                if data:
                    return json.loads(data)
            except Exception as ex:
                logger.warning("Redis get_cached_prices error: %s", ex)
        return self._fallback.get_price(key)

    async def set_cached_prices(
        self, ticker: str, period_key: str, prices: list[dict[str, Any]], ttl_seconds: int = 86400
    ) -> bool:
        """Cache OHLC prices with 24-hour TTL."""
        key = f"prices:{ticker}:{period_key}"
        client = await self._get_client()
        if client:
            try:
                await client.set(key, json.dumps(prices), ex=ttl_seconds)
                return True
            except Exception as ex:
                logger.warning("Redis set_cached_prices error: %s", ex)
        self._fallback.set_price(key, prices, ttl=ttl_seconds)
        return True

    # ───────────────────────────────────────────────────────────────────────────
    # 3. Use Case 3: LLM Metrics & Telemetry for Observatory
    # ───────────────────────────────────────────────────────────────────────────
    async def record_llm_metric(
        self,
        call_id: str,
        model: str,
        persona: str,
        latency_ms: float,
        tokens_in: int,
        tokens_out: int,
        cost_usd: float,
    ) -> dict[str, Any]:
        """Record real-time telemetry from an LLM invocation."""
        call_record = {
            "call_id": call_id,
            "model": model,
            "persona": persona,
            "latency_ms": round(latency_ms, 2),
            "tokens_in": tokens_in,
            "tokens_out": tokens_out,
            "cost_usd": round(cost_usd, 6),
            "timestamp": time.time(),
        }
        client = await self._get_client()
        if client:
            try:
                # 1. Update cumulative hash
                metrics_key = f"llm:metrics:{model}"
                pipe = client.pipeline()
                pipe.hincrby(metrics_key, "call_count", 1)
                pipe.hincrby(metrics_key, "tokens_in", tokens_in)
                pipe.hincrby(metrics_key, "tokens_out", tokens_out)
                pipe.hincrbyfloat(metrics_key, "total_cost_usd", cost_usd)
                pipe.hincrbyfloat(metrics_key, "total_latency_ms", latency_ms)

                # 2. Append call to rolling list of recent calls (keep 500)
                pipe.lpush("llm:recent_calls", json.dumps(call_record))
                pipe.ltrim("llm:recent_calls", 0, 499)

                # 3. Add to sorted set for percentile latency ranking
                pipe.zadd(f"llm:latency:{model}", {call_id: latency_ms})
                # Retain last 200 items in zset
                pipe.zremrangebyrank(f"llm:latency:{model}", 0, -201)

                await pipe.execute()
                return call_record
            except Exception as ex:
                logger.warning("Redis record_llm_metric error: %s", ex)

        self._fallback.record_metric(model, call_record)
        return call_record

    async def get_model_metrics(self, model: str) -> dict[str, Any]:
        """Fetch cumulative token, cost, and latency percentiles for a model."""
        client = await self._get_client()
        if client:
            try:
                metrics_key = f"llm:metrics:{model}"
                data = await client.hgetall(metrics_key)
                if data and int(data.get("call_count", 0)) > 0:
                    calls = int(data.get("call_count", 0))
                    total_lat = float(data.get("total_latency_ms", 0.0))
                    # Percentiles from zset
                    z_items = await client.zrange(f"llm:latency:{model}", 0, -1, withscores=True)
                    scores: list[float] = []
                    for item in z_items:
                        if isinstance(item, tuple) and len(item) == 2:
                            scores.append(float(item[1]))
                    scores.sort()
                    n = len(scores)
                    p50_val: float = scores[int(n * 0.50)] if n > 0 else 0.0
                    p95_val: float = scores[min(n - 1, int(n * 0.95))] if n > 0 else 0.0

                    return {
                        "model": model,
                        "call_count": calls,
                        "tokens_in": int(data.get("tokens_in", 0)),
                        "tokens_out": int(data.get("tokens_out", 0)),
                        "total_cost_usd": round(float(data.get("total_cost_usd", 0.0)), 6),
                        "avg_latency_ms": round(total_lat / calls, 1),
                        "p50_latency_ms": round(p50_val, 1),
                        "p95_latency_ms": round(p95_val, 1),
                    }
            except Exception as ex:
                logger.warning("Redis get_model_metrics error: %s", ex)
        return self._fallback.get_model_metrics(model)

    async def get_all_metrics(self) -> dict[str, dict[str, Any]]:
        """Fetch comparison metrics for all monitored models."""
        known_models = [
            "gemini/gemini-2.0-flash",
            "groq/llama-3.3-70b-versatile",
            "mistral/mistral-small-latest",
            "ollama/llama3.2:3b",
        ]
        results = {}
        for m in known_models:
            results[m] = await self.get_model_metrics(m)
        return results

    async def get_recent_calls(self, limit: int = 50) -> list[dict[str, Any]]:
        """Fetch recent calls across models."""
        client = await self._get_client()
        if client:
            try:
                items = await client.lrange("llm:recent_calls", 0, limit - 1)
                if items:
                    return [json.loads(item) for item in items]
            except Exception as ex:
                logger.warning("Redis get_recent_calls error: %s", ex)
        return self._fallback.get_recent_calls(limit=limit)

    async def close(self) -> None:
        """Close Redis connection pool cleanly."""
        if self._client is not None:
            await self._client.aclose()
            self._client = None


# Singleton instance
_global_redis_client: Optional[TangentRedisClient] = None


def get_redis_client(redis_url: Optional[str] = None) -> TangentRedisClient:
    """Return shared TangentRedisClient singleton."""
    global _global_redis_client
    if _global_redis_client is None:
        _global_redis_client = TangentRedisClient(redis_url=redis_url)
    return _global_redis_client
