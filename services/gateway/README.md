# Tangent API Gateway (`tangent-gateway`)

Unified front-door API gateway and reverse proxy for Tangent.

## Features
- **JWT Authentication:** Issues guest sessions (`POST /api/v1/auth/guest`) and validates incoming Bearer tokens.
- **Microservice Routing:** Reverse proxies requests to `market-data`, `quant`, `portfolio`, `sentiment`, and `agent`.
- **Rate Limiting:** Sliding-window rate limiting with in-memory fallback.
- **CORS:** Configured for local Next.js frontend development.
- **Health / Readiness:** Direct `/health` and aggregated downstream `/ready` checks.
