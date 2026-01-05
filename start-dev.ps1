#!/usr/bin/env pwsh
# Script de inicio RURAL24 - Desarrollo
# Limpia puertos, inicia servicios y monitorea estado

$ErrorActionPreference = "SilentlyContinue"

# Colores
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host $msg -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host $msg -ForegroundColor Red }

Clear-Host
Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "   🚀 RURAL24 - Inicializador de Servicios" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Magenta

# ============================================================
# PASO 1: Verificar y limpiar puertos
# ============================================================
Write-Info "📡 Verificando puertos necesarios..."

$ports = @(
    @{ Port = 3000; Name = "Backend (Next.js)" }
    @{ Port = 5173; Name = "Frontend (Vite)" }
)

foreach ($p in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $p.Port -State Listen -ErrorAction SilentlyContinue
    
    if ($conn) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Warn "  ⚠️  Puerto $($p.Port) ocupado por PID $($proc.Id) ($($proc.ProcessName))"
            Write-Info "      Deteniendo proceso..."
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
            Write-Success "      ✅ Proceso detenido"
        }
    } else {
        Write-Success "  ✅ Puerto $($p.Port) disponible - $($p.Name)"
    }
}

# ============================================================
# PASO 2: Limpiar caches
# ============================================================
Write-Info "`n🧹 Limpiando caches..."

$backendCache = "$PSScriptRoot\backend\.next"
$frontendCache = "$PSScriptRoot\frontend\node_modules\.vite"

if (Test-Path $backendCache) {
    Remove-Item -Recurse -Force $backendCache -ErrorAction SilentlyContinue
    Write-Success "  ✅ Cache backend limpiado"
}

if (Test-Path $frontendCache) {
    Remove-Item -Recurse -Force $frontendCache -ErrorAction SilentlyContinue
    Write-Success "  ✅ Cache frontend limpiado"
}

# ============================================================
# PASO 3: Verificar variables de entorno
# ============================================================
Write-Info "`n🔐 Verificando configuración..."

$envFile = "$PSScriptRoot\backend\.env.local"
if (Test-Path $envFile) {
    Write-Success "  ✅ Archivo .env.local encontrado"
} else {
    Write-Fail "  ❌ Falta backend/.env.local"
    Write-Warn "      Copia .env.example a .env.local y configura credenciales"
    exit 1
}

# ============================================================
# PASO 4: Iniciar servicios
# ============================================================
Write-Info "`n🚀 Iniciando servicios...`n"

# Backend
Write-Info "  🔹 Iniciando Backend (Next.js)..."
$backendJob = Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host '🔧 BACKEND - Puerto 3000' -ForegroundColor Blue; npm run dev" -PassThru
Start-Sleep -Seconds 3

# Verificar que backend arrancó
$backendCheck = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($backendCheck) {
    Write-Success "     ✅ Backend corriendo en http://localhost:3000"
} else {
    Write-Warn "     ⏳ Backend iniciando... (verificar terminal)"
}

# Frontend
Write-Info "  🔹 Iniciando Frontend (Vite)..."
$frontendJob = Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host '🎨 FRONTEND - Puerto 5173' -ForegroundColor Magenta; npm run dev" -PassThru
Start-Sleep -Seconds 2

# Verificar que frontend arrancó
$frontendCheck = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if ($frontendCheck) {
    Write-Success "     ✅ Frontend corriendo en http://localhost:5173"
} else {
    Write-Warn "     ⏳ Frontend iniciando... (verificar terminal)"
}

# ============================================================
# PASO 5: Resumen
# ============================================================
Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "   ✨ Servicios iniciados correctamente" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Green

Write-Info "📋 URLs de acceso:"
Write-Host "   Frontend:  " -NoNewline; Write-Host "http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend:   " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Cyan

Write-Info "`n🔧 Arquitectura:"
Write-Host "   Frontend → Backend (BFF) → Cloudinary" -ForegroundColor White
Write-Host "             ↓" -ForegroundColor White
Write-Host "        Supabase (PostgreSQL)" -ForegroundColor White

Write-Warn "`n⚠️  Para detener servicios:"
Write-Host "   Get-Process node | Stop-Process -Force" -ForegroundColor Gray

Write-Info "`n📚 Documentación:"
Write-Host "   Ver ARQUITECTURA_UPLOADS.md para detalles técnicos" -ForegroundColor Gray

Write-Host "`n═══════════════════════════════════════════════════`n" -ForegroundColor Magenta

