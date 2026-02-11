# 🏗️ ARQUITECTURA ESCALABLE RURAL24 - Roadmap Técnico

## 📊 RESUMEN EJECUTIVO

**Objetivo:** Escalar de 0 a +1500 usuarios concurrentes sin refactor mayor

**Stack:** Next.js API + PostgreSQL (Supabase/Render) + Deploy en Render

**Estrategia:** Stateless + Abstracciones + Progressive Enhancement

---

## 🎯 ETAPA 1: MVP & Early Growth (0-300 usuarios concurrentes)

### **📈 Métricas de Entrada**
- Usuarios registrados: < 5,000
- Usuarios concurrentes pico: 50-300
- RPS (Requests/seg): 10-50 RPS
- Conexiones DB concurrentes: 5-15
- Uptime requerido: 99% (downtime aceptable en madrugada)

### **🏛️ Arquitectura**

```
┌─────────────────────────────────────────────────────────┐
│                    RENDER STARTER                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │   Next.js API (1 instancia)                       │  │
│  │   - Rate Limiter: Memory                          │  │
│  │   - Cache: Memory (opcional)                      │  │
│  │   - Sessions: JWT (stateless)                     │  │
│  └──────────────┬────────────────────────────────────┘  │
│                 │                                         │
│  ┌──────────────▼────────────────────────────────────┐  │
│  │   PostgreSQL (Render Managed DB)                  │  │
│  │   - Conexiones: 10-20 pool                        │  │
│  │   - Storage: 5-10 GB                              │  │
│  │   - Índices: Todos los obligatorios               │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### **💻 Stack Tecnológico**

```typescript
// .env.production
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-here
SESSION_STRATEGY=jwt  # Stateless
REDIS_ENABLED=false   # Sin Redis todavía
FRONTEND_URL=https://rural24-1.onrender.com
```

### **🔧 Implementación**

#### **Rate Limiting**
```typescript
// backend/app/api/example/route.ts
import { RateLimiters } from '@/infrastructure/rate-limit/rate-limiter-adapter';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  // Rate limit por IP (120 req/min)
  const limitCheck = await RateLimiters.api.check(ip);
  if (!limitCheck.allowed) {
    return Response.json(
      { error: 'Too many requests', resetAt: limitCheck.resetAt },
      { status: 429 }
    );
  }

  // Procesar request...
  return Response.json({ success: true });
}
```

#### **Sessions (JWT Stateless)**
```typescript
// backend/app/api/auth/login/route.ts
import { sessions } from '@/infrastructure/session/session-adapter';

export async function POST(request: Request) {
  const { email, password } = await request.json();
  
  // Validar credenciales (bcrypt)
  const user = await validateUser(email, password);
  if (!user) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Crear JWT session (stateless, sin DB)
  const token = await sessions.create(user.id, {
    email: user.email,
    role: user.role
  }, 7 * 24 * 3600); // 7 días

  return Response.json({
    token,
    user: { id: user.id, email: user.email, role: user.role }
  });
}
```

#### **Cache Opcional (Memory)**
```typescript
// backend/services/categoryService.ts
import { cache } from '@/infrastructure/cache/cache-adapter';

export async function getCategories() {
  // Intentar obtener de cache
  const cached = await cache.get<Category[]>('categories:all');
  if (cached) return cached;

  // Si no existe, consultar DB
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' }
  });

  // Cachear por 1 hora
  await cache.set('categories:all', categories, 3600);
  return categories;
}
```

### **⚠️ Limitaciones Etapa 1**
- ❌ Rate limiter NO compartido entre instancias (si escalás a 2+ dynos)
- ❌ Sessions JWT NO se pueden revocar inmediatamente
- ❌ Cache en memoria NO sincroniza entre instancias
- ✅ Suficiente para 1 instancia y tráfico bajo-medio

### **🚨 Señales de Cambio a Etapa 2**
1. **Usuarios concurrentes > 200** (picos constantes)
2. **RPS > 40** sostenido por +5 minutos
3. **Conexiones DB > 15** durante picos
4. **Response time > 500ms** en percentil p95
5. **CPU > 70%** durante horas pico
6. **Necesidad de 2+ instancias** para disponibilidad

---

## 🚀 ETAPA 2: Growth & Scale (300-1500 usuarios concurrentes)

### **📈 Métricas de Entrada**
- Usuarios registrados: 5,000 - 50,000
- Usuarios concurrentes pico: 300-1500
- RPS (Requests/seg): 50-300 RPS
- Conexiones DB concurrentes: 15-50
- Uptime requerido: 99.5% (downtime solo maintenance)

### **🏛️ Arquitectura**

```
┌──────────────────────────────────────────────────────────────┐
│                      RENDER STANDARD                          │
│                                                                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │  Next.js API   │  │  Next.js API   │  │  Next.js API   │ │
│  │  Instance 1    │  │  Instance 2    │  │  Instance 3    │ │
│  │  (Stateless)   │  │  (Stateless)   │  │  (Stateless)   │ │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘ │
│          │                   │                    │           │
│          └───────────────────┼────────────────────┘           │
│                              │                                │
│         ┌────────────────────▼─────────────────────┐         │
│         │  Redis (Upstash/Render Redis Add-on)     │         │
│         │  - Rate Limiter compartido                │         │
│         │  - Cache compartido                       │         │
│         │  - Sessions (opcional)                    │         │
│         └────────────────────┬─────────────────────┘         │
│                              │                                │
│         ┌────────────────────▼─────────────────────┐         │
│         │  PostgreSQL (Render Pro/Supabase Pro)    │         │
│         │  - 50-100 conexiones pool                 │         │
│         │  - Read replicas (opcional)               │         │
│         │  - Storage: 20-50 GB                      │         │
│         └───────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

### **💻 Stack Tecnológico**

```typescript
// .env.production ETAPA 2
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_ENABLED=true          # 🔴 ACTIVAR REDIS
REDIS_URL=redis://...       # Upstash o Render Redis
JWT_SECRET=your-secret-here
SESSION_STRATEGY=redis      # Cambiar a Redis sessions
FRONTEND_URL=https://rural24-1.onrender.com
```

### **🔧 Cambios Implementación**

#### **ANTES (Etapa 1 - Memory)**
```typescript
// .env
REDIS_ENABLED=false
```

#### **DESPUÉS (Etapa 2 - Redis) - CERO CAMBIOS DE CÓDIGO** ✅
```typescript
// .env
REDIS_ENABLED=true
REDIS_URL=redis://default:password@host:port
```

**Resultado:** Los adapters automáticamente usan Redis sin cambiar una línea de código.

### **📊 Mejoras de Performance**

| Métrica | Etapa 1 (Memory) | Etapa 2 (Redis) | Mejora |
|---------|------------------|-----------------|--------|
| Rate Limit Latency | 0.1ms | 0.5ms | Compartido ✅ |
| Cache Hit Rate | 40-60% | 80-95% | +40% ✅ |
| Session Lookup | 0ms (JWT) | 1-2ms (Redis) | Revocable ✅ |
| Auth Revocación | ❌ No soportado | ✅ Instantánea | - |
| Escalamiento | ❌ 1 instancia | ✅ N instancias | Infinito ✅ |

### **🔧 Features Desbloqueados**

#### **1. Revocación de Sesiones**
```typescript
// backend/app/api/auth/logout-all-devices/route.ts
import { sessions } from '@/infrastructure/session/session-adapter';

export async function POST(request: Request) {
  const user = await getCurrentUser(request);
  
  // Revocar TODAS las sesiones del usuario
  await sessions.destroyAll(user.id);
  
  return Response.json({ success: true });
}
```

#### **2. Rate Limiting Compartido**
```typescript
// Automáticamente funciona entre todas las instancias
// Sin cambios de código - solo activar REDIS_ENABLED=true
```

#### **3. Cache Distribuido**
```typescript
// backend/services/searchService.ts
import { cache } from '@/infrastructure/cache/cache-adapter';

export async function searchAds(filters: SearchFilters) {
  const cacheKey = `search:${JSON.stringify(filters)}`;
  
  // Cache compartido entre TODAS las instancias
  const cached = await cache.get<Ad[]>(cacheKey);
  if (cached) return cached;

  const results = await prisma.ad.findMany({ /* ... */ });
  await cache.set(cacheKey, results, 300); // 5 min
  
  return results;
}
```

#### **4. Real-time Notifications (Pub/Sub)**
```typescript
// backend/services/notificationService.ts
import { createClient } from 'redis';

const publisher = createClient({ url: process.env.REDIS_URL });
const subscriber = createClient({ url: process.env.REDIS_URL });

// Publicar notificación
export async function notifyUser(userId: string, message: string) {
  await publisher.publish(`user:${userId}:notifications`, JSON.stringify({
    message,
    timestamp: Date.now()
  }));
}

// Subscribirse a notificaciones (WebSocket server)
export async function subscribeToUserNotifications(userId: string, callback: (msg: string) => void) {
  await subscriber.subscribe(`user:${userId}:notifications`, (message) => {
    callback(message);
  });
}
```

### **⚠️ Limitaciones Etapa 2**
- ⚠️ Redis añade latencia (0.5-2ms por operación)
- ⚠️ Redis puede ser single point of failure (usar persistencia)
- ⚠️ Costo adicional ($10-30/mes por Redis)
- ✅ Escala horizontalmente sin límite teórico

### **🚨 Señales de Cambio a Etapa 3**
1. **Usuarios concurrentes > 1000** sostenido
2. **RPS > 200** durante horas
3. **Conexiones DB > 40** constante
4. **Redis memory > 100 MB**
5. **Chat en tiempo real** con +500 usuarios simultáneos
6. **Latencia DB > 50ms** (considerar read replicas)

---

## 🌟 ETAPA 3: Enterprise Scale (+1500 usuarios concurrentes)

### **📈 Métricas de Entrada**
- Usuarios registrados: 50,000+
- Usuarios concurrentes pico: 1500-5000+
- RPS (Requests/seg): 300-1000+ RPS
- Conexiones DB concurrentes: 50-150
- Uptime requerido: 99.9% (SLA crítico)

### **🏛️ Arquitectura**

```
┌─────────────────────────────────────────────────────────────────────┐
│                     RENDER PRO / CLOUD PLATFORM                      │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                   Load Balancer (Render)                        │ │
│  └──────────────────────────┬──────────────────────────────────────┘ │
│                             │                                         │
│  ┌──────────────────────────▼──────────────────────────────────────┐ │
│  │            Next.js API Auto-Scaling (3-10+ instancias)          │ │
│  └──────────────────────────┬──────────────────────────────────────┘ │
│                             │                                         │
│         ┌───────────────────┼────────────────────┐                   │
│         │                   │                    │                   │
│  ┌──────▼──────┐   ┌────────▼────────┐   ┌──────▼─────────┐        │
│  │   Redis     │   │   PostgreSQL    │   │   CDN          │        │
│  │  Cluster    │   │   Primary +     │   │  (Cloudflare)  │        │
│  │  (HA mode)  │   │   Read Replica  │   │                │        │
│  └─────────────┘   └─────────────────┘   └────────────────┘        │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Optional: Message Queue (BullMQ + Redis)                    │   │
│  │  - Background jobs                                            │   │
│  │  - Email processing                                           │   │
│  │  - Image optimization                                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
```

### **🔧 Optimizaciones Adicionales**

#### **1. Database Read Replicas**
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // Primary (writes)
  // Read replica
  directUrl = env("DATABASE_READ_URL")
}
```

```typescript
// backend/services/adService.ts
import { PrismaClient } from '@prisma/client';

const prismaRead = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_READ_URL } }
});

export async function searchAds(filters: SearchFilters) {
  // Leer de replica (reduce load en primary)
  return await prismaRead.ad.findMany({
    where: buildWhereClause(filters),
    orderBy: { createdAt: 'desc' },
    take: 50
  });
}
```

#### **2. Connection Pooling Agresivo**
```typescript
// backend/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: `${process.env.DATABASE_URL}?connection_limit=20&pool_timeout=30`
      }
    }
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

#### **3. Background Jobs con BullMQ**
```typescript
// backend/queue/email-queue.ts
import { Queue, Worker } from 'bullmq';

const emailQueue = new Queue('emails', {
  connection: { url: process.env.REDIS_URL }
});

// Agregar job
export async function sendWelcomeEmail(userId: string, email: string) {
  await emailQueue.add('welcome', { userId, email }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }
  });
}

// Worker
const worker = new Worker('emails', async (job) => {
  const { userId, email } = job.data;
  await sendEmailViaProvider(email, 'welcome-template');
}, {
  connection: { url: process.env.REDIS_URL }
});
```

#### **4. API Response Caching con CDN**
```typescript
// backend/app/api/ads/[id]/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const ad = await getAdById(params.id);
  
  return Response.json(ad, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'CDN-Cache-Control': 'max-age=600'
    }
  });
}
```

### **📊 Performance Target**

| Métrica | Target | Herramienta Medición |
|---------|--------|---------------------|
| Response Time p50 | < 100ms | Datadog, New Relic |
| Response Time p95 | < 300ms | Datadog, New Relic |
| Response Time p99 | < 1000ms | Datadog, New Relic |
| Uptime | 99.9% | UptimeRobot, Pingdom |
| Error Rate | < 0.1% | Sentry, Rollbar |
| DB Query Time | < 50ms | pg_stat_statements |
| Redis Latency | < 2ms | redis-cli --latency |

---

## 🔥 PUNTO DE QUIEBRE: ¿Cuándo SÍ necesito Redis?

### **✅ Necesitas Redis INMEDIATAMENTE si:**

1. **Múltiples instancias de API**
   - Tienes o planeas tener 2+ instancias simultáneas
   - Auto-scaling activado en Render

2. **Rate Limiting crítico**
   - Ataques DDoS frecuentes
   - Necesitas límites compartidos entre instancias

3. **Sessions revocables**
   - Logout desde todos los dispositivos
   - Bloqueo instantáneo de usuarios

4. **Chat en tiempo real**
   - WebSockets con pub/sub
   - Notificaciones push

5. **Cache de alto volumen**
   - > 1000 búsquedas/min
   - Cache invalidation sincronizada

### **⚠️ Puedes esperar sin Redis si:**

1. **1 instancia única**
   - Render Starter con 1 dyno
   - Usuarios concurrentes < 200

2. **JWT stateless suficiente**
   - No necesitas revocar sesiones inmediatamente
   - Token expira en 7-30 días

3. **Rate limiting básico**
   - Solo prevenir spam, no DDoS
   - Memory rate limiter OK

4. **Sin real-time**
   - No hay chat
   - No hay notificaciones push

### **📊 Métricas Concretas para Activar Redis**

| Métrica | Sin Redis OK | Redis Recomendado | Redis Obligatorio |
|---------|--------------|-------------------|-------------------|
| Usuarios concurrentes | < 200 | 200-500 | > 500 |
| RPS | < 40 | 40-100 | > 100 |
| Instancias API | 1 | 2 | 3+ |
| Cache hit rate | < 50% | 50-70% | > 70% |
| Session revocations/día | 0-10 | 10-100 | > 100 |
| WebSocket connections | 0 | 50-200 | > 200 |

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

### **✅ Fase Inicial (Antes de lanzar)**
- [ ] Ejecutar `INDEXES_PRODUCTION.sql` en PostgreSQL
- [ ] Configurar `JWT_SECRET` en .env
- [ ] Habilitar CORS correcto en Next.js config
- [ ] Implementar rate limiting en endpoints sensibles
- [ ] Configurar cache de categorías/settings
- [ ] Setup monitoring básico (Render dashboard)

### **✅ Antes de Escalar (Etapa 1 → 2)**
- [ ] Contratar Redis (Upstash Serverless o Render Redis)
- [ ] Cambiar `REDIS_ENABLED=true` en .env
- [ ] Activar auto-scaling en Render (2-3 instancias)
- [ ] Migrar sessions de JWT a Redis (opcional)
- [ ] Implementar health checks `/api/health`
- [ ] Configurar alertas de latencia/errores

### **✅ Escala Enterprise (Etapa 2 → 3)**
- [ ] Contratar PostgreSQL Pro con read replicas
- [ ] Redis Cluster (HA mode)
- [ ] CDN para assets estáticos (Cloudflare)
- [ ] Background jobs con BullMQ
- [ ] Monitoreo avanzado (Datadog/New Relic)
- [ ] Disaster recovery plan

---

## 🎓 Ejemplos de Uso Real

### **Ejemplo 1: Endpoint de Búsqueda Optimizado**

```typescript
// backend/app/api/ads/search/route.ts
import { NextRequest } from 'next/server';
import { RateLimiters } from '@/infrastructure/rate-limit/rate-limiter-adapter';
import { cache } from '@/infrastructure/cache/cache-adapter';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  // 1. RATE LIMITING
  const limitCheck = await RateLimiters.search.check(ip);
  if (!limitCheck.allowed) {
    return Response.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  // 2. PARSEAR FILTROS
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const province = url.searchParams.get('province');
  const page = parseInt(url.searchParams.get('page') || '1');

  // 3. CACHE KEY
  const cacheKey = `search:${category}:${province}:${page}`;

  // 4. INTENTAR CACHE
  const cached = await cache.get<any[]>(cacheKey);
  if (cached) {
    return Response.json({ results: cached, cached: true });
  }

  // 5. QUERY OPTIMIZADA (usa índices)
  const results = await prisma.ad.findMany({
    where: {
      status: 'active',
      deletedAt: null,
      ...(category && { category }),
      ...(province && { province })
    },
    select: {
      id: true,
      title: true,
      price: true,
      images: { select: { url: true }, take: 1 },
      user: { select: { id: true, name: true } }
    },
    orderBy: [
      { isFeatured: 'desc' },
      { createdAt: 'desc' }
    ],
    skip: (page - 1) * 50,
    take: 50
  });

  // 6. CACHEAR RESULTADO (5 minutos)
  await cache.set(cacheKey, results, 300);

  // 7. RESPUESTA CON CACHE HEADERS
  return Response.json(
    { results, cached: false },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    }
  );
}
```

### **Ejemplo 2: Sistema de Mensajería Stateless**

```typescript
// backend/app/api/messages/send/route.ts
import { RateLimiters } from '@/infrastructure/rate-limit/rate-limiter-adapter';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const user = await getCurrentUser(request); // Desde JWT
  const { recipientId, content, adId } = await request.json();

  // Rate limit: 30 mensajes/min
  const limitCheck = await RateLimiters.messages.check(user.id);
  if (!limitCheck.allowed) {
    return Response.json({ error: 'Too many messages' }, { status: 429 });
  }

  // Crear mensaje en DB (single source of truth)
  const message = await prisma.message.create({
    data: {
      senderId: user.id,
      recipientId,
      content,
      adId,
      isRead: false
    }
  });

  // Notificar vía WebSocket (si Redis está activo)
  if (process.env.REDIS_ENABLED === 'true') {
    const { createClient } = await import('redis');
    const redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
    await redis.publish(`user:${recipientId}:messages`, JSON.stringify({
      messageId: message.id,
      from: user.name,
      preview: content.substring(0, 50)
    }));
    await redis.quit();
  }

  return Response.json({ success: true, messageId: message.id });
}
```

---

## 🚀 CONCLUSIÓN

### **TL;DR - Implementación por Etapas**

| Característica | Etapa 1 (0-300) | Etapa 2 (300-1500) | Etapa 3 (1500+) |
|----------------|-----------------|--------------------|--------------------|
| **Deploy** | 1 instancia | 2-3 instancias | Auto-scaling 3-10+ |
| **Rate Limiter** | Memory | Redis | Redis Cluster |
| **Cache** | Memory (opcional) | Redis | Redis + CDN |
| **Sessions** | JWT stateless | Redis | Redis HA |
| **Database** | PostgreSQL Starter | PostgreSQL Pro | Pro + Read Replicas |
| **Monitoring** | Render Dashboard | + Sentry | + Datadog/NewRelic |
| **Costo mensual** | $7-15 | $50-100 | $200-500+ |

### **🎯 Recomendación Inmediata**

1. **Implementar AHORA:**
   - ✅ Abstracciones ya creadas (rate-limiter-adapter, cache-adapter, session-adapter)
   - ✅ Índices PostgreSQL (`INDEXES_PRODUCTION.sql`)
   - ✅ JWT sessions (stateless)
   - ✅ Rate limiting in-memory

2. **Preparar para activar SIN CÓDIGO:**
   ```bash
   # Cuando llegues a 200+ usuarios concurrentes
   REDIS_ENABLED=true
   REDIS_URL=redis://...
   ```

3. **Monitorear métricas clave:**
   - Usuarios concurrentes (Render dashboard)
   - Response time p95 (Sentry)
   - Conexiones DB (Supabase dashboard)
   - Error rate (Sentry)

**La arquitectura está lista. Solo activá Redis cuando las métricas lo indiquen.** 🚀
