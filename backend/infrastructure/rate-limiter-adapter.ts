/**
 * Rate Limiter Adapter - Switchable Memory ↔ Redis
 * ==================================================
 * Abstracción que permite cambiar entre implementaciones sin refactor
 * 
 * ETAPA 1 (0-300 users): InMemoryRateLimiter
 * ETAPA 2-3 (300+): RedisRateLimiter (mismo interface)
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  reason?: string;
}

export interface IRateLimiter {
  check(identifier: string): Promise<RateLimitResult> | RateLimitResult;
  reset(identifier: string): Promise<void> | void;
  getStats(): Promise<{ totalKeys: number; blockedCount: number }> | { totalKeys: number; blockedCount: number };
}

// =========================================
// IMPLEMENTACIÓN 1: IN-MEMORY (Etapa 1)
// =========================================

interface MemoryRateLimitEntry {
  requests: number[];
  blockedUntil?: number;
}

class InMemoryRateLimiter implements IRateLimiter {
  private store = new Map<string, MemoryRateLimitEntry>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly blockDuration: number;

  constructor(config: { windowMs: number; maxRequests: number; blockDuration: number }) {
    this.windowMs = config.windowMs;
    this.maxRequests = config.maxRequests;
    this.blockDuration = config.blockDuration;

    // Cleanup automático cada 10 minutos
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  check(identifier: string): RateLimitResult {
    const now = Date.now();
    let entry = this.store.get(identifier);

    // Verificar si está bloqueado
    if (entry?.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        reason: `Blocked until ${new Date(entry.blockedUntil).toISOString()}`
      };
    }

    // Inicializar o limpiar bloqueo expirado
    if (!entry || (entry.blockedUntil && now >= entry.blockedUntil)) {
      entry = { requests: [] };
      this.store.set(identifier, entry);
    }

    // Limpiar requests fuera de la ventana (sliding window)
    entry.requests = entry.requests.filter(timestamp => (now - timestamp) < this.windowMs);

    // Verificar límite
    if (entry.requests.length >= this.maxRequests) {
      entry.blockedUntil = now + this.blockDuration;
      this.store.set(identifier, entry);
      
      console.warn(`[RateLimiter] ${identifier} blocked - ${entry.requests.length} requests in last ${this.windowMs}ms`);
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        reason: `Rate limit exceeded: ${this.maxRequests} requests per ${this.windowMs}ms`
      };
    }

    // Registrar request
    entry.requests.push(now);
    this.store.set(identifier, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.requests.length,
      resetAt: now + this.windowMs
    };
  }

  reset(identifier: string): void {
    this.store.delete(identifier);
  }

  getStats() {
    let blockedCount = 0;
    const now = Date.now();
    
    for (const entry of this.store.values()) {
      if (entry.blockedUntil && now < entry.blockedUntil) {
        blockedCount++;
      }
    }

    return {
      totalKeys: this.store.size,
      blockedCount
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hora

    for (const [key, entry] of this.store.entries()) {
      // Eliminar si no tiene requests recientes y no está bloqueado
      if (entry.requests.length === 0 && (!entry.blockedUntil || now > entry.blockedUntil)) {
        this.store.delete(key);
      }
      // O si el último request es muy antiguo
      else if (entry.requests.length > 0) {
        const lastRequest = Math.max(...entry.requests);
        if ((now - lastRequest) > maxAge) {
          this.store.delete(key);
        }
      }
    }

    console.log(`[RateLimiter] Cleanup: ${this.store.size} active entries`);
  }
}

// =========================================
// IMPLEMENTACIÓN 2: REDIS (Etapa 2-3)
// =========================================

class RedisRateLimiter implements IRateLimiter {
  private redis: any; // Redis client
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly blockDuration: number;
  private readonly keyPrefix: string;

  constructor(
    redisClient: any,
    config: { windowMs: number; maxRequests: number; blockDuration: number; keyPrefix?: string }
  ) {
    this.redis = redisClient;
    this.windowMs = config.windowMs;
    this.maxRequests = config.maxRequests;
    this.blockDuration = config.blockDuration;
    this.keyPrefix = config.keyPrefix || 'ratelimit:';
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const key = `${this.keyPrefix}${identifier}`;
    const blockKey = `${this.keyPrefix}block:${identifier}`;

    // Verificar si está bloqueado
    const blockedUntil = await this.redis.get(blockKey);
    if (blockedUntil && now < parseInt(blockedUntil)) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: parseInt(blockedUntil),
        reason: 'Rate limit exceeded - blocked'
      };
    }

    // Redis Sorted Set para sliding window
    // Score = timestamp, Value = unique ID
    const windowStart = now - this.windowMs;

    // Limpiar requests antiguos
    await this.redis.zremrangebyscore(key, 0, windowStart);

    // Contar requests en ventana
    const requestCount = await this.redis.zcard(key);

    if (requestCount >= this.maxRequests) {
      // Bloquear
      const blockUntil = now + this.blockDuration;
      await this.redis.setex(blockKey, Math.ceil(this.blockDuration / 1000), blockUntil);
      
      console.warn(`[RedisRateLimiter] ${identifier} blocked - ${requestCount} requests`);
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: blockUntil,
        reason: `Rate limit exceeded: ${this.maxRequests} requests per ${this.windowMs}ms`
      };
    }

    // Registrar request
    const requestId = `${now}-${Math.random()}`;
    await this.redis.zadd(key, now, requestId);
    
    // Establecer TTL para auto-cleanup
    await this.redis.expire(key, Math.ceil(this.windowMs / 1000) + 60);

    return {
      allowed: true,
      remaining: this.maxRequests - requestCount - 1,
      resetAt: now + this.windowMs
    };
  }

  async reset(identifier: string): Promise<void> {
    const key = `${this.keyPrefix}${identifier}`;
    const blockKey = `${this.keyPrefix}block:${identifier}`;
    await this.redis.del(key, blockKey);
  }

  async getStats(): Promise<{ totalKeys: number; blockedCount: number }> {
    const keys = await this.redis.keys(`${this.keyPrefix}*`);
    const blockKeys = await this.redis.keys(`${this.keyPrefix}block:*`);
    
    return {
      totalKeys: keys.length,
      blockedCount: blockKeys.length
    };
  }
}

// =========================================
// FACTORY: Auto-detecta Redis disponible
// =========================================

export function createRateLimiter(config: {
  windowMs?: number;
  maxRequests?: number;
  blockDuration?: number;
  redisClient?: any;
}): IRateLimiter {
  const finalConfig = {
    windowMs: config.windowMs || 60 * 1000, // 1 min
    maxRequests: config.maxRequests || 120,
    blockDuration: config.blockDuration || 15 * 60 * 1000, // 15 min
  };

  // Si Redis está disponible y configurado, usar Redis
  if (config.redisClient && process.env.REDIS_ENABLED === 'true') {
    console.log('[RateLimiter] Using Redis implementation');
    return new RedisRateLimiter(config.redisClient, finalConfig);
  }

  // Por defecto: in-memory
  console.log('[RateLimiter] Using In-Memory implementation (stateless-safe for single instance)');
  return new InMemoryRateLimiter(finalConfig);
}

// =========================================
// SINGLETON GLOBAL
// =========================================

let globalRateLimiter: IRateLimiter | null = null;

export function initRateLimiter(config?: Parameters<typeof createRateLimiter>[0]): IRateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = createRateLimiter(config || {});
  }
  return globalRateLimiter;
}

export function getRateLimiter(): IRateLimiter {
  if (!globalRateLimiter) {
    throw new Error('Rate limiter not initialized. Call initRateLimiter() first.');
  }
  return globalRateLimiter;
}
