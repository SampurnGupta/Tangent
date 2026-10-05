# ── Stage 1: Build virtual environment with uv ──────────────────────────────
FROM ghcr.io/astral-sh/uv:0.6.14-python3.12-bookworm-slim AS builder

WORKDIR /workspace

# Configure uv for container builds
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Copy root workspace and library definitions
COPY pyproject.toml uv.lock ./
COPY libs/common/ ./libs/common/
COPY libs/contracts/ ./libs/contracts/
COPY services/template/ ./services/template/

# Build locked virtual environment
RUN uv sync --package tangent-template-service --no-dev

# ── Stage 2: Runtime image (non-root) ─────────────────────────────────────────
FROM python:3.12-slim-bookworm AS runner

# Security: create non-root service user
RUN groupadd -g 10001 appuser && \
    useradd -u 10001 -g appuser -s /bin/sh -m appuser

WORKDIR /app

# Copy virtualenv and code from builder
COPY --from=builder --chown=appuser:appuser /workspace/.venv /app/.venv
COPY --from=builder --chown=appuser:appuser /workspace/services/template/app /app/app

# Set environment PATH to use virtualenv
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
