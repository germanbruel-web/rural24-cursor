#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Verificación de salud del backend Rural24
    
.DESCRIPTION
    Ejecuta checklist completo para validar que el servidor está corriendo.
    
.EXAMPLE
    .\verify-health.ps1
#>

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Rural24 Backend - Health Check       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

$Port = 3000
$Passed = 0
$Failed = 0

# Test 1: Proceso Node corriendo
Write-Host "[1/5] Checking Node.js processes..." -ForegroundColor Yellow
$NodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($NodeProcesses) {
    Write-Host "   ✓ Found $($NodeProcesses.Count) Node.js process(es)" -ForegroundColor Green
    $NodeProcesses | Select-Object Id, StartTime, CPU | Format-Table
    $Passed++
} else {
    Write-Host "   ✗ No Node.js processes found" -ForegroundColor Red
    $Failed++
}

# Test 2: Puerto escuchando
Write-Host "`n[2/5] Checking port $Port..." -ForegroundColor Yellow
$Listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($Listening) {
    Write-Host "   ✓ Port $Port is LISTENING" -ForegroundColor Green
    $Listening | Select-Object LocalAddress, LocalPort, State, OwningProcess | Format-Table
    $Passed++
} else {
    Write-Host "   ✗ Port $Port is NOT listening" -ForegroundColor Red
    $Failed++
}

# Test 3: Health endpoint HTTP
Write-Host "`n[3/5] Testing /api/health endpoint..." -ForegroundColor Yellow
try {
    $Response = Invoke-RestMethod -Uri "http://localhost:$Port/api/health" -Method GET -TimeoutSec 5
    Write-Host "   ✓ Health endpoint responded" -ForegroundColor Green
    $Response | ConvertTo-Json | Write-Host
    $Passed++
} catch {
    Write-Host "   ✗ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    $Failed++
}

# Test 4: Verificar .env.local
Write-Host "`n[4/5] Checking .env.local..." -ForegroundColor Yellow
$EnvPath = Join-Path $PSScriptRoot ".env.local"
if (Test-Path $EnvPath) {
    Write-Host "   ✓ .env.local exists" -ForegroundColor Green
    $EnvContent = Get-Content $EnvPath
    Write-Host "   → Variables: $($EnvContent.Count) lines" -ForegroundColor Gray
    $Passed++
} else {
    Write-Host "   ✗ .env.local NOT found" -ForegroundColor Red
    $Failed++
}

# Test 5: Verificar node_modules
Write-Host "`n[5/5] Checking dependencies..." -ForegroundColor Yellow
$NodeModulesPath = Join-Path $PSScriptRoot "node_modules"
if (Test-Path $NodeModulesPath) {
    Write-Host "   ✓ node_modules exists" -ForegroundColor Green
    $Passed++
} else {
    Write-Host "   ✗ node_modules NOT found (run npm install)" -ForegroundColor Red
    $Failed++
}

# Resumen
Write-Host "`n═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "RESULTS: $Passed passed, $Failed failed" -ForegroundColor $(if ($Failed -eq 0) { "Green" } else { "Red" })
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

if ($Failed -gt 0) {
    Write-Host "⚠️  Action required:" -ForegroundColor Yellow
    Write-Host "   1. Ensure server is running: .\start-standalone.ps1" -ForegroundColor Gray
    Write-Host "   2. Check logs for errors" -ForegroundColor Gray
    Write-Host "   3. Verify .env.local has all credentials`n" -ForegroundColor Gray
    exit 1
} else {
    Write-Host "✅ All systems operational!`n" -ForegroundColor Green
    exit 0
}
