# Test Backend Search API - Rural24
# Simple script to verify search functionality

$BACKEND_URL = "http://localhost:3001"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Backend Search API Test" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "TEST 1: Health Check..." -ForegroundColor Yellow
try {
    $url = "$BACKEND_URL/api/health"
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing
    Write-Host "[OK] Backend is running - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Backend is not responding" -ForegroundColor Red
    Write-Host "Make sure backend is running at $BACKEND_URL" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Search all ads
Write-Host "TEST 2: Search all active ads..." -ForegroundColor Yellow
try {
    $url = "$BACKEND_URL/api/ads/search?status=active&approval_status=approved&limit=5"
    $response = Invoke-RestMethod -Uri $url -Method Get
    $total = $response.pagination.total
    $count = $response.data.Count
    
    Write-Host "[OK] Found $total total ads, returned $count" -ForegroundColor Green
    if ($count -gt 0) {
        $ad = $response.data[0]
        Write-Host "   Example: $($ad.title) - $($ad.category)/$($ad.subcategory)" -ForegroundColor Gray
    }
} catch {
    Write-Host "[ERROR] Search failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Search by category
Write-Host "TEST 3: Search by category (maquinarias)..." -ForegroundColor Yellow
try {
    $url = "$BACKEND_URL/api/ads/search?cat=maquinarias&status=active&approval_status=approved&limit=5"
    $response = Invoke-RestMethod -Uri $url -Method Get
    $total = $response.pagination.total
    $count = $response.data.Count
    
    Write-Host "[OK] Found $total ads in Maquinarias, returned $count" -ForegroundColor Green
    if ($count -gt 0) {
        $ad = $response.data[0]
        Write-Host "   Example: $($ad.title)" -ForegroundColor Gray
        if ($ad.brand) {
            Write-Host "   Brand: $($ad.brand)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "[ERROR] Search by category failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Search by subcategory
Write-Host "TEST 4: Search by subcategory (tractores)..." -ForegroundColor Yellow
try {
    $url = "$BACKEND_URL/api/ads/search?cat=maquinarias&sub=tractores&status=active&approval_status=approved&limit=5"
    $response = Invoke-RestMethod -Uri $url -Method Get
    $total = $response.pagination.total
    $count = $response.data.Count
    
    Write-Host "[OK] Found $total tractors, returned $count" -ForegroundColor Green
    if ($count -gt 0) {
        $ad = $response.data[0]
        Write-Host "   Example: $($ad.title)" -ForegroundColor Gray
        if ($ad.brand) {
            Write-Host "   Brand: $($ad.brand)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "[ERROR] Search by subcategory failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Search by province
Write-Host "TEST 5: Search by province (buenos-aires)..." -ForegroundColor Yellow
try {
    $url = "$BACKEND_URL/api/ads/search?prov=buenos-aires&status=active&approval_status=approved&limit=5"
    $response = Invoke-RestMethod -Uri $url -Method Get
    $total = $response.pagination.total
    $count = $response.data.Count
    
    Write-Host "[OK] Found $total ads in Buenos Aires, returned $count" -ForegroundColor Green
    if ($count -gt 0) {
        $ad = $response.data[0]
        Write-Host "   Example: $($ad.title) - $($ad.location)" -ForegroundColor Gray
    }
} catch {
    Write-Host "[ERROR] Search by province failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Intelligent search (auto-detect category)
Write-Host "TEST 6: Intelligent search (search=tractor)..." -ForegroundColor Yellow
try {
    $url = "$BACKEND_URL/api/ads/search?search=tractor&status=active&approval_status=approved&limit=5"
    $response = Invoke-RestMethod -Uri $url -Method Get
    $total = $response.pagination.total
    $count = $response.data.Count
    
    Write-Host "[OK] Found $total ads with 'tractor', returned $count" -ForegroundColor Green
    
    if ($response.meta -and $response.meta.detected_from_search) {
        Write-Host "   [AUTO-DETECTED] $($response.meta.category)/$($response.meta.subcategory)" -ForegroundColor Magenta
    }
    
    if ($count -gt 0) {
        $ad = $response.data[0]
        Write-Host "   Example: $($ad.title)" -ForegroundColor Gray
    }
} catch {
    Write-Host "[ERROR] Intelligent search failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7: Search with dynamic attributes
Write-Host "TEST 7: Search with dynamic attribute (marca=john-deere)..." -ForegroundColor Yellow
try {
    $url = "$BACKEND_URL/api/ads/search?cat=maquinarias&attr_marca=john-deere&status=active&approval_status=approved&limit=5"
    $response = Invoke-RestMethod -Uri $url -Method Get
    $total = $response.pagination.total
    $count = $response.data.Count
    
    Write-Host "[OK] Found $total John Deere machines, returned $count" -ForegroundColor Green
    if ($count -gt 0) {
        $ad = $response.data[0]
        Write-Host "   Example: $($ad.title)" -ForegroundColor Gray
        if ($ad.brand) {
            Write-Host "   Brand: $($ad.brand)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "[ERROR] Search with attribute failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 8: Pagination
Write-Host "TEST 8: Pagination (page=1, limit=10)..." -ForegroundColor Yellow
try {
    $url = "$BACKEND_URL/api/ads/search?status=active&approval_status=approved&page=1&limit=10"
    $response = Invoke-RestMethod -Uri $url -Method Get
    
    Write-Host "[OK] Pagination working" -ForegroundColor Green
    Write-Host "   Current page: $($response.pagination.page)" -ForegroundColor Gray
    Write-Host "   Total pages: $($response.pagination.totalPages)" -ForegroundColor Gray
    Write-Host "   Total ads: $($response.pagination.total)" -ForegroundColor Gray
    Write-Host "   Has more: $($response.pagination.hasMore)" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Pagination test failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "TESTS COMPLETED" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "HOW THE SEARCH API WORKS:" -ForegroundColor White
Write-Host ""
Write-Host "Endpoint: $BACKEND_URL/api/ads/search" -ForegroundColor White
Write-Host ""
Write-Host "Available parameters:" -ForegroundColor White
Write-Host "  cat          - Category slug (maquinarias, ganaderia, etc.)" -ForegroundColor Gray
Write-Host "  sub          - Subcategory slug (tractores, bovinos, etc.)" -ForegroundColor Gray
Write-Host "  prov         - Province slug (buenos-aires, cordoba, etc.)" -ForegroundColor Gray
Write-Host "  city         - City slug" -ForegroundColor Gray
Write-Host "  search       - Free text search (auto-detects category)" -ForegroundColor Gray
Write-Host "  min_price    - Minimum price" -ForegroundColor Gray
Write-Host "  max_price    - Maximum price" -ForegroundColor Gray
Write-Host "  attr_*       - Dynamic attributes (attr_marca, attr_modelo)" -ForegroundColor Gray
Write-Host "  page         - Page number (default: 1)" -ForegroundColor Gray
Write-Host "  limit        - Ads per page (default: 20)" -ForegroundColor Gray
Write-Host "  status       - Status filter (active, inactive, deleted)" -ForegroundColor Gray
Write-Host "  approval_status - Approval filter (approved, pending, rejected)" -ForegroundColor Gray
Write-Host ""
Write-Host "Examples:" -ForegroundColor White
Write-Host "  1. All tractors:" -ForegroundColor Yellow
Write-Host "     $BACKEND_URL/api/ads/search?cat=maquinarias&sub=tractores" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. John Deere tractors in Buenos Aires:" -ForegroundColor Yellow
Write-Host "     $BACKEND_URL/api/ads/search?cat=maquinarias&sub=tractores&attr_marca=john-deere&prov=buenos-aires" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Intelligent search (auto-detects):" -ForegroundColor Yellow
Write-Host "     $BACKEND_URL/api/ads/search?search=tractor" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Real estate with price range:" -ForegroundColor Yellow
Write-Host "     $BACKEND_URL/api/ads/search?cat=inmuebles&min_price=100000&max_price=500000" -ForegroundColor Gray
Write-Host ""
