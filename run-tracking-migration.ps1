# ============================================
# Script: Ejecutar Migración de Tracking
# Descripción: Agrega columnas y funciones RPC
# ============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  MIGRACIÓN: Banner Tracking" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$migrationFile = "database\migrations\2026-01-10_add_banner_tracking.sql"

if (!(Test-Path $migrationFile)) {
    Write-Host "❌ ERROR: No se encuentra el archivo de migración" -ForegroundColor Red
    Write-Host "   Ruta esperada: $migrationFile" -ForegroundColor Yellow
    exit 1
}

Write-Host "📄 Leyendo archivo de migración..." -ForegroundColor Yellow
$sqlContent = Get-Content $migrationFile -Raw

Write-Host ""
Write-Host "📋 SQL a ejecutar:" -ForegroundColor Green
Write-Host "-------------------------------------------" -ForegroundColor DarkGray
Write-Host $sqlContent -ForegroundColor Gray
Write-Host "-------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   1. Este script solo muestra el SQL" -ForegroundColor White
Write-Host "   2. Debes copiar el contenido y ejecutarlo manualmente" -ForegroundColor White
Write-Host "   3. Ir a: https://supabase.com/dashboard/project/YOUR_PROJECT/sql" -ForegroundColor White
Write-Host ""

Write-Host "✨ Pasos para ejecutar:" -ForegroundColor Cyan
Write-Host "   1. Abrir Supabase Dashboard" -ForegroundColor White
Write-Host "   2. Ir a: SQL Editor" -ForegroundColor White
Write-Host "   3. Copiar TODO el contenido del recuadro de arriba" -ForegroundColor White
Write-Host "   4. Pegarlo en el editor SQL" -ForegroundColor White
Write-Host "   5. Click en 'Run'" -ForegroundColor White
Write-Host "   6. Verificar mensaje: 'Success. No rows returned'" -ForegroundColor White
Write-Host ""

Write-Host "📋 ¿Copiar SQL al portapapeles? (S/N): " -NoNewline -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "S" -or $response -eq "s") {
    Set-Clipboard -Value $sqlContent
    Write-Host "✅ SQL copiado al portapapeles!" -ForegroundColor Green
    Write-Host "   Ahora ve a Supabase y pégalo en el SQL Editor" -ForegroundColor White
} else {
    Write-Host "⏭️  Puedes copiar manualmente desde el archivo:" -ForegroundColor Yellow
    Write-Host "   $migrationFile" -ForegroundColor White
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Script finalizado" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
