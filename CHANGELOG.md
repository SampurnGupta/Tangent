# Changelog

All notable changes to the **Tangent** portfolio decision intelligence platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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
