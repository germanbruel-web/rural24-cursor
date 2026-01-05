#!/usr/bin/env pwsh
# Script para detener servicios RURAL24

$ErrorActionPreference = "SilentlyContinue"

Write-Host "`n🛑 Deteniendo servicios RURAL24...`n" -ForegroundColor Yellow

$stopped = 0

# Detener todos los procesos Node
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    foreach ($proc in $nodeProcesses) {
        $port = (Get-NetTCPConnection -OwningProcess $proc.Id -ErrorAction SilentlyContinue | Where-Object LocalPort -in 3000,5173).LocalPort
        
        if ($port) {
            Write-Host "  ⏹️  Deteniendo proceso en puerto $port (PID: $($proc.Id))..." -ForegroundColor Cyan
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            $stopped++
        }
    }
    
    if ($stopped -gt 0) {
        Write-Host "`n  ✅ $stopped proceso(s) detenido(s)" -ForegroundColor Green
    }
} else {
    Write-Host "  ℹ️  No hay servicios corriendo" -ForegroundColor Gray
}

Write-Host ""
