# ── Stage 1: Build virtual environment with uv ──────────────────────────────
FROM ghcr.io/astral-sh/uv:0.6.14-python3.12-bookworm-slim AS builder

WORKDIR /app

ENV UV_COMPILE_BYTECODE=0
ENV UV_LINK_MODE=copy
ENV UV_HTTP_TIMEOUT=120

# 1. Copy workspace manifests only (cached unless dependency declarations change)
COPY pyproject.toml uv.lock ./
COPY libs/common/pyproject.toml ./libs/common/
COPY libs/contracts/pyproject.toml ./libs/contracts/
COPY libs/llm/pyproject.toml ./libs/llm/
COPY services/agent/pyproject.toml ./services/agent/
COPY services/gateway/pyproject.toml ./services/gateway/
COPY services/market-data/pyproject.toml ./services/market-data/
COPY services/observatory/pyproject.toml ./services/observatory/
COPY services/persona-growth/pyproject.toml ./services/persona-growth/
COPY services/persona-macro/pyproject.toml ./services/persona-macro/
COPY services/persona-risk/pyproject.toml ./services/persona-risk/
COPY services/portfolio/pyproject.toml ./services/portfolio/
COPY services/quant/pyproject.toml ./services/quant/
COPY services/sentiment/pyproject.toml ./services/sentiment/

# 2. Synchronize all external third-party dependencies (100% cached across code edits)
RUN uv sync --package tangent-quant --no-install-workspace --no-dev --no-editable

# 3. Copy real source code and documentation required by hatchling
COPY README.md ./
COPY libs/ ./libs/
COPY services/quant/ ./services/quant/

# 4. Final sync to install the workspace package into .venv
RUN uv sync --package tangent-quant --no-dev --no-editable

# ── Stage 2: Runtime image (non-root) ─────────────────────────────────────────
FROM python:3.12-slim-bookworm AS runner

RUN groupadd -g 10001 appuser && \
    useradd -u 10001 -g appuser -s /bin/sh -m appuser

WORKDIR /app

COPY --from=builder --chown=appuser:appuser /app/.venv /app/.venv
COPY --from=builder --chown=appuser:appuser /app/libs /app/libs
COPY --from=builder --chown=appuser:appuser /app/services/quant/quant /app/quant

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app:/app/libs/common:/app/libs/contracts:/app/libs/llm"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

USER appuser

EXPOSE 8002

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import os, urllib.request; port = os.getenv('PORT', '8002'); urllib.request.urlopen(f'http://localhost:{port}/health')"

CMD ["sh", "-c", "python -m uvicorn quant.main:app --host 0.0.0.0 --port ${PORT:-8002}"]
