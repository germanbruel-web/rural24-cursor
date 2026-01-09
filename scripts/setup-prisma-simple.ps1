# ========================================
# 🗄️ PRISMA SETUP SIMPLIFICADO
# ========================================

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🗄️ PRISMA ORM SETUP" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

$ErrorActionPreference = "Continue"

# Cambiar a directorio backend
Set-Location backend

# ========================================
# PASO 1: Instalar Prisma
# ========================================
Write-Host "📦 Instalando Prisma..." -ForegroundColor Yellow

npm install prisma @prisma/client --save
npm install -D prisma

Write-Host "✅ Prisma instalado`n" -ForegroundColor Green

# ========================================
# PASO 2: Inicializar Prisma
# ========================================
Write-Host "🔧 Inicializando Prisma..." -ForegroundColor Yellow

npx prisma init --datasource-provider postgresql

Write-Host "✅ Prisma inicializado`n" -ForegroundColor Green

# ========================================
# PASO 3: Crear cliente Prisma
# ========================================
Write-Host "📝 Creando cliente Prisma..." -ForegroundColor Yellow

# Crear directorio infrastructure si no existe
if (-not (Test-Path ".\infrastructure")) {
    New-Item -ItemType Directory -Path ".\infrastructure" | Out-Null
}

# Crear archivo prisma.ts
$prismaContent = @'
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

$prismaContent | Out-File -FilePath ".\infrastructure\prisma.ts" -Encoding UTF8 -Force

Write-Host "✅ Cliente Prisma creado`n" -ForegroundColor Green

# Volver a root
Set-Location ..

# ========================================
# RESULTADO
# ========================================
Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   ✅ SETUP COMPLETADO" -ForegroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "🎯 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Configurar DATABASE_URL en backend/.env.local" -ForegroundColor White
Write-Host "   2. cd backend" -ForegroundColor White
Write-Host "   3. npx prisma db pull" -ForegroundColor White
Write-Host "   4. npx prisma generate" -ForegroundColor White
Write-Host "   5. npx prisma studio" -ForegroundColor White

Write-Host "`n📖 Ver: docs/PRISMA_MIGRATION_GUIDE.md`n" -ForegroundColor Cyan
