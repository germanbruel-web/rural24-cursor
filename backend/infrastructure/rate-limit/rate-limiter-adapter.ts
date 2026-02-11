/**
 * Rate Limiter Adapter - Abstracción Memory/Redis
 * =================================================
 * Sliding window rate limiting con swap automático
 * 
 * Usage:
 * const limiter = RateLimiterFactory.create('api', { windowMs: 60000, max: 100 });
 * const result = await limiter.check(ip);
 * if (!result.allowed) throw new Error('Rate limit exceeded');
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  totalHits?: number;
  reason?: string;
}

export interface RateLimitOptions {
  windowMs: number;      // Ventana de tiempo en ms
  max: number;           // Máximo de requests por ventana
  blockDuration?: number; // Tiempo de bloqueo en ms (default: 15min)
}

export interface IRateLimiterAdapter {
  check(identifier: string): Promise<RateLimitResult>;
  reset(identifier: string): Promise<void>;
  getStats(): Promise<{ totalKeys: number; blockedKeys: number }>;
}

/**
 * Memory-based Rate Limiter (Stateless entre instancias)
 * ⚠️ WARNING: NO comparte límites entre múltiples instancias
 * ✅ OK para: Etapa 1 (0-300 usuarios, 1 instancia)
 */
class MemoryRateLimiter implements IRateLimiterAdapter {
  private store = new Map<string, { hits: number[]; blockedUntil?: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private namespace: string,
    private options: RateLimitOptions
  ) {
    // Cleanup cada 5 minutos
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const key = `${this.namespace}:${identifier}`;
    const now = Date.now();
    let entry = this.store.get(key);

    // Verificar si está bloqueado
    if (entry?.blockedUntil) {
      if (now < entry.blockedUntil) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: entry.blockedUntil,
          totalHits: entry.hits.length,
          reason: `Blocked until ${new Date(entry.blockedUntil).toISOString()}`
        };
      }
      // Desbloquear
      entry = { hits: [] };
      this.store.set(key, entry);
    }

    // Inicializar si no existe
    if (!entry) {
      entry = { hits: [] };
      this.store.set(key, entry);
    }

    // Limpiar hits fuera de ventana
    const windowStart = now - this.options.windowMs;
    entry.hits = entry.hits.filter(timestamp => timestamp > windowStart);

    // Verificar límite
    if (entry.hits.length >= this.options.max) {
      const blockDuration = this.options.blockDuration || 15 * 60 * 1000;
      entry.blockedUntil = now + blockDuration;
      this.store.set(key, entry);

      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        totalHits: entry.hits.length,
        reason: `Rate limit exceeded: ${this.options.max} requests per ${this.options.windowMs / 1000}s`
      };
    }

    // Registrar hit
    entry.hits.push(now);
    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: this.options.max - entry.hits.length,
      resetAt: now + this.options.windowMs,
      totalHits: entry.hits.length
    };
  }

  async reset(identifier: string): Promise<void> {
    const key = `${this.namespace}:${identifier}`;
    this.store.delete(key);
  }

  async getStats(): Promise<{ totalKeys: number; blockedKeys: number }> {
    let blockedKeys = 0;
    const now = Date.now();

    for (const entry of this.store.values()) {
      if (entry.blockedUntil && entry.blockedUntil > now) {
        blockedKeys++;
      }
    }

    return {
      totalKeys: this.store.size,
      blockedKeys
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = this.options.windowMs * 2;

    for (const [key, entry] of this.store.entries()) {
      // Eliminar si está vacío y no bloqueado
      if (entry.hits.length === 0 && (!entry.blockedUntil || now > entry.blockedUntil)) {
        this.store.delete(key);
        continue;
      }

      // Eliminar si el último hit es muy antiguo
      const lastHit = entry.hits[entry.hits.length - 1];
      if (lastHit && (now - lastHit) > maxAge) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

/**
 * Redis-based Rate Limiter (Compartido entre todas las instancias)
 * ✅ OK para: Etapa 2+ (300+ usuarios, múltiples instancias)
 * 
 * Usa Redis Sorted Sets para sliding window preciso
 */
class RedisRateLimiter implements IRateLimiterAdapter {
  private client: any;

  constructor(
    private namespace: string,
    private options: RateLimitOptions
  ) {
    this.initRedis();
  }

  private async initRedis() {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL not configured');
    }

    try {
      const { createClient } = await import('redis');
      this.client = createClient({ url: process.env.REDIS_URL });
      await this.client.connect();
    } catch (error) {
      console.error('❌ Redis Rate Limiter failed:', error);
      throw error;
    }
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const key = `ratelimit:${this.namespace}:${identifier}`;
    const blockKey = `${key}:blocked`;
    const now = Date.now();

    // Verificar bloqueo
    const blockedUntil = await this.client.get(blockKey);
    if (blockedUntil && parseInt(blockedUntil) > now) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: parseInt(blockedUntil),
        reason: 'Blocked'
      };
    }

    // Limpiar hits antiguos (fuera de ventana)
    const windowStart = now - this.options.windowMs;
    await this.client.zRemRangeByScore(key, 0, windowStart);

    // Contar hits en ventana actual
    const hitCount = await this.client.zCard(key);

    if (hitCount >= this.options.max) {
      // Bloquear
      const blockDuration = this.options.blockDuration || 15 * 60 * 1000;
      const blockUntil = now + blockDuration;
      await this.client.setEx(blockKey, Math.ceil(blockDuration / 1000), blockUntil.toString());

      return {
        allowed: false,
        remaining: 0,
        resetAt: blockUntil,
        totalHits: hitCount,
        reason: `Rate limit exceeded`
      };
    }

    // Registrar hit (sorted set con timestamp como score)
    await this.client.zAdd(key, { score: now, value: `${now}-${Math.random()}` });
    
    // Expirar key después de windowMs + buffer
    await this.client.expire(key, Math.ceil((this.options.windowMs + 60000) / 1000));

    return {
      allowed: true,
      remaining: this.options.max - hitCount - 1,
      resetAt: now + this.options.windowMs,
      totalHits: hitCount + 1
    };
  }

  async reset(identifier: string): Promise<void> {
    const key = `ratelimit:${this.namespace}:${identifier}`;
    const blockKey = `${key}:blocked`;
    await this.client.del(key);
    await this.client.del(blockKey);
  }

  async getStats(): Promise<{ totalKeys: number; blockedKeys: number }> {
    const keys = await this.client.keys('ratelimit:*');
    const blockKeys = await this.client.keys('ratelimit:*:blocked');
    
    return {
      totalKeys: keys.length,
      blockedKeys: blockKeys.length
    };
  }
}

/**
 * Factory para crear el rate limiter correcto
 */
export class RateLimiterFactory {
  private static instances = new Map<string, IRateLimiterAdapter>();

  static create(namespace: string, options: RateLimitOptions): IRateLimiterAdapter {
    const cacheKey = `${namespace}-${options.max}-${options.windowMs}`;
    
    if (this.instances.has(cacheKey)) {
      return this.instances.get(cacheKey)!;
    }

    const useRedis = process.env.REDIS_ENABLED === 'true' && process.env.REDIS_URL;

    const limiter = useRedis
      ? new RedisRateLimiter(namespace, options)
      : new MemoryRateLimiter(namespace, options);

    this.instances.set(cacheKey, limiter);
    return limiter;
  }

  static reset(): void {
    for (const limiter of this.instances.values()) {
      if (limiter instanceof MemoryRateLimiter) {
        limiter.destroy();
      }
    }
    this.instances.clear();
  }
}

/**
 * Rate limiters pre-configurados para usar en la app
 */
export const RateLimiters = {
  // API general: 120 req/min
  api: RateLimiterFactory.create('api', {
    windowMs: 60 * 1000,
    max: 120,
    blockDuration: 15 * 60 * 1000
  }),

  // Login: 5 intentos/5min
  auth: RateLimiterFactory.create('auth', {
    windowMs: 5 * 60 * 1000,
    max: 5,
    blockDuration: 30 * 60 * 1000
  }),

  // Uploads: 10 uploads/5min
  upload: RateLimiterFactory.create('upload', {
    windowMs: 5 * 60 * 1000,
    max: 10,
    blockDuration: 15 * 60 * 1000
  }),

  // Mensajes: 30 mensajes/min
  messages: RateLimiterFactory.create('messages', {
    windowMs: 60 * 1000,
    max: 30,
    blockDuration: 10 * 60 * 1000
  }),

  // Búsquedas: 60 búsquedas/min
  search: RateLimiterFactory.create('search', {
    windowMs: 60 * 1000,
    max: 60,
    blockDuration: 5 * 60 * 1000
  }),
};
