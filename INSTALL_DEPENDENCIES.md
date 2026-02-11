# 🚀 Instalación de Dependencias - Arquitectura Escalable

## Dependencias NPM requeridas (backend)

```bash
cd backend

# JWT handling (elegir UNA opción):

# OPCIÓN A: jsonwebtoken (tradicional, Node.js)
npm install jsonwebtoken @types/jsonwebtoken

# OPCIÓN B: jose (moderno, Edge Runtime compatible)
# npm install jose

# Redis client (cuando actives Redis en Etapa 2)
# npm install ioredis @types/ioredis

# Socket.io (cuando actives WebSocket en Etapa 3)
# npm install socket.io @socket.io/redis-adapter
```

## Verificar instalación

```bash
# Backend
cd backend
npm list jsonwebtoken
npm list ioredis  # Si ya instalaste Redis

# Frontend (ya debería estar todo)
cd ../frontend
npm list
```

## Estado actual

✅ **LISTO SIN INSTALAR NADA EXTRA:**
- Rate Limiter (in-memory)
- Cache (in-memory LRU)
- Security headers
- Middleware

⚠️ **REQUIERE INSTALACIÓN:**
- Session Manager → `npm install jsonwebtoken @types/jsonwebtoken`

🔮 **FUTURO (Etapa 2+):**
- Redis → `npm install ioredis @types/ioredis`
- WebSocket → `npm install socket.io @socket.io/redis-adapter`

## Instalación rápida (todo de una vez)

```bash
cd backend
npm install jsonwebtoken @types/jsonwebtoken
```

## Deploy en Render

El código ya está preparado. Render ejecutará `npm install` automáticamente al deployar.

Asegúrate de tener en Render env vars:
```bash
JWT_SECRET=tu-secret-super-seguro-minimo-32-caracteres
DATABASE_URL=postgresql://...
# REDIS_ENABLED=false  # Por ahora
# REDIS_URL=redis://...  # Cuando actives Redis
```

## Próximos pasos

1. **Instalar jsonwebtoken:**
   ```bash
   cd backend
   npm install jsonwebtoken @types/jsonwebtoken
   ```

2. **Commit cambios:**
   ```bash
   git add .
   git commit -m "feat: Add scalable architecture (memory↔Redis ready)"
   git push
   ```

3. **Aplicar índices BD:**
   ```bash
   psql $DATABASE_URL < database/migrations/INDEXES_PRODUCTION_REQUIRED.sql
   ```

4. **Monitorear métricas durante 1 semana**

5. **Cuando >300 users → Activar Redis**
