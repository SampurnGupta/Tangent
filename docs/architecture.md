# Tangent Architecture Specification

> **Product:** Tangent | **Tagline:** Portfolio decisions you can trace.

---

## 1. System Overview & Topology

Tangent is a production-grade multi-asset portfolio decision intelligence platform designed to replace legacy monolithic financial optimizers with a clean, decoupled **10-microservice architecture**. It strictly separates deterministic Modern Portfolio Theory (MPT) quantitative calculations from natural language synthesis and multi-agent deliberation.

```
                                  [ Next.js 16 Web App ]
                                (React 19, Turbopack, Edge)
                                             │
                                             ▼
                            [ API Gateway (FastAPI, Port 8000) ]
                           (JWT Auth, Rate Limiter, Reverse Proxy)
                                             │
      ┌────────────────┬─────────────┼───────────────┬────────────────┬────────────────┐
      ▼                ▼             ▼               ▼                ▼                ▼
[ Market-Data ]    [ Quant ]   [ Portfolio ]   [ Sentiment ]      [ Agent ]      [ Observatory ]
  (Port 8001)     (Port 8002)   (Port 8003)     (Port 8004)      (Port 8005)      (Port 8009)
      │                │             │               │                │         (MetaBot AI Router)
      │                │             │               │                │                │
      │                │             │               │      ┌─────────┴─────────┐      │
      │                │             │               │      ▼         ▼         ▼      │
      │                │             │               │  [MacroBot][GrowthBot][RiskBot] │
      │                │             │               │   (8006)    (8007)    (8008)    │
      │                │             │               │   Gemini     Groq   Cloudflare  │
      └────────────────┴─────────────┴───────┬───────┴─────┴─────────┴─────────┴───────┘
                                             ▼
                                [ PostgreSQL 16 + Redis 7 ]
                       (Schemas: market_data, portfolio | Prefixes: tangent:*)
```

---

## 2. Core Tenets

1. **Deterministic Authority**: Numbers come exclusively from deterministic Python microservices (SciPy, Ledoit-Wolf, NumPy). LLMs analyze, synthesize, and cite — they never generate, extrapolate, or alter numerical metrics.
2. **Traceable Citations (`[E1]`–`[E9]`)**: Every claim emitted by the Agent service carries a structured evidence tag pointing to an audited item in the deterministic `EvidencePack`.
3. **Automated Critic Review**: An independent Critic agent reviews every decision brief against an evidence pack, rejecting directive financial language and flagging numerical discrepancies exceeding ±0.5% tolerance.
4. **Out-of-Sample Integrity**: Portfolio backtests use walk-forward rolling windows to eliminate lookahead bias. We never claim AI "beat the market".
5. **Guest-First Accessibility**: Seamless onboarding with cryptographic guest JWTs; zero mandatory signup barriers.
6. **Multi-LLM Resilience**: Multi-provider inference tier (Groq LPU, Google Gemini TPU, Cloudflare Workers AI Edge) providing real-time comparative benchmarking and zero vendor lock-in.

---

## 3. Microservice Matrix

| Service | Port | Primary Responsibilities | Data Store / Cache | Technology Stack |
|---|---|---|---|---|
| **apps/web** | 3000 | Next.js 16 UI, Vanilla CSS design system, Arena, Draww, Decision Studio, Observatory | Browser LocalStorage | Next.js 16, React 19, TypeScript |
| **gateway** | 8000 | Front-door proxy, guest JWT issuance, sliding window rate limiting, CORS | In-memory / Redis (`tangent:ratelimit:`) | FastAPI, PyJWT, HTTPX |
| **market-data** | 8001 | 74 curated assets across 8 classes, yfinance integration, 24h Postgres cache, daily sync | Postgres (`market_data`), Redis (`tangent:mkt:`) | FastAPI, SQLAlchemy, Pandas, yfinance |
| **quant** | 8002 | SLSQP Max-Sharpe, Ledoit-Wolf shrinkage, Monte Carlo (10k paths), walk-forward backtest | Stateless | FastAPI, NumPy, SciPy, Scikit-learn |
| **portfolio** | 8003 | User state, saved allocations, execution audit trails, investor CSV/JSON export | Postgres (`portfolio` schema) | FastAPI, SQLAlchemy, PostgreSQL |
| **sentiment** | 8004 | Zero-key RSS ingest (Google News, ET), content-hash deduplication, lexicon sentiment | Stateless / In-memory | FastAPI, Feedparser, HTTPX |
| **agent** | 8005 | EvidencePack assembly, Bull/Bear/Synthesizer multi-agent pipeline, Critic review, SSE | In-memory cache | FastAPI, LiteLLM, Groq / Gemini |
| **persona-macro** | 8006 | Independent MacroBot: sovereign yields, central bank liquidity, inflation cycles | Redis (`tangent:session:macro:`) | FastAPI, Google Gemini 2.0 Flash |
| **persona-growth** | 8007 | Independent GrowthBot: capital compounding, valuation floors, free cash flows | Redis (`tangent:session:growth:`) | FastAPI, Groq Llama 3.3 70B |
| **persona-risk** | 8008 | Independent RiskBot: downside volatility, tail-risk drawdown, hedging constraints | Redis (`tangent:session:risk:`) | FastAPI, Cloudflare Workers AI Llama 3.2 3B |
| **observatory** | 8009 | Cross-model telemetry leaderboard, cluster microservices monitor, MetaBot dynamic router | Redis (`tangent:telemetry:*`) | FastAPI, Redis Sorted Sets |

---

## 4. Shared Libraries (`libs/`)

- **`libs/contracts`**: Shared Pydantic models guaranteeing type safety across microservice boundaries (assets, optimization, projections, marginal impact, evidence pack, decision brief, backtest, telemetry).
- **`libs/common`**: Unified JSON structured logging, resilient HTTP client with header propagation, request ID middleware, base settings, and `TangentRedisClient` with scoped key namespacing (`tangent:mkt:`, `tangent:session:`, `tangent:telemetry:`, `tangent:services:`).
- **`libs/llm`**: Provider-agnostic LiteLLM abstraction supporting Groq (primary) and Gemini (secondary) with token/cost tracking and offline deterministic fixture fallback.

---

## 5. Security & Isolation

- **Non-Root Containers**: All microservices run under a dedicated `appuser` (UID 10001) in hardened Debian/Alpine slim containers.
- **Database Schema Isolation**: Services connect to dedicated schemas (`market_data`, `portfolio`) within a single PostgreSQL database, preventing cross-domain schema drift.
- **Scoped Redis Isolation**: Keys are prefixed with domain namespaces (`tangent:mkt:`, `tangent:session:`, `tangent:telemetry:`) with explicit TTL expirations, preventing cache collisions and memory leaks.
- **Secrets Management**: Secrets (`JWT_SECRET`, API keys) are strictly injected via environment variables; `.env` is ignored by Git, and `.env.example` serves as the public schema contract.

---

## 6. Frontend Architecture (`apps/web`)

The user interface is built on Next.js 16 (App Router + React 19 + Turbopack) using Vanilla CSS for high-performance styling and micro-animations.

- **Hero Homepage (`HeroHomepage.tsx`)**: Institutional landing view featuring ambient backdrops, platform metrics (74 assets, 5k Monte Carlo paths, SciPy SLSQP solver, 5 ideologies), interactive feature showcase grid, and 3-way direct navigation redirects.
- **Expert Committee Arena (`ArenaView.tsx`)**: Multi-agent crossfire debate stream powered by 5 strictly bounded expert personas (Macro, Deep Value, Quant Momentum, Austrian Sound Money, ESG) with direct 1-on-1 consultation chat.
- **Draww Institutional Portfolio Co-pilot (`AIChatConcierge.tsx`)**: Conversational assistant embedded across the entire app with full context into user portfolio state, optimization returns, volatility, Sharpe, backtests, and citations (`[E1]`–`[E9]`).
- **Optimization Studio (`OptimizationDashboard.tsx` & `AssetSelector.tsx`)**: SciPy SLSQP solver interface with unbiased all-asset candidate mode, marginal impact calculator, and single-click CSV/JSON investor export.
- **Crisis Stress Testing (`StressTestScenario.tsx`)**: Historical crisis replay engine modeling portfolio drawdown under 2008 GFC, 2020 COVID, 2022 Rate Shock, Stagflation, and Dot-com scenarios.
- **LLM Observatory & MetaBot (`ModelObservatory.tsx`)**: Real-time telemetry dashboard featuring:
  - **Live Model Leaderboard**: p50/p95 latency, Avg. Tokens/Response, and Cost / 1k Calls.
  - **Microservices Sub-Dashboard**: Real-time status (`Up`, `Starting`, `Down`), round-trip latency, request hits, and payload transfer for the 6 deterministic microservices.
  - **MetaBot DevOps AI Analyst**: Live conversational AI answering architectural and performance inquiries with direct access to Redis metrics.

---

## 7. Automated Daily Settlement Sync (GitHub Actions)

Tangent automates market data ingestion via a scheduled GitHub Actions workflow:
- **Workflow File:** [`.github/workflows/market-sync.yml`](../.github/workflows/market-sync.yml)
- **Schedule:** `30 22 * * 1-5` (**22:30 UTC Mon–Fri** / **04:00 AM IST**).
- **Execution Strategy:** Scheduled post-close when both Indian (NSE/BSE at 10:00 UTC) and US (NYSE/NASDAQ at 21:00 UTC) markets have finalized daily settlement closes.
- **Cold-Start Resilience:** Uses curl with `--connect-timeout 60 --max-time 120 --retry 3 --retry-delay 15` to smoothly wake sleeping free-tier microservices on Render without pipeline failures.
- **Target Endpoint:** Calls `POST /api/v1/market-data/sync` to ingest and cache fresh benchmark closes (Reliance, TCS, HDFC Bank, Infosys, GoldBees, SPY, QQQ) into Redis and PostgreSQL with 24-hour TTLs.

---

## 8. Architectural Tradeoffs & Platform Novelty

| Architecture Dimension | Chosen Approach | Tradeoff Rationale |
|---|---|---|
| **10 Decoupled Services vs. Monolith** | 10 independent microservices | Isolates heavy scientific libraries (SciPy, Pandas, NumPy) from asynchronous LLM SDKs and edge routing, preventing memory leaks and enabling independent horizontal scaling. |
| **Market Ingestion Strategy** | Scheduled benchmark sync + 24h lazy cache for 74 assets | Fetching all 74 assets synchronously in a single cron call takes 70–100s and risks Yahoo Finance rate limits (`429`) and Render proxy timeouts. Scheduled sync warms the primary benchmarks, while remaining universe assets cache on-demand in `<1ms`. |
| **Telemetry Engine** | Scoped Redis Sorted Sets (`ZADD`) | Prometheus/Grafana requires dedicated daemons and persistent disk volumes. Redis sorted sets provide sub-millisecond p50/p95 calculations with zero additional operational overhead. |
| **Frontend Styling** | Vanilla CSS + Tokenized Design System | Avoids Tailwind utility soup, ensuring clean maintainable styles, bespoke Vide Infra aesthetics (`#6D0E5A`), glassmorphic panels, and 60fps micro-animations without CSS runtime bloat. |
| **Deterministic vs. Generative Boundary** | EvidencePack (`[E1]`–`[E9]`) + Automated Critic | LLMs are strictly forbidden from calculating metrics. The automated Critic rejects non-grounded claims and enforces a ±0.5% numerical tolerance. |
