# Script de Performance Audit
# ============================
# Analiza bundle size, lighthouse scores, y recursos

param(
    [string]$Url = "http://localhost:5173",
    [switch]$Production
)

$ErrorActionPreference = "Continue"

function Write-Section { Write-Host "`n=== $args ===" -ForegroundColor Cyan }
function Write-OK { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-Fail { Write-Host "[ERROR] $args" -ForegroundColor Red }
function Write-Warn { Write-Host "[WARN] $args" -ForegroundColor Yellow }
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Gray }

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "RURAL24 PERFORMANCE AUDIT" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# ===========================================
# 1. BUNDLE SIZE ANALYSIS
# ===========================================
Write-Section "1. Bundle Size Analysis"

if (Test-Path "frontend\dist") {
    Write-OK "Build exists in frontend\dist"
    
    $jsFiles = Get-ChildItem -Path "frontend\dist\assets" -Filter "*.js" -Recurse
    $cssFiles = Get-ChildItem -Path "frontend\dist\assets" -Filter "*.css" -Recurse
    
    $totalJsSize = ($jsFiles | Measure-Object -Property Length -Sum).Sum
    $totalCssSize = ($cssFiles | Measure-Object -Property Length -Sum).Sum
    
    Write-Info "JavaScript: $([math]::Round($totalJsSize / 1KB, 2)) KB"
    Write-Info "CSS: $([math]::Round($totalCssSize / 1KB, 2)) KB"
    Write-Info "Total: $([math]::Round(($totalJsSize + $totalCssSize) / 1KB, 2)) KB"
    
    # Top 5 archivos más grandes
    Write-Info "`nTop 5 archivos más pesados:"
    $jsFiles | Sort-Object Length -Descending | Select-Object -First 5 | ForEach-Object {
        Write-Host "  - $($_.Name): $([math]::Round($_.Length / 1KB, 2)) KB" -ForegroundColor Gray
    }
    
    # Warnings
    if ($totalJsSize -gt 500KB) {
        Write-Warn "Bundle JS > 500KB: Considerar code splitting"
    }
    
} else {
    Write-Fail "Build no existe. Ejecutar: npm run build"
}

# ===========================================
# 2. IMAGE ANALYSIS
# ===========================================
Write-Section "2. Image Analysis"

if (Test-Path "frontend\public\images") {
    $images = Get-ChildItem -Path "frontend\public\images" -Include *.jpg,*.jpeg,*.png,*.webp,*.gif -Recurse
    
    $totalImgSize = ($images | Measure-Object -Property Length -Sum).Sum
    Write-Info "Total imágenes: $($images.Count)"
    Write-Info "Tamaño total: $([math]::Round($totalImgSize / 1MB, 2)) MB"
    
    # Imágenes sin optimizar (> 500KB)
    $heavyImages = $images | Where-Object { $_.Length -gt 500KB }
    if ($heavyImages.Count -gt 0) {
        Write-Warn "Imágenes sin optimizar (> 500KB):"
        $heavyImages | ForEach-Object {
            Write-Host "  - $($_.Name): $([math]::Round($_.Length / 1KB, 2)) KB" -ForegroundColor Yellow
        }
    }
    
    # Formatos modernos
    $webpCount = ($images | Where-Object { $_.Extension -eq '.webp' }).Count
    $webpPercentage = [math]::Round(($webpCount / $images.Count) * 100, 0)
    
    if ($webpPercentage -lt 50) {
        Write-Warn "Solo $webpPercentage% de imágenes en WebP. Considerar migrar."
    } else {
        Write-OK "$webpPercentage% de imágenes en formato moderno (WebP)"
    }
}

# ===========================================
# 3. FONTS ANALYSIS
# ===========================================
Write-Section "3. Fonts Analysis"

if (Test-Path "frontend\index.html") {
    $html = Get-Content "frontend\index.html" -Raw
    
    # Contar familias de Google Fonts
    if ($html -match 'fonts\.googleapis\.com') {
        $fontMatch = [regex]::Match($html, 'family=([^"]+)')
        if ($fontMatch.Success) {
            $families = $fontMatch.Groups[1].Value -split '\|'
            Write-Info "Familias de fuentes: $($families.Count)"
            
            if ($families.Count -gt 2) {
                Write-Warn "Muchas familias ($($families.Count)). Recomendado: 1-2 máximo"
            }
            
            # Contar pesos
            $weights = ([regex]::Matches($fontMatch.Groups[1].Value, 'wght@([\d;]+)')).Count
            if ($weights -gt 10) {
                Write-Warn "Muchos pesos de fuente ($weights). Recomendado: 3-4 máximo"
            }
        }
    } else {
        Write-OK "No usa Google Fonts (self-hosted o sistema)"
    }
}

# ===========================================
# 4. LIGHTHOUSE AUDIT (si está disponible)
# ===========================================
Write-Section "4. Lighthouse Score"

$lighthouseAvailable = Get-Command lighthouse -ErrorAction SilentlyContinue

if ($lighthouseAvailable) {
    Write-Info "Ejecutando Lighthouse audit en $Url..."
    
    $reportPath = "lighthouse-report.html"
    
    try {
        $output = lighthouse $Url `
            --output=html `
            --output-path=$reportPath `
            --chrome-flags="--headless" `
            --quiet 2>&1
        
        Write-OK "Report generado: $reportPath"
        
        # Intentar extraer scores del output
        if ($output -match 'Performance: (\d+)') {
            $perfScore = $matches[1]
            Write-Info "Performance Score: $perfScore/100"
            
            if ($perfScore -lt 70) {
                Write-Warn "Score < 70: Performance crítico"
            } elseif ($perfScore -lt 90) {
                Write-Warn "Score < 90: Hay optimizaciones disponibles"
            } else {
                Write-OK "Performance excelente (>= 90)"
            }
        }
        
    } catch {
        Write-Warn "Error ejecutando Lighthouse: $_"
    }
    
} else {
    Write-Warn "Lighthouse no instalado. Instalar con: npm install -g lighthouse"
}

# ===========================================
# 5. NETWORK ANALYSIS
# ===========================================
Write-Section "5. Network Analysis"

if ($Production) {
    $prodUrl = "https://rural24-1.onrender.com"
    Write-Info "Analizando $prodUrl ..."
    
    try {
        # Test de compresión
        $response = Invoke-WebRequest -Uri $prodUrl -Method Head -UseBasicParsing
        
        $encoding = $response.Headers["Content-Encoding"]
        if ($encoding -and $encoding -match "gzip|br") {
            Write-OK "Compresión habilitada: $encoding"
        } else {
            Write-Warn "Compresión no detectada"
        }
        
        # Test de cache headers
        $cacheControl = $response.Headers["Cache-Control"]
        if ($cacheControl) {
            Write-Info "Cache-Control: $cacheControl"
        } else {
            Write-Warn "No hay Cache-Control headers"
        }
        
        # Security headers
        $securityHeaders = @(
            'X-Frame-Options',
            'X-Content-Type-Options',
            'X-XSS-Protection',
            'Strict-Transport-Security'
        )
        
        $missingHeaders = @()
        foreach ($header in $securityHeaders) {
            if (-not $response.Headers[$header]) {
                $missingHeaders += $header
            }
        }
        
        if ($missingHeaders.Count -gt 0) {
            Write-Warn "Security headers faltantes: $($missingHeaders -join ', ')"
        } else {
            Write-OK "Todos los security headers presentes"
        }
        
    } catch {
        Write-Fail "Error conectando a producción: $_"
    }
}

# ===========================================
# 6. DEPENDENCIES AUDIT
# ===========================================
Write-Section "6. Dependencies Audit"

if (Test-Path "frontend\package.json") {
    $packageJson = Get-Content "frontend\package.json" -Raw | ConvertFrom-Json
    
    $depCount = ($packageJson.dependencies | Get-Member -MemberType NoteProperty).Count
    $devDepCount = ($packageJson.devDependencies | Get-Member -MemberType NoteProperty).Count
    
    Write-Info "Dependencies: $depCount"
    Write-Info "DevDependencies: $devDepCount"
    
    if ($depCount -gt 30) {
        Write-Warn "Muchas dependencies ($depCount). Revisar si todas son necesarias."
    }
}

# ===========================================
# SUMMARY
# ===========================================
Write-Section "Summary & Recommendations"

Write-Host @"

Para mejorar performance:
1. ✅ Activar CDN en Render Dashboard (Frontend)
2. ✅ Implementar code splitting (lazy loading de rutas)
3. ✅ Optimizar imágenes con Cloudinary transformations
4. ✅ Reducir fuentes a 1-2 familias máximo
5. ✅ Usar Lighthouse CI para monitoreo continuo

Next steps:
- Ejecutar: npm run build (si no existe dist/)
- Ejecutar: npm install -g lighthouse (si no está instalado)
- Ejecutar: .\scripts\performance-audit.ps1 -Production

"@ -ForegroundColor Cyan

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "AUDIT COMPLETE" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta
