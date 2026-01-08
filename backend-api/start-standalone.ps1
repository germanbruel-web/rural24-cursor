# Rural24 Backend API - Standalone Launcher
# NO ejecutar npm run dev desde rural24/ (Turbo interfiere)

param(
    [switch]$Watch = $false,
    [switch]$Clean = $true
)

# Garantizar que estamos en backend-api/
$BackendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $BackendDir

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Rural24 Backend API (Standalone)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nWorking directory: $BackendDir" -ForegroundColor Gray

# Limpiar procesos Node previos
if ($Clean) {
    Write-Host "Cleaning previous Node processes..." -ForegroundColor Yellow
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Verificar .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "`nERROR: .env.local not found in $BackendDir" -ForegroundColor Red
    Write-Host "Create it with Supabase and Cloudinary credentials" -ForegroundColor Yellow
    exit 1
}

# Verificar node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
    npm install
}

# Ejecutar servidor
Write-Host "`nStarting server..." -ForegroundColor Green

if ($Watch) {
    Write-Host "Mode: Watch (hot reload enabled)" -ForegroundColor Gray
    npm run dev:watch
} else {
    Write-Host "Mode: Standard (no watch)" -ForegroundColor Gray
    npm run dev
}

# Si falla
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nServer failed to start (exit code: $LASTEXITCODE)" -ForegroundColor Red
    exit $LASTEXITCODE
}

