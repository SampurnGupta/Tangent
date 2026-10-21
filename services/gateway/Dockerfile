# ── Stage 1: Build virtual environment with uv ──────────────────────────────
FROM ghcr.io/astral-sh/uv:0.6.14-python3.12-bookworm-slim AS builder

WORKDIR /app

ENV UV_COMPILE_BYTECODE=0
ENV UV_LINK_MODE=copy
ENV UV_HTTP_TIMEOUT=120

# 1. Copy workspace manifests only (cached unless dependencies change)
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

# 2. Create stub package structures so uv can resolve workspace members
RUN mkdir -p libs/common/common libs/contracts/contracts libs/llm/llm \
             services/agent/agent services/gateway/gateway services/market-data/market_data \
             services/observatory/observatory services/persona-growth/growth \
             services/persona-macro/macro services/persona-risk/risk \
             services/portfolio/portfolio services/quant/quant services/sentiment/sentiment && \
    touch libs/common/common/__init__.py \
          libs/contracts/contracts/__init__.py \
          libs/llm/llm/__init__.py \
          services/agent/agent/__init__.py \
          services/gateway/gateway/__init__.py \
          services/market-data/market_data/__init__.py \
          services/observatory/observatory/__init__.py \
          services/persona-growth/growth/__init__.py \
          services/persona-macro/macro/__init__.py \
          services/persona-risk/risk/__init__.py \
          services/portfolio/portfolio/__init__.py \
          services/quant/quant/__init__.py \
          services/sentiment/sentiment/__init__.py

# 3. Synchronize third-party wheels (this layer is CACHED across code changes)
RUN uv sync --package tangent-gateway --no-dev --no-editable

# 4. Copy actual library and gateway source code
COPY libs/ ./libs/
COPY services/gateway/ ./services/gateway/

# 5. Final sync to install gateway into .venv
RUN uv sync --package tangent-gateway --no-dev --no-editable

# ── Stage 2: Runtime image (non-root) ─────────────────────────────────────────
FROM python:3.12-slim-bookworm AS runner

RUN groupadd -g 10001 appuser && \
    useradd -u 10001 -g appuser -s /bin/sh -m appuser

WORKDIR /app

COPY --from=builder --chown=appuser:appuser /app/.venv /app/.venv
COPY --from=builder --chown=appuser:appuser /app/libs /app/libs
COPY --from=builder --chown=appuser:appuser /app/services/gateway/gateway /app/gateway

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app:/app/libs/common:/app/libs/contracts:/app/libs/llm"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["python", "-m", "uvicorn", "gateway.main:app", "--host", "0.0.0.0", "--port", "8000"]
