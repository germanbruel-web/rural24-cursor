/**
 * Cache Adapter - Switchable Memory ↔ Redis ↔ Database
 * ======================================================
 * Abstracción de cache preparada para evolución:
 * 
 * ETAPA 1: In-Memory (LRU) - 0-300 users
 * ETAPA 2: Redis - 300-1500 users
 * ETAPA 3: Redis + DB fallback - 1500+ users
 */

export interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
}

export interface ICache {
  get<T>(key: string): Promise<T | null> | T | null;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> | void;
  del(key: string): Promise<void> | void;
  clear(pattern?: string): Promise<void> | void;
  getStats(): { hits: number; misses: number; size: number };
}

// =========================================
// IMPLEMENTACIÓN 1: IN-MEMORY LRU (Etapa 1)
// =========================================

class InMemoryCache implements ICache {
  private store = new Map<string, CacheEntry>();
  private maxSize: number;
  private stats = { hits: 0, misses: 0 };

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
    
    // Cleanup cada 5 minutos
    setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Verificar expiración
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    
    // LRU: mover al final (delete + set)
    this.store.delete(key);
    this.store.set(key, entry);
    
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number = 3600): void {
    // Eviction LRU si excede tamaño
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) {
        this.store.delete(firstKey);
      }
    }

    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, { value, expiresAt });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  clear(pattern?: string): void {
    if (!pattern) {
      this.store.clear();
      return;
    }

    // Simple pattern matching (prefix:*)
    const prefix = pattern.replace('*', '');
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  getStats() {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.store.size
    };
  }

  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Cache] Cleaned ${cleaned} expired entries. Size: ${this.store.size}`);
    }
  }
}

// =========================================
// IMPLEMENTACIÓN 2: REDIS (Etapa 2-3)
// =========================================

class RedisCache implements ICache {
  private redis: any;
  private keyPrefix: string;
  private stats = { hits: 0, misses: 0 };

  constructor(redisClient: any, keyPrefix: string = 'cache:') {
    this.redis = redisClient;
    this.keyPrefix = keyPrefix;
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = `${this.keyPrefix}${key}`;
    
    try {
      const data = await this.redis.get(fullKey);
      
      if (!data) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`[RedisCache] Error getting ${key}:`, error);
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    const fullKey = `${this.keyPrefix}${key}`;
    
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(fullKey, ttlSeconds, serialized);
    } catch (error) {
      console.error(`[RedisCache] Error setting ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    const fullKey = `${this.keyPrefix}${key}`;
    await this.redis.del(fullKey);
  }

  async clear(pattern?: string): Promise<void> {
    const searchPattern = pattern 
      ? `${this.keyPrefix}${pattern}` 
      : `${this.keyPrefix}*`;
    
    const keys = await this.redis.keys(searchPattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  getStats() {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: -1 // No disponible sin escanear todas las keys
    };
  }
}

// =========================================
// IMPLEMENTACIÓN 3: DATABASE FALLBACK (Etapa 3)
// =========================================

import { PrismaClient } from '@prisma/client';

/**
 * Cache híbrido: Redis primario + Base de datos fallback
 * Útil para datos críticos que no pueden perderse si Redis falla
 */
class HybridCache implements ICache {
  private redis: any;
  private prisma: PrismaClient;
  private keyPrefix: string;
  private stats = { hits: 0, misses: 0 };

  constructor(redisClient: any, prisma: PrismaClient, keyPrefix: string = 'cache:') {
    this.redis = redisClient;
    this.prisma = prisma;
    this.keyPrefix = keyPrefix;
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = `${this.keyPrefix}${key}`;
    
    // Intentar Redis primero
    try {
      const data = await this.redis.get(fullKey);
      if (data) {
        this.stats.hits++;
        return JSON.parse(data) as T;
      }
    } catch (error) {
      console.warn(`[HybridCache] Redis failed, trying DB for ${key}`);
    }

    // Fallback a DB (requiere tabla cache_entries)
    try {
      const entry = await this.prisma.$queryRawUnsafe<Array<{ value: string; expires_at: Date }>>(
        `SELECT value, expires_at FROM cache_entries WHERE key = $1 AND expires_at > NOW()`,
        fullKey
      );

      if (entry && entry.length > 0) {
        const value = JSON.parse(entry[0].value) as T;
        
        // Re-popular Redis
        try {
          const ttl = Math.floor((entry[0].expires_at.getTime() - Date.now()) / 1000);
          await this.redis.setex(fullKey, Math.max(ttl, 60), entry[0].value);
        } catch {}

        this.stats.hits++;
        return value;
      }
    } catch (error) {
      console.error(`[HybridCache] DB fallback failed for ${key}:`, error);
    }

    this.stats.misses++;
    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    const fullKey = `${this.keyPrefix}${key}`;
    const serialized = JSON.stringify(value);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    // Escribir a Redis
    try {
      await this.redis.setex(fullKey, ttlSeconds, serialized);
    } catch (error) {
      console.error(`[HybridCache] Redis write failed for ${key}`);
    }

    // Escribir a DB (UPSERT)
    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO cache_entries (key, value, expires_at) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (key) 
         DO UPDATE SET value = $2, expires_at = $3`,
        fullKey,
        serialized,
        expiresAt
      );
    } catch (error) {
      console.error(`[HybridCache] DB write failed for ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    const fullKey = `${this.keyPrefix}${key}`;
    
    await Promise.all([
      this.redis.del(fullKey).catch(() => {}),
      this.prisma.$executeRawUnsafe(`DELETE FROM cache_entries WHERE key = $1`, fullKey).catch(() => {})
    ]);
  }

  async clear(pattern?: string): Promise<void> {
    const searchPattern = pattern 
      ? `${this.keyPrefix}${pattern}%` 
      : `${this.keyPrefix}%`;

    await Promise.all([
      this.redis.keys(`${this.keyPrefix}${pattern || '*'}`).then((keys: string[]) => {
        if (keys.length > 0) return this.redis.del(...keys);
      }).catch(() => {}),
      this.prisma.$executeRawUnsafe(`DELETE FROM cache_entries WHERE key LIKE $1`, searchPattern).catch(() => {})
    ]);
  }

  getStats() {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: -1
    };
  }
}

// =========================================
// FACTORY
// =========================================

export function createCache(config: {
  type?: 'memory' | 'redis' | 'hybrid';
  redisClient?: any;
  prisma?: PrismaClient;
  maxSize?: number;
  keyPrefix?: string;
}): ICache {
  const type = config.type || (process.env.REDIS_ENABLED === 'true' ? 'redis' : 'memory');

  switch (type) {
    case 'redis':
      if (!config.redisClient) {
        console.warn('[Cache] Redis requested but no client provided, falling back to memory');
        return new InMemoryCache(config.maxSize);
      }
      console.log('[Cache] Using Redis implementation');
      return new RedisCache(config.redisClient, config.keyPrefix);

    case 'hybrid':
      if (!config.redisClient || !config.prisma) {
        console.warn('[Cache] Hybrid requires Redis + Prisma, falling back to memory');
        return new InMemoryCache(config.maxSize);
      }
      console.log('[Cache] Using Hybrid (Redis + DB) implementation');
      return new HybridCache(config.redisClient, config.prisma, config.keyPrefix);

    default:
      console.log('[Cache] Using In-Memory LRU implementation');
      return new InMemoryCache(config.maxSize);
  }
}

// =========================================
// SINGLETON GLOBAL
// =========================================

let globalCache: ICache | null = null;

export function initCache(config?: Parameters<typeof createCache>[0]): ICache {
  if (!globalCache) {
    globalCache = createCache(config || {});
  }
  return globalCache;
}

export function getCache(): ICache {
  if (!globalCache) {
    throw new Error('Cache not initialized. Call initCache() first.');
  }
  return globalCache;
}

// =========================================
// HELPER: Cache-aside pattern
// =========================================

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600,
  cache: ICache = getCache()
): Promise<T> {
  // Intento 1: Buscar en cache
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss: ejecutar fetcher
  const fresh = await fetcher();
  
  // Guardar en cache (fire-and-forget, handle both sync and async)
  const setResult = cache.set(key, fresh, ttlSeconds);
  if (setResult && typeof setResult === 'object' && 'catch' in setResult) {
    setResult.catch(() => {}); // Async: ignore errors
  }

  return fresh;
}
