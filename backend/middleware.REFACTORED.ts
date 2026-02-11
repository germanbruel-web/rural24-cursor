/**
 * Next.js Global Middleware - REFACTORED VERSION
 * ===============================================
 * Usa abstracciones desacoplables preparadas para Redis
 * 
 * ✅ VENTAJAS vs middleware.ts original:
 * 1. Rate limiter swap Memory ↔ Redis sin cambiar código
 * 2. Código más limpio y mantenible
 * 3. Preparado para escalar horizontalmente
 * 4. Mismo comportamiento actual (Memory por defecto)
 * 
 * 🔄 PARA MIGRAR:
 * 1. Rename: middleware.ts → middleware.OLD.ts
 * 2. Rename: middleware.REFACTORED.ts → middleware.ts
 * 3. Test en dev
 * 4. Deploy
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RateLimiters } from '@/infrastructure/rate-limit/rate-limiter-adapter';

/**
 * Middleware ejecutado en TODAS las requests
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);

  // ===========================================
  // 1. RATE LIMITING GLOBAL (con abstracción)
  // ===========================================
  
  // Excluir health check y paths públicos
  const shouldRateLimit = 
    pathname.startsWith('/api') && 
    !pathname.includes('/health') &&
    !pathname.includes('/api/config/');

  if (shouldRateLimit) {
    // Usar rate limiter pre-configurado (Memory o Redis según env)
    const limitCheck = await RateLimiters.api.check(ip);
    
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
  
  // XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=()'
  );
  
  // HSTS (solo en producción)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // CSP (report-only mode - validar sin romper)
  const csp = buildCSP();
  response.headers.set('Content-Security-Policy-Report-Only', csp);

  // ===========================================
  // 3. CORS PREFLIGHT
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
          'Access-Control-Max-Age': '86400',
        },
      });
    }
  }

  return response;
}

/**
 * Content Security Policy
 */
function buildCSP(): string {
  const csp = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      'https://aistudiocdn.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
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
 * Extrae IP real (Render usa X-Forwarded-For)
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Configuración de paths
 */
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
