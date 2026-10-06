# Tangent API Specification

This document outlines the API endpoints exposed by the API Gateway (Port 8000) and the Next.js Real-Time API Route (`/api/groq`).

---

## 1. Authentication & Security

Tangent implements a guest-first authentication model. Callers obtain a cryptographically signed JSON Web Token (JWT) without registration.

### Endpoints
- `POST /api/v1/auth/guest`
  - Generates a guest session token.
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

## 2. Market Data (`/api/v1/assets`, `/api/v1/prices`, `/api/v1/fx`)

- `GET /api/v1/assets`: Returns the 74-asset institutional universe categorized by asset class.
- `POST /api/v1/prices`: Ingests or fetches historical daily close price series for specified tickers.
- `GET /api/v1/fx`: Provides USD/INR exchange rate curves and currency decomposition models.

---

## 3. Quantitative Optimization (`/api/v1/optimize`, `/api/v1/frontier`, `/api/v1/projections`, `/api/v1/backtest`)

- `POST /api/v1/optimize`:
  - Runs SciPy SLSQP optimization with Ledoit-Wolf shrinkage, asset cap (15%), sector cap (25%), tax drag (12.5% LTCG), and inflation adjustment (6.0%).
- `POST /api/v1/marginal-impact`:
  - Computes pre/post metrics (Sharpe delta, volatility delta, return delta) when adding/removing candidate assets.
- `POST /api/v1/projections`:
  - Generates 1,000 to 10,000 geometric Brownian motion Monte Carlo simulations.
- `POST /api/v1/backtest`:
  - Runs walk-forward out-of-sample backtest across 4 strategies (Max-Sharpe Sample, Max-Sharpe Ledoit-Wolf, Min-Variance, Equal Weight).

---

## 4. Sentiment Analysis (`/api/v1/sentiment/`)

- `POST /api/v1/sentiment/analyze`: Lexicon and transformer analysis for custom financial news text.
- `GET /api/v1/sentiment/{ticker}`: Returns cached RSS financial news headlines, sentiment scores, and content hashes.

---

## 5. Agent Decision Studio (`/api/v1/agent/`)

- `POST /api/v1/agent/runs`: Assembles an `EvidencePack` (`[E1]`–`[E9]`) and initiates multi-agent brief generation.
- `GET /api/v1/agent/runs/{run_id}`: Retrieves completed brief and critic audit records.
- `GET /api/v1/agent/runs/stream/{ticker}`: Real-time Server-Sent Events (SSE) stream for agent thoughts and debate turns.

---

## 6. Real-Time Groq & Persona Route (`apps/web/src/app/api/groq`)

- `POST /api/groq`:
  - Request Body:
    ```json
    {
      "messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}],
      "portfolioContext": { ... },
      "mode": "arena | chat | consultation"
    }
    ```
  - Directly streams or responds with Groq `llama-3.3-70b-versatile` reasoning.
  - Automatically falls back to deterministic institutional synthesis if `GROQ_API_KEY` is unavailable or offline.
