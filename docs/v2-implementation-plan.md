# Tangent v2 — Revised Implementation Plan

> Updated: Oct 2026 | Incorporates user feedback from review session.

---

## What Changed From v1 Plan

| v1 Plan | v2 Revision | Reason |
|---|---|---|
| Redis for 5 use cases | Redis for 3 targeted use cases | Pragmatism — only where it genuinely helps |
| 1 persona-service with routing | 3 independent persona services | Coursework requirement, demonstrable independence |
| Railway for backend | Render + UptimeRobot for backend | Render 750hr/month is fine for 1 service kept awake |
| Vague "3 LLMs" | LLM Observatory + MetaBot chatbot | Concrete, demonstrable DevOps feature |
| GCP as option | GCP Cloud Run with honest analysis | min-instances blows past free tier in days |

---

## Part 0 — Critical Math Fixes (Do First, Non-Negotiable)

**These are correctness bugs. Everything downstream depends on them being right.**

### 0.1 Fix Monte Carlo GBM

**File:** [`services/quant/quant/engine.py`](file:///d:/%23PROPER_PROJECTS/Tangent/services/quant/quant/engine.py#L340-L347)

**Problem:** `paths[:,m+1] = paths[:,m] * (1 + shocks)` is an arithmetic random walk. Asset prices follow geometric Brownian motion (GBM). The arithmetic walk can generate negative wealth and understates long-tail dispersion.

**Fix:**
```python
# Itô-corrected drift: subtract ½σ² to maintain correct expected value
monthly_mu_gbm = (req.expected_annual_return / 12.0) - 0.5 * (req.annual_volatility**2 / 12.0)
monthly_sigma   = req.annual_volatility / np.sqrt(12.0)
log_shocks      = rng.normal(monthly_mu_gbm, monthly_sigma, size=(req.paths, n_months))
# Geometric step — prices can never go negative
paths[:, m + 1] = paths[:, m] * np.exp(log_shocks[:, m]) + req.monthly_sip
```

### 0.2 Fix LLM Cost Estimation

**File:** [`libs/llm/llm/client.py`](file:///d:/%23PROPER_PROJECTS/Tangent/libs/llm/llm/client.py#L128)

**Problem:** Hardcoded Groq Llama pricing used regardless of which model is called. Gemini Flash has a completely different price.

**Fix — model-aware pricing table:**
```python
MODEL_PRICING_PER_1M = {
    "groq/llama-3.3-70b-versatile": {"in": 0.59,  "out": 0.79},
    "groq/llama3-8b-8192":          {"in": 0.05,  "out": 0.08},
    "groq/qwen-qwq-32b":            {"in": 0.60,  "out": 0.60},
    "gemini/gemini-2.0-flash":      {"in": 0.10,  "out": 0.40},
    "gemini/gemini-1.5-flash":      {"in": 0.075, "out": 0.30},
    "mistral/mistral-small-latest": {"in": 0.10,  "out": 0.30},
}

def _estimate_cost(model: str, tokens_in: int, tokens_out: int) -> float:
    p = MODEL_PRICING_PER_1M.get(model, {"in": 0.50, "out": 0.80})
    return ((tokens_in * p["in"]) + (tokens_out * p["out"])) / 1_000_000
```

### 0.3 Add VaR & CVaR

**File:** [`services/quant/quant/risk.py`](file:///d:/%23PROPER_PROJECTS/Tangent/services/quant/quant/risk.py)

```python
from scipy import stats

def compute_var_cvar(
    weights: np.ndarray,
    mean_monthly_returns: np.ndarray,
    cov_monthly: np.ndarray,
    confidence: float = 0.95,
    horizon_days: int = 252,
    portfolio_value: float = 1_000_000,
) -> dict:
    """Parametric VaR and CVaR (Expected Shortfall)."""
    port_ret = float(np.dot(weights, mean_monthly_returns) * 12.0)
    port_vol = float(np.sqrt(weights @ cov_monthly @ weights) * np.sqrt(12.0))
    daily_mu  = port_ret / 252.0
    daily_vol = port_vol / np.sqrt(252.0)
    h_mu  = daily_mu  * horizon_days
    h_vol = daily_vol * np.sqrt(horizon_days)
    z     = stats.norm.ppf(1 - confidence)
    var   = -(h_mu + z * h_vol) * portfolio_value
    cvar  = -(h_mu - h_vol * stats.norm.pdf(z) / (1 - confidence)) * portfolio_value
    return {
        "var_95": round(max(0.0, var), 2),
        "cvar_95": round(max(0.0, cvar), 2),
        "confidence": confidence,
        "horizon_days": horizon_days,
    }
```

---

## Part 1 — Redis (Scoped to 3 Real Use Cases)

Redis is currently declared but never used. Fix this properly.

### 1.1 Use Case 1: Persona Chat Session Memory

**Why:** The 1-on-1 chat currently passes history in the HTTP body (last 6 turns). Refresh = lost. Redis stores conversation history keyed by `session_id + persona_id`.

```
Key:   session:{session_id}:{persona_id}   (e.g. session:abc123:macro)
Value: JSON array of {role, content, timestamp} messages
TTL:   7200 seconds (2 hours sliding window)
```

### 1.2 Use Case 2: Price Cache (Replace PostgreSQL Cache)

**Why:** Market-data currently caches prices in PostgreSQL. Redis is 10–100× faster for hot ticker reads. Keeps DB for durable storage, Redis for fast cache layer.

```
Key:   prices:{ticker}:{YYYY-MM}    (e.g. prices:TCS.NS:2026-09)
Value: JSON array of OHLC close prices
TTL:   86400 seconds (24 hours)
```

### 1.3 Use Case 3: LLM Metrics (for Observatory feature)

**Why:** Every LLM call across all 3 persona chatbots writes metrics to Redis. The Observatory queries Redis directly — no database query needed.

```
Key:   llm:metrics:{model}          Hash  — sum of tokens_in, tokens_out, total_cost, call_count
Key:   llm:latency:{model}          Sorted set — individual latency values (for percentiles)
Key:   llm:calls:{call_id}          Hash — single call record (model, persona, latency, tokens, cost)
TTL:   llm:calls → 24h (rolling log)
```

**Implementation:** Create `libs/common/common/redis_client.py` with async Redis functions for all 3 use cases. All persona services and the gateway share this library via the monorepo.

---

## Part 2 — The 3 Independent Persona Chatbot Services

### 2.1 Why These 3 Personas

Choosing the 3 most cognitively distinct financial worldviews — each defensibly grounded in a different academic tradition:

| Service | Persona | Philosophy | LLM Model | Academic Tradition |
|---|---|---|---|---|
| `persona-macro` | **MacroBot 🏛️** | Macro & Sovereign Rates | `gemini/gemini-2.0-flash` | Keynesian / Monetarist |
| `persona-growth` | **GrowthBot 🚀** | Growth Equity & Business Moats | `groq/llama-3.3-70b-versatile` | Buffett / Quality Investing |
| `persona-risk` | **RiskBot 🛡️** | Quantitative Risk & Covariance | `mistral/mistral-small-latest` | Markowitz / MPT |

> **What about Valuation (⚖️) and Arbiter (🎯)?**  
> Keep them in the Arena debate as synthesis/moderation roles. They are not deployed as independent chatbots. For coursework: "3 independently deployed expert chatbots with domain-specific LLMs" is a cleaner, more defensible claim.

### 2.2 Each Persona Service Is Exactly This

Each is a **standalone FastAPI application** with:
- Its own `Dockerfile`
- Its own `requirements.txt` / `pyproject.toml`
- Its own Render deployment with a unique public URL
- Its own system prompt (never changes — defines the persona boundary)
- One assigned LLM model (hardcoded per service, not configurable at runtime)
- Redis-backed session memory (shared Upstash instance, separate namespaces)

```
services/
  persona-macro/
    Dockerfile
    pyproject.toml
    macro/
      main.py        # FastAPI app, /chat POST, /health GET, /session/{id} GET
      persona.py     # MACRO_SYSTEM_PROMPT (hardcoded ideology)
      session.py     # Redis session read/write
      llm.py         # Calls gemini/gemini-2.0-flash only
      metrics.py     # Writes to Redis llm:metrics:gemini
    
  persona-growth/    # Same structure, groq/llama-3.3-70b-versatile
  persona-risk/      # Same structure, mistral/mistral-small-latest
```

### 2.3 Persona System Prompts (Hardcoded Per Service)

**MacroBot (`persona-macro/macro/persona.py`):**
```python
SYSTEM_PROMPT = """You are MacroBot, an elite institutional economist specializing in 
sovereign interest rates, central bank policy (Fed, RBI, ECB), currency depreciation, 
and foreign institutional capital flows.

Your STRICT boundaries:
- Answer ONLY through the lens of macro interest rate differentials, monetary policy, 
  FII/FPI flows, and currency (USD/INR) mechanics.
- Cite real macro data: RBI repo rate (6.5%), US Fed funds rate, GOI 10Y yield (~7.2%), 
  USD/INR depreciation trajectory (~3-4% annually).
- NEVER give specific stock picks or portfolio allocation percentages.
- Use the DISCLAIMER: "This is educational macro analysis, not investment advice."

You are aware of the investor's session context which will be provided with each message.
Maintain strict ideological consistency across the conversation."""
```

**GrowthBot (`persona-growth/growth/persona.py`):**
```python
SYSTEM_PROMPT = """You are GrowthBot, an institutional growth equity analyst focused 
exclusively on business moats, capital reinvestment quality, and long-term compounding.

Your STRICT boundaries:
- Analyze ONLY through corporate fundamentals: ROE (>18% threshold), ROCE, revenue growth, 
  operating margins, free cash flow conversion, and competitive moats (brand, switching costs, 
  network effects, cost advantages).
- When asked about a company, discuss: ROCE, margin trajectory, order book, competitive position.
- NEVER discuss macro rates, valuations multiples in isolation, or covariance math.
- Use the DISCLAIMER: "This is educational growth equity analysis, not investment advice." """
```

**RiskBot (`persona-risk/risk/persona.py`):**
```python
SYSTEM_PROMPT = """You are RiskBot, a quantitative portfolio risk specialist trained in 
Modern Portfolio Theory, mean-variance optimization, and tail-risk management.

Your STRICT boundaries:
- Answer ONLY in quantitative risk terms: portfolio variance, covariance matrix, Sharpe ratio, 
  Value-at-Risk (VaR), Expected Shortfall (CVaR), maximum drawdown, beta, correlation.
- When given portfolio weights, always compute: diversification score (1/HHI), 
  effective number of assets, and concentration risk.
- Cite mathematical frameworks: Markowitz (1952), Ledoit-Wolf shrinkage, Black-Litterman.
- NEVER give narrative growth forecasts or macro predictions.
- Use the DISCLAIMER: "This is educational quantitative risk analysis, not investment advice." """
```

### 2.4 API Contract (Identical Across All 3 Persona Services)

```http
POST /chat
Content-Type: application/json
{
  "session_id": "uuid-from-frontend",
  "message": "Should I add TCS to my portfolio?",
  "context": {
    "portfolio_weights": {"TCS.NS": 0.12, "INFY.NS": 0.08},
    "nominal_return": 0.134,
    "real_return": 0.058,
    "horizon_years": 10
  }
}

Response:
{
  "reply": "...",
  "persona": "macro",
  "model": "gemini/gemini-2.0-flash",
  "tokens_in": 312,
  "tokens_out": 189,
  "latency_ms": 847,
  "cost_usd": 0.000091,
  "session_message_count": 4
}
```

```http
GET /health → { "status": "ok", "persona": "macro", "model": "gemini/gemini-2.0-flash" }
GET /session/{session_id} → { "history": [...], "message_count": 4 }
DELETE /session/{session_id} → { "cleared": true }
```

---

## Part 3 — LLM Observatory & MetaBot

### 3.1 What the Observatory Actually Is

A **4th independently deployed service** (`services/observatory`) that:
1. Reads LLM metrics from Redis (no DB)
2. Exposes `/metrics` endpoint (raw JSON)
3. Runs **MetaBot** — a chatbot that *explains* the metrics using whichever model is currently fastest
4. Shows a live Model Leaderboard in the UI

> **MetaBot is the most interesting DevOps element.** It is a chatbot *about* the system itself — it analyzes the performance of the other 3 LLMs and explains to the user why model X is faster, model Y is cheaper, etc. The model it uses rotates to whichever scored best in the last 100 calls.

### 3.2 Observatory Service Architecture

```
services/observatory/
  observatory/
    main.py          # FastAPI: /metrics, /metabot/chat, /leaderboard
    metrics.py       # Reads from Redis llm:metrics:* keys
    metabot.py       # Calls the "current best" LLM with metrics context
    persona.py       # METABOT_SYSTEM_PROMPT
```

**MetaBot System Prompt:**
```python
METABOT_SYSTEM_PROMPT = """You are MetaBot, the performance intelligence analyst for 
the Tangent AI Observatory. You have access to real-time performance data from 3 LLM 
models powering the expert persona chatbots:

- MacroBot: uses Gemini 2.0 Flash
- GrowthBot: uses Groq Llama 3.3 70B  
- RiskBot:   uses Mistral Small

Your job is to explain the performance metrics in plain language:
- Why is one model faster? (architecture, hardware, quantization)
- Why does one model use more tokens? (verbosity tendencies, context compression)
- What do the cost differences mean at scale?
- Which model would you recommend for which task and why?

Be specific, cite the actual numbers from the metrics provided to you, and be honest 
about each model's strengths and weaknesses. Explain as a DevOps observability expert."""
```

### 3.3 Leaderboard Metrics

| Metric | Source | Display |
|---|---|---|
| Average response latency (ms) | Redis sorted set percentiles (p50, p95) | Bar chart |
| Tokens per response (avg) | Redis hash: tokens_out / call_count | Horizontal bar |
| Cost per 1000 responses ($) | Redis hash: total_cost / call_count × 1000 | Number cards |
| Total calls | Redis hash: call_count | Counter |
| Quality score | User thumbs up/down per persona | Star rating (optional) |

### 3.4 Frontend Changes

Add to `apps/web/src/components/`:
- `ModelObservatory.tsx` — leaderboard panel with bar charts
- `MetaBotChat.tsx` — chat UI for the Observatory bot
- Update `ArenaView.tsx` to show which model responded for each persona

Poll `/api/v1/observatory/metrics` every 30 seconds. No websockets needed — metrics change slowly enough.

---

## Part 4 — Deployment Strategy (Honest Free Tier Analysis)

### 4.1 Platform Options — Honest Comparison

#### Render (Recommended for personas + gateway)

| Fact | Detail |
|---|---|
| Free tier | 750 instance-hours/month per workspace |
| Sleep | After 15 min of no traffic → 30-60s cold start |
| UptimeRobot fix | Ping every 5 min → service stays awake → **consumes ~744 hours/month** |
| The math | 750 hours ÷ 1 service = 1 service can run 24/7. With 2 services, you burn through hours in 2 weeks |
| **Verdict** | ⚠️ **Only use Render for the 3 persona services.** Keep alive with UptimeRobot. But gateway + quant + market-data will need a different host |

> **Critical realization:** You cannot keep 8 services awake on Render free with 750 hours/month. You'd need 8 × 720 = 5,760 hours. The math doesn't work.

#### GCP Cloud Run (Recommended for gateway + quant + market-data)

| Fact | Detail |
|---|---|
| Free tier | 2M requests/month, 180k vCPU-seconds/month, 360k GiB-seconds/month |
| min-instances=0 | Scales to zero → cold start 3-8s, but $0/month when idle |
| min-instances=1 | **Blows past free tier within 3 days** (1 vCPU 24/7 = 2.5M vCPU-seconds, limit is 180k) |
| UptimeRobot + min-instances=0 | UptimeRobot pings keep Cloud Run warm WITHOUT billing for idle time (it only bills for actual request processing) |
| **Verdict** | ✅ **Use Cloud Run for gateway, quant, market-data, portfolio, sentiment** with `min-instances=0` + UptimeRobot pings |

> **Why this works:** Cloud Run only charges compute during request execution. A `/health` ping that returns in 50ms uses 0.05 seconds of vCPU time. 12 pings/hour × 24h × 30 days × 0.05s = 432 vCPU-seconds/month. Well within the 180,000 vCPU-second limit.

#### Supabase (PostgreSQL)

| Fact | Detail |
|---|---|
| Free tier | 500MB storage, 2 concurrent connections, no expiry (unlike Render Postgres) |
| Limitation | 2 direct connections is tight. Use PgBouncer pooling or Supabase's pooler |
| **Verdict** | ✅ Use for all services that need a DB |

#### Upstash Redis

| Fact | Detail |
|---|---|
| Free tier | 10,000 commands/day (~300k/month) |
| HTTP REST API | Works from Vercel Edge Functions AND from Python services |
| No TCP | Vercel serverless can't open Redis TCP sockets, but doesn't matter since Vercel is only frontend |
| **Verdict** | ✅ Use for all Redis needs |

### 4.2 Final Platform Assignment

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT ARCHITECTURE                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  VERCEL (Free Forever)                                  │   │
│  │  apps/web — Next.js frontend                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────┐   │
│  │  RENDER (3 services,     │  │  GCP CLOUD RUN           │   │
│  │  750hr/month, UptimeBot) │  │  (per-request billing,   │   │
│  │                          │  │  free within limits)     │   │
│  │  persona-macro           │  │  gateway                 │   │
│  │  persona-growth          │  │  quant                   │   │
│  │  persona-risk            │  │  market-data             │   │
│  │  observatory (MetaBot)   │  │  portfolio               │   │
│  └──────────────────────────┘  │  sentiment               │   │
│                                └──────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────┐   │
│  │  SUPABASE                │  │  UPSTASH REDIS           │   │
│  │  PostgreSQL (500MB free) │  │  (10k cmds/day free)     │   │
│  └──────────────────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**UptimeRobot Configuration (Free account: 50 monitors):**
- Monitor each Render service every 5 minutes
- Monitor each Cloud Run service every 14 minutes (to stay warm between auto-scale-to-zero events)
- Render: `/health` endpoint on each service
- Cloud Run: `/health` endpoint

### 4.3 Deployment Files to Create/Change

**Delete:** `infra/deploy/fly.gateway.toml`, `infra/deploy/fly.web.toml`, `infra/deploy/deploy.ps1`

**Create:**
```
infra/deploy/
  render.yaml                    # Render Blueprint for persona services
  gcp/
    cloudbuild.yaml              # Cloud Build CI/CD trigger
    cloudrun.gateway.yaml        # Cloud Run service spec: gateway
    cloudrun.quant.yaml          # Cloud Run service spec: quant
    cloudrun.market-data.yaml    # Cloud Run service spec: market-data
    cloudrun.portfolio.yaml      # Cloud Run service spec: portfolio
    cloudrun.sentiment.yaml      # Cloud Run service spec: sentiment
  vercel.json                    # Frontend deployment config
  .env.production.example        # Template with all cloud service URLs
```

**Render Blueprint (`render.yaml`) — defines all 4 Render services declaratively:**
```yaml
services:
  - type: web
    name: tangent-persona-macro
    runtime: docker
    dockerfilePath: ./services/persona-macro/Dockerfile
    envVars:
      - key: UPSTASH_REDIS_URL
        sync: false
      - key: GEMINI_API_KEY
        sync: false
    healthCheckPath: /health

  - type: web
    name: tangent-persona-growth
    runtime: docker
    dockerfilePath: ./services/persona-growth/Dockerfile
    envVars:
      - key: UPSTASH_REDIS_URL
        sync: false
      - key: GROQ_API_KEY
        sync: false
    healthCheckPath: /health

  - type: web
    name: tangent-persona-risk
    runtime: docker
    dockerfilePath: ./services/persona-risk/Dockerfile
    envVars:
      - key: UPSTASH_REDIS_URL
        sync: false
      - key: MISTRAL_API_KEY
        sync: false
    healthCheckPath: /health

  - type: web
    name: tangent-observatory
    runtime: docker
    dockerfilePath: ./services/observatory/Dockerfile
    envVars:
      - key: UPSTASH_REDIS_URL
        sync: false
      - key: GROQ_API_KEY    # MetaBot uses the current best model
        sync: false
    healthCheckPath: /health
```

**Cloud Run Service Spec Example (`cloudrun.gateway.yaml`):**
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: tangent-gateway
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "0"   # Scale to zero when idle — stays free
        autoscaling.knative.dev/maxScale: "3"
    spec:
      containers:
        - image: gcr.io/${PROJECT_ID}/tangent-gateway:latest
          ports: [{ containerPort: 8080 }]
          env:
            - name: PORT
              value: "8080"
          resources:
            limits:
              memory: 512Mi
              cpu: "1"
```

---

## Part 5 — Frontend Changes

### 5.1 Arena View Changes

- Replace the single `/api/groq` call with calls to each persona's Render URL
- Show model badge on each chat message (`gemini-2.0-flash`, `llama-3.3-70b`, `mistral-small`)
- Add session reset button (clears Redis + frontend state)
- `sessionId` = `crypto.randomUUID()` stored in `useRef` + `sessionStorage`

### 5.2 New Components

| Component | Location | Purpose |
|---|---|---|
| `ModelObservatory.tsx` | `src/components/` | Leaderboard bar charts for 3 models |
| `MetaBotChat.tsx` | `src/components/` | Chat UI for the Observatory bot |
| `PersonaChatBadge.tsx` | `src/components/` | Reusable model badge with latency |

---

## Execution Order (Phase-Gated)

```
── PHASE A: Math Fixes (2-3 hours) ─────────────────────────────
  A1: Fix GBM shocks in engine.py (the Itô correction)
  A2: Fix model-aware cost table in client.py
  A3: Add VaR/CVaR to risk.py
  A4: Write math regression tests (assert GBM never produces negative wealth)
  A5: Commit: fix(quant): correct GBM drift and add VaR/CVaR metrics

── PHASE B: Redis Wiring (1 day) ────────────────────────────────
  B1: Add Upstash Redis account, get REST URL + token
  B2: Create libs/common/common/redis_client.py (async, HTTP-mode for Upstash)
  B3: Add price cache to market-data service (Redis → DB fallback)
  B4: Write integration test: cache hit returns same data as DB
  B5: Commit: feat(cache): wire Redis price cache to market-data service

── PHASE C: Persona Services (2-3 days) ─────────────────────────
  C1: Create services/persona-macro/ with Dockerfile + pyproject.toml
  C2: Implement persona.py (SYSTEM_PROMPT), llm.py, session.py, metrics.py
  C3: Implement main.py: /chat, /health, /session/{id}, /session/{id} DELETE
  C4: Test locally: docker run persona-macro → curl /chat
  C5: Repeat for persona-growth/ (Groq Llama 3.3 70B)
  C6: Repeat for persona-risk/ (Mistral Small)
  C7: Commit: feat(personas): 3 independent persona chatbot services

── PHASE D: Observatory + MetaBot (1-2 days) ────────────────────
  D1: Create services/observatory/ with metrics.py and metabot.py
  D2: Implement /metrics endpoint (reads Redis llm:metrics:* keys)
  D3: Implement /metabot/chat (model selection: picks current fastest)
  D4: Create ModelObservatory.tsx + MetaBotChat.tsx frontend components
  D5: Wire ArenaView.tsx to call persona Render URLs instead of /api/groq
  D6: Add sessionId generation (crypto.randomUUID in useRef)
  D7: Commit: feat(observatory): LLM metrics leaderboard and MetaBot

── PHASE E: Deployment (2-3 days) ──────────────────────────────
  E1: Set up Supabase project → get DATABASE_URL
  E2: Set up Upstash Redis → get UPSTASH_REDIS_URL + token
  E3: Deploy persona-macro, persona-growth, persona-risk to Render
      → Connect Render.yaml blueprint
      → Get 3 public URLs
  E4: Deploy observatory to Render
  E5: Set up GCP project → enable Cloud Run + Container Registry APIs
  E6: Build + push Docker images for gateway, quant, market-data, portfolio, sentiment
  E7: Deploy each to Cloud Run with cloudrun.*.yaml specs
  E8: Update NEXT_PUBLIC_GATEWAY_URL in Vercel to Cloud Run gateway URL
  E9: Update persona service URLs in gateway env vars
  E10: Deploy apps/web to Vercel → get public URL
  E11: Set up UptimeRobot monitors for all Render services (5-min interval)
  E12: Set up UptimeRobot monitors for Cloud Run services (14-min interval)
  E13: Smoke test: end-to-end flow from Vercel → gateway → quant → persona → Redis
  E14: Commit: chore(deploy): Render + GCP Cloud Run + Vercel deployment config

── PHASE F: GitHub Actions CI/CD ────────────────────────────────
  F1: .github/workflows/deploy-render.yml → trigger on push to main for persona services
  F2: .github/workflows/deploy-gcp.yml → Cloud Build trigger for backend services
  F3: Vercel auto-deploys from GitHub on push (zero config)
```

---

## Environment Variables (Updated `.env.example`)

```bash
# === LLM API Keys ===
GROQ_API_KEY=                      # GrowthBot (Llama 3.3 70B) + MetaBot fallback
GEMINI_API_KEY=                    # MacroBot (Gemini 2.0 Flash)
MISTRAL_API_KEY=                   # RiskBot (Mistral Small)
LLM_PRIMARY_MODEL=groq/llama-3.3-70b-versatile
LLM_SECONDARY_MODEL=gemini/gemini-2.0-flash

# === Database ===
DATABASE_URL=postgresql+psycopg://...    # Supabase connection string

# === Redis ===
UPSTASH_REDIS_URL=https://....upstash.io   # Upstash REST endpoint
UPSTASH_REDIS_TOKEN=...                    # Upstash REST token

# === Persona Service URLs (set after Render deploy) ===
PERSONA_MACRO_URL=https://tangent-persona-macro.onrender.com
PERSONA_GROWTH_URL=https://tangent-persona-growth.onrender.com
PERSONA_RISK_URL=https://tangent-persona-risk.onrender.com
OBSERVATORY_URL=https://tangent-observatory.onrender.com

# === Backend Service URLs (set after GCP Cloud Run deploy) ===
GATEWAY_URL=https://tangent-gateway-xxxx-uc.a.run.app
QUANT_URL=https://tangent-quant-xxxx-uc.a.run.app
MARKET_DATA_URL=https://tangent-market-data-xxxx-uc.a.run.app

# === Frontend ===
NEXT_PUBLIC_GATEWAY_URL=https://tangent-gateway-xxxx-uc.a.run.app
```

---

## Things Still Pushed Back On

| Request | Pushback |
|---|---|
| "5 independently deployed chatbots" | Still recommending 3. The 4th Observatory/MetaBot is a value-add, not a required persona. Adding Valuation and Arbiter as independent services just creates 2 more cold starts with no new capability. |
| "AWS for free tier" | AWS free tier is 12 months then it expires. GCP Always Free has no expiry. For coursework that needs to stay up beyond a year, GCP is safer. AWS Lambda could work but FastAPI + scipy is a bad fit for Lambda (package size, cold start). |
| "Render for all services" | 750 hours/month = 1 always-on service. Keeping 8 services awake would need 5,760 hours — 7.7× over the limit. Render for 4 services (3 personas + observatory), GCP Cloud Run for the rest is the correct split. |
