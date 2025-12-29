// ====================================================================
// useCatalog Hook - Con caché localStorage
// ====================================================================

import { useState, useEffect } from 'react';
import { getCatalog, Catalog } from '../services/catalogService';

const CACHE_KEY = 'catalog_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora

interface CachedCatalog {
  data: Catalog;
  timestamp: number;
}

export function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      setLoading(true);

      // ====================================================================
      // 1. Check localStorage cache
      // ====================================================================
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp }: CachedCatalog = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > CACHE_DURATION;

        if (!isExpired) {
          console.log('✅ Catalog loaded from cache');
          setCatalog(data);
          setLoading(false);
          return;
        }
      }

      // ====================================================================
      // 2. Fetch from Supabase
      // ====================================================================
      console.log('🔄 Fetching catalog from Supabase...');
      const freshCatalog = await getCatalog();

      // ====================================================================
      // 3. Save to cache
      // ====================================================================
      const cacheData: CachedCatalog = {
        data: freshCatalog,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

      console.log('✅ Catalog fetched and cached');
      setCatalog(freshCatalog);
      setError(null);
    } catch (err) {
      console.error('❌ Error loading catalog:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCatalog = () => {
    localStorage.removeItem(CACHE_KEY);
    loadCatalog();
  };

  return {
    catalog,
    loading,
    error,
    refreshCatalog,
  };
}
