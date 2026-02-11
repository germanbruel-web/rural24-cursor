/**
 * Next.js Global Middleware - REFACTORED
 * =======================================
 * Usa abstracciones desacopladas para fácil swap Memory ↔ Redis
 * 
 * Funciones:
 * 1. Rate Limiting (via adapter: memory o Redis)
 * 2. Security Headers (X-Frame-Options, CSP, etc.)
 * 3. CORS preflight handling
 * 4. Request logging
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { initRateLimiter, getRateLimiter } from '@/infrastructure/rate-limiter-adapter';

// Inicializar Rate Limiter al startup (singleton)
// Auto-detecta Redis si process.env.REDIS_ENABLED='true'
initRateLimiter({
  windowMs: 60 * 1000, // 1 min
  maxRequests: 120, // 120 req/min
  blockDuration: 15 * 60 * 1000, // 15 min block
  // redisClient: redisClient, // Descomentar cuando tengas Redis
});

/**
 * Middleware ejecutado en TODAS las requests
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);

  // ===========================================
  // 1. RATE LIMITING GLOBAL (via adapter)
  // ===========================================
  
  const rateLimiter = getRateLimiter();
  
  // Excluir health check y paths públicos de rate limiting
  const shouldRateLimit = 
    pathname.startsWith('/api') && 
    !pathname.includes('/health') &&
    !pathname.includes('/api/config/');

  if (shouldRateLimit) {
    const limitCheck = await rateLimiter.check(ip);
    
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
            'X-RateLimit-Limit': '120',
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
