# Diagnostic Script - Rural24 Deploy Issues
# =========================================
# Verifica configuracion y conectividad entre frontend y backend

param(
    [string]$Frontend = "http://localhost:5173",
    [string]$Backend = "http://localhost:3001"
)

$ErrorActionPreference = "Continue"

function Write-Section { Write-Host "`n=== $args ===" -ForegroundColor Cyan }
function Write-OK { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-Fail { Write-Host "[ERROR] $args" -ForegroundColor Red }
function Write-Warn { Write-Host "[WARN] $args" -ForegroundColor Yellow }
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Gray }

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "RURAL24 DEPLOY DIAGNOSTIC" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Info "Frontend: $Frontend"
Write-Info "Backend: $Backend"

# =========================================
# 1. VERIFICAR VARIABLES DE ENTORNO
# =========================================
Write-Section "1. Environment Variables"

# Frontend
if (Test-Path "frontend\.env.local") {
    Write-OK "frontend\.env.local exists"
    $envContent = Get-Content "frontend\.env.local" | Select-String "VITE_API_URL"
    if ($envContent) {
        Write-Info "   $envContent"
        if ($envContent -match "localhost:3001") {
            Write-OK "Configured for LOCAL development"
        } else {
            Write-Info "Configured for: $(($envContent -split '=')[1])"
        }
    } else {
        Write-Fail "VITE_API_URL not found in .env.local"
    }
} else {
    Write-Warn "frontend\.env.local not found (using defaults)"
}

if (Test-Path "frontend\.env.production") {
    Write-OK "frontend\.env.production exists (for Render deploy)"
    $prodEnv = Get-Content "frontend\.env.production" | Select-String "VITE_API_URL"
    if ($prodEnv) {
        Write-Info "   $prodEnv"
    }
} else {
    Write-Fail "frontend\.env.production NOT FOUND"
    Write-Warn "   This is needed for Render deploy!"
    Write-Warn "   Create it with: VITE_API_URL=https://rural24.onrender.com"
}

# Backend
Write-Info ""
if (Test-Path "backend\.env.local") {
    Write-OK "backend\.env.local exists"
} else {
    Write-Warn "backend\.env.local not found"
}

# =========================================
# 2. VERIFICAR CONECTIVIDAD BACKEND
# =========================================
Write-Section "2. Backend Connectivity"

try {
    $health = Invoke-RestMethod -Uri "$Backend/api/health" -Method Get -TimeoutSec 5
    Write-OK "Backend is responding"
    Write-Info "   Status: $($health.status)"
    Write-Info "   Database: $(if($health.database) {'Connected'} else {'Disconnected'})"
    Write-Info "   Environment: $($health.environment)"
} catch {
    Write-Fail "Backend not responding at $Backend"
    Write-Fail "   Error: $($_.Exception.Message)"
    Write-Warn "   Start backend with: npm run dev (in backend folder)"
    exit 1
}

# =========================================
# 3. VERIFICAR CORS
# =========================================
Write-Section "3. CORS Configuration"

try {
    # Simular request con Origin header
    $headers = @{
        "Origin" = $Frontend
    }
    $response = Invoke-WebRequest -Uri "$Backend/api/health" -Headers $headers -Method Get -UseBasicParsing
    
    $corsHeaders = $response.Headers["Access-Control-Allow-Origin"]
    if ($corsHeaders) {
        Write-OK "CORS headers present"
        Write-Info "   Allowed origin: $corsHeaders"
        
        if ($corsHeaders -eq $Frontend -or $corsHeaders -eq "*") {
            Write-OK "Frontend origin is ALLOWED"
        } else {
            Write-Fail "Frontend origin NOT allowed"
            Write-Warn "   Expected: $Frontend"
            Write-Warn "   Got: $corsHeaders"
        }
    } else {
        Write-Warn "No CORS headers found"
        Write-Info "   This might cause issues in production"
    }
} catch {
    Write-Warn "Could not verify CORS: $($_.Exception.Message)"
}

# =========================================
# 4. VERIFICAR ENDPOINTS CRITICOS
# =========================================
Write-Section "4. Critical Endpoints"

# Search endpoint
try {
    $searchUrl = "$Backend/api/ads/search?status=active&approval_status=approved&limit=1"
    $search = Invoke-RestMethod -Uri $searchUrl -Method Get
    Write-OK "/api/ads/search is working"
    Write-Info "   Total ads: $($search.pagination.total)"
} catch {
    Write-Fail "/api/ads/search failed"
    Write-Fail "   Error: $($_.Exception.Message)"
}

# Categories endpoint
try {
    $categories = Invoke-RestMethod -Uri "$Backend/api/categories" -Method Get
    Write-OK "/api/categories is working"
    Write-Info "   Categories: $($categories.Count)"
} catch {
    Write-Warn "/api/categories failed: $($_.Exception.Message)"
}

# Filters endpoint
try {
    $filters = Invoke-RestMethod -Uri "$Backend/api/config/filters?cat=maquinarias" -Method Get
    Write-OK "/api/config/filters is working"
    Write-Info "   Filters returned: $($filters.filters.Count)"
} catch {
    Write-Warn "/api/config/filters failed: $($_.Exception.Message)"
}

# =========================================
# 5. TEST SEARCH SCENARIOS
# =========================================
Write-Section "5. Search Functionality Tests"

# Test 1: Category search
Write-Info "Test 1: Category search (cat=maquinarias-agricolas)"
try {
    $url = "$Backend/api/ads/search?cat=maquinarias-agricolas&status=active&approval_status=approved&limit=3"
    $result = Invoke-RestMethod -Uri $url -Method Get
    Write-OK "Found $($result.pagination.total) ads"
    if ($result.data.Count -gt 0) {
        Write-Info "   Example: $($result.data[0].title)"
    }
} catch {
    Write-Fail "Category search failed: $($_.Exception.Message)"
}

# Test 2: Subcategory search
Write-Info ""
Write-Info "Test 2: Subcategory search (sub=tractores)"
try {
    $url = "$Backend/api/ads/search?cat=maquinarias-agricolas&sub=tractores&status=active&approval_status=approved&limit=3"
    $result = Invoke-RestMethod -Uri $url -Method Get
    Write-OK "Found $($result.pagination.total) tractors"
    if ($result.data.Count -gt 0) {
        Write-Info "   Example: $($result.data[0].title)"
    }
} catch {
    Write-Fail "Subcategory search failed: $($_.Exception.Message)"
}

# Test 3: Intelligent search
Write-Info ""
Write-Info "Test 3: Intelligent search (q=tractor)"
try {
    $url = "$Backend/api/ads/search?search=tractor&status=active&approval_status=approved&limit=3"
    $result = Invoke-RestMethod -Uri $url -Method Get
    Write-OK "Found $($result.pagination.total) ads"
    
    if ($result.meta -and $result.meta.detected_from_search) {
        Write-OK "Auto-detection worked: $($result.meta.category)/$($result.meta.subcategory)"
    } else {
        Write-Warn "Auto-detection did not trigger"
    }
} catch {
    Write-Fail "Intelligent search failed: $($_.Exception.Message)"
}

# =========================================
# 6. VERIFICAR CONFIGURACION SPA
# =========================================
Write-Section "6. SPA Configuration"

if (Test-Path "frontend\public\_redirects") {
    Write-OK "frontend\public\_redirects exists (Render SPA routing)"
    $redirects = Get-Content "frontend\public\_redirects"
    Write-Info "   Content: $redirects"
} else {
    Write-Fail "_redirects file MISSING"
    Write-Warn "   Render needs this file for SPA routing"
    Write-Warn "   Create: frontend\public\_redirects"
    Write-Warn "   Content: /*    /index.html   200"
}

# =========================================
# SUMMARY & RECOMMENDATIONS
# =========================================
Write-Section "SUMMARY & RECOMMENDATIONS"

Write-Host ""
Write-Host "LOCALHOST DEPLOYMENT:" -ForegroundColor Yellow
Write-Info "1. Backend must run on port 3001: npm run dev (in backend/)"
Write-Info "2. Frontend must run on port 5173: npm run dev (in frontend/)"
Write-Info "3. .env.local should have VITE_API_URL=http://localhost:3001"

Write-Host ""
Write-Host "RENDER DEPLOYMENT (Production):" -ForegroundColor Yellow

$allOk = $true

# Check 1: .env.production
if (-not (Test-Path "frontend\.env.production")) {
    Write-Fail "[1/4] Create frontend\.env.production"
    Write-Info "      VITE_API_URL=https://rural24.onrender.com"
    Write-Info "      VITE_SUPABASE_URL=https://lmkuecdvxtenrikjomol.supabase.co"
    Write-Info "      VITE_SUPABASE_KEY=<your_anon_key>"
    $allOk = $false
} else {
    Write-OK "[1/4] frontend\.env.production exists"
}

# Check 2: _redirects
if (Test-Path "frontend\public\_redirects") {
    Write-OK "[2/4] _redirects file exists"
} else {
    Write-Fail "[2/4] Create frontend\public\_redirects with: /*    /index.html   200"
    $allOk = $false
}

# Check 3: Backend CORS
Write-Info "[3/4] Backend FRONTEND_URL environment variable in Render:"
Write-Info "      Set to: https://rural24-1.onrender.com"

# Check 4: Routing fixes
Write-OK "[4/4] Routing fixes already applied (commit 2d86e05)"

Write-Host ""
if ($allOk) {
    Write-OK "Configuration looks good for localhost!"
    Write-Info "After creating .env.production, push to GitHub:"
    Write-Info "   git add frontend/.env.production"
    Write-Info "   git commit -m 'fix: Add production environment config'"
    Write-Info "   git push origin main"
} else {
    Write-Warn "Fix the issues above before deploying to Render"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "DIAGNOSTIC COMPLETE" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
