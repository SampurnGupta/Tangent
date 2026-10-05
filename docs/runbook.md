# Tangent Operations & Disaster Recovery Runbook

This document details operational procedures, health checks, fallback modes, and recovery procedures for the Tangent platform.

## 1. Health Checks & Monitoring

Every service exposes standardized `/health` and `/ready` endpoints:

| Endpoint | Service | Purpose | Healthy Response |
|---|---|---|---|
| `GET /health` | All Services | Process liveness check | `{"status": "ok", "service": "..."}` |
| `GET /ready` | gateway | Downstream readiness aggregator | `{"status": "ready", "checks": {...}}` |
| `GET /ready` | market-data | Postgres & external provider connectivity | `{"status": "ready", "checks": {"db": "ok"}}` |
| `GET /ready` | portfolio | Postgres migrations check | `{"status": "ready", "checks": {"db": "ok"}}` |

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
