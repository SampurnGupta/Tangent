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

See [docs/architecture.md](docs/architecture.md) and [docs/adr/0001-architecture-decisions.md](docs/adr/0001-architecture-decisions.md) for detailed architectural records.

---

## Microservice Matrix

| Service | Port | Primary Responsibilities | Stack |
|---|---|---|---|
| **apps/web** | 3000 | Next.js 16 App Router UI, Vanilla CSS design system, Interactive Decision Studio | React 19, TypeScript, Vanilla CSS |
| **gateway** | 8000 | Unified entrypoint, guest JWT issuance, sliding-window rate limiter, reverse proxy | FastAPI, PyJWT, HTTPX |
| **market-data** | 8001 | 73 curated assets, yfinance integration, 24h Postgres cache, synthetic bond accrual | FastAPI, SQLAlchemy, Pandas |
| **quant** | 8002 | SciPy SLSQP Max-Sharpe, Ledoit-Wolf shrinkage, Monte Carlo projections, Walk-Forward Backtest | NumPy, SciPy, Scikit-learn |
| **portfolio** | 8003 | Guest profiles, saved allocations, execution audit trails | FastAPI, SQLAlchemy, PostgreSQL |
| **sentiment** | 8004 | Zero-key RSS ingest (Google News, Economic Times), content-hash cache, lexicon scoring | FastAPI, Feedparser, HTTPX |
| **agent** | 8005 | EvidencePack extraction (`E1`–`E9`), Bull/Bear/Synthesizer agents, Critic review, SSE streaming | FastAPI, LiteLLM, Groq / Gemini |

---

## Core Features

1. **Risk Profiler Wizard**: Calculates risk tolerance scores (1–10) and establishes asset-class allocation bounds (equity, debt, commodities, cash).
2. **Asset Universe Selector**: Curated pool across Indian Large Caps, US ETFs, Commodities, Government Debt, and Synthetic Fixed Income.
3. **Max-Sharpe Portfolio Optimizer**: SciPy SLSQP solver incorporating Ledoit-Wolf covariance shrinkage, asset caps (15%), sector caps (25%), Indian LTCG tax drag (12.5%), and 6.0% inflation adjustments.
4. **Monte Carlo Wealth Projections**: 1,000 to 10,000 path geometric Brownian motion simulation displaying median wealth trajectories, 95% confidence intervals, and drawdown profiles.
5. **Decision Studio & Marginal Impact**: Evaluates candidate asset inclusions by calculating real Sharpe delta, return delta, and volatility delta.
6. **Traceable Multi-Agent Briefs**: Multi-perspective synthesis (Bull, Bear, Synthesizer) backed by deterministic `EvidencePack` citations (`[E1]`–`E9`).
7. **Automated Critic Agent**: Enforces 100% numerical claim verification within ±0.5% tolerance and strictly rejects directive financial advice.
8. **Walk-Forward Backtest Lab**: Rolling out-of-sample comparison of 4 classic MPT strategies without lookahead bias.
9. **Traceable AI Concierge**: Grounded chatbot with citation popups explaining portfolio metrics and diversification benefits.

---

## Quickstart (Windows PowerShell)

### 1. Prerequisites Check
```powershell
just doctor
```
Ensures Docker Desktop (WSL2), Python 3.12, `uv`, Node.js 22+, and `just` are ready.

### 2. Environment Setup
```powershell
Copy-Item .env.example .env
# Edit .env with your credentials (or leave DEMO_MODE=true for zero-key local operation)
```

### 3. Start Core Database & Cache
```powershell
just up-core
just migrate
```

### 4. Run Development Services
```powershell
# In terminal 1: start backend services
just up

# In terminal 2: run web application
cd apps/web
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## Testing & Quality Assurance

```powershell
just test        # Run all 48 unit & E2E integration tests
just lint        # Ruff linting & format validation
just fmt         # Automated code formatting
just typecheck   # Mypy strict type checking across 65 source files
just pre-commit  # Run all Git pre-commit hooks
```

---

## Statutory Notice

Tangent is an educational simulation tool for portfolio analysis. It does not provide personalized investment advice, financial planning, or broker execution services. Past performance derived from historical backtesting is no guarantee of future returns. See [DISCLAIMER.md](DISCLAIMER.md) for full terms.
