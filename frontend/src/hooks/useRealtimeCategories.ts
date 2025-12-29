/**
 * Hook para sincronización en tiempo real con Supabase
 * Escucha cambios en categorías y actualiza automáticamente
 * 
 * OPCIONAL: Si Realtime falla, la app sigue funcionando normalmente
 */

import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useCategories } from '../contexts/CategoryContext';

export function useRealtimeCategories(enabled: boolean = true) {
  const { invalidateCache, refreshCategories } = useCategories();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      console.log('⏸️ Realtime deshabilitado');
      return;
    }

    console.log('🔌 Intentando conectar a Realtime...');
    
    let categoriesChannel: any;
    let subcategoriesChannel: any;
    let brandsChannel: any;
    let modelsChannel: any;
    
    try {
      // Suscripción a cambios en categorías
      categoriesChannel = supabase
        .channel('categories_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'categories',
          },
          (payload) => {
            console.log('🔔 Categoría actualizada:', payload);
            invalidateCache('categories');
            refreshCategories();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            console.log('✅ Realtime conectado');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setIsConnected(false);
            setError('No se pudo conectar a Realtime');
            console.warn('⚠️ Realtime no disponible (la app sigue funcionando)');
          }
        });

      // Suscripción a cambios en subcategorías
      subcategoriesChannel = supabase
        .channel('subcategories_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'subcategories',
          },
          (payload) => {
            console.log('🔔 Subcategoría actualizada:', payload);
            invalidateCache('subcategories');
          }
        )
        .subscribe();

      // Suscripción a cambios en marcas
      brandsChannel = supabase
        .channel('brands_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'brands',
          },
          (payload) => {
            console.log('🔔 Marca actualizada:', payload);
            invalidateCache('brands');
          }
        )
        .subscribe();

      // Suscripción a cambios en modelos
      modelsChannel = supabase
        .channel('models_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'models',
          },
          (payload) => {
            console.log('🔔 Modelo actualizado:', payload);
            invalidateCache('models');
          }
        )
        .subscribe();
        
    } catch (err) {
      console.error('❌ Error al conectar Realtime:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      // NO romper la app, solo loguear
    }

    // Cleanup
    return () => {
      console.log('🔌 Desconectando de Realtime...');
      try {
        if (categoriesChannel) categoriesChannel.unsubscribe();
        if (subcategoriesChannel) subcategoriesChannel.unsubscribe();
        if (brandsChannel) brandsChannel.unsubscribe();
        if (modelsChannel) modelsChannel.unsubscribe();
      } catch (err) {
        console.warn('⚠️ Error al desconectar Realtime:', err);
      }
    };
  }, [invalidateCache, refreshCategories, enabled]);
  
  return { isConnected, error };
}
