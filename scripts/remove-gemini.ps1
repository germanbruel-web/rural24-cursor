# Script para eliminar Gemini API del proyecto
# Fecha: 8 de Enero 2026
# PARTE DE: Sprint 1, Día 1 - Tarea 1.2

Write-Host "`n🤖 ELIMINACIÓN DE GEMINI API" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

Write-Host "📊 ANÁLISIS:" -ForegroundColor Yellow
Write-Host "  - Costo actual: ~`$50-200/mes"
Write-Host "  - Decisión: ADR-001 (eliminar IA generativa)"
Write-Host "  - Razón: Costos + Datos inconsistentes"
Write-Host ""

# Paso 1: Crear backup
Write-Host "📦 PASO 1: Creando backup..." -ForegroundColor Cyan

$backupDir = ".\backups\2026-01-08_gemini-removal"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
}

# Copiar archivos que se van a eliminar
Copy-Item ".\frontend\src\services\geminiService.ts" "$backupDir\" -ErrorAction SilentlyContinue
Copy-Item ".\frontend\src\services\aiTextGeneratorService.ts" "$backupDir\" -ErrorAction SilentlyContinue
Copy-Item ".\frontend\src\services\aiModelGenerator.ts" "$backupDir\" -ErrorAction SilentlyContinue
Copy-Item ".\frontend\package.json" "$backupDir\package.json.backup" -ErrorAction SilentlyContinue
Copy-Item ".\frontend\.env.local" "$backupDir\.env.local.backup" -ErrorAction SilentlyContinue

Write-Host "  ✅ Backup creado en: $backupDir" -ForegroundColor Green
Write-Host ""

# Paso 2: Mostrar archivos a eliminar
Write-Host "🗑️  PASO 2: Archivos a eliminar:" -ForegroundColor Cyan
Write-Host "  1. frontend/src/services/geminiService.ts"
Write-Host "  2. frontend/src/services/aiTextGeneratorService.ts"
Write-Host "  3. frontend/src/services/aiModelGenerator.ts"
Write-Host ""

# Paso 3: Dependencias a desinstalar
Write-Host "📦 PASO 3: Dependencias a desinstalar:" -ForegroundColor Cyan
Write-Host "  1. @google/genai"
Write-Host "  2. @google/generative-ai"
Write-Host ""

# Paso 4: Archivos a actualizar
Write-Host "✏️  PASO 4: Archivos a actualizar:" -ForegroundColor Cyan
Write-Host "  1. frontend/src/vite-env.d.ts (remover VITE_GEMINI_API_KEY)"
Write-Host "  2. frontend/src/diagnostics.ts (remover checks de Gemini)"
Write-Host "  3. frontend/.env.local (remover VITE_GEMINI_API_KEY)"
Write-Host "  4. Componentes que usen servicios de IA"
Write-Host ""

Write-Host "⚠️  ADVERTENCIA:" -ForegroundColor Yellow
Write-Host "  Esta operación eliminará la capacidad de:"
Write-Host "  - Autocompletar modelos con IA"
Write-Host "  - Generar títulos/descripciones automáticas"
Write-Host "  - Sugerencias inteligentes"
Write-Host ""
Write-Host "  Será reemplazado por:"
Write-Host "  - Selects normales desde base de datos"
Write-Host "  - Catálogo maestro manual"
Write-Host ""

$continue = Read-Host "¿Continuar con la eliminación? (S/N)"

if ($continue -ne "S" -and $continue -ne "s") {
    Write-Host ""
    Write-Host "ℹ️  Operación cancelada" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Ejecutando eliminación..." -ForegroundColor Cyan
Write-Host ""

# Paso 5: Eliminar archivos
Write-Host "  🗑️  Eliminando archivos..." -ForegroundColor Yellow

Remove-Item ".\frontend\src\services\geminiService.ts" -ErrorAction SilentlyContinue
if ($?) { Write-Host "    ✅ geminiService.ts eliminado" -ForegroundColor Green }

Remove-Item ".\frontend\src\services\aiTextGeneratorService.ts" -ErrorAction SilentlyContinue
if ($?) { Write-Host "    ✅ aiTextGeneratorService.ts eliminado" -ForegroundColor Green }

Remove-Item ".\frontend\src\services\aiModelGenerator.ts" -ErrorAction SilentlyContinue
if ($?) { Write-Host "    ✅ aiModelGenerator.ts eliminado" -ForegroundColor Green }

Write-Host ""

# Paso 6: Desinstalar dependencias
Write-Host "  📦 Desinstalando dependencias npm..." -ForegroundColor Yellow
Set-Location ".\frontend"
npm uninstall @google/genai @google/generative-ai
if ($LASTEXITCODE -eq 0) {
    Write-Host "    ✅ Dependencias desinstaladas" -ForegroundColor Green
}
Set-Location ".."

Write-Host ""

# Paso 7: Resumen
Write-Host "✅ ELIMINACIÓN COMPLETADA" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos MANUALES:" -ForegroundColor Yellow
Write-Host "  1. Editar: frontend/src/vite-env.d.ts"
Write-Host "     Remover línea: readonly VITE_GEMINI_API_KEY: string"
Write-Host ""
Write-Host "  2. Editar: frontend/.env.local"
Write-Host "     Remover línea: VITE_GEMINI_API_KEY=..."
Write-Host ""
Write-Host "  3. Actualizar componentes que usen IA"
Write-Host "     GitHub Copilot te ayudará con esto"
Write-Host ""
Write-Host "  4. Verificar build:"
Write-Host "     cd frontend && npm run build"
Write-Host ""
Write-Host "📊 AHORRO ESTIMADO: `$50-200/mes" -ForegroundColor Green
Write-Host ""
Write-Host "📄 Backup disponible en: $backupDir" -ForegroundColor Cyan
Write-Host ""
