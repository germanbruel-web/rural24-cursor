# Rural24 Development Environment Script - OPTIMIZED
# Usage: .\dev-optimized.ps1 [-Frontend] [-Backend] [-Status] [-Stop] [-Monitor]
# New: Health monitoring and automatic zombie cleanup

param(
    [switch]$Frontend,
    [switch]$Backend,
    [switch]$Status,
    [switch]$Stop,
    [switch]$Monitor
)

$ErrorActionPreference = "Continue"

# ========================================
# CONFIGURACIÓN DE RECURSOS
# ========================================
$MAX_RAM_MB = 4096  # Alerta si VS Code + Dev servers > 4GB
$MAX_WATCHERS = 1000  # Límite recomendado de file watchers
$ZOMBIE_TIMEOUT_MIN = 60  # Matar procesos Node > 60 min sin actividad
$HEALTH_CHECK_INTERVAL = 30  # Segundos entre health checks

$FRONTEND_PORT = 5173
$BACKEND_PORT = 3001
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

# ========================================
# HEALTH MONITOR (Guardian Process)
# ========================================
function Start-HealthMonitor {
    Write-Inf "Starting Health Monitor..."
    
    $job = Start-Job -ScriptBlock {
        param($maxRam, $zombieTimeout, $interval)
        
        function Write-Monitor { 
            param($msg, $color = "White") 
            Write-Host "[MONITOR] $msg" -ForegroundColor $color 
        }
        
        $iteration = 0
        while ($true) {
            Start-Sleep -Seconds $interval
            $iteration++
            
            try {
                # ========================================
                # 1. Check RAM usage (VS Code + Node)
                # ========================================
                $codeProcs = Get-Process Code -ErrorAction SilentlyContinue
                $nodeProcs = Get-Process node -ErrorAction SilentlyContinue
                
                $codeRam = ($codeProcs | Measure-Object WorkingSet64 -Sum).Sum / 1MB
                $nodeRam = ($nodeProcs | Measure-Object WorkingSet64 -Sum).Sum / 1MB
                $totalRam = $codeRam + $nodeRam
                
                if ($totalRam -gt $maxRam) {
                    $codeRounded = [math]::Round($codeRam)
                    $nodeRounded = [math]::Round($nodeRam)
                    Write-Monitor "WARNING: RAM exceeded ${maxRam}MB (Code: ${codeRounded}MB | Node: ${nodeRounded}MB)" "Yellow"
                    Write-Monitor "TIP: Consider restarting VS Code or running .\cleanup-processes.ps1" "Cyan"
                }
                
                # ========================================
                # 2. Kill zombie Node processes
                # ========================================
                $now = Get-Date
                $zombies = $nodeProcs | Where-Object {
                    ($now - $_.StartTime).TotalMinutes -gt $zombieTimeout
                }
                
                foreach ($zombie in $zombies) {
                    $zombieAge = [math]::Round(($now - $zombie.StartTime).TotalMinutes)
                    Write-Monitor "ZOMBIE: Killing zombie Node PID $($zombie.Id) (age: ${zombieAge}m)" "Yellow"
                    Stop-Process -Id $zombie.Id -Force -ErrorAction SilentlyContinue
                }
                
                # ========================================
                # 3. Periodic status (every 5 minutes)
                # ========================================
                if ($iteration % 10 -eq 0) {
                    $codeCount = $codeProcs.Count
                    $nodeCount = $nodeProcs.Count
                    $ramRounded = [math]::Round($totalRam)
                    Write-Monitor "STATUS: Code processes: $codeCount | Node processes: $nodeCount | RAM: ${ramRounded}MB" "Cyan"
                }
                
            }
            catch {
                Write-Monitor "Error in health check: $_" "Red"
            }
        }
    } -ArgumentList $MAX_RAM_MB, $ZOMBIE_TIMEOUT_MIN, $HEALTH_CHECK_INTERVAL
    
    Write-OK "Health Monitor started (Job ID: $($job.Id))"
    Write-Inf "Mon- RAM usage > ${MAX_RAM_MB}MB" -ForegroundColor Gray
    Write-Host "  - RAM usage > ${MAX_RAM_MB}MB" -ForegroundColor Gray
    Write-Host "  • Zombie Node processes > ${ZOMBIE_TIMEOUT_MIN}min" -ForegroundColor Gray
    Write-Host ""
    
    return $job
}

# ========================================
# Show status with health metrics
# ========================================
function Show-Status {
    Write-Host ""
    Write-Host "======================================================" -ForegroundColor Blue
    Write-Host "          RURAL24 - Service Status (OPTIMIZED)        " -ForegroundColor Blue
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
    
    # Health metrics
    Write-Host ""
    Write-Host "Health Metrics:" -ForegroundColor Cyan
    
    $codeProcs = Get-Process Code -ErrorAction SilentlyContinue
    $nodeProcs = Get-Process node -ErrorAction SilentlyContinue
    
    $codeCount = $codeProcs.Count
    $nodeCount = $nodeProcs.Count
    $codeRam = ($codeProcs | Measure-Object WorkingSet64 -Sum).Sum / 1MB
    $nodeRam = ($nodeProcs | Measure-Object WorkingSet64 -Sum).Sum / 1MB
    $totalRam = $codeRam + $nodeRam
    
    Write-Host "  Code processes: $codeCount" -ForegroundColor $(if ($codeCount -lt 15) { "Green" } else { "Yellow" })
    Write-Host "  Node processes: $nodeCount" -ForegroundColor $(if ($nodeCount -lt 5) { "Green" } else { "Yellow" })
    Write-Host "  Total RAM: $([math]::Round($totalRam))MB" -ForegroundColor $(if ($totalRam -lt $MAX_RAM_MB) { "Green" } else { "Yellow" })
    Write-Host ""
    
    # API connection test (solo si backend está activo)
    if (Test-Port -Port $BACKEND_PORT) {
        Write-Host "Testing API connection..." -ForegroundColor Gray
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:$BACKEND_PORT/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
            Write-OK "API responding correctly"
        }
        catch {
            Write-Warn "Backend active but API not responding yet"
        }
    }
    Write-Host ""
}

# ========================================
# Stop all services
# ========================================
function Stop-All {
    Write-Inf "Stopping services..."
    Stop-PortProcess -Port $FRONTEND_PORT
    Stop-PortProcess -Port $BACKEND_PORT
    
    # Stop health monitor jobs
    $jobs = Get-Job | Where-Object { $_.State -eq "Running" }
    foreach ($job in $jobs) {
        Stop-Job -Id $job.Id
        Remove-Job -Id $job.Id
    }
    
    Write-OK "Services stopped"
}

# ========================================
# Start Frontend with optimizations
# ========================================
function Start-Frontend {
    if (Test-Port -Port $FRONTEND_PORT) {
        Write-Warn "Frontend already running on port $FRONTEND_PORT"
        return
    }
    
    Write-Inf "Starting Frontend (Vite) with optimizations..."
    
    # Set Node memory limit
    $env:NODE_OPTIONS = "--max-old-space-size=2048"
    
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

# ========================================
# Start Backend with optimizations
# ========================================
function Start-Backend {
    if (Test-Port -Port $BACKEND_PORT) {
        Write-Warn "Backend already running on port $BACKEND_PORT"
        return
    }
    
    Write-Inf "Starting Backend (Next.js) with optimizations..."
    
    # Set Node memory limit
    $env:NODE_OPTIONS = "--max-old-space-size=2048"
    
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

# ========================================
# MAIN LOGIC
# ========================================
Write-Host ""
Write-Host "RURAL24 Development Environment (OPTIMIZED)" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""

# Monitor mode (solo monitoreo, no inicia servicios)
if ($Monitor) {
    Write-Inf "Starting in MONITOR-ONLY mode..."
    $job = Start-HealthMonitor
    Write-Host ""
    Write-Host "Press CTRL+C to stop monitoring" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        while ($true) {
            Start-Sleep -Seconds 5
        }
    }
    finally {
        Stop-Job -Id $job.Id
        Remove-Job -Id $job.Id
        Write-Inf "Monitor stopped"
    }
    exit 0
}

# Status mode
if ($Status) {
    Show-Status
    exit 0
}

# Stop mode
if ($Stop) {
    Stop-All
    exit 0
}

# ========================================
# START SERVICES
# ========================================

# Cleanup zombie processes first
Write-Inf "Pre-flight cleanup..."
& "$PSScriptRoot\cleanup-processes.ps1"
Write-Host ""

# Start requested services
if ($Frontend -and -not $Backend) {
    Start-Frontend
    Start-HealthMonitor | Out-Null
    Show-Status
    exit 0
}

if ($Backend -and -not $Frontend) {
    Start-Backend
    Start-HealthMonitor | Out-Null
    Show-Status
    exit 0
}

# Default: start both services
Write-Inf "Starting full development environment..."
Write-Host ""

# Kill any existing processes on ports
Stop-PortProcess -Port $BACKEND_PORT
Stop-PortProcess -Port $FRONTEND_PORT

# Start services
Start-Frontend
Start-Sleep -Seconds 2
Start-Backend
Start-Sleep -Seconds 2

# Start health monitor
Start-HealthMonitor | Out-Null

# Show final status
Write-Host ""
Show-Status

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "Development environment ready! 🚀" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host """ -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Optimizations active:" -ForegroundColor Cyan
Write-Host "  [OK] File watchers optimized (no polling)" -ForegroundColor Gray
Write-Host "  [OK] Node memory limit: 2GB per service" -ForegroundColor Gray
Write-Host "  [OK] Health monitor running" -ForegroundColor Gray
Write-Host "  [OK]mands:" -ForegroundColor Yellow
Write-Host "  .\dev-optimized.ps1 -Status    # Check status" -ForegroundColor Gray
Write-Host "  .\dev-optimized.ps1 -Stop      # Stop all services" -ForegroundColor Gray
Write-Host "  .\dev-optimized.ps1 -Monitor   # Run health monitor only" -ForegroundColor Gray
Write-Host ""
