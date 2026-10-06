# ADR 0002 — Expert Arena & Dual-Tier LLM Architecture

**Status:** Accepted  
**Date:** 2026-10-06  
**Context:** Adding the Expert Committee Arena, 5 bounded personas, Draww co-pilot, and direct 1-on-1 persona consultation.

---

## Context & Motivation

Tangent users require not just deterministic mathematical metrics (SLSQP Max-Sharpe, Ledoit-Wolf covariance shrinkage), but also multi-dimensional qualitative perspective on prospective investment ideas and asset choices. 

Rather than relying on an unconstrained, monolithic LLM chatbot that hallucinates metrics or provides generic advice, Tangent introduces:
1. **The Expert Committee Arena**: A multi-agent deliberative debate stream simulating an investment committee.
2. **Draww AI Co-Pilot**: An interactive assistant grounded in the user's specific mathematical portfolio run.
3. **Always-Accessible 1-on-1 Consultation**: Direct deep-dive interaction with any individual persona at any time.

---

## Decisions

### 1. Dual-Tier LLM Architecture
- **Tier 1 (Microservice Pipeline - `services/agent`)**: Python FastAPI service that pulls deterministic metrics from `quant`, `market-data`, and `sentiment`, packages them into an immutable `EvidencePack` (`[E1]`–`[E9]`), and uses an automated Critic agent to verify numerical claims within ±0.5% tolerance before publishing.
- **Tier 2 (Interactive Real-Time Route - `apps/web/src/app/api/groq`)**: Next.js route providing streaming chat and debate turn generation using Groq (`llama-3.3-70b-versatile`). It injects active portfolio context into prompts and includes an immediate offline deterministic synthesis fallback when credentials or network connectivity are absent.

### 2. Strictly Bounded Ideologies (No Unbounded Personalities)
To avoid generic conversational filler, personas are strictly bounded by economic and factor disciplines:
1. **Macro & Sovereign Rates**: Central bank liquidity, yield curve inversions, interest rate cycles, currency trends.
2. **Deep Value & Margin of Safety**: Normalized free cash flow yields, balance sheet solvency, downside valuation buffer.
3. **Quant Momentum & Factor Risk**: Trend autocorrelation, factor crowdedness, volatility regimes, tail skewness.
4. **Austrian Sound Money & Hedging**: Hard monetary assets, fiat currency debasement, commodity super-cycles, physical backing.
5. **ESG & Long-Horizon Stewardship**: Regulatory headwinds, climate transition costs, corporate governance and stakeholder risks.

### 3. Immediate 1-on-1 Consultation Availability
- The 1-on-1 consultation interface is not locked behind running a full committee debate first.
- Users can switch between personas freely and immediately query specific stocks, asset classes, or macro theses from that persona's singular perspective.

### 4. Non-Directive Guardrails
- All personas strictly abide by `DISCLAIMER.md`: no directive statements such as "you should buy", "guaranteed upside", or "target price". Claims focus on historical dynamics, risk mechanisms, and trade-offs.

---

## Consequences

- **Pros:**
  - Provides diverse, high-signal institutional perspectives without metric hallucination.
  - Sub-second responses via Groq's LPUs for interactive debates.
  - Works 100% offline in Demo Mode via deterministic synthesis.
- **Cons:**
  - Multiple LLM inference calls per debate round (5 turns + consensus). Mitigated by sequential streaming, token limits (`max_tokens: 350` per turn), and rate-limit fallbacks.
