# AGENTS.md — Tangent Project Master Context

> **Product:** Tangent | **Tagline:** Portfolio decisions you can trace.  
> **Formerly:** FinMaths (legacy code in `legacy/finmaths/` — read-only reference)

This file is project context for AI coding assistants. Read it at the start of every session.

## Working Rules
1. Work one phase at a time. Summarize, run tests, then stop for approval.
2. Numbers come from deterministic code only. LLMs explain and cite — never produce metrics.
3. Simplest thing that works. Justify every new dependency in one line.
4. Secrets never committed. `.env` local only; `.env.example` in repo.
5. Tests ship with code. Conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `chore:`.
6. ADR for every non-obvious architecture choice (`docs/adr/`).
7. All AI output carries the disclaimer from `DISCLAIMER.md`. No directive language ("you should buy", "guaranteed").
8. Windows dev environment (Docker Desktop WSL2, PowerShell). Commands must work in PowerShell.
9. LF line endings enforced for shell scripts / Dockerfiles via `.gitattributes`.

## Architecture Summary (see `docs/adr/0001-architecture-decisions.md` for full ADRs)
- **6 backend services:** gateway, market-data, quant, sentiment, agent, portfolio (all FastAPI + Python)
- **1 frontend:** apps/web (Next.js 16 App Router, React 19, TypeScript, Vanilla CSS, Turbopack)
- **Shared libs:** libs/contracts (Pydantic models), libs/common (logging, config, http), libs/llm (LiteLLM wrapper)
- **Data:** Single PostgreSQL (schema-per-service) + Redis (cache + rate limit)
- **LLM:** Dual-tier — Groq primary (Llama 3.3 70B), Gemini secondary, via LiteLLM & Next.js streaming API
- **Auth:** Own JWT (gateway), guest-first (no mandatory signup)
- **No task queue in v1** — Monte Carlo in thread pool, agent runs via SSE

## Phase Status
- **v1.0 Core**: Completed (SLSQP solver, 24h cache, Ledoit-Wolf, walk-forward backtest, multi-agent briefs with Critic).
- **v1.1 Advanced Suite**: Completed (Animated Hero Homepage, 5-persona Expert Arena + always-on 1-on-1 consultation, Draww co-pilot, 74-asset universe, unbiased all-asset mode, crisis stress testing, CSV/JSON investor export).
See `docs/scope.md` and `CHANGELOG.md` for full detail.

## Repo Layout
```
tangent/
  apps/web/                    # Next.js 16 frontend (HeroHomepage, ArenaView, Draww, Decision Studio)
  services/{gateway,market-data,quant,sentiment,agent,portfolio}/
  libs/{contracts,common,llm}/
  infra/{compose,db/migrations,deploy}/
  tests/e2e/
  legacy/finmaths/             # read-only reference
  docs/{adr/,api/,architecture.md,scope.md,runbook.md,evaluation.md}
  .github/workflows/
  .env.example  justfile  AGENTS.md  README.md  CHANGELOG.md  DISCLAIMER.md
```

## Key Design Decisions
- Evidence-first agents: build evidence pack from deterministic services before any LLM runs
- Critic validates every claim has a traceable evidence ID with matching numbers
- Demo mode: fixtures + recorded LLM responses (no external APIs needed)
- Walk-forward backtest — never claim LLM "beat market" (training data contamination)
