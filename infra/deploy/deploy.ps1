# deploy.ps1 — Tangent cloud deployment helper for PowerShell / Fly.io

param(
    [string]$Action = "status",
    [string]$Region = "bom"
)

Write-Host "── Tangent Cloud Deployment Manager ─────────────────────────" -ForegroundColor Cyan

switch ($Action) {
    "init" {
        Write-Host "Creating Fly apps and private network..." -ForegroundColor Yellow
        fly apps create tangent-postgres --org personal
        fly apps create tangent-redis --org personal
        fly apps create tangent-market-data --org personal
        fly apps create tangent-quant --org personal
        fly apps create tangent-portfolio --org personal
        fly apps create tangent-sentiment --org personal
        fly apps create tangent-agent --org personal
        fly apps create tangent-gateway --org personal
        fly apps create tangent-web --org personal
        Write-Host "All service apps initialized on Fly.io 6pn private network." -ForegroundColor Green
    }
    "deploy-gateway" {
        Write-Host "Deploying API Gateway..." -ForegroundColor Yellow
        fly deploy --config infra/deploy/fly.gateway.toml
    }
    "deploy-web" {
        Write-Host "Deploying Next.js Web Application..." -ForegroundColor Yellow
        fly deploy --config infra/deploy/fly.web.toml
    }
    "status" {
        Write-Host "Checking service status..." -ForegroundColor Yellow
        fly status -a tangent-gateway
        fly status -a tangent-web
    }
    default {
        Write-Host "Unknown action: $Action. Usage: .\deploy.ps1 -Action [init|deploy-gateway|deploy-web|status]" -ForegroundColor Red
    }
}
