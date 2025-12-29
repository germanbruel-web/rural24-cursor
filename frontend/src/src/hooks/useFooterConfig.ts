/**
 * =====================================================
 * USE FOOTER CONFIG - Hook para Footer Dinámico
 * =====================================================
 * Hook React para consumir configuración del footer
 */

import { useState, useEffect } from 'react';
import type { FooterConfig, Category } from '../types/footer';
import { getFooterConfig, getDynamicCategories } from '../services/footerService';
import { DEFAULT_FOOTER_CONFIG } from '../utils/footerDefaults';

/**
 * Hook para obtener configuración del footer
 * Incluye caché en memoria por 60 minutos
 */
export function useFooterConfig() {
  const [config, setConfig] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const footerConfig = await getFooterConfig();
        
        if (mounted) {
          setConfig(footerConfig);
          console.log('✅ Footer config cargado en hook');
        }
      } catch (err) {
        console.error('❌ Error en useFooterConfig:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error desconocido');
          setConfig(DEFAULT_FOOTER_CONFIG); // Fallback
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchConfig();

    return () => {
      mounted = false;
    };
  }, []);

  return { config, isLoading, error };
}

/**
 * Hook para obtener categorías dinámicas del footer
 * Se usa cuando column3.source === 'dynamic'
 */
export function useFooterCategories(limit: number = 6) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const cats = await getDynamicCategories(limit);
        
        if (mounted) {
          setCategories(cats);
          console.log(`✅ ${cats.length} categorías cargadas para footer`);
        }
      } catch (err) {
        console.error('❌ Error en useFooterCategories:', err);
        if (mounted) {
          setCategories([]); // Fallback vacío
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      mounted = false;
    };
  }, [limit]);

  return { categories, isLoading };
}
