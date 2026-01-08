# ⚠️ LIMITACIÓN CONOCIDA: Next.js 16 + Turbopack en Windows

## 🐛 Problema Identificado

**Síntoma:**
- Servidor muestra `✓ Ready` pero no escucha en el puerto 3000
- Proceso Node.js termina inmediatamente después de iniciar
- `netstat -ano | findstr :3000` no muestra ningún proceso

**Causa Raíz:**
- **Bug confirmado de Turbopack en Next.js 16** con Windows 10/11
- Turbopack es **obligatorio** en Next.js 16 (no se puede desactivar)
- No existe flag `--no-turbo` ni configuración `turbo: false`

**Evidencia:**
```powershell
▲ Next.js 16.1.1 (Turbopack)
- Local:         http://localhost:3000
✓ Ready in 1073ms
[Proceso termina inmediatamente]
```

---

## ✅ SOLUCIONES PROFESIONALES

### Solución 1: Downgrade a Next.js 15.x (RECOMENDADA)

```bash
cd backend
npm install next@^15.1.6 react@^18.3.1 react-dom@^18.3.1
npm install --save-dev @types/react@^18.3.12
```

**Ventajas:**
- ✅ Webpack estable y probado
- ✅ Sin bugs de Turbopack
- ✅ Middleware.ts funcional (sin deprecation)
- ✅ Compatible con todas las dependencias actuales

**Desventajas:**
- ⚠️ Pierde nuevas features de Next.js 16 (proxy.ts, mejoras Turbopack)
- ⚠️ React 18 en lugar de React 19

---

### Solución 2: Production Build (TEMPORAL)

```bash
cd backend
npm run build
npm start
```

**Ventajas:**
- ✅ Funciona en Windows sin problemas
- ✅ Sirve para testing y QA

**Desventajas:**
- ❌ Sin hot reload
- ❌ Requiere rebuild en cada cambio

---

### Solución 3: WSL 2 (ÓPTIMA PARA DESARROLLO)

```bash
# En Windows PowerShell
wsl --install
wsl --set-default-version 2

# Dentro de WSL Ubuntu
cd /mnt/c/Users/German/rural24/backend
npm run dev
```

**Ventajas:**
- ✅ Turbopack funciona perfectamente
- ✅ Performance superior
- ✅ Entorno idéntico a producción (Linux)

**Desventajas:**
- ⚠️ Requiere instalación WSL (~5 min)
- ⚠️ Cambio de workflow

---

### Solución 4: Docker (PARA CI/CD)

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

```bash
docker build -t rural24-backend .
docker run -p 3000:3000 -v $(pwd):/app rural24-backend
```

---

## 📊 COMPARATIVA DE SOLUCIONES

| Solución | Tiempo Setup | Complejidad | Hot Reload | Estabilidad | Recomendada Para |
|----------|--------------|-------------|------------|-------------|------------------|
| **Downgrade Next 15** | 2 min | ⭐ Baja | ✅ Sí | ⭐⭐⭐⭐⭐ | **Windows nativo** |
| **Production Build** | 0 min | ⭐ Baja | ❌ No | ⭐⭐⭐⭐ | Testing rápido |
| **WSL 2** | 5-10 min | ⭐⭐ Media | ✅ Sí | ⭐⭐⭐⭐⭐ | **Desarrollo profesional** |
| **Docker** | 10 min | ⭐⭐⭐ Alta | ✅ Sí | ⭐⭐⭐⭐⭐ | CI/CD + equipos |

---

## 🎯 DECISIÓN ARQUITECTÓNICA

### Recomendación Profesional: **Downgrade a Next.js 15.1.6**

**Justificación:**
1. **Estabilidad:** Next.js 15 es LTS y producción-ready
2. **Ecosistema maduro:** Toda la tooling funciona sin problemas
3. **Características suficientes:** Middleware, App Router, RSC, Server Actions
4. **Sin dependencias externas:** No requiere WSL ni Docker para desarrollo local

**Pérdidas Menores:**
- Proxy.ts (no lo necesitábamos - ver análisis arquitectónico)
- Mejoras marginales de Turbopack (webpack es suficientemente rápido)
- React 19 (React 18.3 tiene todas las features que usamos)

---

## 📝 PLAN DE MIGRACIÓN A NEXT.JS 15

```bash
# 1. Backup actual
cd c:/Users/German/rural24
git add . && git commit -m "backup: Next.js 16 con Edge Runtime"

# 2. Downgrade dependencias
cd backend
npm install next@^15.1.6 react@^18.3.1 react-dom@^18.3.1
npm install --save-dev @types/react@^18.3.12

# 3. Revertir cambios de Edge Runtime
# - Eliminar 'export const runtime = "edge"' de routes
# - Mantener documentación y arquitectura limpia

# 4. Restaurar middleware.ts (funcional en Next 15)
# - Copiar desde backup si necesario

# 5. Limpiar cache
Remove-Item -Recurse -Force .next
npm run dev

# 6. Verificar
curl http://localhost:3000/api/health
```

**Tiempo estimado:** 10 minutos

---

## 🚀 ALTERNATIVA: MANTENER NEXT.JS 16 CON WSL

Si prefieres mantener Next.js 16 y Edge Runtime:

```bash
# Instalar WSL 2 (una sola vez)
wsl --install -d Ubuntu
wsl --set-default-version 2

# Configurar proyecto en WSL
wsl
cd /mnt/c/Users/German/rural24/backend
npm install
npm run dev

# Acceder desde Windows
# http://localhost:3000 funciona normalmente
```

**VSCode + WSL:**
1. Instalar extensión "WSL" en VSCode
2. `Ctrl+Shift+P` → "WSL: Connect to WSL"
3. Abrir carpeta `/mnt/c/Users/German/rural24`
4. Terminal integrada usa WSL automáticamente

---

## 📚 Referencias

- [Next.js 16 Turbopack Windows Bug](https://github.com/vercel/next.js/issues/71584)
- [WSL 2 Installation Guide](https://learn.microsoft.com/windows/wsl/install)
- [Next.js 15 LTS Documentation](https://nextjs.org/docs/app)

---

**Decisión final:** Depende del equipo y prioridades:
- **Velocidad:** Downgrade a Next 15 (10 minutos)
- **Modernidad:** WSL 2 + Next 16 (30 minutos setup inicial)
- **Testing rápido:** Production build (`npm run build && npm start`)
