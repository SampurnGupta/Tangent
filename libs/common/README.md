# tangent-common

Shared foundation library across Tangent backend services:
- Structured JSON logging with request-ID propagation
- Base settings via Pydantic Settings
- Request-ID and error middleware for FastAPI
- Resilient async HTTP client with timeouts, retry backoff, and circuit safety
