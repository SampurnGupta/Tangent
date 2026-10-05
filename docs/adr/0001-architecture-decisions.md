# ADR 0001 — Core Architecture Decisions

**Status:** Accepted  
**Date:** 2026-10-05  
**Context:** Rebuilding FinMaths as Tangent — a production microservice platform.

---

## ADR-001: Microservices over Monolith

**Decision:** Split into 6 backend services (gateway, market-data, quant, sentiment, agent, portfolio).

**Rationale:**
- `quant` is CPU-bound; scales independently from `agent` which is LLM-bound and long-running.
- `market-data` is the least reliable dependency (external APIs); isolation contains failure.
- `sentiment` has a separate cost profile (LLM + news API calls).
- Enables independent deployment and testing of each concern.

**Trade-off:** More operational complexity vs. a monolith. Mitigated by Docker Compose for local parity and a single `just up` command.

---

## ADR-002: Single PostgreSQL Instance, Schema-per-Service

**Decision:** One managed Postgres instance; each service owns its own schema (`market`, `sentiment`, `agent`, `portfolio`, `config`).

**Rationale:**
- Cheaper than separate DB instances on free/small tiers.
- Schema isolation enforces the rule "a service never reads another service's table."
- Migration management is simpler than separate databases.

**Trade-off:** A single Postgres failure affects all services. Mitigated by managed hosting (Neon/Supabase) with automatic failover. Revisit for v2 if load demands it.

---

## ADR-003: Backend Host — Fly.io

**Decision:** Deploy backend containers on Fly.io.

**Options considered:**
- Render: simpler DX, but 30s request timeout breaks long-running SSE agent streams.
- Railway: easy Docker deploys, less networking control.
- Cloud Run: serverless cold starts unsuitable for SSE.
- **Fly.io:** persistent VMs, no artificial timeout on SSE, private networking between services, generous free tier.

**`TODO(verify)`:** Fly.io free-tier machine limits, SSE timeout behavior, cold start times, and region availability for India.

---

## ADR-004: Auth — Own JWT (guest-first)

**Decision:** Implement JWT auth in the gateway service. Guest tokens issued without signup.

**Options considered:**
- Supabase Auth: free but adds vendor lock-in.
- Clerk: best DX but paid after free tier.
- **Own JWT:** simplest, no vendor, guest mode trivial to implement.

**Implementation:** `POST /auth/guest` returns a short-lived JWT. `POST /auth/register` + `POST /auth/login` for registered users. All routes accept either token type.

---

## ADR-005: LLM Provider — Groq primary, Gemini secondary via LiteLLM

**Decision:** Use LiteLLM as the provider-agnostic client. Groq (llama-3.3-70b-versatile) as primary, Google Gemini Flash as secondary.

**Rationale:**
- Already using Groq. Fast inference for agent pipelines.
- LiteLLM allows model names in config, enabling model comparison without code changes.
- Secondary model required by evaluation plan (A8).

**`TODO(verify)`:** Gemini free-tier terms (check if non-sensitive data is used for training). Groq rate limits for agent workloads.

---

## ADR-006: News Source — RSS feeds (no key required)

**Decision:** Use RSS feeds for news ingest in the sentiment service. NewsAPI.org as optional upgrade.

**Rationale:**
- RSS requires no API key — zero cold-start friction, always available for demo mode.
- Content-hash caching means RSS can be polled infrequently.
- NewsAPI free tier is 100 req/day — too restrictive for multi-ticker sentiment.

**Sources planned (RSS):** Google News RSS per ticker, Economic Times Markets RSS, Moneycontrol RSS.

**`TODO(verify)`:** Google News RSS ToS for programmatic use.

---

## ADR-007: No Task Queue in v1

**Decision:** No Celery/RabbitMQ. Monte Carlo runs in a thread pool; agent runs tracked in `agent.runs` table and streamed over SSE.

**Rationale:**
- NumPy Monte Carlo (10k paths) completes in <3s — no queue needed.
- Agent runs are long-lived but initiated by user; SSE streaming gives responsiveness.
- Adding Celery would require a broker, worker fleet, and monitoring — disproportionate for v1.

**Revisit trigger:** If load testing shows >10 concurrent agent runs cause latency spikes, introduce a queue.

---

## ADR-008: Dependency Management — uv (Python) + pnpm (Node)

**Decision:** `uv` for Python dependency locking, `pnpm` for Node.

**Rationale:**
- `uv` is significantly faster than pip, produces a `uv.lock` for reproducible builds.
- `pnpm` is faster than npm/yarn and uses content-addressable storage.
- Both produce lockfiles that are committed to the repo.

---

## ADR-009: Covariance — Ledoit-Wolf shrinkage as configurable option

**Decision:** Default to sample covariance; offer Ledoit-Wolf shrinkage via config parameter. Compare in backtest.

**Rationale:**
- Sample covariance is noisy with <60 monthly observations.
- Ledoit-Wolf (scikit-learn `LedoitWolf`) is well-tested and reduces estimation error.
- Making it configurable allows the backtest to compare both strategies objectively.
