# Script para aplicar políticas RLS en Supabase
# Fecha: 8 de Enero 2026

Write-Host "`n🔐 CONFIGURACIÓN DE RLS EN SUPABASE" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

# Verificar archivo SQL
$sqlFile = ".\database\ENABLE_RLS_CORRECTLY.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Error: No se encontró $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Archivo SQL encontrado: $sqlFile`n" -ForegroundColor Green

# Leer contenido del archivo
$sqlContent = Get-Content $sqlFile -Raw

Write-Host "📋 INSTRUCCIONES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Abre tu navegador e inicia sesión en Supabase"
Write-Host "2. Ve a tu proyecto: https://supabase.com/dashboard/project/lmkuecdvxtenrikjomol"
Write-Host "3. Click en 'SQL Editor' en el menú lateral"
Write-Host "4. Copia el contenido del archivo SQL (se copiará al portapapeles)"
Write-Host "5. Pega en el editor SQL de Supabase"
Write-Host "6. Click en 'Run' para ejecutar"
Write-Host ""

# Preguntar si continuar
$continue = Read-Host "¿Deseas copiar el SQL al portapapeles ahora? (S/N)"

if ($continue -eq "S" -or $continue -eq "s") {
    # Copiar al portapapeles
    Set-Clipboard -Value $sqlContent
    Write-Host ""
    Write-Host "✅ SQL copiado al portapapeles!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Pasos siguientes:" -ForegroundColor Cyan
    Write-Host "  1. Ve a Supabase SQL Editor"
    Write-Host "  2. Ctrl+V para pegar"
    Write-Host "  3. Click en 'Run'"
    Write-Host "  4. Vuelve aquí y presiona Enter para verificar"
    Write-Host ""
    
    Read-Host "Presiona Enter cuando hayas ejecutado el SQL en Supabase"
    
    # Verificar RLS
    Write-Host ""
    Write-Host "🔍 Verificando estado de RLS..." -ForegroundColor Cyan
    Write-Host ""
    
    node scripts/verify-rls.js
    
    Write-Host ""
    Write-Host "✅ Proceso completado!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📄 Documentación actualizada en:" -ForegroundColor Yellow
    Write-Host "   - docs/RLS_STATUS_JAN_8_2026.md"
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "ℹ️  Operación cancelada" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para ejecutar manualmente:" -ForegroundColor Cyan
    Write-Host "  1. Abre: $sqlFile"
    Write-Host "  2. Copia todo el contenido"
    Write-Host "  3. Pega en Supabase SQL Editor"
    Write-Host "  4. Ejecuta: node scripts/verify-rls.js"
    Write-Host ""
}
