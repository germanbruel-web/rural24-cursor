# Script de diagnóstico de banners
# Ejecutar desde la raíz del proyecto

Write-Host "`n🔍 DIAGNÓSTICO DE BANNERS" -ForegroundColor Cyan
Write-Host "=" * 50

# Leer el archivo .env.local del frontend
$envFile = Get-Content "frontend/.env.local" -ErrorAction SilentlyContinue
if (-not $envFile) {
    $envFile = Get-Content "frontend/.env" -ErrorAction SilentlyContinue
}

$supabaseUrl = ($envFile | Where-Object { $_ -match "VITE_SUPABASE_URL=" }) -replace "VITE_SUPABASE_URL=", ""
$supabaseKey = ($envFile | Where-Object { $_ -match "VITE_SUPABASE_KEY=" }) -replace "VITE_SUPABASE_KEY=", ""

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "❌ No se encontraron las credenciales de Supabase en .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Credenciales encontradas" -ForegroundColor Green
Write-Host "   URL: $($supabaseUrl.Substring(0, 30))..."

# Query para banners_clean
$headers = @{
    "apikey"        = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type"  = "application/json"
}

Write-Host "`n📋 BANNERS EN banners_clean:" -ForegroundColor Yellow
$bannersUrl = "$supabaseUrl/rest/v1/banners_clean?select=id,placement,category,is_active,client_name,carousel_image_url,created_at&order=created_at.desc&limit=10"

try {
    $banners = Invoke-RestMethod -Uri $bannersUrl -Headers $headers -Method Get
    
    if ($banners.Count -eq 0) {
        Write-Host "   ⚠️ No hay banners en la tabla banners_clean" -ForegroundColor Yellow
    }
    else {
        foreach ($b in $banners) {
            $status = if ($b.is_active) { "✅" } else { "❌" }
            $hasImage = if ($b.carousel_image_url) { "🖼️" } else { "⚠️ SIN IMAGEN" }
            Write-Host "   $status [$($b.placement)] $($b.category) - $($b.client_name) $hasImage" -ForegroundColor White
        }
    }
}
catch {
    Write-Host "   ❌ Error consultando banners: $_" -ForegroundColor Red
}

# Query para avisos destacados en Maquinarias
Write-Host "`n📋 AVISOS DESTACADOS EN MAQUINARIAS:" -ForegroundColor Yellow

# Primero obtener el ID de la categoría Maquinarias
$categoriesUrl = "$supabaseUrl/rest/v1/categories?select=id,name,display_name&name=eq.maquinarias"
try {
    $categories = Invoke-RestMethod -Uri $categoriesUrl -Headers $headers -Method Get
    
    if ($categories.Count -gt 0) {
        $maquinariasId = $categories[0].id
        Write-Host "   Categoría ID: $maquinariasId" -ForegroundColor Gray
        
        # Buscar avisos featured en esa categoría
        $adsUrl = "$supabaseUrl/rest/v1/ads?select=id,title,featured,status&category_id=eq.$maquinariasId&featured=eq.true&limit=5"
        $ads = Invoke-RestMethod -Uri $adsUrl -Headers $headers -Method Get
        
        if ($ads.Count -eq 0) {
            Write-Host "   ⚠️ NO HAY AVISOS DESTACADOS (featured=true) en Maquinarias!" -ForegroundColor Red
            Write-Host "   → Esto explica por qué no se muestra la sección de Maquinarias" -ForegroundColor Yellow
        }
        else {
            foreach ($ad in $ads) {
                Write-Host "   ✅ $($ad.title.Substring(0, [Math]::Min(50, $ad.title.Length)))..." -ForegroundColor Green
            }
        }
    }
    else {
        Write-Host "   ❌ No se encontró la categoría 'maquinarias'" -ForegroundColor Red
    }
}
catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
}

Write-Host "`n" + "=" * 50
Write-Host "✨ Diagnóstico completado" -ForegroundColor Cyan
