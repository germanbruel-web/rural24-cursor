# ============================================================================
# Script: run-featured-cron.ps1
# Ejecuta manualmente el CRON de destacados
# ============================================================================

param(
    [switch]$Local,
    [switch]$Production
)

Write-Host "🕐 Ejecutando CRON de Avisos Destacados..." -ForegroundColor Cyan

$cronSecret = "rural24-cron-secret-2026"

if ($Local) {
    $url = "http://localhost:3001/api/featured-ads/cron"
    Write-Host "📍 Endpoint: $url (Local)" -ForegroundColor Yellow
}
elseif ($Production) {
    $url = $env:BACKEND_URL + "/api/featured-ads/cron"
    if (-not $url -or $url -eq "/api/featured-ads/cron") {
        Write-Host "❌ Variable BACKEND_URL no configurada" -ForegroundColor Red
        exit 1
    }
    Write-Host "📍 Endpoint: $url (Producción)" -ForegroundColor Yellow
}
else {
    $url = "http://localhost:3001/api/featured-ads/cron"
    Write-Host "📍 Endpoint: $url (Default: Local)" -ForegroundColor Yellow
}

try {
    $headers = @{
        "X-Cron-Secret" = $cronSecret
        "Content-Type"  = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri $url -Method GET -Headers $headers -ErrorAction Stop
    
    if ($response.success) {
        Write-Host ""
        Write-Host "✅ CRON ejecutado correctamente" -ForegroundColor Green
        Write-Host "   Destacados activados: $($response.activated)" -ForegroundColor White
        Write-Host "   Destacados expirados: $($response.expired)" -ForegroundColor White
        Write-Host "   Timestamp: $($response.timestamp)" -ForegroundColor Gray
    }
    else {
        Write-Host "❌ Error: $($response.error)" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Error al conectar: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Asegurate de que el backend esté corriendo:" -ForegroundColor Yellow
    Write-Host "   cd backend && npm run dev" -ForegroundColor Gray
}

Write-Host ""
