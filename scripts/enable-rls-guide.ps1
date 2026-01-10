# =====================================================
# INSTRUCCIONES PARA HABILITAR RLS EN SUPABASE
# =====================================================

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🔐 GUÍA: HABILITAR RLS EN SUPABASE                          ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  IMPORTANTE: Este script NO puede ejecutar el SQL automáticamente." -ForegroundColor Yellow
Write-Host "    Supabase requiere que lo ejecutes manualmente en su SQL Editor." -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 PASOS A SEGUIR:" -ForegroundColor Green
Write-Host ""
Write-Host "1️⃣  Abre Supabase Dashboard:" -ForegroundColor White
Write-Host "    → https://supabase.com/dashboard" -ForegroundColor Gray
Write-Host ""

Write-Host "2️⃣  Navega a tu proyecto:" -ForegroundColor White
Write-Host "    → Rural24 Project" -ForegroundColor Gray
Write-Host ""

Write-Host "3️⃣  Ve a SQL Editor:" -ForegroundColor White
Write-Host "    → Menú lateral izquierdo: 'SQL Editor'" -ForegroundColor Gray
Write-Host ""

Write-Host "4️⃣  Crea nueva consulta:" -ForegroundColor White
Write-Host "    → Click en 'New query'" -ForegroundColor Gray
Write-Host ""

Write-Host "5️⃣  Copia el contenido del archivo:" -ForegroundColor White
Write-Host "    → database/ENABLE_RLS_CORRECTLY.sql" -ForegroundColor Gray
Write-Host ""

Write-Host "6️⃣  Pega el SQL en el editor de Supabase" -ForegroundColor White
Write-Host ""

Write-Host "7️⃣  Ejecuta la consulta:" -ForegroundColor White
Write-Host "    → Click en 'Run' (Ctrl+Enter)" -ForegroundColor Gray
Write-Host ""

Write-Host "8️⃣  Verifica el resultado:" -ForegroundColor White
Write-Host "    → Deberías ver: 'Success. No rows returned.'" -ForegroundColor Gray
Write-Host ""

# Preguntar si quiere abrir el archivo
Write-Host ""
Write-Host "¿Deseas abrir el archivo SQL ahora? (S/N): " -ForegroundColor Yellow -NoNewline
$response = Read-Host

if ($response -eq "S" -or $response -eq "s") {
    $sqlFile = Join-Path $PSScriptRoot "..\database\ENABLE_RLS_CORRECTLY.sql"
    
    if (Test-Path $sqlFile) {
        Write-Host ""
        Write-Host "✅ Abriendo archivo..." -ForegroundColor Green
        Start-Process notepad.exe -ArgumentList $sqlFile
    }
    else {
        Write-Host ""
        Write-Host "❌ Error: No se encontró el archivo SQL" -ForegroundColor Red
        Write-Host "   Ruta esperada: $sqlFile" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""
Write-Host "✨ DESPUÉS DE EJECUTAR EL SQL:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Ejecuta el script de verificación:" -ForegroundColor White
Write-Host "   → node scripts/verify-rls.js" -ForegroundColor Gray
Write-Host ""
Write-Host "   Deberías ver RLS HABILITADO en todas las tablas:" -ForegroundColor White
Write-Host "   ✅ ads                - RLS HABILITADO" -ForegroundColor Green
Write-Host "   ✅ users              - RLS HABILITADO" -ForegroundColor Green
Write-Host "   ✅ categories         - RLS HABILITADO" -ForegroundColor Green
Write-Host "   ✅ subcategories      - RLS HABILITADO" -ForegroundColor Green
Write-Host "   ✅ brands             - RLS HABILITADO" -ForegroundColor Green
Write-Host "   ✅ models             - RLS HABILITADO" -ForegroundColor Green
Write-Host "   ✅ banners            - RLS HABILITADO" -ForegroundColor Green
Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""
