/**
 * Next.js Global Middleware
 * ==========================
 * Aplica seguridad y rate limiting a TODAS las requests
 * 
 * Funciones:
 * 1. Security Headers (X-Frame-Options, CSP, etc.)
 * 2. Rate Limiting global por IP (120 req/min)
 * 3. CORS preflight handling
 * 4. Request logging
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate Limiter In-Memory (simple sliding window)
interface RateLimitEntry {
  requests: number[];
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 min
const RATE_LIMIT_MAX_REQUESTS = 120; // 120 req/min
const BLOCK_DURATION = 15 * 60 * 1000; // 15 min block

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number; reason?: string } {
  const now = Date.now();
  let entry = rateLimitStore.get(ip);

  // Si está bloqueado, verificar si ya pasó el tiempo
  if (entry?.blockedUntil) {
    if (now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        reason: `Bloqueado hasta ${new Date(entry.blockedUntil).toLocaleTimeString()}`
      };
    }
    // Desbloquear
    entry = { requests: [] };
    rateLimitStore.set(ip, entry);
  }

  // Inicializar si no existe
  if (!entry) {
    entry = { requests: [] };
    rateLimitStore.set(ip, entry);
  }

  // Limpiar requests fuera de la ventana
  entry.requests = entry.requests.filter(timestamp => (now - timestamp) < RATE_LIMIT_WINDOW);

  // Verificar límite
  if (entry.requests.length >= RATE_LIMIT_MAX_REQUESTS) {
    entry.blockedUntil = now + BLOCK_DURATION;
    rateLimitStore.set(ip, entry);
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
      reason: `Límite de ${RATE_LIMIT_MAX_REQUESTS} req/min excedido. Bloqueado por 15 minutos`
    };
  }

  // Registrar request
  entry.requests.push(now);
  rateLimitStore.set(ip, entry);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.requests.length,
    resetAt: now + RATE_LIMIT_WINDOW
  };
}

// Cleanup cada 10 minutos
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (entry.requests.length === 0 && (!entry.blockedUntil || now > entry.blockedUntil)) {
      rateLimitStore.delete(ip);
    }
  }
}, 10 * 60 * 1000);

/**
 * Middleware ejecutado en TODAS las requests
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);

  // ===========================================
  // 1. RATE LIMITING GLOBAL
  // ===========================================
  
  // Excluir health check y paths públicos de rate limiting
  const shouldRateLimit = 
    pathname.startsWith('/api') && 
    !pathname.includes('/health') &&
    !pathname.includes('/api/config/');

  if (shouldRateLimit) {
    const limitCheck = checkRateLimit(ip);
    
    if (!limitCheck.allowed) {
      console.warn(`[RATE LIMIT] IP ${ip} blocked on ${pathname}`);
      
      return NextResponse.json(
        { 
          error: 'Too many requests',
          message: limitCheck.reason,
          resetAt: new Date(limitCheck.resetAt).toISOString(),
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((limitCheck.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(limitCheck.resetAt),
          },
        }
      );
    }
  }

  // ===========================================
  // 2. SECURITY HEADERS
  // ===========================================
  
  const response = NextResponse.next();
  
  // Anti-clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevenir MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // XSS protection (legacy, pero no hace daño)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy (no enviar datos sensibles en referrer)
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy (deshabilitar APIs peligrosas)
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=()'
  );
  
  // HSTS (forzar HTTPS en producción)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // Content Security Policy (modo report-only por ahora)
  // Después de validar sin errores, cambiar a 'Content-Security-Policy'
  const csp = buildCSP();
  response.headers.set('Content-Security-Policy-Report-Only', csp);

  // ===========================================
  // 3. CORS PREFLIGHT (OPTIONS)
  // ===========================================
  
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin');
    const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    if (origin === allowedOrigin) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400', // 24 horas
        },
      });
    }
  }

  return response;
}

/**
 * Content Security Policy
 * Ajustar según tus necesidades específicas
 */
function buildCSP(): string {
  const csp = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // TODO: Remover después de migrar scripts inline
      "'unsafe-eval'",   // TODO: Necesario para Vite en dev, remover en prod
      'https://aistudiocdn.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Tailwind usa inline styles
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'blob:',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      'https://lmkuecdvxtenrikjomol.supabase.co',
      'https://rural24.onrender.com',
      'https://res.cloudinary.com',
    ],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': [],
  };

  return Object.entries(csp)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Extrae IP real del cliente (considerando proxies de Render)
 */
function getClientIP(request: NextRequest): string {
  // Render usa X-Forwarded-For
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Otras alternativas
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback
  return 'unknown';
}

/**
 * Configuración de paths que ejecutan este middleware
 * Por defecto: todas las rutas API
 */
export const config = {
  matcher: [
    // Todas las API routes
    '/api/:path*',
    // Excluir static files y Next.js internals
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
