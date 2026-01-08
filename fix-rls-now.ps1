# ============================================================
# FIX RLS - Arreglar recursión infinita en políticas
# ============================================================

Write-Host "🔧 Rural24 - Fix RLS Policies" -ForegroundColor Cyan
Write-Host ""

# Leer credenciales
$envPath = ".\backend-api\.env.local"
if (-not (Test-Path $envPath)) {
    Write-Host "❌ No se encuentra .env.local en backend-api/" -ForegroundColor Red
    exit 1
}

$env = Get-Content $envPath
$url = ($env | Select-String "SUPABASE_URL=(.*)").Matches.Groups[1].Value
$key = ($env | Select-String "SUPABASE_SERVICE_ROLE_KEY=(.*)").Matches.Groups[1].Value

if (-not $url -or -not $key) {
    Write-Host "❌ No se encontraron credenciales de Supabase" -ForegroundColor Red
    exit 1
}

Write-Host "📡 Conectando a Supabase..." -ForegroundColor Gray
Write-Host "   URL: $url" -ForegroundColor Gray
Write-Host ""

# Leer script SQL
$sqlPath = ".\database\ENABLE_RLS_CORRECTLY.sql"
if (-not (Test-Path $sqlPath)) {
    Write-Host "❌ No se encuentra el archivo SQL: $sqlPath" -ForegroundColor Red
    exit 1
}

$sql = Get-Content $sqlPath -Raw

# Ejecutar SQL
Write-Host "⚡ Ejecutando script RLS..." -ForegroundColor Yellow
Write-Host ""

try {
    $headers = @{
        "apikey"        = $key
        "Authorization" = "Bearer $key"
        "Content-Type"  = "application/json"
        "Prefer"        = "return=representation"
    }

    $restUrl = "$url/rest/v1/rpc/exec_sql"
    
    # Intentar con endpoint RPC si existe
    Write-Host "   Intentando ejecutar SQL..." -ForegroundColor Gray
    
    # Como Supabase no tiene un endpoint directo para ejecutar SQL arbitrario
    # desde la API REST, necesitamos usar el SQL Editor de Supabase Dashboard
    
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Ejecuta este SQL manualmente" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Abre Supabase Dashboard: https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "2. Ve a SQL Editor" -ForegroundColor White
    Write-Host "3. Copia y pega el contenido de:" -ForegroundColor White
    Write-Host "   $sqlPath" -ForegroundColor Cyan
    Write-Host "4. Ejecuta el script completo" -ForegroundColor White
    Write-Host ""
    Write-Host "O ejecuta esto directamente en tu terminal de PostgreSQL:" -ForegroundColor White
    Write-Host ""
    Write-Host "   psql <connection-string> -f $sqlPath" -ForegroundColor Cyan
    Write-Host ""
    
    # Abrir archivo en editor
    Write-Host "¿Quieres abrir el archivo SQL ahora? (S/N): " -NoNewline -ForegroundColor Green
    $respuesta = Read-Host
    
    if ($respuesta -eq "S" -or $respuesta -eq "s") {
        Start-Process notepad.exe $sqlPath
        Write-Host ""
        Write-Host "✅ Archivo abierto en Notepad" -ForegroundColor Green
        Write-Host "   Copia todo el contenido y pégalo en Supabase SQL Editor" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Presiona Enter cuando hayas ejecutado el SQL..." -ForegroundColor Yellow
    Read-Host
    
    Write-Host ""
    Write-Host "✅ Reinicia el frontend para aplicar cambios" -ForegroundColor Green
    Write-Host ""
    
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
