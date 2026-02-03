# ================================================================
# Script para regenerar slugs de todos los avisos
# Ejecuta la migración SQL en Supabase
# ================================================================

Write-Host "🔧 Regenerando slugs de avisos existentes..." -ForegroundColor Cyan
Write-Host ""

# Leer el archivo SQL
$sqlFile = ".\database\migrations\20260203_ADD_SLUG_TO_ADS.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ No se encontró el archivo: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Archivo SQL: $sqlFile" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Ejecuta este SQL directamente en Supabase SQL Editor" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pasos:" -ForegroundColor Green
Write-Host "1. Abre https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Selecciona tu proyecto" -ForegroundColor White
Write-Host "3. Ve a SQL Editor" -ForegroundColor White
Write-Host "4. Pega el contenido del archivo y ejecuta" -ForegroundColor White
Write-Host ""
Write-Host "Contenido del archivo SQL:" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray

Get-Content $sqlFile | Write-Host

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""
Write-Host "✅ Copia el contenido anterior y ejecútalo en Supabase SQL Editor" -ForegroundColor Green
