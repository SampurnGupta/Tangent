# Tangent Cloud Deployment Guide

This directory contains cloud deployment configurations for running Tangent in production.

## Architecture Overview

```
                      [ Client Browser ]
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            [ tangent-web ]     [ tangent-gateway ]
            (Next.js App)       (FastAPI Reverse Proxy)
                                        │
             ┌──────────────┬───────────┼───────────┬──────────────┐
             ▼              ▼           ▼           ▼              ▼
       market-data        quant     portfolio   sentiment        agent
             │              │           │           │              │
             └──────────────┼───────────┴───────────┴──────────────┘
                            ▼
                   [ PostgreSQL + Redis ]
```

## Recommended Host: Fly.io

- **Why Fly.io?**
  - Native 6pn private WireGuard mesh network connecting internal microservices without public IP exposure.
  - Full support for Long-Lived Server-Sent Events (SSE) connections for the Agent Decision Studio streaming pipeline.
  - Edge regions close to Indian users (e.g. `bom` Mumbai region).

### Prerequisites

1. Install Fly CLI: `winget install Casey.Fly` or `iwr https://fly.io/install.ps1 -useb | iex`
2. Authenticate: `fly auth login`

### Step 1: Initialize Applications

```powershell
.\infra\deploy\deploy.ps1 -Action init
```

### Step 2: Provision Shared Managed PostgreSQL & Redis

```bash
# Provision Postgres
fly postgres create --name tangent-postgres --region bom --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 10

# Provision Redis (Upstash)
fly redis create --name tangent-redis --region bom
```

### Step 3: Set Production Secrets

```bash
# Secrets for Gateway
fly secrets set JWT_SECRET="<generate-random-64-char-hex-secret>" -a tangent-gateway

# Secrets for Agent & Sentiment services
fly secrets set GROQ_API_KEY="<your-groq-key>" GEMINI_API_KEY="<your-gemini-key>" -a tangent-sentiment
fly secrets set GROQ_API_KEY="<your-groq-key>" GEMINI_API_KEY="<your-gemini-key>" -a tangent-agent
```

### Step 4: Run Database Migrations

```bash
fly ssh console -a tangent-portfolio -C "alembic -c infra/db/alembic.ini upgrade head"
```

### Step 5: Deploy Services

```powershell
.\infra\deploy\deploy.ps1 -Action deploy-gateway
.\infra\deploy\deploy.ps1 -Action deploy-web
```

## Alternative Hosting Options

- **Render / Railway**: Supports multi-service deploys via Dockerfile with custom environment variables.
- **AWS ECS / DigitalOcean App Platform**: Deploy images built from the multi-stage Dockerfiles.
