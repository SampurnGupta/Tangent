# Changelog

All notable changes to the **Tangent** portfolio decision intelligence platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [2.1.0] - 2026-10-28

### Added
- **Automated Daily Market Settlement Sync via Scheduled GitHub Actions**:
  - Implemented `.github/workflows/market-sync.yml` running automatically on cron `30 22 * * 1-5` (22:30 UTC Mon–Fri / 04:00 AM IST next day).
  - Synchronizes daily settlement closes post-market when both Indian exchanges (NSE/BSE at 10:00 UTC) and US exchanges (NYSE/NASDAQ at 21:00 UTC) have settled.
  - Implemented `POST /api/v1/market-data/sync` on `services/market-data` with curl retry flags (`--max-time 120 --retry 3 --retry-delay 15`) to gracefully tolerate Render free-tier cold starts.
  - Reverse-proxied the sync endpoint through central API Gateway (`/api/v1/market-data/sync`).
- **Observatory Microservices Telemetry Sub-Dashboard (`ModelObservatory.tsx`)**:
  - Added a dedicated 3rd sub-dashboard in Observatory: **"Microservices"** positioned between "Live Model Leaderboard" and "Ask MetaBot".
  - Exclusively displays the 6 deterministic core microservices (Gateway, Market-Data, Quant, Portfolio, Sentiment, Agent) with strictly 4 live metrics:
    1. **Status**: Live traffic-light indicators (`Up` 🟢, `Starting` 🟡, `Down` 🔴).
    2. **Response Latency**: Round-trip response time in milliseconds.
    3. **Request Hits**: Cumulative production request hits per service.
    4. **Payload Transfer**: Real-time network bytes transferred in KB / MB.
  - Real-time 30-second background polling paired with an explicit manual **"Sync Metrics"** button with a loading spinner and last-synced timestamp.
- **Observatory Cluster Top Stat Cards**:
  - Added **Core Microservices** (`6/6 Up`) and **Cluster Data Transfer** (`KB/MB`) metric cards to the top summary bar alongside model inference metrics.
- **MetaBot Architecture Grounding**:
  - Injected real-time microservice status, latency, request volume, and payload snapshots into MetaBot's prompt context, enabling MetaBot to accurately explain the 10-microservice cluster topology.
- **Endpoint `GET /api/v1/observatory/microservices`**:
  - Built endpoint in `services/observatory` to aggregate live service metrics from Redis or provide deterministic local baselines.

### Changed
- In the **Cross-Model Latency & Economics Matrix** table: renamed `Tokens/Response` column header to **`Avg. Tokens/Response`** for clarity.
- Preserved in-session conversation history in MetaBot when toggling between sub-dashboards using non-destructive CSS conditional visibility.
- Strengthened type safety in `services/observatory/observatory/metrics.py` to satisfy strict Mypy pre-commit typing.

---

## [2.0.0] - 2026-10-21

### Added
- **Independent Expert Persona Microservices**:
  - `persona-macro`: Dedicated FastAPI microservice powered by Gemini 2.0 Flash (`gemini/gemini-2.0-flash`).
  - `persona-growth`: Dedicated FastAPI microservice powered by Groq Llama 3.3 70B (`groq/llama-3.3-70b-versatile`).
  - `persona-risk`: Dedicated FastAPI microservice powered by Cloudflare Workers AI Llama 3.2 3B (`cloudflare/@cf/meta/llama-3.2-3b-instruct`), with automatic failover to Groq/Gemini.
  - Dedicated Redis session memory per persona maintaining conversational context, user portfolio constraints, and message history across turns.
- **LLM Observatory & MetaBot Dynamic Analyst**:
  - `observatory`: Aggregates live latency (avg, p50, p95), token throughput, and estimated costs across all active LLMs into Redis.
  - Interactive Model Leaderboard in Web UI (`/observatory`) visualizing real-time metrics across models and providers.
  - MetaBot dynamic model router: evaluates live leaderboard performance and selects the fastest performing model for synthesis.
- **Frontend 1-on-1 Persona Consultation Wiring (`ArenaView.tsx`)**:
  - Wired direct 1-on-1 consultation chat to independent persona microservices via Gateway API (`/api/v1/personas/{persona}/chat`).
  - Persistent session management via `sessionStorage` with visible session ID indicator.
  - Real-time model source and latency telemetry badges attached to every response.
  - "Clear Memory" button allowing users to reset Redis conversational context on demand.
- **Two-Stage Selective Docker Build Pattern**:
  - Implemented selective manifest copying (`pyproject.toml` + stub package directories) before dependency installation across all 10 service Dockerfiles.
  - Eliminates Docker cache invalidation on application code edits, resolving WSL2 disk bloat from 40GB to <3GB.
  - Comprehensive `.dockerignore` ignoring binary documents, presentations, test artifacts, and temp files.

### Changed
- Migrated RiskBot from paid Mistral API to Cloudflare Workers AI free-tier (`@cf/meta/llama-3.2-3b-instruct`), ensuring a zero-cost 3-provider architecture (Groq + Gemini + Cloudflare).
- Cleaned monorepo architecture: deleted scaffolding `services/template/`, updated workspace manifests in `pyproject.toml`, and archived prior GCP Cloud Run and Oracle VM attempts to `docs/archive/`.
- Configured free-tier cloud deployment across Render (Personas & Observatory), Vercel (Next.js), and Supabase/Neon + Upstash Redis.

---

## [1.1.0] - 2026-10-06

### Added
- **Interactive Professional Homepage (`HeroHomepage.tsx`)**:
  - Ambient glowing backdrop, animated spotlight badge pills, and live institutional statistics (74 multi-asset universe, SciPy SLSQP solver, 5,000 Monte Carlo simulation paths, 5 autonomous AI ideologies).
  - Feature Showcase Grid covering: Expert Arena, 1-on-1 Consultation, Crisis Stress Testing, Deterministic SLSQP Engine, Monte Carlo Projections, and Draww AI Co-pilot.
  - Interactive fast-redirect decision pathways:
    - *"Discover Your Ideal Portfolio"* &rarr; Launches Optimization Studio.
    - *"Enter The Expert Arena"* &rarr; Launches Arena Debate & Consultation.
    - *"Chat with Draww AI"* &rarr; Opens floating interactive AI concierge.
- **Expert Committee Arena (`ArenaView.tsx`)**:
  - Live multi-agent debate stream featuring 5 strictly bounded expert personas:
    1. **Macro & Sovereign Rates** (global liquidity, interest rate cycles, inflation dynamics).
    2. **Deep Value & Margin of Safety** (fundamentals, cash flow yields, valuation downside).
    3. **Quant Momentum & Factor Risk** (trend strength, volatility regimes, statistical factors).
    4. **Austrian Sound Money & Hedging** (hard monetary assets, fiat debasement hedges, gold/commodities).
    5. **ESG & Long-Horizon Stewardship** (sustainable governance, climate transition, tail risks).
  - Sequential debate progression ending in a balanced institutional consensus synthesis.
  - Direct integration with Groq API (`llama-3.3-70b-versatile`) for real-world live market reasoning, with graceful fallback to offline deterministic reasoning if unconfigured.
  - **Always-Accessible 1-on-1 Consultation**: Interactive chat interface directly available at all times without requiring a prior debate session to run.
- **"Draww" Portfolio AI Co-pilot (`AIChatConcierge.tsx`)**:
  - Rebranded Tangent Concierge to Draww with institutional styling and conversational awareness.
  - Deep context integration into user's active portfolio state, asset weights, risk score, optimization metrics, and Monte Carlo paths.
  - Traceable evidence tag citations (`[E1]`–`[E9]`) with interactive metric inspection.
- **Expanded Asset Universe (74 Securities)**:
  - Added complete Indian Nifty 50 large caps, US index & sector ETFs, global commodities, Indian REITs, sovereign debt, synthetic fixed income (bank FDs), and liquid cash equivalents.
  - Introduced *"Unbiased All-Asset Mode"* in the asset selector allowing optimization across all possibilities without manual pre-filtering.
- **Crisis Stress Testing Engine (`StressTestScenario.tsx`)**:
  - Historical crisis shock simulations: 2008 Global Financial Crisis, 2020 COVID Market Crash, 2022 Fed Rate Hike Shock, 1970s Stagflation, and 2000 Dot-com Bubble.
- **Decision Studio Investor Export**:
  - Single-click export of final portfolio asset allocation, nominal/real returns, volatility, and Sharpe metrics to CSV and JSON formats.

### Changed
- **Navigation & Header Cleanup (`Header.tsx`)**:
  - Added `Overview` navigation tab linking to the new Homepage.
  - Removed obsolete `v1.0 Core` badge pill from the Tangent emblem.
  - Completely removed the `Interactive Session` indicator pill from the top navbar.
  - Streamlined header layout to reduce clutter and prioritize navigation.
- **Arena Stream Cleanup**:
  - Removed redundant `Ideology Doctrine` and `Consensus Synthesis` tag pills from agent responses for a cleaner executive reading experience.
  - Removed extraneous UUID session badges and internal identifiers from the top banner.
- **UI Enhancements**:
  - Relocated statutory regulatory disclaimer cleanly to the footer.
  - Removed cluttering Markowitz frontier graph from the navbar.
  - Enhanced page layout with subtle particle grid aesthetics and responsive container widths.

---

## [1.0.0] - 2026-10-05

### Added
- **Microservices Architecture**:
  - **Gateway** (Port 8000): Fast reverse proxy, JWT guest onboarding, sliding-window rate limiting.
  - **Market-Data** (Port 8001): Market ingestion engine with yfinance adapter, 24h PostgreSQL cache, and synthetic yield accrual models.
  - **Quant** (Port 8002): Deterministic SciPy SLSQP Max-Sharpe solver, Ledoit-Wolf covariance shrinkage, Monte Carlo engine (10,000 paths), and walk-forward backtest lab.
  - **Portfolio** (Port 8003): User state persistence, saved allocations, execution audit logs.
  - **Sentiment** (Port 8004): Zero-key RSS financial news ingestion (Google News, ET) with FinBERT lexicon scoring and content-hash caching.
  - **Agent** (Port 8005): EvidencePack builder (`E1`–`E9`), Bull/Bear/Synthesizer multi-agent pipeline, automated Critic verification, SSE streaming.
- **Shared Libraries (`libs/`)**:
  - `libs/contracts`: Shared Pydantic schemas for microservice contracts.
  - `libs/common`: Unified structured JSON logging, resilient HTTP client, and base config.
  - `libs/llm`: LiteLLM wrapper with Groq primary and Gemini secondary fallback.
- **Next.js 16 Web Application (`apps/web`)**:
  - Risk profiler wizard calculating risk tolerance scores (1–10) and asset-class bounds.
  - Deterministic Optimization Studio with live pie chart, sector breakdown, and marginal asset impact analysis.
  - Walk-Forward Backtest Lab comparing 4 classic MPT strategies without lookahead bias.
  - Full demo mode support with deterministic offline fixtures.
