param(
    [int]$TimeoutSec = 90,
    [switch]$KeepRunning
)

$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$DevScript = Join-Path $RootDir "dev.ps1"

function Invoke-WithRetry {
    param(
        [string]$Url,
        [int]$TimeoutSec = 30
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    $lastError = $null

    while ((Get-Date) -lt $deadline) {
        try {
            return Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 10
        } catch {
            $lastError = $_
            Start-Sleep -Seconds 2
        }
    }

    throw "Request failed for $Url. Last error: $($lastError.Exception.Message)"
}

Write-Host ""
Write-Host "== Rural24 Localhost Smoke Test ==" -ForegroundColor Cyan
Write-Host ""

try {
    Write-Host "[1/4] Starting services with dev.ps1..." -ForegroundColor Yellow
    & $DevScript

    Write-Host "[2/4] Checking frontend..." -ForegroundColor Yellow
    $frontend = Invoke-WithRetry -Url "http://localhost:5173" -TimeoutSec $TimeoutSec
    if ($frontend.StatusCode -ne 200) {
        throw "Frontend returned HTTP $($frontend.StatusCode)"
    }
    Write-Host "  OK Frontend: HTTP 200" -ForegroundColor Green

    Write-Host "[3/4] Checking backend root..." -ForegroundColor Yellow
    $backend = Invoke-WithRetry -Url "http://localhost:3001" -TimeoutSec $TimeoutSec
    if ($backend.StatusCode -ne 200) {
        throw "Backend root returned HTTP $($backend.StatusCode)"
    }
    Write-Host "  OK Backend: HTTP 200" -ForegroundColor Green

    Write-Host "[4/4] Checking backend health..." -ForegroundColor Yellow
    try {
        $health = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3001/api/health" -TimeoutSec 15
        Write-Host "  OK Health endpoint: HTTP $($health.StatusCode)" -ForegroundColor Green
        Write-Host "  Body: $($health.Content)" -ForegroundColor Gray
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 503) {
            Write-Host "  WARN Health endpoint returned HTTP 503 (expected with placeholder Supabase credentials)." -ForegroundColor Yellow
        } else {
            throw
        }
    }

    Write-Host ""
    Write-Host "Smoke test completed successfully." -ForegroundColor Green
} finally {
    if (-not $KeepRunning) {
        Write-Host ""
        Write-Host "Stopping services..." -ForegroundColor Yellow
        & $DevScript -Stop
    } else {
        Write-Host ""
        Write-Host "KeepRunning enabled, services left running." -ForegroundColor Yellow
    }
}
