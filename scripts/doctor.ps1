# doctor.ps1 — Tangent pre-flight check
# Verifies all required tools are installed and operational.
# Run with: pwsh -File scripts/doctor.ps1

# Refresh PATH from registry so newly installed tools are visible
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$errors = 0

function Check-Tool {
    param($name, $cmd, $minVersion = $null)
    try {
        $output = Invoke-Expression $cmd 2>&1
        if ($minVersion) {
            Write-Host "  OK  $name ($output)" -ForegroundColor Green
        } else {
            Write-Host "  OK  $name" -ForegroundColor Green
        }
        return $true
    } catch {
        Write-Host "  FAIL  $name — not found or not working" -ForegroundColor Red
        return $false
    }
}

Write-Host ""
Write-Host "Tangent — Doctor Script" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Docker Desktop
Write-Host "[1] Docker Desktop (WSL2 backend)" -ForegroundColor Yellow
$dockerOk = Check-Tool "docker" "docker --version"
if ($dockerOk) {
    $composeOk = Check-Tool "docker compose" "docker compose version"
    # Check WSL2 backend
    $dockerInfo = docker info 2>&1
    if ($dockerInfo -match "WSL") {
        Write-Host "  OK  Docker is using WSL2 backend" -ForegroundColor Green
    } else {
        Write-Host "  WARN WSL2 backend not detected — check Docker Desktop settings" -ForegroundColor Yellow
    }
} else {
    $errors++
    Write-Host "  Install Docker Desktop from https://www.docker.com/products/docker-desktop/" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "[2] Git" -ForegroundColor Yellow
if (-not (Check-Tool "git" "git --version")) {
    $errors++
    Write-Host "  Install from https://git-scm.com/download/win" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "[3] Python + uv" -ForegroundColor Yellow
if (-not (Check-Tool "python" "python --version")) {
    $errors++
    Write-Host "  Install Python 3.12+ from https://www.python.org/downloads/" -ForegroundColor DarkGray
}
if (-not (Check-Tool "uv" "uv --version")) {
    $errors++
    Write-Host "  Install with: winget install --id astral-sh.uv" -ForegroundColor DarkGray
    Write-Host "  Or: powershell -ExecutionPolicy ByPass -c 'irm https://astral.sh/uv/install.ps1 | iex'" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "[4] Node.js + pnpm" -ForegroundColor Yellow
if (-not (Check-Tool "node" "node --version")) {
    $errors++
    Write-Host "  Install Node 20 LTS from https://nodejs.org/en/download/" -ForegroundColor DarkGray
}
if (-not (Check-Tool "pnpm" "pnpm --version")) {
    $errors++
    Write-Host "  Install with: npm install -g pnpm" -ForegroundColor DarkGray
    Write-Host "  Or: winget install pnpm.pnpm" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "[5] just (task runner)" -ForegroundColor Yellow
if (-not (Check-Tool "just" "just --version")) {
    $errors++
    Write-Host "  Install with: winget install Casey.Just" -ForegroundColor DarkGray
    Write-Host "  Or: scoop install just" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "[6] Environment file" -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "  OK  .env file exists" -ForegroundColor Green
} else {
    Write-Host "  WARN .env not found — copy .env.example to .env and fill in values" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[7] Checking for committed secrets (.env in git)" -ForegroundColor Yellow
$gitTracked = git ls-files .env 2>&1
if ($gitTracked -eq ".env") {
    Write-Host "  FAIL .env is tracked by git! Run: git rm --cached .env" -ForegroundColor Red
    $errors++
} else {
    Write-Host "  OK  .env is not tracked by git" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "All checks passed! You're ready to run 'just up'" -ForegroundColor Green
} else {
    Write-Host "$errors check(s) failed. Fix the issues above and re-run 'just doctor'" -ForegroundColor Red
    exit 1
}
Write-Host ""
