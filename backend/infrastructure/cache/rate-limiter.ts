/**
 * Rate Limiter Abstracto - Usa Cache Adapter
 * ===========================================
 * Funciona con Memory o Redis sin cambiar código
 * 
 * Estrategias:
 * 1. Sliding Window (preciso, más costoso)
 * 2. Fixed Window (más eficiente, menos preciso)
 * 
 * Uso:
 * const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 100 });
 * const result = await limiter.check(ip);
 * if (!result.allowed) return 429;
 */

import { cache } from './cache-adapter';

export interface RateLimiterConfig {
  windowMs: number;          // Ventana de tiempo en ms
  maxRequests: number;       // Requests máximos en la ventana
  blockDurationMs?: number;  // Tiempo de bloqueo tras exceder (default: windowMs * 15)
  keyPrefix?: string;        // Prefijo para keys de cache
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  blockedUntil?: number;
  reason?: string;
}

export class RateLimiter {
  private config: Required<RateLimiterConfig>;

  constructor(config: RateLimiterConfig) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      blockDurationMs: config.blockDurationMs || (config.windowMs * 15),
      keyPrefix: config.keyPrefix || 'ratelimit',
    };
  }

  /**
   * Verificar si un identificador (IP/userId) puede hacer request
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const blockKey = `${this.config.keyPrefix}:block:${identifier}`;
    const countKey = `${this.config.keyPrefix}:count:${identifier}`;

    // 1. Verificar si está bloqueado
    const blockedUntil = await cache.get<number>(blockKey);
    if (blockedUntil && now < blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: blockedUntil,
        blockedUntil,
        reason: `Bloqueado hasta ${new Date(blockedUntil).toLocaleTimeString()}`,
      };
    }

    // 2. Obtener contador actual
    const currentCount = await cache.get<number>(countKey) || 0;

    // 3. Verificar límite
    if (currentCount >= this.config.maxRequests) {
      // Bloquear
      const blockedUntil = now + this.config.blockDurationMs;
      await cache.set(blockKey, blockedUntil, Math.ceil(this.config.blockDurationMs / 1000));
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: blockedUntil,
        blockedUntil,
        reason: `Límite de ${this.config.maxRequests} requests excedido`,
      };
    }

    // 4. Incrementar contador
    const newCount = await cache.increment(countKey);
    
    // Set TTL en primer request
    if (newCount === 1) {
      await cache.expire(countKey, Math.ceil(this.config.windowMs / 1000));
    }

    return {
      allowed: true,
      remaining: this.config.maxRequests - newCount,
      resetAt: now + this.config.windowMs,
    };
  }

  /**
   * Resetear rate limit de un identifier (útil para testing/admin)
   */
  async reset(identifier: string): Promise<void> {
    const blockKey = `${this.config.keyPrefix}:block:${identifier}`;
    const countKey = `${this.config.keyPrefix}:count:${identifier}`;
    
    await Promise.all([
      cache.delete(blockKey),
      cache.delete(countKey),
    ]);
  }

  /**
   * Stats de un identifier (debugging)
   */
  async getStats(identifier: string): Promise<{ requests: number; blocked: boolean }> {
    const blockKey = `${this.config.keyPrefix}:block:${identifier}`;
    const countKey = `${this.config.keyPrefix}:count:${identifier}`;
    
    const [requests, blocked] = await Promise.all([
      cache.get<number>(countKey),
      cache.exists(blockKey),
    ]);

    return {
      requests: requests || 0,
      blocked,
    };
  }
}

/**
 * Rate Limiters predefinidos (singleton)
 */
export const RateLimiters = {
  // API global: 120 req/min
  api: new RateLimiter({
    windowMs: 60_000,
    maxRequests: 120,
    blockDurationMs: 15 * 60_000, // 15 min
    keyPrefix: 'rl:api',
  }),

  // Upload de imágenes: 10 uploads / 5 min
  upload: new RateLimiter({
    windowMs: 5 * 60_000,
    maxRequests: 10,
    blockDurationMs: 15 * 60_000,
    keyPrefix: 'rl:upload',
  }),

  // Mensajería: 30 mensajes / min
  messages: new RateLimiter({
    windowMs: 60_000,
    maxRequests: 30,
    blockDurationMs: 5 * 60_000,
    keyPrefix: 'rl:msg',
  }),

  // Login/Auth: 5 intentos / 15 min
  auth: new RateLimiter({
    windowMs: 15 * 60_000,
    maxRequests: 5,
    blockDurationMs: 60 * 60_000, // 1 hora
    keyPrefix: 'rl:auth',
  }),

  // Búsquedas: 60 búsquedas / min
  search: new RateLimiter({
    windowMs: 60_000,
    maxRequests: 60,
    blockDurationMs: 5 * 60_000,
    keyPrefix: 'rl:search',
  }),
};

/**
 * Helper para extraer IP del request (Render proxy aware)
 */
export function getClientIP(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}
