# 🚀 RURAL24 - GUÍA DE INICIO RÁPIDO

**Fecha:** 29 de diciembre, 2025  
**Proyecto:** Sistema de clasificados agrícolas con IA

---

## 📂 YA ESTÁS EN EL PROYECTO CORRECTO

✅ **Carpeta actual:** C:\Users\German\rural24  
✅ **GitHub:** https://github.com/germanbruel-web/rural24  
✅ **VS Code:** Ya abierto aquí (si no, ejecuta: `code .`)

---

## 🗂️ ESTRUCTURA DEL PROYECTO

```
rural24/
├── frontend/          # Frontend actual (Vite + React)
│   └── (copiar desde agro-buscador-app/src)
│
├── backend/           # NUEVO: Backend Next.js + APIs
│   └── (crear nuevo)
│
├── database/          # Migraciones y schemas SQL
│   └── (copiar desde agro-buscador-app/database)
│
├── docs/              # Documentación
│   └── (copiar docs importantes)
│
├── shared/            # Código compartido
│   └── types/
│
└── EMPEZAR_AQUI.md   # ← ESTÁS AQUÍ
```

---

## 📋 PASO 1: COPIAR CÓDIGO DEL PROYECTO VIEJO

### Opción A: Script Automático (RECOMENDADO)

```powershell
# Ejecutar este script en PowerShell desde C:\Users\German\rural24

# Crear estructura
New-Item -ItemType Directory -Force frontend, backend, database, docs, shared

# Copiar frontend completo
Copy-Item -Recurse C:\Users\German\agro-buscador-app\src .\frontend\src
Copy-Item -Recurse C:\Users\German\agro-buscador-app\public .\frontend\public
Copy-Item C:\Users\German\agro-buscador-app\index.html .\frontend\
Copy-Item C:\Users\German\agro-buscador-app\package.json .\frontend\
Copy-Item C:\Users\German\agro-buscador-app\package-lock.json .\frontend\
Copy-Item C:\Users\German\agro-buscador-app\vite.config.ts .\frontend\
Copy-Item C:\Users\German\agro-buscador-app\tsconfig.json .\frontend\
Copy-Item C:\Users\German\agro-buscador-app\tailwind.config.js .\frontend\
Copy-Item C:\Users\German\agro-buscador-app\postcss.config.js .\frontend\
Copy-Item C:\Users\German\agro-buscador-app\types.ts .\frontend\
Copy-Item C:\Users\German\agro-buscador-app\constants.ts .\frontend\

# Copiar configuración
Copy-Item C:\Users\German\agro-buscador-app\.env.example .\
Copy-Item C:\Users\German\agro-buscador-app\.env.local .\frontend\ -ErrorAction SilentlyContinue
Copy-Item C:\Users\German\agro-buscador-app\.gitignore .\

# Copiar database
Copy-Item -Recurse C:\Users\German\agro-buscador-app\database\* .\database\ -ErrorAction SilentlyContinue
Copy-Item -Recurse C:\Users\German\agro-buscador-app\supabase\* .\database\supabase\ -ErrorAction SilentlyContinue

# Copiar docs importantes
Copy-Item C:\Users\German\agro-buscador-app\BACKEND_ML_ARCHITECTURE_2026.md .\docs\
Copy-Item C:\Users\German\agro-buscador-app\ARCHITECTURE_SUMMARY.md .\docs\
Copy-Item C:\Users\German\agro-buscador-app\DESIGN_SYSTEM_UNIFIED.md .\docs\
```

### Opción B: Manual (si algo falla)

1. Copiar carpeta `src/` completa → `rural24/frontend/src/`
2. Copiar `package.json` → `rural24/frontend/package.json`
3. Copiar `.env.local` → `rural24/frontend/.env.local`

---

## 📋 PASO 2: INSTALAR DEPENDENCIAS

```powershell
cd frontend
npm install
```

**Tiempo estimado:** 2-3 minutos

---

## 📋 PASO 3: VERIFICAR QUE FUNCIONA

```powershell
cd frontend
npm run dev
```

**Deberías ver:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

**Si funciona:** ✅ Frontend migrado correctamente!

---

## 📋 PASO 4: CREAR BACKEND (NUEVO)

```powershell
cd backend

# Instalar Next.js 14
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"

# Instalar dependencias para backend
npm install @supabase/supabase-js
npm install @google/generative-ai
npm install @trpc/server @trpc/client
npm install zod
```

---

## 🔑 CREDENCIALES NECESARIAS

### 1. Supabase (ya tienes)
Verificar en `frontend/.env.local`:

```bash
VITE_SUPABASE_URL=tu_url_aqui
VITE_SUPABASE_KEY=tu_key_aqui
```

### 2. Google Gemini (CREAR AHORA)

**Paso a paso:**

1. Ir a: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copiar la key
4. Agregar a `frontend/.env.local`:

```bash
VITE_GEMINI_API_KEY=tu_gemini_key_aqui
```

### 3. Cloudflare (MÁS ADELANTE)

**NO crear ahora.** Se configura en Semana 10-11 cuando vayas a producción.

---

## 🎯 PRÓXIMOS PASOS (ESTA SEMANA)

### ✅ Día 1 (HOY)
- [x] Crear estructura de carpetas
- [ ] Copiar código del proyecto viejo
- [ ] Instalar dependencias
- [ ] Verificar que frontend funciona
- [ ] Crear API key de Gemini

### ⏳ Día 2-3
- [ ] Setup Next.js backend
- [ ] Primera API funcionando
- [ ] Conectar backend con Supabase

### ⏳ Día 4-5
- [ ] Migrar schema BD (nuevas tablas)
- [ ] CRUD básico de categorías
- [ ] Testing

---

## 📚 DOCUMENTACIÓN IMPORTANTE

**Dentro de este proyecto:**

- `docs/BACKEND_ML_ARCHITECTURE_2026.md` - Arquitectura completa
- `docs/ARCHITECTURE_SUMMARY.md` - Resumen del sistema
- `database/schema.sql` - Schema de BD actual

**Proyecto viejo (referencia):**

- `C:\Users\German\agro-buscador-app\` - Código original

---

## ❓ TROUBLESHOOTING

### Frontend no arranca

```powershell
cd frontend
rm -r node_modules
rm package-lock.json
npm install
npm run dev
```

### Error de Supabase

Verificar `.env.local` tiene las variables correctas.

### Error de imports

Verificar que `tsconfig.json` tiene:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 🚨 SI ALGO SALE MAL

**Backup está en:**
- Proyecto original: `C:\Users\German\agro-buscador-app\`
- GitHub: https://github.com/germanbruel-web/agro-buscador-app

**Siempre puedes volver al proyecto original sin perder nada.**

---

## 📞 COMANDOS RÁPIDOS

```powershell
# Arrancar frontend
cd frontend && npm run dev

# Arrancar backend (cuando esté listo)
cd backend && npm run dev

# Ver estructura
tree /F

# Estado de Git
git status

# Commit y push
git add .
git commit -m "descripción"
git push origin main
```

---

## 🎯 OBJETIVO FINAL

Tener un sistema con:

1. **Frontend Vite + React** (mejorado)
2. **Backend Next.js + IA** (nuevo)
3. **Catálogo Maestro** de marcas/modelos
4. **Auto-completado inteligente**
5. **Publicación de avisos en < 2 min**

**Timeline realista:** 3 meses

---

## ✅ CHECKLIST RÁPIDO

Marca lo que ya hiciste:

- [x] VS Code abierto en `C:\Users\German\rural24`
- [x] Carpetas `frontend/`, `backend/`, `database/`, `docs/` creadas
- [x] Código copiado de `agro-buscador-app`
- [x] `npm install` ejecutado en `frontend/`
- [x] `npm run dev` funciona
- [ ] API key de Gemini creada
- [ ] `.env.local` configurado
- [ ] Backend Next.js instalado

---

**Última actualización:** 29/12/2025  
**Status:** 🏗️ Setup inicial  
**Siguiente:** Copiar código y verificar que funciona
