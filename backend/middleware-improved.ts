/**
 * Next.js Middleware Mejorado con Rate Limiter Abstracto
 * =======================================================
 * Usa cache adapter (Memory o Redis) sin cambiar código
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RateLimiters, getClientIP } from '@/infrastructure/cache/rate-limiter';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request.headers);

  // ==============================================
  // 1. RATE LIMITING según tipo de request
  // ==============================================
  
  const rateLimitConfig = getRateLimitConfig(pathname);
  
  if (rateLimitConfig) {
    const result = await rateLimitConfig.limiter.check(ip);
    
    if (!result.allowed) {
      console.warn(`[RATE LIMIT] ${rateLimitConfig.name} - IP ${ip} blocked on ${pathname}`);
      
      return NextResponse.json(
        { 
          error: 'Too many requests',
          message: result.reason,
          resetAt: new Date(result.resetAt).toISOString(),
          type: rateLimitConfig.name,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(rateLimitConfig.limiter['config'].maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(result.resetAt),
          },
        }
      );
    }
  }

  // ==============================================
  // 2. SECURITY HEADERS
  // ==============================================
  
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
    'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
  );
  
  // HSTS en producción
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }
  
  // CSP (ajustar según tu app)
  const csp = buildCSP();
  response.headers.set('Content-Security-Policy-Report-Only', csp);

  // ==============================================
  // 3. CORS PREFLIGHT
  // ==============================================
  
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin');
    const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    if (origin === allowedOrigin) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
  }

  return response;
}

/**
 * Mapeo de rutas a rate limiters específicos
 */
function getRateLimitConfig(pathname: string): { name: string; limiter: any } | null {
  // Health check: Sin rate limit
  if (pathname.includes('/health')) {
    return null;
  }

  // Upload de imágenes: 10 uploads / 5 min
  if (pathname.includes('/upload') || pathname.includes('/cloudinary')) {
    return { name: 'upload', limiter: RateLimiters.upload };
  }

  // Mensajería: 30 mensajes / min
  if (pathname.includes('/messages') || pathname.includes('/chat')) {
    return { name: 'messages', limiter: RateLimiters.messages };
  }

  // Auth: 5 intentos / 15 min
  if (pathname.includes('/auth') || pathname.includes('/login')) {
    return { name: 'auth', limiter: RateLimiters.auth };
  }

  // Búsquedas: 60 búsquedas / min
  if (pathname.includes('/search') || pathname.includes('/ads')) {
    return { name: 'search', limiter: RateLimiters.search };
  }

  // API general: 120 req / min
  if (pathname.startsWith('/api')) {
    return { name: 'api', limiter: RateLimiters.api };
  }

  return null;
}

/**
 * Content Security Policy
 */
function buildCSP(): string {
  const csp = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': [
      "'self'",
      'https://lmkuecdvxtenrikjomol.supabase.co',
      'https://rural24.onrender.com',
      'https://res.cloudinary.com',
    ],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };

  return Object.entries(csp)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
