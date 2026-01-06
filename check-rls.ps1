# ============================================
# RLS Status Checker
# ============================================
# Verifica el estado de RLS en tabla ads

Write-Host "🔍 Verificando estado de RLS..." -ForegroundColor Cyan
Write-Host ""

# Leer credenciales de Supabase
$envPath = ".\backend\.env.local"
if (-not (Test-Path $envPath)) {
    Write-Host "❌ No se encuentra .env.local en backend/" -ForegroundColor Red
    exit 1
}

$env = Get-Content $envPath
$url = ($env | Select-String "SUPABASE_URL=(.*)").Matches.Groups[1].Value
$key = ($env | Select-String "SUPABASE_ANON_KEY=(.*)").Matches.Groups[1].Value

if (-not $url -or -not $key) {
    Write-Host "❌ No se encontraron credenciales de Supabase" -ForegroundColor Red
    exit 1
}

Write-Host "📡 Conectando a Supabase..." -ForegroundColor Gray
Write-Host "   URL: $url" -ForegroundColor Gray
Write-Host ""

# Crear script Node.js temporal
$nodeScript = @"
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('$url', '$key');

(async () => {
  try {
    // Test 1: Query sin autenticación
    const { data: allAds, error } = await supabase
      .from('ads')
      .select('id, title, user_id, status')
      .limit(100);

    if (error) {
      console.log('❌ Error en query:', error.message);
      return;
    }

    console.log('📊 RESULTADOS:');
    console.log('   Total avisos visibles:', allAds?.length || 0);
    
    if (allAds && allAds.length > 0) {
      console.log('   Primeros avisos:');
      allAds.slice(0, 3).forEach(ad => {
        console.log('   - ' + ad.title + ' (user: ' + ad.user_id.substring(0, 8) + '...)');
      });
    }

    console.log('');
    
    if (allAds && allAds.length > 50) {
      console.log('⚠️  RLS parece estar DESHABILITADO');
      console.log('   Ves más de 50 avisos sin autenticación');
      console.log('   Para re-habilitar, ejecutá: database/DEBUG_DISABLE_RLS.sql');
    } else if (allAds && allAds.length > 0) {
      console.log('✅ RLS probablemente ACTIVO');
      console.log('   Solo ves avisos públicos/permitidos');
    } else {
      console.log('ℹ️  No hay avisos en la base de datos');
    }

  } catch (err) {
    console.log('❌ Error:', err.message);
  }
})();
"@

# Ejecutar desde directorio backend
Set-Location -Path ".\backend"
$nodeScript | node
Set-Location -Path ".."

Write-Host ""
Write-Host "✅ Verificación completa" -ForegroundColor Green
