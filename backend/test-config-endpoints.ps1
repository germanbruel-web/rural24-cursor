# Script para probar los endpoints de configuración creados en Día 2
# Test de los 4 endpoints: categories, brands, models, form

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RURAL24 - Test Config Endpoints Día 2" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api/config"

# ==================== TEST 1: GET /api/config/categories ====================
Write-Host "[1/4] Testing GET /api/config/categories" -ForegroundColor Yellow
Write-Host "--------------------------------------"
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/categories" -Method Get -ErrorAction Stop
    Write-Host "✓ Success! Found $($response.categories.Count) categories" -ForegroundColor Green
    
    # Mostrar primera categoría y subcategoría
    if ($response.categories.Count -gt 0) {
        $firstCat = $response.categories[0]
        $subCount = $firstCat.subcategories.Count
        Write-Host "  Example: $($firstCat.display_name) - $subCount subcategories"
        
        # Guardar una subcategoryId para tests posteriores
        if ($firstCat.subcategories.Count -gt 0) {
            $testSubcategoryId = $firstCat.subcategories[0].id
            $testSubcategoryName = $firstCat.subcategories[0].display_name
            Write-Host "  Using subcategory: $testSubcategoryName" -ForegroundColor Cyan
            Write-Host "  ID: $testSubcategoryId" -ForegroundColor DarkGray
        }
    }
}
catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    $testSubcategoryId = $null
}
Write-Host ""

# ==================== TEST 2: GET /api/config/brands ====================
Write-Host "[2/4] Testing GET /api/config/brands?subcategoryId=..." -ForegroundColor Yellow
Write-Host "--------------------------------------"
if ($testSubcategoryId) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/brands?subcategoryId=$testSubcategoryId" -Method Get -ErrorAction Stop
        Write-Host "✓ Success! Found $($response.brands.Count) brands for $testSubcategoryName" -ForegroundColor Green
        
        # Mostrar primeras 3 marcas
        if ($response.brands.Count -gt 0) {
            $brandNames = $response.brands[0..2] | ForEach-Object { $_.name }
            Write-Host "  Examples: $($brandNames -join ', ')"
            
            # Guardar una brandId para test de models
            $testBrandId = $response.brands[0].id
            $testBrandName = $response.brands[0].name
        }
    }
    catch {
        Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        $testBrandId = $null
    }
}
else {
    Write-Host "⊘ Skipped (no subcategoryId available)" -ForegroundColor Gray
}
Write-Host ""

# ==================== TEST 3: GET /api/config/models ====================
Write-Host "[3/4] Testing GET /api/config/models?brandId=..." -ForegroundColor Yellow
Write-Host "--------------------------------------"
if ($testBrandId) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/models?brandId=$testBrandId" -Method Get -ErrorAction Stop
        Write-Host "✓ Success! Found $($response.models.Count) models for $testBrandName" -ForegroundColor Green
        
        # Mostrar primeros 3 modelos
        if ($response.models.Count -gt 0) {
            $modelNames = $response.models[0..2] | ForEach-Object { $_.name }
            Write-Host "  Examples: $($modelNames -join ', ')"
        }
    }
    catch {
        Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
else {
    Write-Host "⊘ Skipped (no brandId available)" -ForegroundColor Gray
}
Write-Host ""

# ==================== TEST 4: GET /api/config/form/[subcategoryId] ====================
Write-Host "[4/4] Testing GET /api/config/form/[subcategoryId]" -ForegroundColor Yellow
Write-Host "--------------------------------------"
if ($testSubcategoryId) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/form/$testSubcategoryId" -Method Get -ErrorAction Stop
        Write-Host "✓ Success! Form config for $($response.subcategory_name)" -ForegroundColor Green
        Write-Host "  - Requires Brand: $($response.requires_brand)"
        Write-Host "  - Requires Model: $($response.requires_model)"
        Write-Host "  - Requires Year: $($response.requires_year)"
        Write-Host "  - Requires Condition: $($response.requires_condition)"
        Write-Host "  - Dynamic Attributes: $($response.dynamic_attributes.Count) fields"
        
        # Agrupar por field_group
        if ($response.dynamic_attributes.Count -gt 0) {
            $groups = $response.dynamic_attributes | Group-Object -Property field_group
            Write-Host "  - Field Groups:" -ForegroundColor Cyan
            foreach ($group in $groups) {
                Write-Host "    · $($group.Name): $($group.Count) fields"
            }
        }
    }
    catch {
        Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
else {
    Write-Host "⊘ Skipped (no subcategoryId available)" -ForegroundColor Gray
}
Write-Host ""

# ==================== RESUMEN ====================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test completed!" -ForegroundColor Green
Write-Host "All 4 config endpoints are now available:" -ForegroundColor White
Write-Host "  1. GET /api/config/categories" -ForegroundColor White
Write-Host "  2. GET /api/config/brands?subcategoryId=<uuid>" -ForegroundColor White
Write-Host "  3. GET /api/config/models?brandId=<uuid>" -ForegroundColor White
Write-Host "  4. GET /api/config/form/[subcategoryId]" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
