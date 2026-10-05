# Tangent — Master Build Plan

> Portfolio decisions you can trace.

---

## What We're Building

Transforming **FinMaths** (a Streamlit MPT optimizer) into **Tangent** — a production microservice platform with:
- A modern Next.js frontend
- 6 FastAPI backend services (gateway, market-data, quant, sentiment, agent, portfolio)
- Evidence-grounded AI Decision Studio with traceable citations
- Walk-forward backtest evaluation layer

---

## Phase Execution Plan

| Phase | Name | Size | Status |
|-------|------|------|--------|
| **0** | Decisions & Scope Freeze | S | ✅ **DONE** (commit 1d5ea28) |
| **1** | Environment Setup | S | ✅ **DONE** |
| **2** | Foundation (libs, compose, CI) | M | ✅ **DONE** |
| **3** | Port Core Services | L | ✅ **DONE** |
| **4** | Gateway + Frontend MVP | L | 🔄 **NEXT** |
| **5** | Sentiment + Agent Service | L | ⏳ Pending |
| **6** | Decision Studio UI + Chat | M | ⏳ Pending |
| **7** | Evaluation Harness | M | ⏳ Pending |
| **8** | Hardening | M | ⏳ Pending |
| **9** | Testing & CI/CD | M | ⏳ Pending |
| **10** | Cloud Deployment | M | ⏳ Pending |
| **11** | Docs, Lock & Release | S-M | ⏳ Pending |

---

## Phase 0 Outputs (Current Phase)

### 1. Port Map — Legacy → Tangent

| Legacy Module | New Service | Function |
|---|---|---|
| `app.py` (screens 1-2: Profile, Preferences) | `apps/web` | Risk profiler wizard UI |
| `app.py` (screen 3: Optimization runner) | `services/quant` | `POST /optimize`, `POST /frontier` |
| `app.py` (screen 4-8: Results, Frontier, etc.) | `apps/web` | Results pages with typed API client |
| `app.py` (screen 9: Projections) | `services/quant` | `POST /simulate` |
| `app.py` (screen 11: AI Concierge) | `services/agent` | `POST /chat` (grounded) |
| `modules/data_fetcher.py` | `services/market-data` | Prices, FX, cache, asset metadata |
| `modules/portfolio_optimizer.py` | `services/quant` | Optimizer, frontier, Monte Carlo, marginal-impact |
| `modules/risk_profiler.py` | `services/quant` or `libs/contracts` | Risk scoring, asset-class bounds |
| `modules/projections.py` | `services/quant` | SIP future value, goal probability |
| `modules/visualizations.py` | `apps/web` | Recharts/Plotly components (ported to TS) |
| `modules/llm_engine.py` | `libs/llm` + `services/agent` | Provider-agnostic client, agent prompts |
| `modules/db.py` | `libs/common` | Pooled SQLAlchemy connection |
| `schema.sql` | `infra/db/migrations/` | Alembic per-schema migrations |
| `seed_assets.py` | `services/market-data` (seeder script) | Asset metadata seeding |

### 2. Risk Register (Top 10)

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | yfinance is unofficial, may break/rate-limit | High | High | Provider abstraction + fallback fixture provider |
| 2 | SSE not supported through some hosts (Render timeout 30s, Fly might need config) | Medium | High | `TODO(verify)` per host; add polling fallback at UI layer |
| 3 | Groq free-tier rate limits during agent runs | High | Medium | Cache evidence packs by (ticker, portfolio_hash, date); per-run token budget |
| 4 | Cold starts on container hosts delay first request | Medium | Medium | Keep `/health` alive, demo mode for zero-API smoke tests |
| 5 | Covariance matrix instability with few data points | Medium | High | Ledoit-Wolf shrinkage as default; document sample size warning |
| 6 | LLM output fails Pydantic schema validation → run fails | Medium | High | Max 2 critic revision loops; output best attempt with issues flagged |
| 7 | News API free-tier too restrictive (e.g., NewsAPI 100 req/day) | High | Medium | Content-hash cache; fixture fallback; RSS as no-key option |
| 8 | DB schema drift between services (shared PG instance) | Low | High | One schema per service; never cross-read; enforced by naming convention |
| 9 | LLM data contamination in backtest evaluation | N/A | Reputational | Document caveat explicitly; judge agent only on groundedness |
| 10 | Windows/Linux path incompatibilities in Docker builds | Medium | Medium | `.gitattributes` LF enforcement; PowerShell-compatible `justfile` |

### 3. Decision Log

#### Backend Host
- **Option A: Fly.io** — Good SSE support, persistent VMs, private networking, generous free tier. ⭐ Recommended
- **Option B: Render** — Simpler DX, but 30s request timeout breaks long agent runs via SSE
- **Option C: Railway** — Easy Docker deploys, but less control over networking
- **Decision: Fly.io** `TODO(verify)` free-tier limits and SSE timeout behavior

#### Auth Approach
- **Option A: Own JWT (FastAPI + python-jose)** — Simplest, no vendor, guest tokens easy. ⭐ Recommended
- **Option B: Supabase Auth** — Free, but adds a vendor dependency
- **Option C: Clerk** — Best DX but paid after free tier
- **Decision: Own JWT** with guest mode (no signup required)

#### News Source
- **Option A: NewsAPI.org** — 100 req/day free; needs key. `TODO(verify)` current limits
- **Option B: RSS feeds (no key)** — Zero cost, always available, fixture-friendly. ⭐ Recommended for v1
- **Option C: GNews / Currents API** — Similar free tiers
- **Decision: RSS + fixture fallback** for v1; NewsAPI as upgrade path

#### LLM Comparison Pair
- **Primary: Groq (llama-3.3-70b-versatile)** — Already in use, fast inference
- **Secondary: Google Gemini Flash 1.5** — Free tier, different architecture for comparison `TODO(verify)` terms
- **Decision: Groq primary, Gemini secondary** via LiteLLM abstraction

#### Asset Universe (curated ~60-100 assets)
- **Indian Large Caps:** Nifty 50 top 20 by market cap (RELIANCE, TCS, HDFCBANK, INFY, ICICIBANK, HINDUNILVR, WIPRO, AXISBANK, KOTAKBANK, BAJFINANCE, MARUTI, SUNPHARMA, TATAMOTORS, NTPC, ONGC, DRREDDY, ULTRACEMCO, TITAN, ASIANPAINT, LT)
- **Indian Indices:** ^NSEI, ^NSEBANK, ^CNXIT
- **Global ETFs:** SPY, QQQ, EEM, VT, IVE, IVW, USMV
- **Commodities:** GOLDBEES.NS, SILVERBEES.NS, GLD, SLV
- **Crypto:** BTC-USD, ETH-USD (labeled high-risk)
- **FX Pair:** USDINR=X (for FX lens)
- **Synthetic (modeled):** SBI_FD (7% yield), INDIA_GOVT_10Y (7.2%), INDIA_CORP_AAA (8%), HDFC_FD (7.1%), EMBASSY_REIT, MINDSPACE_REIT, BROOKFIELD_REIT

### 4. Scope Freeze

#### Must-Have (v1)
- [ ] Full legacy parity in new UI (risk profiler → optimize → results → projections)
- [ ] Decision Studio: marginal impact + cited multi-agent brief
- [ ] Sentiment service (RSS-based, LLM-scored, cached)
- [ ] Currency lens (FX decomposition per asset)
- [ ] Market regime snapshot (rule-based)
- [ ] Backtest Lab (walk-forward, 4 strategies)
- [ ] Agent trace dashboard
- [ ] Demo mode (fixtures + recorded LLM)
- [ ] Guest-first accounts (no mandatory signup)
- [ ] All services containerized (Docker Compose)
- [ ] CI green (lint, type-check, unit tests)
- [ ] Deployed to cloud with public URL

#### Stretch (post-v1)
- PDF report export
- Watchlist with alerts
- Forward paper-trading log
- Mobile app (React Native)
- Trending screener (full implementation)
- Multi-tenant billing

#### Out of Scope
- Real brokerage integration / order placement
- Real-money advice
- Price prediction models
- Intraday data

---

## Repo Layout

```
tangent/
  apps/web/                    # Next.js 14 App Router + TypeScript
  services/
    gateway/                   # FastAPI: JWT auth, rate limit, CORS, routing
    market-data/               # FastAPI: prices, FX, metadata, regime, screener
    quant/                     # FastAPI: optimizer, frontier, MC, backtest
    sentiment/                 # FastAPI: news ingest, LLM scoring, cache
    agent/                     # FastAPI: evidence pack, agents, critic, SSE
    portfolio/                 # FastAPI: users, portfolios, run history
  libs/
    contracts/                 # Pydantic models, OpenAPI export
    common/                    # logging, config, httpx client, middleware
    llm/                       # LiteLLM wrapper (Groq + Gemini)
  infra/
    compose/                   # docker-compose.yml + profiles
    db/migrations/             # Alembic per schema
    deploy/                    # Fly.io config
  tests/e2e/                   # Playwright
  legacy/finmaths/             # original code (read-only reference)
  docs/
    adr/                       # Architecture Decision Records
    api/                       # OpenAPI generated docs
  .github/workflows/
  .env.example
  justfile
  AGENTS.md                    # Master prompt (from build prompt Part A)
  README.md
  DISCLAIMER.md
```

---

## Working Rules (carried from build prompt)
1. One phase at a time — stop for approval after each
2. Numbers from deterministic code only — LLMs explain, never produce metrics
3. Simplest thing that works — justify every dependency
4. Secrets never committed (`.env` local, `.env.example` in repo)
5. Tests ship with code (conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `chore:`)
6. ADR for every non-obvious architecture decision
7. All AI output carries disclaimer — no directive language
