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
- **1 frontend:** apps/web (Next.js 14, TypeScript, Tailwind, shadcn/ui)
- **Shared libs:** libs/contracts (Pydantic models), libs/common (logging, config, http), libs/llm (LiteLLM wrapper)
- **Data:** Single PostgreSQL (schema-per-service) + Redis (cache + rate limit)
- **LLM:** Groq primary, Gemini secondary, via LiteLLM — model names in config, never hardcoded
- **Auth:** Own JWT (gateway), guest-first (no mandatory signup)
- **No task queue in v1** — Monte Carlo in thread pool, agent runs via SSE

## Phase Status
See `docs/scope.md` for must-have vs stretch vs out-of-scope.

## Repo Layout
```
tangent/
  apps/web/                    # Next.js frontend
  services/{gateway,market-data,quant,sentiment,agent,portfolio}/
  libs/{contracts,common,llm}/
  infra/{compose,db/migrations,deploy}/
  tests/e2e/
  legacy/finmaths/             # read-only reference
  docs/{adr/,api/,architecture.md,scope.md,runbook.md,evaluation.md}
  .github/workflows/
  .env.example  justfile  AGENTS.md  README.md  DISCLAIMER.md
```

## Key Design Decisions
- Evidence-first agents: build evidence pack from deterministic services before any LLM runs
- Critic validates every claim has a traceable evidence ID with matching numbers
- Demo mode: fixtures + recorded LLM responses (no external APIs needed)
- Walk-forward backtest — never claim LLM "beat market" (training data contamination)
