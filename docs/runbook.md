# Tangent Operations & Disaster Recovery Runbook

This document details operational procedures, health checks, fallback modes, and recovery procedures for the Tangent platform.

## 1. Health Checks & Monitoring

Every service exposes standardized `/health` and `/ready` endpoints:

| Endpoint | Service | Purpose | Healthy Response |
|---|---|---|---|
| `GET /health` | All 10 Services | Process liveness check | `{"status": "ok", "service": "..."}` |
| `GET /ready` | gateway (8000) | Downstream readiness aggregator | `{"status": "ready", "checks": {...}}` |
| `GET /ready` | market-data (8001) | Postgres & external provider connectivity | `{"status": "ready", "checks": {"db": "ok"}}` |
| `GET /ready` | portfolio (8003) | Postgres migrations check | `{"status": "ready", "checks": {"db": "ok"}}` |
| `GET /health` | persona-macro (8006) | Gemini 2.0 Flash engine liveness | `{"status": "ok", "service": "tangent-persona-macro"}` |
| `GET /health` | persona-growth (8007) | Groq Llama 3.3 70B engine liveness | `{"status": "ok", "service": "tangent-persona-growth"}` |
| `GET /health` | persona-risk (8008) | Cloudflare Workers AI engine liveness | `{"status": "ok", "service": "tangent-persona-risk"}` |
| `GET /health` | observatory (8009) | Redis sorted set telemetry liveness | `{"status": "ok", "service": "tangent-observatory"}` |
| `GET /api/v1/observatory/microservices` | observatory | Cluster metrics (Status, Latency, Hits, Payload) | Array of 6 core service metric objects |

### Quick Diagnostic Command

```powershell
# In PowerShell:
just doctor
```

## 2. High-Availability & Fallback Modes

### Provider Outage Fallback (`DEMO_MODE=true`)
If external APIs (Yahoo Finance, RSS news, or LLM providers) experience outages, Tangent switches seamlessly to deterministic offline fixtures:
- **Market Data**: Returns bundled 36-month empirical return histories for all 73 assets.
- **Sentiment**: Uses pre-cached financial sentiment lexicon scoring.
- **LLM Engine**: Generates deterministic, pre-computed evidence briefs citing exact metrics.

To force full offline fixture mode:
```env
DEMO_MODE=true
```

## 3. Database Migration Management

Tangent uses Alembic for database versioning:

```powershell
# Apply all pending migrations across schemas:
just migrate

# Downgrade and re-apply from base (dev only):
just migrate-reset

# Create a new migration after editing models:
just migration "add_field_name"
```

## 4. Disaster Recovery & Troubleshooting

### Problem: PostgreSQL Connection Exhaustion
- **Symptom**: Services report `OperationalError: too many clients already`.
- **Mitigation**: SQLAlchemy pools are configured with `pool_size=10, max_overflow=20`. Check for unclosed connections or restart services:
  ```powershell
  just down && just up
  ```

### Problem: LLM Rate Limit Hit (429 Too Many Requests)
- **Symptom**: Agent brief generation fails or logs LiteLLM rate limit error.
- **Mitigation**:
  1. The resilient client automatically falls back from Groq to Google Gemini.
  2. If all provider quotas are exhausted, the agent pipeline serves grounded fixture briefs without throwing 500 errors to the client.

### Problem: Rate Limiter Blocking Legitimate Traffic
- **Mitigation**: Adjust `RATE_LIMIT_PER_MINUTE` in `.env` (default is 60 requests/minute per client IP).

---

## 5. Free-Tier Cloud Deployment Guide

Tangent v2 is designed to run 100% free across managed tiers:

### 5.1 Architecture Overview
- **Vercel**: Next.js 16 Web Frontend (`apps/web`)
- **Render**: 4 Services (MacroBot, GrowthBot, RiskBot, Observatory) via Blueprint (`infra/deploy/render.yaml`)
- **Google Cloud Run**: 5 Core Services (Gateway, Quant, Market-Data, Portfolio, Sentiment) with `min-instances=0`
- **Supabase**: Managed PostgreSQL 16 (500 MB Free Tier)
- **Upstash**: Serverless Redis (10,000 commands/day Free Tier)
- **Oracle Cloud VM (Optional)**: Always-Free Ampere A1 ARM Compute (4 OCPU, 24 GB RAM) running Ollama (`llama3.2:3b`)

### 5.2 Step-by-Step Setup

1. **Database & Cache**:
   - Create free project on **Supabase** -> grab pooler connection string.
   - Create free database on **Upstash** -> copy `rediss://...` REST URL.
2. **Deploy Personas & Observatory on Render**:
   - Link repo on [Render Dashboard](https://dashboard.render.com).
   - Select **New + -> Blueprint** -> point to `infra/deploy/render.yaml`.
   - Add environment variables (`GROQ_API_KEY`, `GEMINI_API_KEY`, `UPSTASH_REDIS_URL`).
3. **Deploy Core Backend on GCP Cloud Run**:
   - Authenticate with `gcloud auth login` and set project ID.
   - Deploy services using `gcloud builds submit --config infra/deploy/gcp/cloudbuild.yaml`.
4. **Deploy Frontend on Vercel**:
   - Import repo on Vercel -> set Root Directory to `apps/web`.
   - Add `NEXT_PUBLIC_GATEWAY_URL` pointing to your deployed Cloud Run Gateway URL.
5. **Keepalive via UptimeRobot**:
   - Create free account on [UptimeRobot](https://uptimerobot.com).
   - Add HTTP monitor for each Render service `/health` every 5 minutes.
   - Add HTTP monitor for each Cloud Run service `/health` every 14 minutes.
6. **(Optional) Self-Hosted Ollama on Oracle Cloud**:
   - Create Always-Free Ubuntu ARM instance on Oracle Cloud.
   - Run `bash scripts/setup-oracle-vm.sh`.
   - Set `OLLAMA_API_BASE=http://<VM_IP>:11434` in Render.

---

## 6. Scheduled Daily Market Settlement Sync Operations

Tangent runs automated post-close price synchronization via GitHub Actions:
- **Workflow:** `.github/workflows/market-sync.yml`
- **Schedule:** Runs Mon–Fri at 22:30 UTC (04:00 AM IST) after Indian and US exchanges settle.
- **Manual Trigger via GitHub CLI:**
  ```powershell
  gh workflow run market-sync.yml
  ```
- **Manual Direct Invocation via curl:**
  ```powershell
  curl -X POST "https://tangent-gateway.onrender.com/api/v1/market-data/sync" `
       --connect-timeout 60 --max-time 120
  ```
- **Operational Verification:**
  - Check the response JSON for `"status": "synchronized"` and `"synced_count": 7`.
  - Verify in the Web UI under `Observatory -> Microservices` that `Market Data Engine` shows fresh request hits and an `Up` status.

---

## 7. LLM Observatory & Telemetry Management

### Clear Telemetry Cache & Cold-Start Latency
When containers experience cold starts, initial latency outliers (e.g. 5,000–12,000ms) can temporarily distort p50/p95 calculations.
- To purge cold-start latency records:
  - In the UI, click **"Clear Matrix Cache"** in the Observatory header.
  - Or via API:
    ```powershell
    curl -X POST "https://tangent-observatory.onrender.com/api/v1/observatory/reset"
    ```
- Warm inference runs will immediately repopulate the Redis sorted sets (`tangent:telemetry:*`) with clean production benchmarks.
