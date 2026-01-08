# Test Completo - Todos los Endpoints Rural24
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Rural24 API - Test Completo" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Iniciar servidor
Write-Host "1. Iniciando servidor..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

$Job = Start-Job -ScriptBlock {
    Set-Location "c:\Users\German\rural24\backend-api"
    npm run dev 2>&1
}

Write-Host "2. Esperando servidor..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# IDs de prueba
$tractoresId = "d290f1ee-6c54-4b01-90e6-d701748f0851"
$johnDeereId = "550e8400-e29b-41d4-a716-446655440004"

$tests = @(
    @{ Name = "Health Check"; Url = "http://localhost:3000/api/health" },
    @{ Name = "Get Categories"; Url = "http://localhost:3000/api/config/categories" },
    @{ Name = "Get Brands (tractores)"; Url = "http://localhost:3000/api/config/brands?subcategoryId=$tractoresId" },
    @{ Name = "Get Models (John Deere)"; Url = "http://localhost:3000/api/config/models?brandId=$johnDeereId" },
    @{ Name = "Get Form Config (tractores)"; Url = "http://localhost:3000/api/config/form/$tractoresId" },
    @{ Name = "List Ads"; Url = "http://localhost:3000/api/ads" },
    @{ Name = "List Active Ads"; Url = "http://localhost:3000/api/ads?status=active" }
)

$passed = 0
$failed = 0

Write-Host "3. Ejecutando tests...`n" -ForegroundColor Yellow

foreach ($test in $tests) {
    Write-Host "[TEST] $($test.Name)" -ForegroundColor Cyan
    Write-Host "  URL: $($test.Url)" -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri $test.Url -Method GET -TimeoutSec 5
        Write-Host "  [OK] Status: 200" -ForegroundColor Green
        
        # Mostrar preview de respuesta
        $json = $response | ConvertTo-Json -Depth 2 -Compress
        if ($json.Length -gt 150) {
            Write-Host "  Response: $($json.Substring(0, 147))..." -ForegroundColor Gray
        } else {
            Write-Host "  Response: $json" -ForegroundColor Gray
        }
        Write-Host ""
        $passed++
    }
    catch {
        Write-Host "  [FAIL] Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        $failed++
    }
}

# Resumen
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Resumen" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Passed: $passed" -ForegroundColor Green
Write-Host "  Failed: $failed" -ForegroundColor Red
Write-Host "========================================`n" -ForegroundColor Cyan

# Limpiar
Write-Host "4. Limpiando..." -ForegroundColor Yellow
Stop-Job $Job -ErrorAction SilentlyContinue
Remove-Job $Job -ErrorAction SilentlyContinue
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

if ($failed -gt 0) {
    Write-Host "RESULTADO: Tests fallaron`n" -ForegroundColor Red
    exit 1
} else {
    Write-Host "RESULTADO: Todos los tests pasaron!`n" -ForegroundColor Green
    exit 0
}
