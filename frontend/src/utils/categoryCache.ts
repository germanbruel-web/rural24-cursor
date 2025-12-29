/**
 * Sistema de Caché en Memoria para Categorías
 * Reduce requests a la BD almacenando datos temporalmente
 * con Time To Live (TTL) configurable
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

class CategoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 1000 * 60 * 15; // 15 minutos
  private stats = { hits: 0, misses: 0 };

  /**
   * Almacena datos en el caché con TTL personalizado
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    });
    console.log(`📦 Cache SET: ${key} (TTL: ${(ttl || this.DEFAULT_TTL) / 1000}s)`);
  }

  /**
   * Obtiene datos del caché si existen y no han expirado
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    }

    const isExpired = Date.now() - item.timestamp > item.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      this.stats.misses++;
      console.log(`⏰ Cache EXPIRED: ${key}`);
      return null;
    }

    this.stats.hits++;
    console.log(`✅ Cache HIT: ${key}`);
    return item.data;
  }

  /**
   * Invalida un elemento específico del caché
   */
  invalidate(key: string): void {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ Cache INVALIDATE: ${key}`);
    }
  }

  /**
   * Invalida múltiples elementos por patrón
   */
  invalidatePattern(pattern: string): void {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    console.log(`🗑️ Cache INVALIDATE PATTERN: ${pattern} (${count} items)`);
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
    console.log(`🧹 Cache CLEARED (${size} items removed)`);
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
    };
  }

  /**
   * Muestra estadísticas formateadas en consola
   */
  logStats(): void {
    const stats = this.getStats();
    const total = stats.hits + stats.misses;
    const hitRate = total > 0 ? ((stats.hits / total) * 100).toFixed(1) : '0.0';
    
    console.group('📊 Cache Statistics');
    console.log(`Hits: ${stats.hits}`);
    console.log(`Misses: ${stats.misses}`);
    console.log(`Hit Rate: ${hitRate}%`);
    console.log(`Cache Size: ${stats.size} items`);
    console.groupEnd();
  }

  /**
   * Limpieza automática de items expirados
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cache CLEANUP: ${cleaned} expired items removed`);
    }
  }
}

// Instancia singleton del caché
export const categoryCache = new CategoryCache();

// Limpieza automática cada 5 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    categoryCache.cleanup();
  }, 1000 * 60 * 5);
}

// Helper para generar keys consistentes
export const cacheKeys = {
  categories: () => 'categories:all',
  subcategories: (categoryId: string) => `subcategories:${categoryId}`,
  brands: (subcategoryId: string) => `brands:${subcategoryId}`,
  models: (brandId: string) => `models:${brandId}`,
  categoryBundle: (categoryId: string) => `bundle:${categoryId}`,
};
