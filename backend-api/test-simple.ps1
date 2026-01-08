# Test Simple - Backend Rural24
Write-Host "1. Matando procesos previos..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "2. Iniciando servidor en background..." -ForegroundColor Yellow
$Job = Start-Job -ScriptBlock {
    Set-Location "c:\Users\German\rural24\backend-api"
    npm run dev 2>&1
}

Write-Host "3. Esperando 8 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host "4. Verificando puerto 3000..." -ForegroundColor Yellow
$Port = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($Port) {
    Write-Host "   OK: Puerto 3000 escuchando" -ForegroundColor Green
    $Port | Format-Table
} else {
    Write-Host "   ERROR: Puerto 3000 NO escuchando" -ForegroundColor Red
}

Write-Host "5. Probando endpoint /api/health..." -ForegroundColor Yellow
try {
    $Response = Invoke-RestMethod http://localhost:3000/api/health
    Write-Host "   OK: Endpoint respondio" -ForegroundColor Green
    $Response | ConvertTo-Json
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n6. Logs del Job:" -ForegroundColor Yellow
Receive-Job $Job

Write-Host "`n7. Limpiando..." -ForegroundColor Yellow
Stop-Job $Job
Remove-Job $Job
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
