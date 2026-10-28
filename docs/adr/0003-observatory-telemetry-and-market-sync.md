# ADR 0003 — DevOps Observatory, Microservice Telemetry & Scheduled Market Sync

**Status:** Accepted  
**Date:** 2026-10-28  
**Context:** Adding real-time infrastructure telemetry, multi-LLM comparative benchmarking, microservices monitoring, and automated daily market data settlement synchronization.

---

## 1. Context & Problem Statement

As Tangent evolved into a 10-microservice platform across multiple LLM providers (Groq LPU, Google Gemini TPU, Cloudflare Workers AI edge) and hosting tiers (Render, Vercel, Supabase, Upstash), two operational requirements emerged:
1. **Comparative Inference & Cluster Observability:** We needed real-time visibility into cross-model inference latency (p50/p95), token throughput velocity, costs, and the health status of the 6 core deterministic microservices without installing a bloated Prometheus/Grafana stack.
2. **Automated Market Settlement Sync:** Market data must be kept fresh on a daily cadence without violating Yahoo Finance IP rate limits or exhausting free-tier Render container active hours.

---

## 2. Decision 1: Scoped Redis Sorted Sets for Telemetry Storage

**Decision:** Use lightweight Redis Sorted Sets (`ZADD`, `ZRANGEBYSCORE`) with domain prefix `tangent:telemetry:*` for inference latency and microservice metric tracking instead of dedicated observability daemons (Prometheus/Grafana).

**Rationale:**
- Redis is already running in the cluster with zero marginal infrastructure footprint.
- Sub-millisecond percentile calculations (`p50`, `p95`) are achieved natively in memory using sorted set rank operations.
- Explicit TTLs (30 days for inference logs, 24 hours for service health snapshots) prevent unbounded memory growth.

**Trade-offs:** Less granular long-term historical metrics graphing compared to dedicated timeseries databases, which is acceptable for an agile decision-support platform.

---

## 3. Decision 2: Scheduled GitHub Actions Post-Close Sync (`market-sync.yml`)

**Decision:** Trigger daily benchmark settlement price refresh via a scheduled GitHub Actions workflow running at **22:30 UTC Mon–Fri (04:00 AM IST next day)** calling `POST /api/v1/market-data/sync`.

**Rationale:**
- **Settlement Timing:** Indian markets (NSE/BSE) close at 10:00 UTC (15:30 IST) and US markets (NYSE/NASDAQ) close at 21:00 UTC (16:00 EST). By 22:30 UTC, both exchanges have settled official daily closing prices.
- **Resource Conservation:** Eliminates the need for an always-on cron daemon process inside containers, conserving the 750 free Render instance hours.
- **Cold-Start Resilience:** Workflow includes `--connect-timeout 60 --max-time 120 --retry 3 --retry-delay 15` to ensure sleeping free-tier containers can wake up and complete the sync without pipeline failures.

**Trade-offs:** GitHub Actions cron schedules can occasionally experience dispatch delays (5–15 minutes) depending on GitHub queue load, which is completely negligible for a daily post-market close settlement ingestion.

---

## 4. Decision 3: 7 Benchmark Pillars Scheduled Sync + 24h Lazy On-Demand Caching for Remaining Assets

**Decision:** The scheduled workflow synchronizes only the 7 core benchmark assets (`RELIANCE.NS`, `TCS.NS`, `HDFCBANK.NS`, `INFY.NS`, `GOLDBEES.NS`, `SPY`, `QQQ`). The remaining securities in the 74-asset universe are cached on-demand with a 24-hour TTL when selected by users.

**Rationale:**
- Sequential synchronous fetching of all 74 assets via Yahoo Finance takes 70–100+ seconds, risking Render HTTP timeouts (60–100s) and Yahoo Finance IP rate limits (`429 Too Many Requests`).
- The 7 benchmark pillars warm the default homepage charts and portfolio templates immediately.
- Portfolios typically only incorporate 5–15 assets, making lazy cache-on-demand significantly more bandwidth- and latency-efficient.

---

## 5. Decision 4: Deterministic 3-State Health Indicators (`Up`, `Starting`, `Down`)

**Decision:** The Observatory Microservices sub-dashboard displays live status strictly as `Up` (🟢), `Starting` (🟡), or `Down` (🔴), rejecting ambiguous SRE jargon like "degraded".

**Rationale:**
- Clear, unambiguous communication for investors and engineers.
- Latency > 2,500ms indicates a container undergoing cold start or intense CPU load, accurately mapped to `Starting`.
