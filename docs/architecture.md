# Tangent Architecture Specification

> **Product:** Tangent | **Tagline:** Portfolio decisions you can trace.

## 1. System Overview

Tangent is a production-grade portfolio decision intelligence platform designed to replace legacy monolithic financial optimizers with a clean, decoupled microservices architecture. It combines deterministic Modern Portfolio Theory (MPT) calculations with an evidence-grounded multi-agent LLM decision studio.

```
                         [ Next.js 16 Web App ]
                                   │
                                   ▼
                    [ API Gateway (FastAPI, Port 8000) ]
                   (JWT Auth, Rate Limiter, Reverse Proxy)
                                   │
      ┌───────────────┬────────────┼───────────┬───────────────┐
      ▼               ▼            ▼           ▼               ▼
[ Market-Data ]    [ Quant ]  [ Portfolio ] [ Sentiment ]   [ Agent ]
  (Port 8001)    (Port 8002)   (Port 8003)   (Port 8004)   (Port 8005)
      │               │            │           │               │
      └───────────────┴─────┬──────┴───────────┴───────────────┘
                            ▼
              [ PostgreSQL 16 + Redis 7 ]
               (Schema-per-service isolation)
```

## 2. Core Tenets

1. **Deterministic Authority**: Numbers come exclusively from deterministic Python microservices (SciPy, Ledoit-Wolf, NumPy). LLMs analyze, synthesize, and cite — they never generate or alter numerical metrics.
2. **Traceable Citations**: Every claim emitted by the Agent service carries a structured evidence tag (e.g. `[E1]`, `[E5]`) pointing to an audited item in the deterministic `EvidencePack`.
3. **Automated Critic Review**: An independent Critic agent reviews every decision brief against an evidence pack, rejecting directive financial language and flagging numerical discrepancies exceeding ±0.5% tolerance.
4. **Out-of-Sample Integrity**: Portfolio backtests use walk-forward rolling windows to eliminate lookahead bias. We never claim AI "beat the market".
5. **Guest-First Accessibility**: Seamless onboarding with cryptographic guest JWTs; zero mandatory signup barriers.

## 3. Microservice Matrix

| Service | Port | Primary Responsibilities | Data Store |
|---|---|---|---|
| **apps/web** | 3000 | Next.js 16 App Router UI, Vanilla CSS design system, Interactive Homepage, Arena, Draww AI | Stateless / LocalStorage |
| **gateway** | 8000 | Front-door proxy, guest JWT issuance, sliding window rate limiting, CORS | In-memory / Redis |
| **market-data** | 8001 | 74 curated assets across 8 classes, yfinance integration, 24h Postgres cache, synthetic bond models | Postgres (`market_data` schema), Redis |
| **quant** | 8002 | SLSQP Max-Sharpe optimization, Ledoit-Wolf shrinkage, Monte Carlo projections, walk-forward backtest | Stateless |
| **portfolio** | 8003 | User state, saved allocations, execution audit trails | Postgres (`portfolio` schema) |
| **sentiment** | 8004 | Zero-key RSS ingest (Google News, ET), content-hash deduplication, lexicon sentiment scoring | Stateless / In-memory |
| **agent** | 8005 | EvidencePack assembly, Bull/Bear/Synthesizer multi-agent pipeline, Critic review, SSE streaming | In-memory cache |

## 4. Shared Libraries (`libs/`)

- `libs/contracts`: Shared Pydantic models guaranteeing type safety across microservices (assets, optimization, projections, marginal impact, evidence pack, decision brief, backtest).
- `libs/common`: Unified JSON structured logging, resilient HTTP client with header propagation, request ID middleware, base settings.
- `libs/llm`: Provider-agnostic LiteLLM abstraction supporting Groq (primary) and Gemini (secondary) with token/cost tracking and offline deterministic fixture fallback.

## 5. Security & Isolation

- **Non-Root Containers**: All microservices run under a dedicated `appuser` (UID 10001) in hardened Debian/Alpine slim containers.
- **Database Schema Isolation**: Services connect to dedicated schemas (`market_data`, `portfolio`) within a single PostgreSQL database, preventing cross-domain schema drift.
- **Secrets Management**: Secrets (`JWT_SECRET`, API keys) are strictly injected via environment variables; `.env` is ignored by Git, and `.env.example` serves as the public schema contract.

## 6. Frontend Architecture (`apps/web`)

The user interface is built on Next.js 16 (App Router + React 19 + Turbopack) using Vanilla CSS for high-performance styling and micro-animations.

- **Hero Homepage (`HeroHomepage.tsx`)**: Institutional landing view featuring ambient backdrops, platform metrics (74 assets, 5k Monte Carlo paths, SciPy SLSQP solver, 5 ideologies), interactive feature showcase grid, and 3-way direct navigation redirects.
- **Expert Committee Arena (`ArenaView.tsx`)**: Multi-agent crossfire debate stream powered by 5 strictly bounded expert personas:
  1. *Macro & Sovereign Rates*: Global liquidity, rate cycles, inflation trends.
  2. *Deep Value & Margin of Safety*: Balance sheet strength, free cash flows, valuation floors.
  3. *Quant Momentum & Factor Risk*: Statistical trend indicators, volatility regimes, tail risks.
  4. *Austrian Sound Money & Hedging*: Hard monetary assets, fiat debasement hedges, commodities.
  5. *ESG & Long-Horizon Stewardship*: Climate transition, governance resilience, regulatory headwinds.
  Includes always-accessible 1-on-1 direct consultation with any selected persona.
- **Draww Institutional Portfolio Co-pilot (`AIChatConcierge.tsx`)**: Conversational assistant embedded across the entire app with full context into user portfolio state, optimization returns, volatility, Sharpe, backtests, and citations (`[E1]`–`[E9]`).
- **Optimization Studio (`OptimizationDashboard.tsx` & `AssetSelector.tsx`)**: SciPy SLSQP solver interface with unbiased all-asset candidate mode, marginal impact calculator, and single-click CSV/JSON investor export.
- **Crisis Stress Testing (`StressTestScenario.tsx`)**: Historical crisis replay engine modeling portfolio drawdown under 2008 GFC, 2020 COVID, 2022 Rate Shock, Stagflation, and Dot-com scenarios.

## 7. Dual-Tier LLM Architecture

Tangent employs a hybrid LLM pipeline designed for resilience and grounding:
1. **Microservice Tier (`services/agent`)**: Assembles immutable `EvidencePack` objects (`E1`–`E9`) from deterministic Python microservices. Bull, Bear, and Synthesizer agents construct decision briefs, while an automated Critic agent audits quantitative claims against ±0.5% tolerance.
2. **Next.js Real-Time Tier (`/api/groq`)**: Serves interactive streaming conversations for Arena debates, 1-on-1 consultations, and Draww co-pilot via Groq (`llama-3.3-70b-versatile`). Seamlessly falls back to grounded offline deterministic logic when API keys are unconfigured or rate limits are reached.
