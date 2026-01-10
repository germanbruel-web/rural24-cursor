# =====================================================
# SCRIPT DE TESTING - INTEGRACIÓN FRONTEND-BACKEND
# Rural24 - Sprint 1 Día 2
# =====================================================

Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🧪 TESTING INTEGRACIÓN FRONTEND-BACKEND                     ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$tests = @()

# Test 1: Backend Health
Write-Host "1️⃣  Backend Health..." -ForegroundColor Yellow -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -ErrorAction Stop
    Write-Host " ✅ OK" -ForegroundColor Green
    $tests += "✅ Backend Health"
}
catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
    $tests += "❌ Backend Health (no responde - ¿está corriendo?)"
    exit 1
}

# Test 2: Categories
Write-Host "2️⃣  GET /api/config/categories..." -ForegroundColor Yellow -NoNewline
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/config/categories" -Method Get
    Write-Host " ✅ OK ($($response.categories.Count) categorías)" -ForegroundColor Green
    $tests += "✅ GET /api/config/categories"
}
catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
    $tests += "❌ GET /api/config/categories"
}

# Test 3: Form Config
Write-Host "3️⃣  Frontend..." -ForegroundColor Yellow -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -ErrorAction Stop
    Write-Host " ✅ OK" -ForegroundColor Green
    $tests += "✅ Frontend"
}
catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
    $tests += "❌ Frontend (no responde - ¿está corriendo?)"
}

# Resumen
Write-Host "`n📊 RESUMEN:" -ForegroundColor Cyan
foreach ($test in $tests) {
    Write-Host "   $test" -ForegroundColor White
}

Write-Host "`n🎯 Próximo paso: Testing manual en http://localhost:5173/publicar`n" -ForegroundColor Green
