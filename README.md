# Tangent

**Portfolio decisions you can trace.**

> Tangent is a production-grade multi-asset portfolio decision intelligence platform that unifies Modern Portfolio Theory (MPT) with an **evidence-grounded multi-agent Decision Studio** — where every AI assertion is mathematically traceable to a deterministic metric and audited by an automated Critic.

> ⚠️ **Educational decision-support tool only, not investment advice.** See [DISCLAIMER.md](DISCLAIMER.md).

---

## Architecture Overview (10 Microservices + Next.js 16)

```
                                  [ Next.js 16 Web App ]
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
                               (Schema-per-service isolation)
```

See [docs/architecture.md](docs/architecture.md) and [docs/adr/0001-architecture-decisions.md](docs/adr/0001-architecture-decisions.md) for full Architectural Decision Records (ADRs).

---

## Clean Monorepo Layout

```
Tangent/
├── apps/
│   └── web/                   # Next.js 16 App Router UI (React 19, TypeScript, Vanilla CSS, Turbopack)
│       ├── src/app/           # App routes & /api/personas/chat, /api/groq live LLM proxy
│       └── src/components/    # HeroHomepage, ArenaView, ModelObservatory, MetaBotChat, DecisionStudio
│
├── services/                  # 10 Standalone FastAPI Microservices
│   ├── gateway/               # Port 8000 — Unified entrypoint, guest JWT issuance, sliding rate limiter, proxy
│   ├── market-data/           # Port 8001 — 74 curated assets, yfinance pipeline, 24h Postgres cache, daily sync
│   ├── quant/                 # Port 8002 — SLSQP Max-Sharpe, Ledoit-Wolf shrinkage, Monte Carlo, walk-forward
│   ├── portfolio/             # Port 8003 — Postgres persistence for user portfolios, allocations & exports
│   ├── sentiment/             # Port 8004 — Zero-key RSS financial news ingest & FinBERT lexicon scoring
│   ├── agent/                 # Port 8005 — EvidencePack builder ([E1]–[E9]), Bull/Bear/Synthesizer, Critic, SSE
│   ├── persona-macro/         # Port 8006 — Independent MacroBot powered by Google Gemini 2.0 Flash
│   ├── persona-growth/        # Port 8007 — Independent GrowthBot powered by Groq Llama 3.3 70B
│   ├── persona-risk/          # Port 8008 — Independent RiskBot powered by Cloudflare Workers AI Llama 3.2 3B
│   └── observatory/           # Port 8009 — Real-time telemetry leaderboard, microservices health, MetaBot analyst
│
├── libs/                      # Shared Python Libraries (managed via uv workspace)
│   ├── contracts/             # Pydantic models & schemas across all microservice boundaries
│   ├── common/                # Structured JSON logging, settings config, resilient HTTP, Redis client
│   └── llm/                   # LiteLLM client wrapper with automatic provider fallback & fixtures
│
├── .github/workflows/
│   └── market-sync.yml        # Scheduled daily post-close settlement market sync (22:30 UTC Mon-Fri)
│
├── infra/
│   ├── compose/               # Docker Compose environments (Postgres, Redis, all 10 microservices)
│   ├── db/                    # Alembic migrations with per-service schema isolation
│   └── deploy/                # Cloud manifests (Render blueprints, Vercel config, Supabase/Neon setup)
│
├── docs/                      # Architectural Decision Records, API contracts, runbooks, and evaluation
├── legacy/finmaths/           # Archived read-only reference of the original FinMaths Streamlit prototype
├── pyproject.toml             # uv workspace root definition and development dependencies
├── justfile                   # Developer task runner (build, test, lint, fmt, deploy)
└── DISCLAIMER.md              # Mandatory regulatory disclaimers
```

---

## 10-Microservice Fleet Matrix

| Service | Port | Primary Responsibilities | Core Stack / Engine | Target Host / Tier |
|---|---|---|---|---|
| **apps/web** | 3000 | Next.js 16 UI, Vanilla CSS design system, Arena, Draww, Decision Studio, Observatory | React 19, TypeScript, Turbopack | Vercel Edge |
| **gateway** | 8000 | Unified entrypoint, guest JWT issuance, sliding-window rate limiter, reverse proxy | FastAPI, PyJWT, HTTPX | Cloud Run / Render |
| **market-data** | 8001 | 74 curated assets, yfinance pipeline, 24h cache, daily scheduled sync | FastAPI, SQLAlchemy, Pandas | Cloud Run / Render |
| **quant** | 8002 | SciPy SLSQP Max-Sharpe, Ledoit-Wolf shrinkage, Monte Carlo (10k paths), walk-forward | NumPy, SciPy, Scikit-learn | Cloud Run / Render |
| **portfolio** | 8003 | Guest profiles, saved allocations, audit trails, CSV/JSON investor exports | FastAPI, SQLAlchemy, PostgreSQL | Cloud Run / Render |
| **sentiment** | 8004 | Zero-key RSS financial news ingest (Google News, ET), content-hash cache, lexicon | FastAPI, Feedparser, HTTPX | Cloud Run / Render |
| **agent** | 8005 | EvidencePack extraction (`[E1]`–`[E9]`), Bull/Bear/Synthesizer agents, Critic review | FastAPI, LiteLLM, Groq / Gemini | Cloud Run / Render |
| **persona-macro** | 8006 | Independent MacroBot: sovereign debt, central bank liquidity, inflation cycles | Google Gemini 2.0 Flash (TPU) | Render Free Tier |
| **persona-growth** | 8007 | Independent GrowthBot: capital compounding, valuation floors, free cash flows | Groq Llama 3.3 70B (LPU) | Render Free Tier |
| **persona-risk** | 8008 | Independent RiskBot: downside volatility, tail-risk drawdown, hedging constraints | Cloudflare Workers AI Llama 3.2 3B | Render Free Tier |
| **observatory** | 8009 | Cross-model telemetry leaderboard, cluster microservices monitor, MetaBot dynamic router | FastAPI, Redis Sorted Sets | Render Free Tier |

---

## Core Features & Platform Novelty

### 1. Deterministic Authority vs. LLM Boundary (Platform Novelty)
In traditional "AI financial apps", LLMs hallucinate portfolio returns, invent Sharpe ratios, or recommend securities with directive language. Tangent strictly separates mathematical computation from natural language reasoning:
- **Zero Hallucinated Metrics:** Every metric is computed by deterministic Python microservices using SciPy SLSQP, Ledoit-Wolf shrinkage, and NumPy.
- **EvidencePack Grounding (`[E1]`–`[E9]`):** The Agent service compiles an immutable package of mathematical claims before any LLM is called.
- **Automated Critic Audit:** An independent Critic agent reviews every generated brief, rejecting non-grounded claims and flagging quantitative discrepancies exceeding a ±0.5% tolerance.

### 2. Multi-LLM Tier with Live DevOps Observatory & MetaBot
- **Live Model Leaderboard:** Profiles inference speed (p50 and p95 latency), token velocity, and dollar cost per 1,000 queries across Groq LPUs, Google TPUs, and Cloudflare Workers AI edge inference.
- **MetaBot Dynamic DevOps Analyst:** An interactive AI observer with direct real-time access to Redis telemetry sorted sets, answering architectural and performance queries on model routing and infrastructure tradeoffs.
- **Microservices Telemetry Sub-Dashboard:** Real-time health monitoring of the 6 deterministic microservices displaying strictly:
  - **Status:** Live `Up` 🟢, `Starting` 🟡, or `Down` 🔴 status.
  - **Response Latency:** Sub-millisecond round-trip profiling.
  - **Request Hits:** Cumulative production request volume.
  - **Payload Transfer:** Network bytes transferred (`KB` / `MB`).
  - Includes a manual **"Sync Metrics"** button and 30-second background polling.

### 3. Automated Daily Settlement Sync via Scheduled GitHub Actions
- **Workflow:** [`.github/workflows/market-sync.yml`](.github/workflows/market-sync.yml) runs automatically at **22:30 UTC Mon–Fri (04:00 AM IST)**.
- **Post-Market Settlement Timing:** Scheduled after both Indian exchanges (NSE/BSE close at 10:00 UTC) and US exchanges (NYSE/NASDAQ close at 21:00 UTC) have finalized daily closing settlements.
- **Cold-Start Resilience:** Built with `--connect-timeout 60` and `--max-time 120` with 3 retries to gracefully wake sleeping free-tier containers without failing the workflow.

### 4. Expert Committee Arena & Always-On 1-on-1 Consultation
- **5 Autonomous Expert Ideologies:** Macro, Deep Value, Quant Momentum, Austrian Sound Money, and ESG engaging in structured crossfire debates powered by dedicated microservices.
- **Always-Accessible 1-on-1 Consultation:** Interactive chat interface directly available at all times without requiring a prior debate session to run.

### 5. Deterministic Quantitative Optimization Suite
- **SciPy SLSQP Solver:** Max-Sharpe portfolio optimization with Ledoit-Wolf covariance shrinkage, asset caps (15%), sector caps (25%), Indian LTCG tax drag (12.5%), and inflation adjustments (6.0%).
- **Curated Multi-Asset Universe (74 Securities):** Full coverage across Indian Nifty 50 large caps, US ETFs, global commodities, Indian REITs, sovereign debt, bank FDs, and crypto — with an *Unbiased All-Asset Mode*.
- **Crisis Stress Testing Engine:** Replays historical drawdowns across the 2008 GFC, 2020 COVID Crash, 2022 Fed Rate Spikes, 1970s Stagflation, and 2000 Dot-com Bubble.
- **Walk-Forward Backtest Lab:** Rolling out-of-sample comparison of 4 classic MPT strategies without lookahead bias.
- **Draww Institutional Portfolio Co-pilot:** Conversational assistant embedded across the entire app with full context into portfolio weights, expected returns, volatility, Sharpe, and evidence citations.

---

## Architectural Tradeoffs & Design Decisions

| Decision | Chosen Approach | Alternative Considered | Tradeoff Rationale |
|---|---|---|---|
| **Microservice Fleet** | 10 independent microservices | Monolithic FastAPI app | Monoliths couple LLM dependency bloat and memory footprint with math libraries. Decoupling isolates heavy scientific libraries (SciPy, Pandas) from LLM SDKs and allows independent scaling and failure isolation. |
| **Market Data Caching** | 24h lazy cache + 7-benchmark scheduled sync | Batch sync all 74 assets via cron | Fetching 74 tickers sequentially via Yahoo Finance takes 70–100s, risking Render HTTP timeouts and IP rate limits (`429`). The 7 benchmark pillars sync post-close, while remaining assets load on-demand in <1ms once cached. |
| **Telemetry Storage** | Scoped Redis Sorted Sets (`ZADD`) | Prometheus + Grafana stack | Prometheus/Grafana requires dedicated daemon instances, storage volumes, and high RAM. Redis sorted sets provide sub-millisecond p50/p95 latency queries with zero infrastructure overhead. |
| **Frontend Styling** | Vanilla CSS + Design System tokens | TailwindCSS | Tailwind utility soup creates visual clutter and rigid component abstraction. Custom Vanilla CSS with tokenized CSS variables enables rich Vide Infra design aesthetics (`#6D0E5A`), glassmorphism, and micro-animations with zero runtime bundle bloat. |
| **LLM Tiering** | 3 specialized free-tier models (Groq, Gemini, Cloudflare) | Single commercial OpenAI/Anthropic API | Eliminates vendor lock-in, enables live comparative latency/cost benchmarking, and achieves 100% free-tier cloud deployment across providers. |

---

## How to Run Locally

### Prerequisites
- **Docker Desktop** (with WSL2 engine enabled on Windows)
- **Python 3.12** & **uv** (`winget install astral-sh.uv`)
- **Node.js 20+** & **npm**
- **just** (optional task runner: `winget install Casey.Just`)

---

### Option A: Using `just` (Recommended)

```powershell
# 1. Verify your environment
just doctor

# 2. Start PostgreSQL and Redis
just up-core

# 3. Run database migrations across isolated schemas
just migrate

# 4. Start all 10 backend microservices in Docker
just up

# 5. In a second terminal, start the Next.js UI
cd apps/web
npm run dev
```

---

### Option B: Using Direct Docker Compose & Python

```powershell
# 1. Start Postgres and Redis
docker compose -f infra/compose/docker-compose.yml up -d db redis

# 2. Run Alembic Migrations
uv run alembic -c infra/db/alembic.ini upgrade head

# 3. Build and launch all 10 microservices
docker compose -f infra/compose/docker-compose.yml up --build

# 4. In a separate terminal, launch the web frontend:
cd apps/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.  
Interactive API Gateway Documentation: [http://localhost:8000/docs](http://localhost:8000/docs).

> **Zero-Key Demo Mode:** No external API keys (Groq, Gemini, etc.) are required to run Tangent locally. The system defaults gracefully to deterministic offline market fixtures and recorded LLM responses.

---

## Testing & Quality Assurance

Tangent enforces strict quality controls across every commit:

```powershell
# Run complete test suite across microservices
uv run pytest services/observatory/tests services/market-data/tests services/quant/tests -v

# Run pre-commit quality checks (Ruff linting, formatting, trailing whitespace, and Mypy)
uv run pre-commit run --all-files

# Build frontend production bundle
cd apps/web
npm run build
```

---

## Statutory Notice

Tangent is an educational simulation platform for portfolio analysis and algorithmic decision-support. It does not provide personalized investment advice, financial planning, or broker execution services. Past performance derived from historical backtesting is no guarantee of future returns. See [DISCLAIMER.md](DISCLAIMER.md) for full terms.
