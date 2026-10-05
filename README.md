# Tangent

**Portfolio decisions you can trace.**

> Formerly FinMaths. Tangent is a production-grade portfolio optimization platform that builds 
> on Modern Portfolio Theory and adds an evidence-grounded AI Decision Studio — every claim 
> is traceable to a computed metric.

> ⚠️ **Educational tool only, not investment advice.** See [DISCLAIMER.md](DISCLAIMER.md).

---

## What it does

1. **Risk-profile wizard** — Age, horizon, and preferences generate asset-class bounds.
2. **Portfolio optimizer** — Max-Sharpe via SciPy SLSQP with sector caps, asset caps, and tax/inflation-adjusted real returns.
3. **Efficient Frontier** — 10,000-point Monte Carlo cloud + solved frontier curve.
4. **Wealth projections** — SIP future value, 1,000-path Monte Carlo with 95% CI and goal-probability.
5. **Decision Studio** — Pick any asset; get marginal impact on your portfolio, a re-optimized allocation, and a multi-agent brief (bull, bear, synthesizer, critic) with claim-level citations.
6. **Backtest Lab** — Walk-forward comparison of 4 strategies.
7. **Agent trace** — Per-run timeline, tokens, cost, and groundedness score.

---

## Architecture

```
web (Next.js) → gateway (FastAPI + JWT) → {
  market-data  (prices, FX, regime, screener)
  quant        (optimizer, frontier, Monte Carlo, backtest)
  sentiment    (news, LLM scoring)
  agent        (evidence pack, specialists, critic, SSE)
  portfolio    (users, saved portfolios, history)
}
PostgreSQL (schema-per-service) + Redis (cache + rate limit)
```

See [docs/adr/0001-architecture-decisions.md](docs/adr/0001-architecture-decisions.md) for all architecture decisions.

---

## Quickstart (Windows)

### Prerequisites
Run the doctor script to check your environment:
```powershell
just doctor
```

Required tools: Docker Desktop (WSL2), Git, Python 3.12+, `uv`, Node 20+, `pnpm`, `just`.

### Setup
```powershell
# 1. Clone
git clone https://github.com/your-org/tangent.git
cd tangent

# 2. Configure environment
Copy-Item .env.example .env
# Edit .env and add your GROQ_API_KEY and DATABASE_URL

# 3. Start infrastructure
just up-core

# 4. Run migrations
just migrate

# 5. Start all services
just up

# 6. Start frontend
just web-dev
```

Open http://localhost:3000.

---

## Environment Variables

See [`.env.example`](.env.example) for the full list. Critical ones:

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Primary LLM (agents, chat, sentiment) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis for cache and rate limiting |
| `JWT_SECRET` | Auth token signing |
| `MC_PATHS` / `MC_SEED` | Monte Carlo config (default 10,000 / 42) |
| `DEMO_MODE` | `true` to use fixtures, no external APIs needed |

---

## Development

```powershell
just lint        # Ruff linting
just fmt         # Auto-format
just typecheck   # mypy
just test        # All unit tests
just ci          # Full CI pipeline
```

---

## Limitations

- Market data is from Yahoo Finance (unofficial API) with 24h cache — not real-time.
- Synthetic assets (FDs, bonds) use a deterministic yield model — not actual market prices.
- Tax rates (LTCG 12.5%, Debt 30%, Inflation 6%) are model assumptions — verify with a CA.
- AI briefs are grounded in computed evidence but can still make reasoning errors — always check citations.
- Overseas investment limits (RBI LRS) apply — consult a registered advisor. `TODO(verify)` current rules.

---

## License

MIT. See [LICENSE](LICENSE).
