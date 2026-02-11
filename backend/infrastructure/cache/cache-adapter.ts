/**
 * Cache Adapter - Abstracción para Memory/Redis
 * ==============================================
 * Permite cambiar entre in-memory y Redis con una variable de entorno
 * 
 * Usage:
 * const cache = CacheFactory.create();
 * await cache.set('key', value, 3600);
 * const value = await cache.get('key');
 */

export interface ICacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  increment(key: string, amount?: number): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<void>;
  clear(): Promise<void>;
}

/**
 * In-Memory Cache (Desarrollo y low-traffic)
 * Limitación: NO comparte estado entre instancias
 */
class MemoryCacheAdapter implements ICacheAdapter {
  private store = new Map<string, { value: any; expiresAt: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Auto-cleanup cada 1 minuto
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async increment(key: string, amount = 1): Promise<number> {
    const current = await this.get<number>(key) || 0;
    const newValue = current + amount;
    // Mantener TTL existente o default 3600s
    await this.set(key, newValue, 3600);
    return newValue;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + (ttlSeconds * 1000);
    }
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
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
 * Redis Cache Adapter (Producción con alta concurrencia)
 * Comparte estado entre TODAS las instancias
 */
class RedisCacheAdapter implements ICacheAdapter {
  private client: any; // Redis client type

  constructor() {
    // Lazy initialization
    this.initRedis();
  }

  private async initRedis() {
    // Esperar a que se habilite Redis sin romper
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL not configured');
    }

    try {
      const { createClient } = await import('redis');
      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 10) return new Error('Redis max retries reached');
            return Math.min(retries * 100, 3000);
          }
        }
      });

      await this.client.connect();
      console.log('✅ Redis connected');
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    return (await this.client.exists(key)) === 1;
  }

  async increment(key: string, amount = 1): Promise<number> {
    if (!this.client) return 0;
    return await this.client.incrBy(key, amount);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    await this.client.expire(key, ttlSeconds);
  }

  async clear(): Promise<void> {
    if (!this.client) return;
    await this.client.flushDb();
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}

/**
 * Factory para crear el cache correcto según entorno
 */
export class CacheFactory {
  private static instance: ICacheAdapter | null = null;

  static create(): ICacheAdapter {
    if (this.instance) return this.instance;

    const useRedis = process.env.REDIS_ENABLED === 'true' && process.env.REDIS_URL;

    if (useRedis) {
      console.log('🔴 Using Redis Cache Adapter');
      this.instance = new RedisCacheAdapter();
    } else {
      console.log('🟡 Using Memory Cache Adapter (not suitable for multiple instances)');
      this.instance = new MemoryCacheAdapter();
    }

    return this.instance;
  }

  static reset(): void {
    if (this.instance && this.instance instanceof MemoryCacheAdapter) {
      this.instance.destroy();
    }
    this.instance = null;
  }
}

// Export singleton
export const cache = CacheFactory.create();
