#!/usr/bin/env pwsh
# Script para verificar estado de servicios RURAL24

$ErrorActionPreference = "SilentlyContinue"

Write-Host "`n===================================================" -ForegroundColor Cyan
Write-Host "   Estado de Servicios RURAL24" -ForegroundColor White
Write-Host "===================================================`n" -ForegroundColor Cyan

# Verificar Backend
$backend = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($backend) {
    $proc = Get-Process -Id $backend.OwningProcess -ErrorAction SilentlyContinue
    Write-Host "  Backend:  CORRIENDO (PID: $($proc.Id))" -ForegroundColor Green
    Write-Host "            http://localhost:3000" -ForegroundColor Cyan
} else {
    Write-Host "  Backend:  DETENIDO" -ForegroundColor Red
}

Write-Host ""

# Verificar Frontend
$frontend = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if ($frontend) {
    $proc = Get-Process -Id $frontend.OwningProcess -ErrorAction SilentlyContinue
    Write-Host "  Frontend: CORRIENDO (PID: $($proc.Id))" -ForegroundColor Green
    Write-Host "            http://localhost:5173" -ForegroundColor Cyan
} else {
    Write-Host "  Frontend: DETENIDO" -ForegroundColor Red
}

Write-Host "`n===================================================`n" -ForegroundColor Cyan
