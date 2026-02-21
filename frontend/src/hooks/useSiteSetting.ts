/**
 * =====================================================
 * USE SITE SETTINGS HOOK
 * =====================================================
 * Hook para acceder a configuraciones del sitio
 * Con cache en memoria para evitar flash del valor default en F5
 */

import { useState, useEffect } from 'react';
import { getSetting } from '../services/siteSettingsService';

// Cache en memoria — persiste entre renders y navegaciones SPA
const settingsCache = new Map<string, string>();

export function useSiteSetting(key: string, defaultValue: string = ''): string {
  // Si ya está en cache, usar ese valor inmediatamente (sin flash)
  const [value, setValue] = useState(() => settingsCache.get(key) ?? defaultValue);

  useEffect(() => {
    // Si ya tenemos el valor cacheado, no re-fetch
    if (settingsCache.has(key)) {
      setValue(settingsCache.get(key)!);
      return;
    }

    let mounted = true;

    const fetchSetting = async () => {
      const settingValue = await getSetting(key);
      if (mounted && settingValue) {
        settingsCache.set(key, settingValue);
        setValue(settingValue);
      }
    };

    fetchSetting();

    return () => {
      mounted = false;
    };
  }, [key]);

  return value;
}

/**
 * Invalidar cache de un setting específico (usar tras update en CMS)
 */
export function invalidateSiteSetting(key: string) {
  settingsCache.delete(key);
}

/**
 * Invalidar todo el cache (usar tras logout o cambio de sesión)
 */
export function invalidateAllSiteSettings() {
  settingsCache.clear();
}
