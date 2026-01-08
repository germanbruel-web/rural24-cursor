# Test Config Endpoints - Día 2

$baseUrl = "http://localhost:3000/api/config"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RURAL24 - Test Config Endpoints" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# TEST 1: Categories
Write-Host "[1/4] Testing categories..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/categories" -Method Get
    Write-Host "  SUCCESS: Found $($response.categories.Count) categories" -ForegroundColor Green
    
    $firstCat = $response.categories[0]
    $firstSub = $firstCat.subcategories[0]
    
    $script:testSubcategoryId = $firstSub.id
    $script:testSubcategoryName = $firstSub.display_name
    
    Write-Host "  Test subcategory: $testSubcategoryName" -ForegroundColor Cyan
}
catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# TEST 2: Brands
Write-Host "[2/4] Testing brands..." -ForegroundColor Yellow
if ($testSubcategoryId) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/brands?subcategoryId=$testSubcategoryId" -Method Get
        Write-Host "  SUCCESS: Found $($response.brands.Count) brands" -ForegroundColor Green
        
        if ($response.brands.Count -gt 0) {
            $script:testBrandId = $response.brands[0].id
            $script:testBrandName = $response.brands[0].name
            Write-Host "  Test brand: $testBrandName" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}
else {
    Write-Host "  SKIPPED" -ForegroundColor Gray
}
Write-Host ""

# TEST 3: Models
Write-Host "[3/4] Testing models..." -ForegroundColor Yellow
if ($testBrandId) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/models?brandId=$testBrandId" -Method Get
        Write-Host "  SUCCESS: Found $($response.models.Count) models" -ForegroundColor Green
    }
    catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}
else {
    Write-Host "  SKIPPED" -ForegroundColor Gray
}
Write-Host ""

# TEST 4: Form Config
Write-Host "[4/4] Testing form config..." -ForegroundColor Yellow
if ($testSubcategoryId) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/form/$testSubcategoryId" -Method Get
        Write-Host "  SUCCESS: Form for $($response.subcategory_name)" -ForegroundColor Green
        Write-Host "    - Requires Brand: $($response.requires_brand)"
        Write-Host "    - Requires Model: $($response.requires_model)"
        Write-Host "    - Dynamic Attributes: $($response.dynamic_attributes.Count)"
    }
    catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}
else {
    Write-Host "  SKIPPED" -ForegroundColor Gray
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All tests completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
