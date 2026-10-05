# justfile — Tangent task runner
# Install 'just' on Windows: winget install Casey.Just
# Usage: just <task>

set windows-shell := ["powershell", "-Command"]

# ── Developer tasks ───────────────────────────────────────────────────────────

# Verify all required tools are installed and working
doctor:
    pwsh -File scripts/doctor.ps1

# Start all services (Postgres, Redis, all backends)
up:
    docker compose -f infra/compose/docker-compose.yml --profile full up -d

# Start only core infrastructure (Postgres + Redis)
up-core:
    docker compose -f infra/compose/docker-compose.yml --profile core up -d

# Stop all services
down:
    docker compose -f infra/compose/docker-compose.yml --profile full down

# Run all tests across all services
test:
    pwsh -Command "Get-ChildItem services -Directory | ForEach-Object { Write-Host \"Testing $($_.Name)...\"; uv run pytest services/$($_.Name)/tests -v }"

# Run tests for a specific service: just test-svc quant
test-svc service:
    uv run pytest services/{{service}}/tests -v

# Lint all Python code with ruff
lint:
    uv run ruff check services/ libs/
    uv run ruff format --check services/ libs/

# Format all Python code
fmt:
    uv run ruff format services/ libs/
    uv run ruff check --fix services/ libs/

# Type-check all Python services
typecheck:
    uv run mypy services/ libs/ --ignore-missing-imports

# Run database migrations (all schemas)
migrate:
    uv run alembic -c infra/db/alembic.ini upgrade head

# Reset and re-run migrations from scratch (dev only)
migrate-reset:
    uv run alembic -c infra/db/alembic.ini downgrade base
    uv run alembic -c infra/db/alembic.ini upgrade head

# Generate a new migration: just migration "add user table"
migration name:
    uv run alembic -c infra/db/alembic.ini revision --autogenerate -m "{{name}}"

# Build all Docker images
build:
    docker compose -f infra/compose/docker-compose.yml --profile full build

# Open a shell in a running service: just shell quant
shell service:
    docker compose -f infra/compose/docker-compose.yml exec {{service}} /bin/sh

# View logs for a service: just logs quant
logs service:
    docker compose -f infra/compose/docker-compose.yml logs -f {{service}}

# Install pre-commit hooks
hooks:
    uvx pre-commit install

# Run pre-commit on all files
pre-commit:
    uvx pre-commit run --all-files

# Frontend dev server
web-dev:
    cd apps/web && pnpm dev

# Frontend install
web-install:
    cd apps/web && pnpm install

# Generate typed API client from OpenAPI
gen-client:
    cd apps/web && pnpm run gen-client

# ── CI helpers ────────────────────────────────────────────────────────────────

# Full CI pipeline (lint + typecheck + test)
ci: lint typecheck test

# Integration tests (requires Compose running)
integration:
    uv run pytest tests/integration -v

# E2E tests with Playwright
e2e:
    cd tests/e2e && pnpm exec playwright test
