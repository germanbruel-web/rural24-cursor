# ============================================================
# Rural24 - Dev Launcher (Single Source of Truth)
# Usage:
#   .\dev.ps1              → Lanza frontend + backend
#   .\dev.ps1 -Frontend    → Solo frontend (Vite :5173)
#   .\dev.ps1 -Backend     → Solo backend (Next.js :3001)
#   .\dev.ps1 -Stop        → Mata TODO proceso Node de rural24
#   .\dev.ps1 -Status      → Muestra estado de puertos y procesos
# ============================================================

param(
    [switch]$Frontend,
    [switch]$Backend,
    [switch]$Stop,
    [switch]$Status
)

$ErrorActionPreference = "Continue"

# --- Configuración ---
$FRONTEND_PORT = 5173
$BACKEND_PORT  = 3001
$ROOT_DIR      = $PSScriptRoot
$FRONTEND_DIR  = Join-Path $ROOT_DIR "frontend"
$BACKEND_DIR   = Join-Path $ROOT_DIR "backend"

# --- Colores ---
function Write-OK   { param($msg) Write-Host "  [OK]    $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  [WARN]  $msg" -ForegroundColor Yellow }
function Write-Err  { param($msg) Write-Host "  [ERROR] $msg" -ForegroundColor Red }
function Write-Inf  { param($msg) Write-Host "  [INFO]  $msg" -ForegroundColor Cyan }

# --- Utilidades ---
function Get-PortProcess {
    param([int]$Port)
    $result = netstat -ano 2>$null | Select-String ":$Port\s" | Select-String "LISTENING"
    if ($result) {
        $parts = $result.Line.Trim() -split '\s+' 
        $procId = $parts[-1]
        if ($procId -and $procId -match '^\d+$') {
            return [int]$procId
        }
    }
    return $null
}

function Stop-PortProcess {
    param([int]$Port, [string]$Label)
    $procId = Get-PortProcess -Port $Port
    if ($procId) {
        try {
            Stop-Process -Id $procId -Force -ErrorAction Stop
            Write-OK "Liberado puerto $Port (PID $procId) - $Label"
        } catch {
            Write-Warn "No se pudo matar PID $procId en puerto $Port"
        }
    }
}

function Kill-AllNodeZombies {
    # Matar procesos node que contengan rural24 en su command line
    # o que estén escuchando en nuestros puertos
    $ports = @($FRONTEND_PORT, $BACKEND_PORT)
    foreach ($port in $ports) {
        Stop-PortProcess -Port $port -Label "rural24"
    }
    
    # Matar turbo daemon si existe
    Get-Process -Name "turbo" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Pequeña pausa para que el OS libere los puertos
    Start-Sleep -Milliseconds 500
}

# ============================================================
# COMANDO: -Stop
# ============================================================
if ($Stop) {
    Write-Host "`n  Deteniendo todos los procesos de desarrollo...`n" -ForegroundColor White
    Kill-AllNodeZombies
    
    # Verificar que quedaron libres
    $fe = Get-PortProcess -Port $FRONTEND_PORT
    $be = Get-PortProcess -Port $BACKEND_PORT
    
    if (-not $fe -and -not $be) {
        Write-OK "Puertos $FRONTEND_PORT y $BACKEND_PORT libres"
    } else {
        if ($fe) { Write-Err "Puerto $FRONTEND_PORT sigue ocupado (PID $fe)" }
        if ($be) { Write-Err "Puerto $BACKEND_PORT sigue ocupado (PID $be)" }
    }
    Write-Host ""
    exit 0
}

# ============================================================
# COMANDO: -Status
# ============================================================
if ($Status) {
    Write-Host "`n  Estado de Rural24 Dev Environment`n" -ForegroundColor White
    
    $fePid = Get-PortProcess -Port $FRONTEND_PORT
    $bePid = Get-PortProcess -Port $BACKEND_PORT
    
    if ($fePid) {
        Write-OK "Frontend (Vite)    → http://localhost:$FRONTEND_PORT  [PID $fePid]"
    } else {
        Write-Warn "Frontend (Vite)    → Puerto $FRONTEND_PORT libre (no corriendo)"
    }
    
    if ($bePid) {
        Write-OK "Backend  (Next.js) → http://localhost:$BACKEND_PORT  [PID $bePid]"
    } else {
        Write-Warn "Backend  (Next.js) → Puerto $BACKEND_PORT libre (no corriendo)"
    }
    
    $nodeCount = (Get-Process -Name "node" -ErrorAction SilentlyContinue | Measure-Object).Count
    Write-Inf "Total procesos Node activos: $nodeCount"
    
    Write-Host ""
    exit 0
}

# ============================================================
# VALIDACIONES PRE-LAUNCH
# ============================================================
Write-Host ""
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host "    Rural24 - Development Environment" -ForegroundColor White
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host ""

# Si no se especifica -Frontend ni -Backend, lanzar ambos
$launchFrontend = $Frontend -or (-not $Frontend -and -not $Backend)
$launchBackend  = $Backend  -or (-not $Frontend -and -not $Backend)

# 1. Verificar node_modules
if (-not (Test-Path (Join-Path $ROOT_DIR "node_modules"))) {
    Write-Err "node_modules no encontrado. Ejecutando npm install..."
    Set-Location $ROOT_DIR
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Err "npm install falló. Revisá el error arriba."
        exit 1
    }
}

# 2. Verificar .env.local
if ($launchFrontend -and -not (Test-Path (Join-Path $FRONTEND_DIR ".env.local"))) {
    Write-Err "Falta frontend/.env.local — Copiá frontend/.env.example y completalo"
    exit 1
}
if ($launchBackend -and -not (Test-Path (Join-Path $BACKEND_DIR ".env.local"))) {
    Write-Err "Falta backend/.env.local — Copiá backend/.env.example y completalo"
    exit 1
}

# 3. Limpiar zombies de sesiones anteriores
Write-Inf "Limpiando procesos residuales..."
Kill-AllNodeZombies

# ============================================================
# LAUNCH
# ============================================================

if ($launchBackend) {
    Write-Inf "Iniciando Backend (Next.js) en puerto $BACKEND_PORT..."
    $backendJob = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c cd /d `"$BACKEND_DIR`" && npx next dev --port $BACKEND_PORT --hostname 0.0.0.0 --webpack" `
        -PassThru -WindowStyle Normal
    Write-OK "Backend lanzado [PID $($backendJob.Id)]"
}

if ($launchFrontend) {
    Write-Inf "Iniciando Frontend (Vite) en puerto $FRONTEND_PORT..."
    $frontendJob = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c cd /d `"$FRONTEND_DIR`" && npx vite --port $FRONTEND_PORT --host" `
        -PassThru -WindowStyle Normal
    Write-OK "Frontend lanzado [PID $($frontendJob.Id)]"
}

# Esperar a que los puertos estén disponibles
Write-Inf "Esperando que los servidores arranquen..."
$maxWait = 30  # segundos
$waited = 0

while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 2
    $waited += 2
    
    $feReady = if ($launchFrontend) { $null -ne (Get-PortProcess -Port $FRONTEND_PORT) } else { $true }
    $beReady = if ($launchBackend)  { $null -ne (Get-PortProcess -Port $BACKEND_PORT)  } else { $true }
    
    if ($feReady -and $beReady) { break }
    
    Write-Host "." -NoNewline -ForegroundColor DarkGray
}
Write-Host ""

# Estado final
Write-Host ""
Write-Host "  ------------------------------------------------" -ForegroundColor Green

if ($launchFrontend) {
    $feUp = $null -ne (Get-PortProcess -Port $FRONTEND_PORT)
    if ($feUp) {
        Write-OK "Frontend → http://localhost:$FRONTEND_PORT"
    } else {
        Write-Err "Frontend no respondió en $maxWait segundos"
    }
}

if ($launchBackend) {
    $beUp = $null -ne (Get-PortProcess -Port $BACKEND_PORT)
    if ($beUp) {
        Write-OK "Backend  → http://localhost:$BACKEND_PORT"
    } else {
        Write-Err "Backend no respondió en $maxWait segundos"
    }
}

Write-Host "  ------------------------------------------------" -ForegroundColor Green
Write-Host ""
Write-Inf "Para detener:  .\dev.ps1 -Stop"
Write-Inf "Para estado:   .\dev.ps1 -Status"
Write-Host ""
