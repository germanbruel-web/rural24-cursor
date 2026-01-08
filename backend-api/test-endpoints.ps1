# Rural24 API - Endpoint Testing Script
$baseUrl = "http://localhost:3000"
$testsPassed = 0
$testsFailed = 0

Write-Host "`n========================================"
Write-Host "  Rural24 API - Endpoint Testing"
Write-Host "========================================`n"

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null
    )
    
    try {
        Write-Host "[TEST] $Name"
        Write-Host "  URL: $Url"
        
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        
        Write-Host "  [OK] Status: 200"
        Write-Host "  Response:"
        $response | ConvertTo-Json -Depth 3 | Write-Host
        Write-Host ""
        
        $script:testsPassed++
        return $true
    }
    catch {
        Write-Host "  [FAIL] Error: $($_.Exception.Message)"
        Write-Host ""
        $script:testsFailed++
        return $false
    }
}

# Test 1: Health Check
Test-Endpoint -Name "Health Check" -Url "$baseUrl/api/health"

# Test 2: Get Categories
Test-Endpoint -Name "Get Categories" -Url "$baseUrl/api/config/categories"

# Test 3: Get Brands for Tractores
$tractoresId = "d290f1ee-6c54-4b01-90e6-d701748f0851"
Test-Endpoint -Name "Get Brands (tractores)" -Url "$baseUrl/api/config/brands?subcategoryId=$tractoresId"

# Test 4: Get Models for John Deere
$johnDeereId = "550e8400-e29b-41d4-a716-446655440004"
Test-Endpoint -Name "Get Models (John Deere)" -Url "$baseUrl/api/config/models?brandId=$johnDeereId"

# Test 5: Get Form Config for Tractores
Test-Endpoint -Name "Get Form Config (tractores)" -Url "$baseUrl/api/config/form/$tractoresId"

# Test 6: List Ads
Test-Endpoint -Name "List Ads" -Url "$baseUrl/api/ads"

# Test 7: List Active Ads
Test-Endpoint -Name "List Active Ads" -Url "$baseUrl/api/ads?status=active"

# Summary
Write-Host "========================================"
Write-Host "  Test Results Summary"
Write-Host "========================================"
Write-Host "  Passed: $testsPassed"
Write-Host "  Failed: $testsFailed"
Write-Host "========================================`n"

if ($testsFailed -gt 0) {
    Write-Host "Warning: Some tests failed"
    exit 1
} else {
    Write-Host "Success: All tests passed!"
    exit 0
}
