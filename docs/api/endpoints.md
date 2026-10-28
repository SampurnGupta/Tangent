# Tangent API Specification

This document details the complete API surface exposed by the API Gateway (Port 8000), internal microservices, and Next.js backend proxy routes.

---

## 1. Authentication & Security

Tangent implements a guest-first authentication model. Callers obtain a cryptographically signed JSON Web Token (JWT) without registration.

### Endpoints
- `POST /api/v1/auth/guest`
  - Generates an anonymous guest session token.
  - Response:
    ```json
    {
      "access_token": "eyJhbGciOi...",
      "user_id": "guest_3f91a...",
      "is_guest": true
    }
    ```
- `GET /api/v1/auth/me`
  - Validates bearer token header (`Authorization: Bearer <token>`).
  - Response: Profile payload (`user_id`, `is_guest`, `exp`).

---

## 2. Market Data Engine (Port 8001 / Gateway Proxy)

- `GET /api/v1/assets`: Returns the curated 74-asset universe categorized across 8 asset classes.
- `POST /api/v1/prices`: Ingests or fetches historical daily close price series for specified tickers with 24-hour cache.
- `GET /api/v1/fx`: Provides USD/INR exchange rate curves and currency decomposition models.
- `POST /api/v1/market-data/sync`:
  - Triggers daily settlement price sync for benchmark assets (e.g. from GitHub Actions scheduled workflow).
  - Response:
    ```json
    {
      "status": "synchronized",
      "service": "tangent-market-data",
      "timestamp_utc": "2026-10-28T22:30:00Z",
      "synced_tickers": ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "GOLDBEES.NS", "SPY", "QQQ"],
      "synced_count": 7,
      "latency_ms": 1420.5,
      "source": "yfinance"
    }
    ```

---

## 3. Quantitative Solver (Port 8002 / Gateway Proxy)

- `POST /api/v1/optimize`:
  - Runs SciPy SLSQP optimization with Ledoit-Wolf shrinkage, asset cap (15%), sector cap (25%), tax drag (12.5% LTCG), and inflation adjustment (6.0%).
- `POST /api/v1/marginal-impact`:
  - Computes pre/post metrics (Sharpe delta, volatility delta, return delta) when adding/removing candidate assets.
- `POST /api/v1/projections`:
  - Generates 1,000 to 10,000 geometric Brownian motion Monte Carlo simulations.
- `POST /api/v1/backtest`:
  - Runs walk-forward out-of-sample backtest across 4 strategies (Max-Sharpe Sample, Max-Sharpe Ledoit-Wolf, Min-Variance, Equal Weight).

---

## 4. Portfolio Persistence & Export (Port 8003 / Gateway Proxy)

- `GET /api/v1/portfolios`: Lists saved user allocations and optimization runs.
- `POST /api/v1/portfolios`: Persists an optimized portfolio configuration.
- `GET /api/v1/portfolios/{id}`: Retrieves saved portfolio configuration and audit trail.
- `GET /api/v1/portfolios/{id}/export`: Exports allocation weights, metrics, and risk profiles in CSV or JSON format.

---

## 5. Sentiment Analysis (Port 8004 / Gateway Proxy)

- `POST /api/v1/sentiment/analyze`: Lexicon and transformer analysis for custom financial news text.
- `GET /api/v1/sentiment/{ticker}`: Returns cached RSS financial news headlines, sentiment scores, and content hashes.

---

## 6. Agent Decision Studio & Critic (Port 8005 / Gateway Proxy)

- `POST /api/v1/agent/runs`: Assembles an `EvidencePack` (`[E1]`–`[E9]`) and initiates multi-agent brief generation.
- `GET /api/v1/agent/runs/{run_id}`: Retrieves completed brief and Critic audit records.
- `GET /api/v1/agent/runs/stream/{ticker}`: Real-time Server-Sent Events (SSE) stream for agent thoughts and debate turns.

---

## 7. Independent Persona Chatbots (Ports 8006, 8007, 8008 / Gateway Proxy)

- `POST /api/v1/personas/{persona}/chat`:
  - Supported personas: `macro` (Gemini 2.0 Flash), `growth` (Groq Llama 3.3 70B), `risk` (Cloudflare Workers AI Llama 3.2 3B).
  - Request Body:
    ```json
    {
      "message": "How will rising interest rates affect my 40% bond allocation?",
      "session_id": "session_abc123",
      "portfolio_context": { "weights": { "HDFCBANK.NS": 0.4 } }
    }
    ```
  - Response:
    ```json
    {
      "reply": "...",
      "persona": "macro",
      "model_used": "gemini/gemini-2.0-flash",
      "latency_ms": 312.4
    }
    ```
- `POST /api/v1/personas/{persona}/reset`: Clears Redis session memory for that persona.

---

## 8. LLM Observatory & MetaBot (Port 8009 / Gateway Proxy)

- `GET /api/v1/observatory/leaderboard`:
  - Returns cross-model latency (avg, p50, p95), call counts, token throughput, and cost estimates.
- `GET /api/v1/observatory/microservices`:
  - Returns live telemetry and health status across the 6 core deterministic services:
    ```json
    [
      {
        "id": "gateway",
        "name": "API Gateway",
        "port": 8000,
        "status": "Up",
        "response_latency_ms": 35.0,
        "request_hits": 240,
        "payload_transfer_kb": 182.4,
        "endpoint": "/health",
        "description": "Reverse proxy, auth token validation & sliding-window rate limiting"
      }
    ]
    ```
- `POST /api/v1/observatory/metabot/chat`:
  - Consults MetaBot DevOps AI Analyst regarding system performance, latency distributions, and architecture.
- `POST /api/v1/observatory/reset`:
  - Flushes cached telemetry sorted sets in Redis.
