# Tangent — Scope Freeze Document

**Version:** 1.0  
**Date:** 2026-10-05

---

## Must-Have (v1 & v1.1 — Completed)

### Legacy Parity & Foundation
- [x] Risk profiler (age + horizon → risk score → asset-class bounds)
- [x] Asset preference selection (sectors, international, commodities, bonds, REITs)
- [x] Market data fetch from yfinance with 24h PostgreSQL cache (TTL bulk upsert)
- [x] Log returns, USD→INR FX conversion, tax (LTCG 12.5% / Debt 30%) + inflation (6%) adjustments
- [x] Max-Sharpe optimization (SciPy SLSQP): weights sum to 1, asset cap 15%, sector cap 25%, class bounds
- [x] 10,000-point Monte Carlo for efficient frontier (seeded, configurable, reproducible)
- [x] Monte Carlo wealth projections: median, 95% CI, worst-case drawdown, goal-achievement probability
- [x] Allocation view: pie chart, sector bar, asset class donut, risk contribution
- [x] Efficient frontier calculations & metrics
- [x] Correlation matrix computation
- [x] Tax & inflation breakdown display
- [x] Portfolio run audit log (persistent in DB)
- [x] Traceable AI concierge co-pilot ("Draww") grounded in portfolio metrics

### Decision Studio & Advanced Analytics
- [x] **Decision Studio:** pick any asset → marginal impact (before/after Sharpe, vol, drawdown, concentration) + re-optimized weights + cited multi-agent brief (bull/bear/synthesizer/critic)
- [x] **Portfolio Export:** single-click export of optimized weights and metrics to CSV and JSON formats
- [x] **Unbiased All-Asset Mode:** optimize across all possibilities without manual pre-filtering
- [x] **Crisis Stress Testing Engine:** historical crisis drawdowns (2008 GFC, 2020 COVID, 2022 Rates, Stagflation, Dot-com)
- [x] **Sentiment service:** RSS news ingest per ticker, LLM-scored with structured output, content-hash cache
- [x] **Currency lens:** decompose asset return into local-currency return + FX return for INR investor
- [x] **Market regime snapshot:** rule-based (index trend, VIX level, rate trend) — no predictions
- [x] **Backtest Lab:** walk-forward comparison of 4 strategies (max-Sharpe sample cov, max-Sharpe Ledoit-Wolf, min-variance, equal weight)
- [x] **Agent trace dashboard:** per-run timeline, tokens, cost estimate, groundedness score
- [x] **Demo mode:** bundled fixtures + recorded LLM responses (works with no external APIs)
- [x] **Guest-first accounts:** use without signup; optional registration; saved portfolio history

### New in v1.1
- [x] **Interactive Professional Homepage (`HeroHomepage.tsx`):** Animated institutional landing view with platform metrics, feature cards, and 3-way direct navigation redirects
- [x] **Expert Committee Arena (`ArenaView.tsx`):** Live crossfire debate with 5 strictly bounded expert ideologies (Macro, Value, Quant, Austrian, ESG) powered by Groq Llama 3.3 70B
- [x] **Direct 1-on-1 Consultation:** Always-accessible individual expert consultation unlocked immediately upon loading the Arena
- [x] **74-Asset Comprehensive Universe:** Expanded coverage including all Indian Nifty 50 large caps, US ETFs, commodities, bonds, REITs, bank FDs, and crypto
- [x] **Draww AI Co-pilot Rebrand:** Comprehensive institutional chatbot with live portfolio awareness and citation inspector
- [x] **Header & Navigation Polish:** Streamlined layout, removed `v1.0 Core` and `Interactive Session` badges, relocated statutory disclaimers cleanly to footer

### Infrastructure
- [x] All 6 services containerized (Docker Compose, multi-stage non-root Dockerfiles)
- [x] One PostgreSQL instance, schema-per-service, Alembic migrations from zero
- [x] Redis for caching and rate limiting
- [x] CI green: lint, type-check, unit tests, build images
- [x] Deployed / deployable to cloud via Fly.io scripts
- [x] SSE streaming for agent runs
- [x] `/health` and `/ready` on every service

---

## Stretch (post-v1, only if time and budget remain)
- PDF report export
- Watchlist with price alerts
- Forward paper-trading log (timestamp recommendations for future evaluation)
- Trending screener (full 60-100 asset ranking by momentum + volume + news)
- Notifications (email digest of portfolio changes)

---

## Out of Scope (never in v1)
- Real brokerage integration or order placement
- Real-money investment advice
- Price prediction or alpha-seeking models
- Intraday data
- Mobile native apps
- Multi-tenant billing / SaaS pricing

---

## Known Fixes Applied in Port (from build prompt A3)

| Legacy Weakness | Fix in Tangent |
|---|---|
| Synthetic assets use random noise | Deterministic yield-accrual model; each assumption documented in assets table |
| Monte Carlo path count inconsistent (1k vs 10k in docs) | Single `MC_PATHS` env var (default 10,000); seeded RNG; seed stored in each run |
| Historical covariance noisy | Ledoit-Wolf shrinkage as configurable option; compared in backtest |
| "Real-time" wording misleading | Changed to "daily close, refreshed within 24h" everywhere |
| Tax/inflation constants hardcoded | Moved into `config` table with `source` and `as_of` date; user-overridable |
| DB connections not pooled; no input validation | SQLAlchemy connection pool; Pydantic validation on every endpoint |
| No out-of-sample evaluation | Walk-forward backtest implemented |
| Hardcoded local paths in setup | All paths parameterized via env vars |

---

## Asset Universe (curated)

**~65 assets across 7 categories:**

| Category | Examples |
|---|---|
| Indian Large Cap Equity | RELIANCE.NS, TCS.NS, HDFCBANK.NS, INFY.NS, ICICIBANK.NS, HINDUNILVR.NS, WIPRO.NS, AXISBANK.NS, KOTAKBANK.NS, BAJFINANCE.NS, MARUTI.NS, SUNPHARMA.NS, TATAMOTORS.NS, NTPC.NS, ONGC.NS, DRREDDY.NS, TITAN.NS, LT.NS |
| Indian Indices | ^NSEI, ^NSEBANK, ^CNXIT |
| Global ETFs | SPY, QQQ, EEM, VT, IVE, IVW, USMV |
| Commodities | GOLDBEES.NS, SILVERBEES.NS, GLD, SLV |
| Crypto (high-risk) | BTC-USD, ETH-USD |
| FX | USDINR=X |
| Synthetic (modeled) | SBI_FD (7%), INDIA_GOVT_10Y (7.2%), INDIA_CORP_AAA (8%), HDFC_FD (7.1%), EMBASSY_REIT, MINDSPACE_REIT, BROOKFIELD_REIT |

---

## Environment Variables Required

See `.env.example` for the full list. Critical ones:

```
DATABASE_URL, REDIS_URL
JWT_SECRET, JWT_EXPIRY_MINUTES
GROQ_API_KEY, SECOND_LLM_API_KEY
LLM_PRIMARY_MODEL, LLM_SECONDARY_MODEL, LLM_MODE
MC_PATHS=10000, MC_SEED=42
DEMO_MODE=false
```
