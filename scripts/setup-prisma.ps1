# ========================================
# 🗄️ PRISMA SETUP AUTOMATIZADO
# ========================================
# Script para configurar Prisma en Rural24
# Ejecutar: .\scripts\setup-prisma.ps1

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🗄️ PRISMA ORM SETUP" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

# ========================================
# PASO 1: Verificar requisitos
# ========================================
Write-Host "📋 Verificando requisitos..." -ForegroundColor Yellow

# Verificar Node.js
$nodeVersion = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js no encontrado" -ForegroundColor Red
    exit 1
}

# Verificar backend directory
if (-not (Test-Path ".\backend")) {
    Write-Host "❌ Directorio backend no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Requisitos cumplidos`n" -ForegroundColor Green

# ========================================
# PASO 2: Instalar Prisma
# ========================================
Write-Host "📦 Instalando Prisma..." -ForegroundColor Yellow

cd backend

# Instalar dependencies
npm install prisma @prisma/client --save
npm install -D prisma

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma instalado correctamente`n" -ForegroundColor Green
} else {
    Write-Host "❌ Error instalando Prisma" -ForegroundColor Red
    cd ..
    exit 1
}

# ========================================
# PASO 3: Inicializar Prisma
# ========================================
Write-Host "🔧 Inicializando Prisma..." -ForegroundColor Yellow

npx prisma init

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma inicializado`n" -ForegroundColor Green
} else {
    Write-Host "❌ Error inicializando Prisma" -ForegroundColor Red
    cd ..
    exit 1
}

# ========================================
# PASO 4: Configurar DATABASE_URL
# ========================================
Write-Host "🔐 Configurando DATABASE_URL..." -ForegroundColor Yellow

# Leer .env.local existente
$envFile = ".\\.env.local"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    
    # Extraer NEXT_PUBLIC_SUPABASE_URL
    if ($envContent -match 'NEXT_PUBLIC_SUPABASE_URL=(.+)') {
        $supabaseUrl = $matches[1].Trim()
        Write-Host "✅ Supabase URL encontrada" -ForegroundColor Green
    }
    
    # Verificar si ya tiene DATABASE_URL
    if ($envContent -match 'DATABASE_URL=') {
        Write-Host "⚠️ DATABASE_URL ya existe en .env.local" -ForegroundColor Yellow
    } else {
        Write-Host "`n⚠️ ACCIÓN MANUAL REQUERIDA:" -ForegroundColor Yellow
        Write-Host "   1. Ir a Supabase Dashboard" -ForegroundColor White
        Write-Host "   2. Settings > Database > Connection String" -ForegroundColor White
        Write-Host "   3. Copiar 'Connection String'" -ForegroundColor White
        Write-Host "   4. Agregar a backend/.env.local:" -ForegroundColor White
        Write-Host "      DATABASE_URL='postgresql://...'`n" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Archivo .env.local no encontrado en backend/" -ForegroundColor Red
}

# ========================================
# PASO 5: Crear cliente Prisma
# ========================================
Write-Host "📝 Creando cliente Prisma singleton..." -ForegroundColor Yellow

$prismaClientContent = @'
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
'@

# Crear directorio infrastructure si no existe
if (-not (Test-Path ".\infrastructure")) {
    New-Item -ItemType Directory -Path ".\infrastructure" | Out-Null
}

# Crear archivo prisma.ts
$prismaClientContent | Out-File -FilePath ".\infrastructure\prisma.ts" -Encoding UTF8

Write-Host "✅ Cliente Prisma creado en infrastructure/prisma.ts`n" -ForegroundColor Green

# ========================================
# PASO 6: Actualizar package.json scripts
# ========================================
Write-Host "📝 Actualizando scripts NPM..." -ForegroundColor Yellow

$packageJsonPath = ".\package.json"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    
    # Agregar scripts de Prisma si no existen
    if (-not $packageJson.scripts."prisma:migrate") {
        $packageJson.scripts | Add-Member -NotePropertyName "prisma:migrate" -NotePropertyValue "prisma migrate dev" -Force
        $packageJson.scripts | Add-Member -NotePropertyName "prisma:deploy" -NotePropertyValue "prisma migrate deploy" -Force
        $packageJson.scripts | Add-Member -NotePropertyName "prisma:studio" -NotePropertyValue "prisma studio" -Force
        $packageJson.scripts | Add-Member -NotePropertyName "prisma:generate" -NotePropertyValue "prisma generate" -Force
        $packageJson.scripts | Add-Member -NotePropertyName "prisma:reset" -NotePropertyValue "prisma migrate reset" -Force
        $packageJson.scripts | Add-Member -NotePropertyName "prisma:pull" -NotePropertyValue "prisma db pull" -Force
        
        $packageJson | ConvertTo-Json -Depth 10 | Out-File $packageJsonPath -Encoding UTF8
        Write-Host "✅ Scripts NPM agregados`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Scripts Prisma ya existen`n" -ForegroundColor Yellow
    }
}

cd ..

# ========================================
# RESULTADOS
# ========================================
Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   ✅ SETUP COMPLETADO" -ForegroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "📁 Archivos creados:" -ForegroundColor Cyan
Write-Host "   ✓ backend/prisma/schema.prisma" -ForegroundColor Green
Write-Host "   ✓ backend/infrastructure/prisma.ts" -ForegroundColor Green

Write-Host "`n🎯 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Configurar DATABASE_URL en backend/.env.local" -ForegroundColor White
Write-Host "   2. Ejecutar: cd backend; npm run prisma:pull" -ForegroundColor White
Write-Host "   3. Revisar schema generado en prisma/schema.prisma" -ForegroundColor White
Write-Host "   4. Ejecutar: npm run prisma:generate" -ForegroundColor White
Write-Host "   5. Abrir Prisma Studio: npm run prisma:studio" -ForegroundColor White

Write-Host "`n📖 Documentación:" -ForegroundColor Cyan
Write-Host "   docs/PRISMA_MIGRATION_GUIDE.md" -ForegroundColor White

Write-Host "`n════════════════════════════════════════`n" -ForegroundColor Cyan
