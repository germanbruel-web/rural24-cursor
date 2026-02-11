/**
 * Query Cache Layer - Abstracción para cachear queries SQL
 * =========================================================
 * 
 * Patrón:
 * 1. Check cache
 * 2. Si miss → Query DB → Store in cache
 * 3. Invalidar cuando cambian datos
 * 
 * Funciona con Memory o Redis transparentemente
 */

import { cache } from './cache-adapter';

export interface QueryCacheOptions {
  ttl: number;           // TTL en segundos
  keyPrefix?: string;    // Prefijo para namespace
  tags?: string[];       // Tags para invalidación grupal
}

export class QueryCache {
  /**
   * Cachear resultado de una query
   */
  static async remember<T>(
    key: string,
    queryFn: () => Promise<T>,
    options: QueryCacheOptions
  ): Promise<T> {
    const cacheKey = this.buildKey(key, options.keyPrefix);

    // 1. Check cache
    const cached = await cache.get<T>(cacheKey);
    if (cached !== null) {
      console.log(`[CACHE HIT] ${cacheKey}`);
      return cached;
    }

    // 2. Execute query
    console.log(`[CACHE MISS] ${cacheKey} - executing query`);
    const result = await queryFn();

    // 3. Store in cache
    if (result !== null && result !== undefined) {
      await cache.set(cacheKey, result, options.ttl);
      
      // Store tags para invalidación grupal
      if (options.tags && options.tags.length > 0) {
        await this.storeTags(cacheKey, options.tags);
      }
    }

    return result;
  }

  /**
   * Invalidar una key específica
   */
  static async invalidate(key: string, keyPrefix?: string): Promise<void> {
    const cacheKey = this.buildKey(key, keyPrefix);
    await cache.delete(cacheKey);
    console.log(`[CACHE INVALIDATE] ${cacheKey}`);
  }

  /**
   * Invalidar todas las keys con un tag
   * Ejemplo: invalidateByTag('ads') -> invalida todas las queries de ads
   */
  static async invalidateByTag(tag: string): Promise<void> {
    const tagKey = `cache:tag:${tag}`;
    const keys = await cache.get<string[]>(tagKey);
    
    if (keys && keys.length > 0) {
      await Promise.all(keys.map(key => cache.delete(key)));
      await cache.delete(tagKey);
      console.log(`[CACHE INVALIDATE TAG] ${tag} - ${keys.length} keys`);
    }
  }

  /**
   * Clear todo el cache (usar con precaución)
   */
  static async clear(): Promise<void> {
    await cache.clear();
    console.log('[CACHE CLEAR] All cache cleared');
  }

  // Helpers privados
  private static buildKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : `cache:${key}`;
  }

  private static async storeTags(cacheKey: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `cache:tag:${tag}`;
      const existingKeys = await cache.get<string[]>(tagKey) || [];
      
      if (!existingKeys.includes(cacheKey)) {
        existingKeys.push(cacheKey);
        await cache.set(tagKey, existingKeys, 86400); // 24 horas
      }
    }
  }
}

/**
 * ===================================================================
 * EJEMPLOS DE USO REALES
 * ===================================================================
 */

/**
 * Ejemplo 1: Cachear lista de categorías (casi nunca cambia)
 */
export async function getCategoriesCached(supabase: any) {
  return QueryCache.remember(
    'categories:all',
    async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    {
      ttl: 3600, // 1 hora
      keyPrefix: 'app',
      tags: ['categories'],
    }
  );
}

/**
 * Ejemplo 2: Cachear configuración global (cambia muy poco)
 */
export async function getGlobalSettings(supabase: any, key: string) {
  return QueryCache.remember(
    `settings:${key}`,
    async () => {
      const { data, error } = await supabase
        .from('global_settings')
        .select('value, value_type')
        .eq('key', key)
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      ttl: 1800, // 30 min
      keyPrefix: 'app',
      tags: ['settings'],
    }
  );
}

/**
 * Ejemplo 3: Cachear búsquedas frecuentes (TTL corto)
 */
export async function searchAdsCached(supabase: any, filters: any) {
  const filterKey = JSON.stringify(filters);
  const cacheKey = `search:${Buffer.from(filterKey).toString('base64').substring(0, 32)}`;

  return QueryCache.remember(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .match(filters)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    {
      ttl: 60, // 1 min (búsquedas cambian rápido)
      keyPrefix: 'search',
      tags: ['ads', 'search'],
    }
  );
}

/**
 * Ejemplo 4: Cachear perfil de usuario (cambia poco)
 */
export async function getUserProfileCached(supabase: any, userId: string) {
  return QueryCache.remember(
    `user:${userId}`,
    async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*, company_profiles(*)')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      ttl: 600, // 10 min
      keyPrefix: 'users',
      tags: ['users', `user:${userId}`],
    }
  );
}

/**
 * ===================================================================
 * INVALIDACIÓN INTELIGENTE
 * ===================================================================
 */

/**
 * Cuando se crea/actualiza/elimina un aviso, invalidar:
 * - Tag 'ads' (todas las búsquedas)
 * - Tag 'search' (caché de búsquedas)
 * - Key específica del aviso
 */
export async function invalidateAdsCache(adId?: string) {
  await Promise.all([
    QueryCache.invalidateByTag('ads'),
    QueryCache.invalidateByTag('search'),
    adId ? QueryCache.invalidate(`ad:${adId}`, 'ads') : Promise.resolve(),
  ]);
}

/**
 * Cuando se actualiza perfil de usuario
 */
export async function invalidateUserCache(userId: string) {
  await Promise.all([
    QueryCache.invalidate(`user:${userId}`, 'users'),
    QueryCache.invalidateByTag(`user:${userId}`),
  ]);
}

/**
 * Cuando se actualiza categoría (raro pero puede pasar)
 */
export async function invalidateCategoriesCache() {
  await QueryCache.invalidateByTag('categories');
}

/**
 * ===================================================================
 * MÉTRICAS DE CACHE (para monitoreo)
 * ===================================================================
 */

export class CacheMetrics {
  private static hits = 0;
  private static misses = 0;

  static recordHit() {
    this.hits++;
  }

  static recordMiss() {
    this.misses++;
  }

  static getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      total,
      hitRate: hitRate.toFixed(2) + '%',
    };
  }

  static reset() {
    this.hits = 0;
    this.misses = 0;
  }
}
