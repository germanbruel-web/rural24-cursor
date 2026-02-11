#!/usr/bin/env pwsh
# Script de limpieza profunda de procesos RURAL24

$ErrorActionPreference = "SilentlyContinue"

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host " LIMPIEZA DE PROCESOS RURAL24" -ForegroundColor White
Write-Host "=====================================`n" -ForegroundColor Cyan

$totalCleaned = 0

# 1. Detener procesos Node en puertos conocidos
Write-Host "[1/4] Deteniendo procesos Node en puertos 3000 y 5173..." -ForegroundColor Yellow

$ports = @(3000, 5173)
foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "  Deteniendo PID $($proc.Id) en puerto $port" -ForegroundColor Gray
            Stop-Process -Id $proc.Id -Force
            $totalCleaned++
        }
    }
}
Write-Host "  OK - Puertos liberados`n" -ForegroundColor Green

# 2. Limpiar procesos Node huerfanos (mas de 100MB y sin conexiones)
Write-Host "[2/4] Limpiando procesos Node huerfanos..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $_.WorkingSet64 -gt 100MB
}

foreach ($proc in $nodeProcesses) {
    $hasConnection = Get-NetTCPConnection -OwningProcess $proc.Id -ErrorAction SilentlyContinue
    if (-not $hasConnection) {
        Write-Host "  Deteniendo Node huerfano PID $($proc.Id) [$([math]::Round($proc.WorkingSet64/1MB))MB]" -ForegroundColor Gray
        Stop-Process -Id $proc.Id -Force
        $totalCleaned++
    }
}
Write-Host "  OK - Procesos Node limpiados`n" -ForegroundColor Green

# 3. Limpiar procesos PowerShell huerfanos (excepto el actual)
Write-Host "[3/4] Limpiando procesos PowerShell huerfanos..." -ForegroundColor Yellow

$currentPID = $PID
$psProcesses = Get-Process -Name powershell -ErrorAction SilentlyContinue | Where-Object {
    $_.Id -ne $currentPID -and 
    $_.StartTime -lt (Get-Date).AddHours(-1)
}

foreach ($proc in $psProcesses) {
    Write-Host "  Deteniendo PowerShell antiguo PID $($proc.Id)" -ForegroundColor Gray
    Stop-Process -Id $proc.Id -Force
    $totalCleaned++
}
Write-Host "  OK - PowerShell limpiado`n" -ForegroundColor Green

# 4. Cerrar extensiones huerfanas de VS Code
Write-Host "[4/4] Limpiando procesos huerfanos de VS Code..." -ForegroundColor Yellow

$codeProcesses = Get-Process | Where-Object {
    $_.ProcessName -like "*cloudcode*" -or 
    $_.ProcessName -eq "node" -and $_.MainWindowTitle -like "*extension*"
}

foreach ($proc in $codeProcesses) {
    Write-Host "  Deteniendo extension VS Code PID $($proc.Id)" -ForegroundColor Gray
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    $totalCleaned++
}
Write-Host "  OK - Extensiones limpiadas`n" -ForegroundColor Green

# Resumen
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " LIMPIEZA COMPLETADA" -ForegroundColor Green
Write-Host " Total procesos detenidos: $totalCleaned" -ForegroundColor White
Write-Host "=====================================`n" -ForegroundColor Cyan

# Mostrar estado final
Write-Host "Estado actual:" -ForegroundColor Cyan
$remainingCode = (Get-Process -Name Code -ErrorAction SilentlyContinue).Count
$remainingNode = (Get-Process -Name node -ErrorAction SilentlyContinue).Count
$remainingPS = (Get-Process -Name powershell -ErrorAction SilentlyContinue).Count

Write-Host "  Procesos Code: $remainingCode" -ForegroundColor $(if ($remainingCode -lt 10) { "Green" } else { "Yellow" })
Write-Host "  Procesos Node: $remainingNode" -ForegroundColor $(if ($remainingNode -lt 3) { "Green" } else { "Yellow" })
Write-Host "  Procesos PowerShell: $remainingPS`n" -ForegroundColor $(if ($remainingPS -lt 5) { "Green" } else { "Yellow" })

Write-Host "Recomendacion: Reinicia VS Code para una limpieza completa.`n" -ForegroundColor Yellow
