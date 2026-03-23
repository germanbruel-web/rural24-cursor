/**
 * Hook para sincronización en tiempo real con Supabase
 * Escucha cambios en categorías y actualiza automáticamente
 *
 * OPCIONAL: Si Realtime falla, la app sigue funcionando normalmente
 */

import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useCategories } from '../contexts/CategoryContext';
import { logger } from '../utils/logger';

export function useRealtimeCategories(enabled: boolean = true) {
  const { invalidateCache, refreshCategories } = useCategories();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    logger.debug('[Realtime] Conectando a categorías...');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let categoriesChannel: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let subcategoriesChannel: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let brandsChannel: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let modelsChannel: any;

    try {
      categoriesChannel = supabase
        .channel('categories_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
          invalidateCache('categories');
          refreshCategories();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setIsConnected(false);
            setError('No se pudo conectar a Realtime');
            logger.warn('[Realtime] No disponible — la app sigue funcionando');
          }
        });

      subcategoriesChannel = supabase
        .channel('subcategories_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, () => {
          invalidateCache('subcategories');
        })
        .subscribe();

      brandsChannel = supabase
        .channel('brands_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'brands' }, () => {
          invalidateCache('brands');
        })
        .subscribe();

      modelsChannel = supabase
        .channel('models_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'models' }, () => {
          invalidateCache('models');
        })
        .subscribe();

    } catch (err) {
      logger.error('[Realtime] Error al conectar:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }

    return () => {
      try {
        if (categoriesChannel) categoriesChannel.unsubscribe();
        if (subcategoriesChannel) subcategoriesChannel.unsubscribe();
        if (brandsChannel) brandsChannel.unsubscribe();
        if (modelsChannel) modelsChannel.unsubscribe();
      } catch (err) {
        logger.warn('[Realtime] Error al desconectar:', err);
      }
    };
  }, [invalidateCache, refreshCategories, enabled]);

  return { isConnected, error };
}
