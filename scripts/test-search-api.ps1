# Script para probar el API de búsqueda de Rural24
# ====================================================================
# Verifica que el backend responda correctamente a búsquedas
# ====================================================================

$ErrorActionPreference = "Stop"

# Colores para output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Fail { Write-Host $args -ForegroundColor Red }

# Configuración
$BACKEND_URL = "http://localhost:3001"
# Para producción: https://rural24-backend.onrender.com
# $BACKEND_URL = "https://rural24-backend.onrender.com"

Write-Info "==================================================="
Write-Info "🔍 TEST: Backend Search API - Rural24"
Write-Info "==================================================="
Write-Info "Backend URL: $BACKEND_URL"
Write-Info ""

# ====================================================================
# TEST 1: Health Check
# ====================================================================
Write-Info "TEST 1: Health Check..."
try {
    $url = "$BACKEND_URL/api/health"
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Success "[OK] Backend esta ACTIVO (200 OK)"
    } else {
        Write-Warning "[!] Backend respondio con codigo $($response.StatusCode)"
    }
} catch {
    Write-Fail "[ERROR] Backend NO RESPONDE"
    Write-Fail "   Error: $($_.Exception.Message)"
    Write-Warning "   Asegurate de que el backend este corriendo en $BACKEND_URL"
    exit 1
}
Write-Info ""

# ====================================================================
# TEST 2: Búsqueda sin filtros (todos los avisos activos)
# ====================================================================
Write-Info "TEST 2: Busqueda sin filtros (todos los avisos activos)..."
try {
    $url = "$BACKEND_URL/api/ads/search?status=active&approval_status=approved&limit=5"
    $response = Invoke-RestMethod -Uri $url -Method Get
    $total = $response.pagination.total
    $count = $response.data.Count
    
    Write-Success "✅ Búsqueda sin filtros OK"
    Write-Info "   Total avisos: $total"
    Write-Info "   Avisos devueltos: $count"
    
    if ($count -gt 0) {
        $firstAd = $response.data[0]
        Write-Info "   Ejemplo: $($firstAd.title) - ($($firstAd.category)/$($firstAd.subcategory))"
    }
} catch {
    Write-Fail "❌ Búsqueda sin filtros FALLÓ"
    Write-Fail "   Error: $($_.Exception.Message)"
}
Write-Info ""

# ====================================================================
# TEST 3: Búsqueda por categoría (slug)
# ====================================================================
Write-Info "TEST 3: Búsqueda por categoría (cat=maquinarias)..."
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/ads/search?cat=maquinarias&status=active&approval_status=approved&limit=5" -Method Get
    $total = $response.pagination.total
    $count = $response.data.Count
    
    Write-Success "✅ Búsqueda por categoría OK"
    Write-Info "   Total en Maquinarias: $total"
    Write-Info "   Avisos devueltos: $count"
    
    if ($count -gt 0) {
        $firstAd = $response.data[0]
        Write-Info "   Ejemplo: $($firstAd.title)"
    }
} catch {
    Write-Fail "❌ Búsqueda por categoría FALLÓ"
    Write-Fail "   Error: $($_.Exception.Message)"
}
Write-Info ""

# ====================================================================
# TEST 4: Búsqueda por subcategoría (cat + sub)
# ====================================================================
Write-Info "TEST 4: Búsqueda por subcategoría (cat=maquinarias&sub=tractores)..."
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/ads/search?cat=maquinarias&sub=tractores&status=active&approval_status=approved&limit=5" -Method Get
    $total = $response.pagination.total
    $count = $response.data.Count
    
    Write-Success "✅ Búsqueda por subcategoría OK"
    Write-Info "   Total en Tractores: $total"
    Write-Info "   Avisos devueltos: $count"
    
    if ($count -gt 0) {
        $firstAd = $response.data[0]
        Write-Info "   Ejemplo: $($firstAd.title)"
        if ($firstAd.brand) {
            Write-Info "   Marca: $($firstAd.brand)"
        }
    }
} catch {
    Write-Fail "❌ Búsqueda por subcategoría FALLÓ"
    Write-Fail "   Error: $($_.Exception.Message)"
}
Write-Info ""

# ====================================================================
# TEST 5: Búsqueda por provincia
# ====================================================================
Write-Info "TEST 5: Búsqueda por provincia (prov=buenos-aires)..."
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/ads/search?prov=buenos-aires&status=active&approval_status=approved&limit=5" -Method Get
    $total = $response.pagination.total
    $count = $response.data.Count
    
    Write-Success "✅ Búsqueda por provincia OK"
    Write-Info "   Total en Buenos Aires: $total"
    Write-Info "   Avisos devueltos: $count"
    
    if ($count -gt 0) {
        $firstAd = $response.data[0]
        Write-Info "   Ejemplo: $($firstAd.title) - $($firstAd.location), $($firstAd.province)"
    }
} catch {
    Write-Fail "❌ Búsqueda por provincia FALLÓ"
    Write-Fail "   Error: $($_.Exception.Message)"
}
Write-Info ""

# ====================================================================
# TEST 6: Búsqueda por texto (detección inteligente)
# ====================================================================
Write-Info "TEST 6: Búsqueda inteligente (search=tractor)..."
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/ads/search?search=tractor&status=active&approval_status=approved&limit=5" -Method Get
    $total = $response.pagination.total
    $count = $response.data.Count
    
    Write-Success "✅ Búsqueda inteligente OK"
    Write-Info "   Total con 'tractor': $total"
    Write-Info "   Avisos devueltos: $count"
    
    # Verificar si detectó subcategoría automáticamente
    if ($response.meta -and $response.meta.detected_from_search) {
        Write-Success "   🎯 Detección automática: $($response.meta.category)/$($response.meta.subcategory)"
    }
    
    if ($count -gt 0) {
        $firstAd = $response.data[0]
        Write-Info "   Ejemplo: $($firstAd.title)"
    }
} catch {
    Write-Fail "❌ Búsqueda inteligente FALLÓ"
    Write-Fail "   Error: $($_.Exception.Message)"
}
Write-Info ""

# ====================================================================
# TEST 7: Búsqueda con atributos dinámicos (marca)
# ====================================================================
Write-Info "TEST 7: Búsqueda con atributo dinámico (cat=maquinarias&attr_marca=john-deere)..."
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/ads/search?cat=maquinarias&attr_marca=john-deere&status=active&approval_status=approved&limit=5" -Method Get
    $total = $response.pagination.total
    $count = $response.data.Count
    
    Write-Success "✅ Búsqueda con atributo dinámico OK"
    Write-Info "   Total con marca John Deere: $total"
    Write-Info "   Avisos devueltos: $count"
    
    if ($count -gt 0) {
        $firstAd = $response.data[0]
        Write-Info "   Ejemplo: $($firstAd.title)"
        if ($firstAd.brand) {
            Write-Info "   Marca detectada: $($firstAd.brand)"
        }
    }
} catch {
    Write-Fail "❌ Búsqueda con atributo dinámico FALLÓ"
    Write-Fail "   Error: $($_.Exception.Message)"
}
Write-Info ""

# ====================================================================
# TEST 8: Paginación
# ====================================================================
Write-Info "TEST 8: Paginación (page=1&limit=10)..."
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/ads/search?status=active&approval_status=approved&page=1&limit=10" -Method Get
    
    Write-Success "✅ Paginación OK"
    Write-Info "   Página actual: $($response.pagination.page)"
    Write-Info "   Total páginas: $($response.pagination.totalPages)"
    Write-Info "   Total avisos: $($response.pagination.total)"
    Write-Info "   Hay más páginas: $($response.pagination.hasMore)"
} catch {
    Write-Fail "❌ Paginación FALLÓ"
    Write-Fail "   Error: $($_.Exception.Message)"
}
Write-Info ""

# ====================================================================
# RESUMEN FINAL
# ====================================================================
Write-Info "==================================================="
Write-Success "✅ TESTS COMPLETADOS"
Write-Info "==================================================="
Write-Info ""
Write-Info "📘 CÓMO FUNCIONA EL API DE BÚSQUEDA:"
Write-Info ""
Write-Info "Endpoint: $BACKEND_URL/api/ads/search"
Write-Info ""
Write-Info "Parámetros disponibles:"
Write-Info "  • cat          - Categoría (slug): maquinarias, ganaderia, inmuebles, etc."
Write-Info "  • sub          - Subcategoría (slug): tractores, bovinos, campos, etc."
Write-Info "  • prov         - Provincia (slug): buenos-aires, cordoba, santa-fe, etc."
Write-Info "  • city         - Ciudad/Localidad (slug)"
Write-Info "  • search       - Búsqueda de texto libre (detecta automáticamente)"
Write-Info "  • min_price    - Precio mínimo"
Write-Info "  • max_price    - Precio máximo"
Write-Info "  • attr_*       - Atributos dinámicos (attr_marca, attr_modelo, etc.)"
Write-Info "  • page         - Número de página (default: 1)"
Write-Info "  • limit        - Avisos por página (default: 20)"
Write-Info "  • status       - Estado (active, inactive, deleted)"
Write-Info "  • approval_status - Estado aprobación (approved, pending, rejected)"
Write-Info ""
Write-Info "Ejemplos de uso:"
Write-Info "  1. Todos los tractores:"
Write-Info "     $BACKEND_URL/api/ads/search?cat=maquinarias&sub=tractores"
Write-Info ""
Write-Info "  2. Tractores John Deere en Buenos Aires:"
Write-Info "     $BACKEND_URL/api/ads/search?cat=maquinarias&sub=tractores&attr_marca=john-deere&prov=buenos-aires"
Write-Info ""
Write-Info "  3. Búsqueda inteligente (detecta categoría):"
Write-Info "     $BACKEND_URL/api/ads/search?search=tractor"
Write-Info ""
Write-Info "  4. Inmuebles con rango de precio:"
Write-Info "     $BACKEND_URL/api/ads/search?cat=inmuebles&min_price=100000&max_price=500000"
Write-Info ""
Write-Info "Respuesta JSON:"
Write-Info "  {
    data: [...],          // Array de avisos
    pagination: {
      total: 156,         // Total de avisos
      page: 1,           // Página actual
      limit: 20,         // Avisos por página
      totalPages: 8,     // Total de páginas
      hasMore: true      // Hay más páginas
    },
    meta: {              // Metadata de búsqueda inteligente
      detected_from_search: true,
      category: 'Maquinarias',
      subcategory: 'Tractores',
      category_id: '...',
      subcategory_id: '...'
    }
  }"
Write-Info ""
Write-Info "==================================================="
