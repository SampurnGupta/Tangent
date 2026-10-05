# tangent-template-service

Reusable service template for Tangent microservices.
Provides:
- FastAPI app with standard lifespan
- `/health` (liveness) and `/ready` (readiness)
- Request-ID tracking and JSON structured logging
- Multi-stage non-root Dockerfile
