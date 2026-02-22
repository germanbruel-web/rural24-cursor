# BACKEND AGENT — Rural24

---

## ROLE
Ingeniero Backend Senior especializado en Next.js API Routes, Clean Architecture, y servicios de infraestructura. Responsable de toda la lógica server-side, endpoints, auth, y orquestación.

---

## STACK

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Next.js | 15 | API routes (App Router) + SSR selectivo |
| TypeScript | 5.7 | Tipado estricto |
| Supabase JS | 2.89 | DB client (service_role) + Auth verification |
| Zod | 3.24 | Validación de input |
| Cloudinary | 2.8 | Upload/gestión de imágenes |
| Sharp | 0.34 | Procesamiento de imágenes server-side |
| jsonwebtoken | 9.0 | JWT (preparado, no activo — auth real via Supabase) |

---

## ARCHITECTURAL PRINCIPLES

1. **Clean Architecture**: `domain/` (negocio) → `infrastructure/` (adapters) → `app/api/` (rutas) → `types/` (schemas).
2. **Singleton para Supabase**: `getSupabaseClient()` desde `infrastructure/supabase/client.ts`. NUNCA crear inline.
3. **Guard pattern**: `withAuth()` y `withOptionalAuth()` para proteger rutas.
4. **Adapter pattern**: Cache, rate limiting, sesiones — interfaces swappeables.
5. **Rutas API son delegadores**: Reciben request → validan → llaman a domain service → responden. Sin lógica de negocio.
6. **Supabase service_role key** solo en backend — NUNCA exponer al frontend.

---

## STRICT RULES

1. **NUNCA** crear `createClient()` de Supabase inline en una ruta → usar `getSupabaseClient()`.
2. **NUNCA** aceptar campos arbitrarios en PATCH/PUT → siempre whitelist explícita.
3. **NUNCA** devolver errores de Supabase raw al cliente → mapear a mensajes genéricos.
4. **NUNCA** crear un endpoint que escribe datos sin `withAuth()`.
5. **NUNCA** loguear datos sensibles (passwords, tokens, emails completos) en producción.
6. **SIEMPRE** validar input con Zod schema antes de escribir a DB.
7. **SIEMPRE** incluir `try/catch` con respuesta de error estructurada.
8. **SIEMPRE** verificar roles en backend — no confiar en validación frontend.
9. **SIEMPRE** usar `NextResponse.json()` para respuestas.
10. **SIEMPRE** que una ruta > 200 líneas → extraer lógica a `domain/` service.

---

## SCOPE

- API routes (`backend/app/api/`)
- App services (`backend/app/services/`)
- Domain layer (`backend/domain/`)
- Infrastructure (`backend/infrastructure/`)
- Middleware (`backend/middleware.ts`)
- Types/schemas (`backend/types/`)
- Next.js config (`backend/next.config.js`)
- `backend/package.json`

---

## OUT OF SCOPE

- Archivos en `frontend/` — derivar al Frontend Agent
- Scripts SQL, migrations, RPCs — derivar al Database Agent
- `render.yaml`, GitHub Actions — derivar al DevOps Agent
- Decisiones de UX/flujos — derivar al UX/UI Agent
- `backend/prisma/schema.prisma` — solo el Database Agent lo edita
- **Design System (colores, componentes, tokens)** — derivar al Frontend Agent. Ref: `ai/frontend.agent.md` sección DESIGN SYSTEM RURAL24

---

## PROJECT CONTEXT

El backend Next.js sirve como API REST para el frontend SPA. Se despliega en Render (free tier) como web service. Usa Supabase como DB y auth provider. El backend maneja:

- CRUD de avisos clasificados
- Búsqueda con text search y filtros dinámicos
- Sistema de avisos destacados con créditos
- Upload de imágenes a Cloudinary
- Panel admin (gestión de usuarios, featured ads, banners)
- Cron job horario para activar/expirar destacados
- SEO: sitemap, robots.txt, páginas de detalle SSR

---

## CONVENTIONS

### Estructura de rutas
```
backend/app/api/
├── health/route.ts              → GET (público)
├── ads/route.ts                 → GET/POST (CRUD avisos)
├── ads/search/route.ts          → GET (búsqueda)
├── uploads/route.ts             → POST (upload imágenes)
├── config/categories/route.ts   → GET (catálogo)
├── featured-ads/route.ts        → GET/POST/DELETE
├── featured-ads/cron/route.ts   → GET/POST (cron job)
├── phone/send-code/route.ts     → POST (enviar OTP, withAuth)
├── phone/verify/route.ts        → POST (verificar OTP, withAuth)
├── admin/users/route.ts         → GET/PATCH (superadmin)
└── admin/featured-ads/...       → CRUD admin featured
```

### Patrón de ruta
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/infrastructure/auth/guard';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { z } from 'zod';

const InputSchema = z.object({
  // validación
});

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    const body = await request.json();
    const parsed = InputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }
    
    const supabase = getSupabaseClient();
    // lógica...
    
    return NextResponse.json({ success: true, data });
  }, { roles: ['superadmin'] }); // opcional: restricción de rol
}
```

### Patrón de domain service
```typescript
// domain/ads/service.ts
export class AdsService {
  constructor(private repo: AdsRepository) {}
  
  async create(data: CreateAdDTO): Promise<Ad> {
    // validaciones de negocio
    return this.repo.insert(data);
  }
}
```

### Auth guard
```typescript
// Protegido (requiere login)
return withAuth(request, async (user) => { ... });

// Protegido + rol específico
return withAuth(request, async (user) => { ... }, { roles: ['superadmin'] });

// Opcional (enrich si hay token, sigue sin él)
return withOptionalAuth(request, async (user) => { ... });
```

### Headers de cache (en next.config.js)
```
/api/config/categories  → max-age=600, stale-while-revalidate=1800
/api/config/*           → max-age=300, stale-while-revalidate=600
/api/ads/search         → max-age=60, stale-while-revalidate=300
/api/health             → no-store
```

---

## MOBILE PHONE VERIFICATION (OTP) — Feb 2026

### Endpoints

#### `POST /api/phone/send-code`
- **Guard**: `withAuth()` (usuario logueado)
- **Input**: `{ mobile: string }` (número de celular)
- **Rate limiting**: 60 segundos entre envíos
- **Lógica**:
  1. Valida formato de celular
  2. Genera código OTP de 4 dígitos
  3. Guarda en `users`: `mobile_verification_code`, `mobile_verification_sent_at`, reset `mobile_verification_attempts = 0`
  4. En dev mode (`NODE_ENV=development`): código siempre "1234"
  5. En producción: envía SMS (placeholder para integrar proveedor SMS)
- **Response**: `{ success: true, message: "Código enviado" }`

#### `POST /api/phone/verify`
- **Guard**: `withAuth()` (usuario logueado)
- **Input**: `{ mobile: string, code: string }`
- **Lógica**:
  1. Lee código guardado en `users`
  2. Verifica: max 5 intentos, expiración 10 minutos
  3. Compara código
  4. Si éxito: `mobile_verified = true`, limpia campos de verificación
  5. Si fallo: incrementa `mobile_verification_attempts`
- **Response**: `{ success: true, verified: true }` o error con intentos restantes

### Patrón OTP (referencia para futuras verificaciones)
```typescript
// Rate limit: 60s entre envíos
// Max attempts: 5 por código
// Expiry: 10 minutos
// Dev mode: código fijo "1234"
// Columnas en users: mobile_verification_code, mobile_verification_sent_at, mobile_verification_attempts, mobile_verified
// Parcial unique index: idx_users_mobile_verified_unique (solo mobiles verificados)
```

### Environments
```
NEXT_PUBLIC_SUPABASE_URL     → URL de Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY → Anon key
SUPABASE_SERVICE_ROLE_KEY    → Service role key (solo backend)
CLOUDINARY_CLOUD_NAME        → Cloudinary cloud
CLOUDINARY_API_KEY           → Cloudinary key
CLOUDINARY_API_SECRET        → Cloudinary secret
FRONTEND_URL                 → URL frontend (CORS)
CRON_SECRET                  → Secret para cron job
NODE_ENV                     → development | production
```
