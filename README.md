# Tangent

**Portfolio decisions you can trace.**

> Tangent is a production-grade multi-asset portfolio decision intelligence platform that builds on Modern Portfolio Theory (MPT) and introduces an **evidence-grounded multi-agent Decision Studio** — where every AI assertion is mathematically traceable to a deterministic metric.

> ⚠️ **Educational decision-support tool only, not investment advice.** See [DISCLAIMER.md](DISCLAIMER.md).

---

## Architecture Overview

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

See [docs/architecture.md](docs/architecture.md) and [docs/adr/0001-architecture-decisions.md](docs/adr/0001-architecture-decisions.md) for full Architectural Decision Records (ADRs).

---

## Clean Monorepo Layout

```
Tangent/
├── apps/
│   └── web/                   # Next.js 16 App Router UI (TypeScript, Tailwind, Radix UI, Turbopack)
│
├── services/                  # 6 Standalone FastAPI Microservices
│   ├── gateway/               # Port 8000 — Unified entrypoint, guest JWT issuance, reverse proxy
│   ├── market-data/           # Port 8001 — Asset universe, yfinance ingest, Postgres 24h cache
│   ├── quant/                 # Port 8002 — SLSQP Max-Sharpe, Ledoit-Wolf shrinkage, Monte Carlo
│   ├── portfolio/             # Port 8003 — Postgres persistence for user portfolios & backtests
│   ├── sentiment/             # Port 8004 — RSS financial news ingest & FinBERT lexicon scoring
│   └── agent/                 # Port 8005 — EvidencePack builder (E1–E9), ReAct agents, Critic, SSE
│
├── libs/                      # Shared Python Libraries (managed via uv workspace)
│   ├── contracts/             # Pydantic models & schemas across all microservice boundaries
│   ├── common/                # Structured JSON logging, settings config, resilient HTTP client
│   └── llm/                   # LiteLLM client wrapper with automatic provider fallback & fixtures
│
├── infra/
│   ├── compose/               # Docker Compose environments (Postgres, Redis, all services)
│   ├── db/                    # Alembic migrations with per-service schema isolation
│   └── deploy/                # Fly.io manifests (fly.*.toml) and PowerShell deployment scripts
│
├── docs/                      # Architectural Decision Records, API contracts, and runbooks
├── legacy/finmaths/           # Archived read-only reference of the original FinMaths Streamlit prototype
├── pyproject.toml             # uv workspace root definition and development dependencies
├── justfile                   # Developer task runner (build, test, lint, deploy)
└── DISCLAIMER.md              # Mandatory regulatory disclaimers
```

---

## Microservice Matrix

| Service | Port | Responsibilities | Core Stack |
|---|---|---|---|
| **apps/web** | 3000 | Next.js 16 App Router UI, Vanilla CSS design system, Interactive Decision Studio | React 19, TypeScript, Vanilla CSS |
| **gateway** | 8000 | Unified entrypoint, guest JWT issuance, sliding-window rate limiter, reverse proxy | FastAPI, PyJWT, HTTPX |
| **market-data** | 8001 | 73 curated assets, yfinance integration, 24h Postgres cache, synthetic bond accrual | FastAPI, SQLAlchemy, Pandas |
| **quant** | 8002 | SciPy SLSQP Max-Sharpe, Ledoit-Wolf covariance shrinkage, Monte Carlo projections, Walk-Forward Backtest | NumPy, SciPy, Scikit-learn |
| **portfolio** | 8003 | Guest profiles, saved allocations, execution audit trails | FastAPI, SQLAlchemy, PostgreSQL |
| **sentiment** | 8004 | Zero-key RSS ingest (Google News, Economic Times), content-hash cache, lexicon scoring | FastAPI, Feedparser, HTTPX |
| **agent** | 8005 | EvidencePack extraction (`E1`–`E9`), Bull/Bear/Synthesizer agents, Critic review, SSE streaming | FastAPI, LiteLLM, Groq / Gemini |

---

## Core Features

1. **Risk Profiler Wizard**: Calculates risk tolerance scores (1–10) and establishes asset-class allocation bounds (equity, debt, commodities, cash).
2. **Curated Multi-Asset Universe**: 73 assets spanning Indian Equities, US ETFs, Global Commodities, Sovereign Bonds, and Synthetic Fixed Income.
3. **Max-Sharpe Optimization**: SciPy SLSQP solver incorporating Ledoit-Wolf covariance shrinkage, asset caps (15%), sector caps (25%), Indian LTCG tax drag (12.5%), and 6.0% inflation adjustments.
4. **Monte Carlo Wealth Projections**: 1,000 to 10,000 path geometric Brownian motion simulation displaying median wealth trajectories, 95% confidence intervals, and drawdown profiles.
5. **Decision Studio & Marginal Impact**: Evaluates candidate asset inclusions by calculating real Sharpe delta, return delta, and volatility delta.
6. **Traceable Multi-Agent Briefs**: Multi-perspective synthesis (Bull, Bear, Synthesizer) backed by deterministic `EvidencePack` citations (`[E1]`–`[E9]`).
7. **Automated Critic Agent**: Enforces 100% numerical claim verification within ±0.5% tolerance and strictly rejects directive financial advice.
8. **Walk-Forward Backtest Lab**: Rolling out-of-sample comparison of 4 classic MPT strategies without lookahead bias.
9. **Traceable AI Concierge**: Grounded chatbot with citation popups explaining portfolio metrics and diversification benefits.

---

## How to Run Locally

### Prerequisites
- **Docker Desktop** (with WSL2 engine enabled)
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

# 3. Run database migrations
just migrate

# 4. Start all backend microservices
just up

# 5. In a second terminal, start the Next.js UI
cd apps/web
npm run dev
```

---

### Option B: Using Direct PowerShell & Docker Commands

```powershell
# 1. Start Postgres and Redis
docker compose -f infra/compose/docker-compose.yml up -d db redis

# 2. Run Alembic Migrations
uv run alembic -c infra/db/alembic.ini upgrade head

# 3. Start all backend services in Docker
docker compose -f infra/compose/docker-compose.yml up --build

# 4. In a separate terminal, launch the web frontend:
cd apps/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.  
Interactive API Gateway Documentation: [http://localhost:8000/docs](http://localhost:8000/docs).

> **Zero-Key Demo Mode:** No external API keys (Groq, Finnhub, etc.) are required to run Tangent. The system defaults to deterministic offline market fixtures and recorded LLM responses.

---

## Microservice Communication & Data Flow

1. **Client Interaction:**
   - The browser connects exclusively to `apps/web` (port 3000) and `gateway` (port 8000). Downstream microservices are internal.
2. **Reverse Proxy & Auth:**
   - The `gateway` issues a cryptographically signed guest JWT upon onboarding. Every subsequent request is rate-limited (sliding window) and forwarded to the target service.
3. **Evidence-Pack Protocol:**
   - When the multi-agent `agent` service generates an advisory brief, it first fetches deterministic calculations from `quant`, `market-data`, and `sentiment` over internal HTTP using [`libs/common/http_client.py`](libs/common/http_client.py).
   - Metrics are packaged into an immutable `EvidencePack` with IDs (`E1`, `E2`, ...).
   - LLMs generate briefs using these evidence items. The **Critic Agent** validates that every quantitative assertion accurately matches its evidence citation.
4. **Database Isolation:**
   - Services share a single PostgreSQL cluster but write to strictly segregated schemas (`portfolio.*`, `market_data.*`).

---

## Production Deployment to Fly.io

Tangent deploys to Fly.io using private WireGuard mesh networking (Fly 6PN):
- Internal services (`market-data`, `quant`, `portfolio`, `sentiment`, `agent`) have **no public IPs** and communicate over Fly's private `.internal` network.
- `gateway` and `apps/web` are exposed to the public internet with automated TLS termination and SSE streaming support.

### Automated Deployment

```powershell
# 1. Login to Fly.io
fly auth login

# 2. Initialize Fly Postgres, Redis, and apps
.\infra\deploy\deploy.ps1 -Action init

# 3. Deploy all microservices
.\infra\deploy\deploy.ps1 -Action deploy
```

Refer to [infra/deploy/README.md](infra/deploy/README.md) for individual service deployment configurations.

---

## Testing & Quality Assurance

```powershell
just test        # Run unit, integration, and E2E system flow tests
just lint        # Ruff code linting and style validation
just fmt         # Automated code formatting
just typecheck   # Mypy strict type checking across all services & libs
```

---

## Statutory Notice

Tangent is an educational simulation tool for portfolio analysis. It does not provide personalized investment advice, financial planning, or broker execution services. Past performance derived from historical backtesting is no guarantee of future returns. See [DISCLAIMER.md](DISCLAIMER.md) for full terms.
