"""Resilient, provider-agnostic LLM client using LiteLLM."""

import os
import re
import time
import uuid
from typing import Any, Optional

import litellm
from common.logging import get_logger
from common.redis_client import get_redis_client
from pydantic import BaseModel, Field

logger = get_logger("tangent-llm")

# Disable litellm telemetry and set log levels clean
litellm.telemetry = False
litellm.drop_params = True


MODEL_PRICING_PER_1M: dict[str, dict[str, float]] = {
    "groq/llama-3.3-70b-versatile": {"in": 0.59, "out": 0.79},
    "groq/llama-3.3-70b-specdec": {"in": 0.59, "out": 0.79},
    "groq/llama3-8b-8192": {"in": 0.05, "out": 0.08},
    "groq/llama-3.1-8b-instant": {"in": 0.05, "out": 0.08},
    "groq/qwen-2.5-32b": {"in": 0.60, "out": 0.60},
    "groq/qwen-qwq-32b": {"in": 0.60, "out": 0.60},
    "gemini/gemini-2.0-flash": {"in": 0.10, "out": 0.40},
    "gemini/gemini-1.5-flash": {"in": 0.075, "out": 0.30},
    "gemini/gemini-1.5-pro": {"in": 1.25, "out": 5.00},
    "mistral/mistral-small-latest": {"in": 0.10, "out": 0.30},
    "cloudflare/@cf/meta/llama-3.2-3b-instruct": {"in": 0.05, "out": 0.06},
    "cloudflare/@cf/meta/llama-3.1-8b-instruct": {"in": 0.10, "out": 0.15},
    "ollama/llama3.2:3b": {"in": 0.05, "out": 0.06},
}


def estimate_llm_cost(model_name: str, tokens_in: int, tokens_out: int) -> float:
    """Calculate USD cost estimate based on model-specific input/output token pricing per 1M tokens."""
    pricing = MODEL_PRICING_PER_1M.get(model_name)
    if not pricing:
        base_name = model_name.split("/")[-1]
        for k, v in MODEL_PRICING_PER_1M.items():
            if base_name in k:
                pricing = v
                break
    if not pricing:
        pricing = {"in": 0.50, "out": 0.80}

    cost = ((tokens_in * pricing["in"]) + (tokens_out * pricing["out"])) / 1_000_000.0
    return round(cost, 6)


class LLMConfig(BaseModel):
    """Configuration for LLM client execution and model tiers."""

    primary_model: str = Field(
        default_factory=lambda: os.getenv("LLM_PRIMARY_MODEL", "groq/llama-3.3-70b-versatile")
    )
    secondary_model: str = Field(
        default_factory=lambda: os.getenv("LLM_SECONDARY_MODEL", "gemini/gemini-1.5-flash")
    )
    temperature: float = 0.2
    max_tokens: int = 2048
    demo_mode: bool = Field(
        default_factory=lambda: os.getenv("DEMO_MODE", "false").lower() in ("true", "1")
    )


class LLMResponse(BaseModel):
    """Normalized response payload from an LLM invocation."""

    text: str
    model: str
    tokens_in: int = 0
    tokens_out: int = 0
    cost_estimate_usd: float = 0.0
    latency_ms: float = 0.0
    is_fallback: bool = False
    is_fixture: bool = False


class ResilientLLMClient:
    """Provider-agnostic LLM client with primary/secondary failover and fixture mode."""

    def __init__(self, config: Optional[LLMConfig] = None) -> None:
        self.config = config or LLMConfig()

    async def complete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model_override: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[float] = None,
        persona: str = "generic",
    ) -> LLMResponse:
        """Execute chat completion with automatic failover, fixture support, and telemetry."""
        t0 = time.time()

        # 1. Deterministic Fixture Mode (for offline testing & zero-key smoke tests)
        if self.config.demo_mode or (
            not os.getenv("GROQ_API_KEY")
            and not os.getenv("GEMINI_API_KEY")
            and not os.getenv("CLOUDFLARE_API_KEY")
        ):
            res = self._generate_fixture_response(prompt, system_prompt)
            res.latency_ms = round((time.time() - t0) * 1000.0, 2)
            await self._record_telemetry(res, persona)
            return res

        primary = model_override or self.config.primary_model
        secondary = self.config.secondary_model
        temp = temperature if temperature is not None else self.config.temperature
        max_tok = int(max_tokens) if max_tokens is not None else self.config.max_tokens

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        # 2. Try Primary Model
        try:
            resp = await litellm.acompletion(
                model=primary,
                messages=messages,
                temperature=temp,
                max_tokens=max_tok,
                timeout=8.0,
            )
            res = self._parse_litellm_response(resp, primary, is_fallback=False)
            res.latency_ms = round((time.time() - t0) * 1000.0, 2)
            await self._record_telemetry(res, persona)
            return res
        except Exception as primary_err:
            logger.warning(
                "Primary LLM (%s) failed: %s. Attempting secondary failover to %s",
                primary,
                primary_err,
                secondary,
            )

        # 3. Try Secondary Model Failover
        try:
            resp = await litellm.acompletion(
                model=secondary,
                messages=messages,
                temperature=temp,
                max_tokens=max_tok,
                timeout=8.0,
            )
            res = self._parse_litellm_response(resp, secondary, is_fallback=True)
            res.latency_ms = round((time.time() - t0) * 1000.0, 2)
            await self._record_telemetry(res, persona)
            return res
        except Exception as secondary_err:
            logger.error("Secondary LLM (%s) also failed: %s", secondary, secondary_err)

        # 4. Fallback to offline deterministic fixture if both providers fail
        logger.info("Falling back to deterministic fixture response.")
        res = self._generate_fixture_response(
            prompt, system_prompt, is_fallback=True, persona=persona
        )
        res.latency_ms = round((time.time() - t0) * 1000.0, 2)
        await self._record_telemetry(res, persona)
        return res

    async def _record_telemetry(self, res: LLMResponse, persona: str) -> None:
        """Record invocation metrics in Redis telemetry."""
        try:
            call_id = f"call_{uuid.uuid4().hex[:12]}"
            redis_c = get_redis_client()
            await redis_c.record_llm_metric(
                call_id=call_id,
                model=res.model,
                persona=persona,
                latency_ms=res.latency_ms,
                tokens_in=res.tokens_in,
                tokens_out=res.tokens_out,
                cost_usd=res.cost_estimate_usd,
            )
        except Exception as ex:
            logger.debug("Failed recording LLM telemetry: %s", ex)

    def _parse_litellm_response(
        self,
        resp: Any,
        model_name: str,
        is_fallback: bool,
    ) -> LLMResponse:
        """Extract text, usage, and cost estimates from a LiteLLM completion."""
        text = ""
        if hasattr(resp, "choices") and resp.choices:
            text = resp.choices[0].message.content or ""

        tokens_in = 0
        tokens_out = 0
        if hasattr(resp, "usage") and resp.usage:
            tokens_in = getattr(resp.usage, "prompt_tokens", 0) or 0
            tokens_out = getattr(resp.usage, "completion_tokens", 0) or 0

        cost = estimate_llm_cost(model_name, tokens_in, tokens_out)

        return LLMResponse(
            text=text,
            model=model_name,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            cost_estimate_usd=cost,
            is_fallback=is_fallback,
            is_fixture=False,
        )

    def _generate_fixture_response(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        is_fallback: bool = False,
        persona: Optional[str] = None,
    ) -> LLMResponse:
        """Produce a grounded, deterministic fixture response citing evidence IDs."""
        low_prompt = (prompt + (system_prompt or "")).lower()
        low_system = (system_prompt or "").lower()

        # Check only the latest user question, NOT the accumulated chat history
        user_query = (
            prompt.split("Investor Question:")[-1].strip().lower()
            if "Investor Question:" in prompt
            else prompt.strip().lower()
        )

        is_greeting = any(
            re.search(rf"\b{g}\b", user_query)
            for g in [
                "hi",
                "hello",
                "hey",
                "greetings",
                "yo",
                "sup",
                "who are you",
                "what do you do",
                "introduce yourself",
                "help",
            ]
        )

        effective_persona = (persona or "").lower()
        if not effective_persona:
            if "growth" in low_system and "growthbot" in low_system:
                effective_persona = "growth"
            elif "risk" in low_system and "riskbot" in low_system:
                effective_persona = "risk"
            elif "metabot" in low_system or "observatory" in low_system:
                effective_persona = "metabot"
            elif "macro" in low_system:
                effective_persona = "macro"

        if is_greeting:
            if effective_persona == "growth":
                text = (
                    "👋 Greetings! I am GrowthBot, powered by Llama 3.3 70B on Groq LPU.\n\n"
                    "My Role & Ideology:\n"
                    "I analyze businesses through sustainable economic moats, high Return on Equity (ROE > 18%), and secular compounding runway.\n\n"
                    "Ask me about corporate competitive moats, pricing power, management capital allocation, or revenue compounding!"
                )
            elif effective_persona == "risk":
                text = (
                    "👋 Greetings! I am RiskBot, powered by Llama 3.2 3B on Cloudflare Workers AI.\n\n"
                    "My Role & Ideology:\n"
                    "I quantify portfolio variance, Ledoit-Wolf covariance shrinkage matrices, downside Value-at-Risk (VaR), and maximum historical drawdowns.\n\n"
                    "Ask me about portfolio variance, correlation reduction, asset caps, or stress-test drawdowns!"
                )
            elif effective_persona == "metabot":
                text = (
                    "👋 Greetings! I am MetaBot, Tangent's DevOps & Multi-LLM Telemetry Intelligence Analyst.\n\n"
                    "I monitor real-time latency, token velocity, error rates, and costs across our 3 independent persona microservices (Groq, Gemini, Cloudflare).\n\n"
                    "Ask me about inference latency, token economics, or dynamic latency routing!"
                )
            elif effective_persona == "macro":
                text = (
                    "👋 Greetings! I am MacroBot, powered by Gemini 2.0 Flash on Google TPU.\n\n"
                    "My Role & Ideology:\n"
                    "I evaluate portfolio decisions strictly through the lens of sovereign interest rates (RBI repo 6.50% vs US Fed funds 4.25%–4.50%), "
                    "USD/INR currency drift (~3.5% structural depreciation), and government bond yield curves (GOI 10Y G-Sec yield ~6.85%).\n\n"
                    "Ask me about central bank policy, inflation drag, currency hedging, or sovereign debt yields!"
                )
            else:
                text = (
                    "👋 Greetings! Welcome to Tangent. I am your quantitative portfolio decision assistant. "
                    "I provide traceable, mathematically grounded portfolio analytics and risk modeling. "
                    "How can I assist your portfolio decisions today?"
                )
        elif effective_persona == "growth":
            text = (
                "Growth Equity Analysis regarding your query:\n\n"
                "1. Return on Capital & ROE: Sustainable wealth creation is driven exclusively by franchises that reinvest operating cash flow at high return on capital employed (ROCE > 22%) and ROE > 18%.\n\n"
                "2. Competitive Moats: Pricing power and enterprise switching costs protect operating margins against inflation, allowing secular compounders to out-compound low-multiple cyclical traps.\n\n"
                "3. Allocation Cap: Maintain disciplined diversification by capping single-stock exposure below 12% to 15%."
            )
        elif effective_persona == "risk":
            text = (
                "Quantitative Risk & Covariance Assessment:\n\n"
                "1. Covariance Shrinkage: Balancing domestic equities with non-correlated assets (Gold correlation ~0.08, Sovereign Debt correlation ~0.15) mathematically compresses portfolio variance without sacrificing expected return.\n\n"
                "2. Downside VaR: Under a 95% 1-Year Value-at-Risk model, an unhedged equity basket suffers peak drawdown risks exceeding -28% to -34% in sudden market panics.\n\n"
                "3. Asset Caps: Strict 15% single-asset ceilings and sovereign bond anchors protect solvency through tail-risk drawdowns."
            )
        elif effective_persona == "macro":
            text = (
                "Macro & Sovereign Rates Analysis:\n\n"
                "1. Central Bank Rate Dynamics: With RBI repo at 6.50% and US Fed funds in the 4.25%–4.50% corridor, the policy spread dictates foreign institutional portfolio (FPI) capital flows.\n\n"
                "2. Currency & Sovereign Yield: Structural USD/INR drift (~3.5% annually) and GOI 10Y G-Sec yields (~6.85%) form the baseline hurdle rate for domestic asset allocations.\n\n"
                "3. Strategic Shield: Maintain a 10% to 15% allocation in Gold or sovereign-backed assets to protect purchasing power against currency depreciation and CPI inflation."
            )
        elif "bull" in low_prompt:
            text = (
                "Bull Thesis: The proposed allocation leverages high risk-adjusted compounding. "
                "The nominal return of 13.4% [EVD-METRIC-NOMRET] outperforms broad inflation by 7.4%. "
                "A low effective correlation across equities and fixed income provides robust downside "
                "resilience while preserving upside exposure [EVD-ALLOC-EQUITY]."
            )
        elif "bear" in low_prompt:
            text = (
                "Bear Thesis: Volatility remains concentrated at 12.2% [EVD-METRIC-VOL], which in adverse "
                "drawdown scenarios could see 10-year terminal wealth dip to the 5th percentile [EVD-MC-WORST]. "
                "Furthermore, tax drag accounts for 1.6% annualized return slippage under Indian LTCG rules [EVD-METRIC-TAX]."
            )
        elif "critic" in low_prompt:
            text = (
                "Critic Review: Groundedness verified. All cited claims match deterministic evidence pack "
                "within 0.01% numerical tolerance. No unsupported directive advice detected."
            )
        else:
            text = (
                "Synthesis Brief: The allocation presents a balanced risk-reward posture with a Real Sharpe "
                "of 0.48 [EVD-METRIC-SHARPE]. Equity risk is mitigated by a 25.0% allocation to Fixed Income [EVD-ALLOC-DEBT], "
                "while 10-year median wealth targets are on track to achieve financial horizons [EVD-MC-MEDIAN]."
            )

        # Strip any stray asterisks
        text = text.replace("**", "")

        tokens_in = len(prompt.split()) + 20
        tokens_out = len(text.split())
        return LLMResponse(
            text=text,
            model="fixture/deterministic-tangent",
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            cost_estimate_usd=0.0,
            is_fallback=is_fallback,
            is_fixture=True,
        )
