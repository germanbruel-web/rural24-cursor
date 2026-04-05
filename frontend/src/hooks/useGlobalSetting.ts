/**
 * useGlobalSetting<T>
 *
 * Hook para leer un valor de global_settings de forma sincrónica en componentes.
 * Retorna `defaultValue` en el primer render y actualiza el estado cuando
 * la promesa de getSetting() resuelve. Usa el cache interno de globalSettingsService
 * (TTL 10 min) — en la práctica el fetch solo ocurre una vez por sesión.
 *
 * Uso:
 *   const limit = useGlobalSetting<number>('similar_ads_limit', 6);
 *   const slugs = useGlobalSetting<string[]>('card_color_category_slugs', ['servicios']);
 *   const url   = useGlobalSetting<string>('site_canonical_url', 'https://rural24.com.ar');
 */

import { useState, useEffect } from 'react';
import { getSetting, getCachedSetting } from '../services/v2/globalSettingsService';

export function useGlobalSetting<T>(key: string, defaultValue: T): T {
  // Inicializar con el cache de módulo si ya fue resuelto por otro componente.
  // Evita el re-render extra cuando 10+ componentes montan el mismo setting.
  const [value, setValue] = useState<T>(() => {
    const cached = getCachedSetting<T>(key);
    return cached !== undefined ? cached : defaultValue;
  });

  useEffect(() => {
    let cancelled = false;
    getSetting<T>(key, defaultValue).then(resolved => {
      if (!cancelled) setValue(resolved);
    });
    return () => { cancelled = true; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return value;
}
