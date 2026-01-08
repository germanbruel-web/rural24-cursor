# ==============================================
# 🧪 TEST E2E - FRONTEND-BACKEND INTEGRATION
# ==============================================
# Script PowerShell para validar integración completa
# Ejecuta tests contra backend Fastify y verifica respuestas

Write-Host "`n═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🧪 TESTING FRONTEND-BACKEND INTEGRATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$passed = 0
$failed = 0
$tests = @()

function Test-Endpoint {
    param(
        [string]$name,
        [string]$url,
        [string]$method = "GET",
        [hashtable]$body = $null
    )
    
    Write-Host "[$name] " -NoNewline -ForegroundColor Yellow
    
    try {
        $startTime = Get-Date
        
        if ($method -eq "GET") {
            $response = Invoke-RestMethod -Uri $url -Method Get -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $url -Method Post -Body ($body | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
        }
        
        $duration = [math]::Round(((Get-Date) - $startTime).TotalMilliseconds)
        
        Write-Host "✅ OK " -ForegroundColor Green -NoNewline
        Write-Host "($duration ms)" -ForegroundColor DarkGray
        
        $script:passed++
        $script:tests += @{
            name = $name
            status = "PASS"
            duration = $duration
            response = $response
        }
        
        return $response
    } catch {
        Write-Host "❌ FAIL" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        
        $script:failed++
        $script:tests += @{
            name = $name
            status = "FAIL"
            error = $_.Exception.Message
        }
        
        return $null
    }
}

# ==============================================
# FASE 1: HEALTH CHECK
# ==============================================
Write-Host "`n📍 FASE 1: Health Check`n" -ForegroundColor Cyan

$health = Test-Endpoint -name "Health Check" -url "$baseUrl/api/health"

if ($health) {
    Write-Host "   ✓ Server Status: $($health.status)" -ForegroundColor Green
    Write-Host "   ✓ Uptime: $([math]::Round($health.uptime, 2))s" -ForegroundColor Green
}

# ==============================================
# FASE 2: CONFIG ENDPOINTS
# ==============================================
Write-Host "`n📍 FASE 2: Config Endpoints (Catalog)`n" -ForegroundColor Cyan

$categories = Test-Endpoint -name "Get Categories" -url "$baseUrl/api/config/categories"

if ($categories -and $categories.categories) {
    Write-Host "   ✓ Categories found: $($categories.categories.Count)" -ForegroundColor Green
    
    # Extraer primera subcategoría para siguientes tests
    $firstSubcategory = $categories.categories[0].subcategories[0]
    $subcategoryId = $firstSubcategory.id
    $subcategoryName = $firstSubcategory.name
    
    Write-Host "   ✓ Using subcategory: $subcategoryName ($subcategoryId)" -ForegroundColor Green
    
    # Test de marcas
    $brands = Test-Endpoint -name "Get Brands (by subcategory)" -url "$baseUrl/api/config/brands?subcategoryId=$subcategoryId"
    
    if ($brands) {
        Write-Host "   ✓ Brands found: $($brands.count)" -ForegroundColor Green
    }
    
    # Test de modelos (usando marca hardcoded conocida)
    $johnDeereId = "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    $models = Test-Endpoint -name "Get Models (John Deere)" -url "$baseUrl/api/config/models?brandId=$johnDeereId"
    
    if ($models) {
        Write-Host "   ✓ Models found: $($models.count)" -ForegroundColor Green
    }
    
    # Test de form config
    $formConfig = Test-Endpoint -name "Get Form Config" -url "$baseUrl/api/config/form/$subcategoryId"
    
    if ($formConfig) {
        Write-Host "   ✓ Total fields: $($formConfig.total_fields)" -ForegroundColor Green
        Write-Host "   ✓ Required fields: $($formConfig.required_fields)" -ForegroundColor Green
    }
}

# ==============================================
# FASE 3: ADS ENDPOINTS
# ==============================================
Write-Host "`n📍 FASE 3: Ads Endpoints`n" -ForegroundColor Cyan

$ads = Test-Endpoint -name "Get Ads (all)" -url "$baseUrl/api/ads"

if ($ads) {
    Write-Host "   ✓ Total ads: $($ads.pagination.total)" -ForegroundColor Green
    Write-Host "   ✓ Limit: $($ads.pagination.limit)" -ForegroundColor Green
}

$adsActive = Test-Endpoint -name "Get Ads (active only)" -url "$baseUrl/api/ads?status=active"

if ($adsActive) {
    Write-Host "   ✓ Active ads: $($adsActive.pagination.total)" -ForegroundColor Green
}

# ==============================================
# FASE 4: FRONTEND API CLIENT TEST
# ==============================================
Write-Host "`n📍 FASE 4: Frontend API Client (Simulated)`n" -ForegroundColor Cyan

Write-Host "[Frontend Service Test] " -NoNewline -ForegroundColor Yellow
Write-Host "⚠️ MANUAL - Open http://localhost:5173/#/api-test" -ForegroundColor Yellow

# ==============================================
# RESULTADOS FINALES
# ==============================================
Write-Host "`n═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   📊 RESULTADOS FINALES" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════`n" -ForegroundColor Cyan

$total = $passed + $failed
$percentage = [math]::Round(($passed / $total) * 100, 1)

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed " -ForegroundColor Green -NoNewline
Write-Host "✅"
Write-Host "Failed: $failed " -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" }) -NoNewline
Write-Host $(if ($failed -eq 0) { "✅" } else { "❌" })
Write-Host "Success Rate: $percentage%" -ForegroundColor $(if ($percentage -eq 100) { "Green" } else { "Yellow" })

# ==============================================
# ESTADÍSTICAS DE PERFORMANCE
# ==============================================
Write-Host "`n📈 Performance Stats:`n" -ForegroundColor Cyan

$passedTests = $tests | Where-Object { $_.status -eq "PASS" }

if ($passedTests.Count -gt 0) {
    $avgDuration = [math]::Round(($passedTests | Measure-Object -Property duration -Average).Average)
    $minDuration = ($passedTests | Measure-Object -Property duration -Minimum).Minimum
    $maxDuration = ($passedTests | Measure-Object -Property duration -Maximum).Maximum
    
    Write-Host "   Average Response Time: $avgDuration ms" -ForegroundColor White
    Write-Host "   Fastest: $minDuration ms" -ForegroundColor Green
    Write-Host "   Slowest: $maxDuration ms" -ForegroundColor Yellow
}

# ==============================================
# PRÓXIMOS PASOS
# ==============================================
Write-Host "`n🎯 Próximos Pasos:`n" -ForegroundColor Cyan

Write-Host "   1. Abrir frontend: http://localhost:5173/#/api-test" -ForegroundColor White
Write-Host "   2. Click en 'Run All Tests' en la UI" -ForegroundColor White
Write-Host "   3. Verificar que todos los tests pasen ✅" -ForegroundColor White
Write-Host "   4. Revisar feature flags en consola del navegador" -ForegroundColor White
Write-Host "   5. Comenzar migración de componentes a catalogServiceV2" -ForegroundColor White

Write-Host "`n═══════════════════════════════════════════════`n" -ForegroundColor Cyan

# Exit con código apropiado
if ($failed -eq 0) {
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
    exit 1
}
