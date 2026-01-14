# Rural24 Development Environment Script
# Usage: .\dev.ps1 [-Frontend] [-Backend] [-Status] [-Stop]

param(
    [switch]$Frontend,
    [switch]$Backend,
    [switch]$Status,
    [switch]$Stop
)

$ErrorActionPreference = "Continue"

# Configuration
$FRONTEND_PORT = 5173
$BACKEND_PORT = 3000
$ROOT_DIR = $PSScriptRoot
$FRONTEND_DIR = Join-Path $ROOT_DIR "frontend"
$BACKEND_DIR = Join-Path $ROOT_DIR "backend"

# Output functions
function Write-OK { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Inf { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }

# Check if port is in use
function Test-Port {
    param([int]$Port)
    $connection = netstat -ano | Select-String ":$Port" | Select-String "LISTENING"
    return $null -ne $connection
}

# Get PID from port
function Get-PortPID {
    param([int]$Port)
    $result = netstat -ano | Select-String ":$Port" | Select-String "LISTENING"
    if ($result) {
        $parts = $result.Line -split '\s+' | Where-Object { $_ }
        return $parts[-1]
    }
    return $null
}

# Kill process on port
function Stop-PortProcess {
    param([int]$Port)
    $portPid = Get-PortPID -Port $Port
    if ($portPid) {
        Write-Warn "Killing process on port $Port (PID: $portPid)..."
        Stop-Process -Id $portPid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}

# Show status
function Show-Status {
    Write-Host ""
    Write-Host "======================================================" -ForegroundColor Blue
    Write-Host "              RURAL24 - Service Status                " -ForegroundColor Blue
    Write-Host "======================================================" -ForegroundColor Blue
    Write-Host ""
    
    # Frontend
    if (Test-Port -Port $FRONTEND_PORT) {
        $portPid = Get-PortPID -Port $FRONTEND_PORT
        Write-OK "Frontend (Vite)    : http://localhost:$FRONTEND_PORT  [PID: $portPid]"
    }
    else {
        Write-Err "Frontend (Vite)    : OFF"
    }
    
    # Backend
    if (Test-Port -Port $BACKEND_PORT) {
        $portPid = Get-PortPID -Port $BACKEND_PORT
        Write-OK "Backend  (Next.js) : http://localhost:$BACKEND_PORT  [PID: $portPid]"
    }
    else {
        Write-Err "Backend  (Next.js) : OFF"
    }
    
    Write-Host ""
    Write-Host "======================================================" -ForegroundColor Blue
    
    # API connection test
    Write-Host ""
    Write-Host "Testing API connection..." -ForegroundColor Gray
    try {
        # Use form config endpoint with a test UUID for Cosechadoras
        $testUUID = "100371df-1481-49a3-b8f2-77aecf002913"
        $response = Invoke-RestMethod -Uri "http://localhost:$BACKEND_PORT/api/config/form/$testUUID" -Method GET -TimeoutSec 5 -ErrorAction Stop
        $count = $response.dynamic_attributes.Count
        Write-OK "API responding correctly ($count dynamic attributes for $($response.subcategory_name))"
    }
    catch {
        if (Test-Port -Port $BACKEND_PORT) {
            Write-Warn "Backend active but API not responding"
        }
        else {
            Write-Err "Backend is not running"
        }
    }
    Write-Host ""
}

# Stop all
function Stop-All {
    Write-Inf "Stopping services..."
    Stop-PortProcess -Port $FRONTEND_PORT
    Stop-PortProcess -Port $BACKEND_PORT
    Write-OK "Services stopped"
}

# Start Frontend
function Start-Frontend {
    if (Test-Port -Port $FRONTEND_PORT) {
        Write-Warn "Frontend already running on port $FRONTEND_PORT"
        return
    }
    
    Write-Inf "Starting Frontend on port $FRONTEND_PORT..."
    Start-Process powershell -ArgumentList "-NoProfile -Command `"Set-Location '$FRONTEND_DIR'; npm run dev`"" -WindowStyle Normal
    
    # Wait for startup
    $attempts = 0
    while (-not (Test-Port -Port $FRONTEND_PORT) -and $attempts -lt 30) {
        Start-Sleep -Seconds 1
        $attempts++
    }
    
    if (Test-Port -Port $FRONTEND_PORT) {
        Write-OK "Frontend started at http://localhost:$FRONTEND_PORT"
    }
    else {
        Write-Err "Frontend failed to start"
    }
}

# Start Backend
function Start-Backend {
    if (Test-Port -Port $BACKEND_PORT) {
        Write-Warn "Backend already running on port $BACKEND_PORT"
        return
    }
    
    Write-Inf "Starting Backend on port $BACKEND_PORT..."
    Start-Process powershell -ArgumentList "-NoProfile -Command `"Set-Location '$BACKEND_DIR'; npm run dev`"" -WindowStyle Normal
    
    # Wait for startup
    $attempts = 0
    while (-not (Test-Port -Port $BACKEND_PORT) -and $attempts -lt 30) {
        Start-Sleep -Seconds 1
        $attempts++
    }
    
    if (Test-Port -Port $BACKEND_PORT) {
        Write-OK "Backend started at http://localhost:$BACKEND_PORT"
    }
    else {
        Write-Err "Backend failed to start"
    }
}

# Main logic
Write-Host ""
Write-Host "RURAL24 Development Environment" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""

if ($Status) {
    Show-Status
    exit 0
}

if ($Stop) {
    Stop-All
    exit 0
}

if ($Frontend -and -not $Backend) {
    Start-Frontend
    Show-Status
    exit 0
}

if ($Backend -and -not $Frontend) {
    Start-Backend
    Show-Status
    exit 0
}

# Default: start both
Write-Inf "Starting full development environment..."
Write-Host ""

Start-Backend
Start-Frontend

Write-Host ""
Show-Status

Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "   .\dev.ps1 -Status  : Check service status" -ForegroundColor Gray
Write-Host "   .\dev.ps1 -Stop    : Stop all services" -ForegroundColor Gray
Write-Host "   .\dev.ps1 -Backend : Start backend only" -ForegroundColor Gray
Write-Host "   .\dev.ps1 -Frontend: Start frontend only" -ForegroundColor Gray
Write-Host ""
