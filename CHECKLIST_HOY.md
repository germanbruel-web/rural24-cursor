# ✅ CHECKLIST ACCIONABLE - HOY 8 de Enero 2026
**Rural24 - Tareas inmediatas**

---

## 🔴 CRÍTICO - Hacer HOY (2-3 horas)

### 1. Verificar Estado de RLS (30 minutos)

```bash
# 1. Abrir Supabase SQL Editor
# 2. Ejecutar este query:

SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('ads', 'users', 'categories', 'payment_transactions')
ORDER BY tablename;

# 3. Si alguna tiene rls_enabled = false:
```

**Si RLS está deshabilitado:**
```sql
-- Ejecutar: database/FIX_500_ERRORS_RLS.sql
-- Verificar con: database/VERIFY_RLS_STATUS.sql
```

**Documentar resultado:**
```bash
# Crear archivo:
# docs/RLS_STATUS_JAN_8_2026.md

Estado verificado: [FECHA]
Tablas con RLS habilitado: [LISTAR]
Tablas con RLS deshabilitado: [LISTAR]
Acción tomada: [DESCRIBIR]
```

**✅ Done cuando:**
- [x] Query ejecutado ✅ COMPLETADO
- [x] Script de verificación creado: `scripts/verify-rls.js` ✅
- [x] Script de corrección creado: `database/ENABLE_RLS_CORRECTLY.sql` ✅
- [ ] SQL ejecutado en Supabase (PENDIENTE - requiere UI)
- [x] Estado documentado en `docs/RLS_STATUS_JAN_8_2026.md` ✅

**📊 RESULTADO:** RLS está DESHABILITADO en todas las tablas (7/7)
**⚠️ ACCIÓN PENDIENTE:** Ejecutar SQL manualmente en Supabase Editor

---

### 2. Crear Issues en GitHub (30 minutos)

```bash
# Crear 5 issues con labels:

1. [CRITICAL] Verificar y habilitar RLS en producción
   Label: security, critical
   Assignee: Backend dev
   
2. [HIGH] Eliminar Gemini API para reducir costos
   Label: refactor, cost-optimization
   Assignee: Frontend dev
   
3. [CRITICAL] Integrar Mercado Pago
   Label: feature, business-critical
   Assignee: Backend dev + Product
   
4. [HIGH] Backend como única fuente de verdad
   Label: architecture, refactor
   Assignee: Full-stack
   
5. [MEDIUM] Migrar a Prisma ORM
   Label: tech-debt, database
   Assignee: Backend dev
```

**Template issue:**
```markdown
## Descripción
[Copiar de PLAN_MEJORAS_DETALLADO.md]

## Criterios de aceptación
- [ ] ...
- [ ] ...

## Estimación
X días / Y horas

## Referencias
- Análisis: ANALISIS_CRITICO_ENERO_2026.md
- Plan: PLAN_MEJORAS_DETALLADO.md
```

**✅ Done cuando:**
- [ ] 5 issues creados en GitHub
- [ ] Labels asignados
- [ ] Milestones: "Sprint 1" y "Sprint 2"

---

### 3. Actualizar README Principal (30 minutos)

```markdown
# Agregar al inicio de README.md:

---
**⚠️ ESTADO DEL PROYECTO - 8 Enero 2026**

El proyecto está en **FASE DE MEJORAS CRÍTICAS** antes de continuar desarrollo.

📖 **Documentación actualizada:**
- [Análisis Crítico](ANALISIS_CRITICO_ENERO_2026.md) - Problemas detectados
- [Plan de Mejoras](PLAN_MEJORAS_DETALLADO.md) - Roadmap de 14 días
- [Decisiones Arquitectónicas](docs/DECISIONES_ARQUITECTONICAS.md) - ADRs

🚨 **No desarrollar nuevas features hasta resolver:**
1. ✅ RLS verificado y habilitado
2. ⏳ Backend como fuente de verdad
3. ⏳ Sistema de pagos integrado DEMO.

**Próximos pasos:** Ver [PLAN_MEJORAS_DETALLADO.md](PLAN_MEJORAS_DETALLADO.md)

---
```

**✅ Done cuando:**
- [ ] README.md actualizado
- [ ] Links funcionan
- [ ] Mensaje claro para colaboradores

---

### 4. Backup del Proyecto Actual (30 minutos)

```bash
# 1. Crear carpeta de backup
mkdir -p backups/2026-01-08_pre-mejoras

# 2. Copiar archivos críticos
cp -r frontend/src/config backups/2026-01-08_pre-mejoras/
cp -r frontend/src/services backups/2026-01-08_pre-mejoras/
cp backend/.env.local backups/2026-01-08_pre-mejoras/backend.env.backup
cp frontend/.env.local backups/2026-01-08_pre-mejoras/frontend.env.backup

# 3. Exportar schema de BD
# Desde Supabase Dashboard > Database > Backups
# Descargar backup manual

# 4. Crear README del backup
cat > backups/2026-01-08_pre-mejoras/README.md << EOF
# Backup Pre-Mejoras - 8 Enero 2026

## Contenido
- frontend/src/config/ - Configuración hardcoded (antes de migrar a BD)
- frontend/src/services/ - Servicios incluyendo Gemini API
- *.env.backup - Variables de entorno

## Razón del backup
Estado del proyecto ANTES de:
- Eliminar Gemini API
- Migrar config a backend
- Integrar sistema de pagos

## Restaurar
Solo si es necesario volver atrás:
\`\`\`bash
cp -r backups/2026-01-08_pre-mejoras/config frontend/src/
\`\`\`

## Contexto
Ver: ANALISIS_CRITICO_ENERO_2026.md
EOF

# 5. Commit del backup
git add backups/
git commit -m "backup: Estado pre-mejoras críticas (8 Ene 2026)"
git push
```

**✅ Done cuando:**
- [ ] Backup creado
- [ ] BD exportada
- [ ] Commit pusheado

---

## 🟡 IMPORTANTE - Hacer Hoy si hay tiempo (1-2 horas)

### 5. Limpiar Documentación Redundante (1 hora)

```bash
# 1. Crear carpeta legacy
mkdir -p docs/legacy

# 2. Mover docs de migraciones viejas
mv frontend/MIGRATION_*.md docs/legacy/
mv frontend/DESIGN_MIGRATION.md docs/legacy/
mv frontend/PROFESSIONAL_MIGRATION_COMPLETE.md docs/legacy/

# 3. Mantener solo:
# - README.md (root)
# - EMPEZAR_AQUI.md (root)
# - ARQUITECTURA_UPLOADS.md (root)
# - docs/PLAN_ACTUALIZADO_2026.md
# - docs/BACKEND_ML_ARCHITECTURE_2026.md
# - docs/AUTH_GUIDE.md

# 4. Crear índice
cat > docs/README.md << EOF
# Documentación Rural24

## Documentos Activos
- [Plan Actualizado 2026](PLAN_ACTUALIZADO_2026.md)
- [Backend Architecture](BACKEND_ML_ARCHITECTURE_2026.md)
- [Auth Guide](AUTH_GUIDE.md)
- [Decisiones Arquitectónicas](DECISIONES_ARQUITECTONICAS.md)

## Análisis y Planes
- [Análisis Crítico](../ANALISIS_CRITICO_ENERO_2026.md)
- [Plan de Mejoras](../PLAN_MEJORAS_DETALLADO.md)
- [Resumen Ejecutivo](../PROBLEMAS_CRITICOS_RESUMEN.md)

## Legacy
Documentos archivados: [legacy/](legacy/)
EOF
```

**✅ Done cuando:**
- [ ] Docs movidas a legacy/
- [ ] Índice creado
- [ ] README.md actualizado

---

### 6. Preparar Environment para Sprint 1 (1 hora)

```bash
# 1. Instalar herramientas necesarias
npm install -g @prisma/cli

# 2. Verificar versiones
node --version  # >= 18
npm --version   # >= 9
git --version

# 3. Actualizar dependencias
cd frontend && npm update
cd ../backend && npm update

# 4. Verificar que todo compila
cd frontend && npm run build
cd ../backend && npm run build

# 5. Ejecutar tests existentes (si hay)
npm test

# 6. Limpiar cache
rm -rf frontend/.next backend/.next
rm -rf frontend/node_modules/.vite
```

**✅ Done cuando:**
- [ ] Herramientas instaladas
- [ ] Builds exitosos
- [ ] Cache limpio

---

## 🟢 OPCIONAL - Si sobra tiempo

### 7. Setup de Testing Tools

```bash
# Instalar Vitest (unit tests)
cd frontend
npm install -D vitest @vitest/ui

# Configurar script
# package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}

# Instalar Playwright (E2E)
npm init playwright@latest
```

---

## 📊 ESTADO AL FINAL DEL DÍA

**Checklist de revisión:**
```
□ RLS verificado y documentado
□ 5 issues creados en GitHub
□ README actualizado con warning
□ Backup completo realizado
□ Docs legacy archivados (opcional)
□ Environment preparado (opcional)
□ Testing tools instalados (opcional)
```

**Output esperado:**
```
✅ docs/RLS_STATUS_JAN_8_2026.md (creado)
✅ GitHub Issues (5 issues)
✅ README.md (actualizado)
✅ backups/2026-01-08_pre-mejoras/ (creado)
✅ docs/legacy/ (opcional)
✅ Builds limpios (opcional)
```

---

## 📞 SI HAY PROBLEMAS

### RLS no se puede verificar
```bash
# Verificar conexión a Supabase
cd backend
node -e "require('./infrastructure/supabase/client').getSupabaseClient()"

# Si falla, verificar .env.local
cat backend/.env.local | grep SUPABASE
```

### GitHub Issues no se pueden crear
```bash
# Usar template manual
# Copiar contenido de PLAN_MEJORAS_DETALLADO.md
# Crear issues desde GitHub Web UI
```

### Backup falla
```bash
# Backup manual mínimo
zip -r backup_$(date +%Y%m%d).zip \
  frontend/src/config \
  frontend/src/services \
  backend/.env.local \
  frontend/.env.local
```

---

## 🚀 MAÑANA (9 de Enero)

**Prioridad 1: Eliminar Gemini API**
- Tiempo: 4 horas
- Ver: PLAN_MEJORAS_DETALLADO.md > Tarea 1.2

**Prioridad 2: Crear primeros endpoints backend**
- `/api/config/categories`
- Tiempo: 4 horas
- Ver: PLAN_MEJORAS_DETALLADO.md > Tarea 2.1

---

**Última actualización:** 8 de Enero, 2026 - 10:00 AM  
**Próxima revisión:** 8 de Enero, 2026 - 18:00 (fin del día)
