/**
 * useCredits.ts
 * Hook personalizado para manejar lógica de créditos
 * Simplifica el uso del servicio de créditos en componentes
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import {
  getUserCredits,
  getCreditsConfig,
  getFeaturedAdsForResults,
  activateFeaturedWithCredits,
  purchaseCredits,
  getCreditTransactions,
} from '../services/creditsService';

/**
 * Hook para obtener el balance de créditos del usuario
 */
export function useUserCredits() {
  const [credits, setCredits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCredits = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuario no autenticado');
        return;
      }

      const data = await getUserCredits(user.id);
      setCredits(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  return { credits, loading, error, refetch: loadCredits };
}

/**
 * Hook para obtener la configuración global de créditos
 */
export function useCreditsConfig() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getCreditsConfig();
        setConfig(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  return { config, loading, error };
}

/**
 * Hook para obtener anuncios destacados
 */
export function useFeaturedAds(categoryId: string, subcategoryId?: string) {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeatured = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getFeaturedAdsForResults(categoryId, subcategoryId);
      setAds(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [categoryId, subcategoryId]);

  useEffect(() => {
    if (categoryId) {
      loadFeatured();
    }
  }, [categoryId, subcategoryId, loadFeatured]);

  return { ads, loading, error, refetch: loadFeatured };
}

/**
 * Hook para activar un anuncio destacado
 */
export function useActivateFeatured() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const activate = useCallback(
    async (adId: string, durationDays: number) => {
      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Usuario no autenticado');
        }

        await activateFeaturedWithCredits(user.id, adId, durationDays);
        setSuccess(true);
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { activate, loading, error, success };
}

/**
 * Hook para comprar créditos
 */
export function usePurchaseCredits() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const purchase = useCallback(
    async (quantity: number, paymentId: string) => {
      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Usuario no autenticado');
        }

        await purchaseCredits(user.id, quantity, paymentId);
        setSuccess(true);
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { purchase, loading, error, success };
}

/**
 * Hook para obtener historial de transacciones
 */
export function useCreditTransactions(limit: number = 20) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuario no autenticado');
        return;
      }

      const data = await getCreditTransactions(user.id, limit);
      setTransactions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return { transactions, loading, error, refetch: loadTransactions };
}

/**
 * Hook utilitario para verificar si el usuario puede destacar un anuncio
 */
export function useCanAffordFeatured(durationDays: number) {
  const { credits, loading: creditsLoading } = useUserCredits();
  const { config, loading: configLoading } = useCreditsConfig();

  const canAfford = (() => {
    if (!credits || !config) return false;

    const durationConfig = config.featured_durations.find(
      (d: any) => d.duration_days === durationDays
    );

    if (!durationConfig) return false;

    return credits.balance >= durationConfig.credits_needed;
  })();

  const creditsNeeded = (() => {
    if (!config) return 0;

    const durationConfig = config.featured_durations.find(
      (d: any) => d.duration_days === durationDays
    );

    return durationConfig?.credits_needed || 0;
  })();

  const totalPrice = (() => {
    if (!config) return 0;
    return config.credit_base_price * creditsNeeded;
  })();

  return {
    canAfford,
    creditsNeeded,
    totalPrice,
    currentBalance: credits?.balance || 0,
    loading: creditsLoading || configLoading,
  };
}

/**
 * Hook para manejar flujo completo de destacado
 * (desde selección de duración hasta deducción de créditos)
 */
export function useFeaturedAdFlow() {
  const { activate, loading, error, success } = useActivateFeatured();
  const { credits, refetch: refetchCredits } = useUserCredits();
  const { config } = useCreditsConfig();

  const highlightAd = useCallback(
    async (adId: string, durationDays: number) => {
      const success = await activate(adId, durationDays);
      if (success) {
        // Recargar créditos después de destacar
        setTimeout(() => refetchCredits(), 500);
      }
      return success;
    },
    [activate, refetchCredits]
  );

  const getDurationLabel = useCallback(
    (durationDays: number) => {
      if (!config) return '';
      const duration = config.featured_durations.find(
        (d: any) => d.duration_days === durationDays
      );
      return duration?.label || '';
    },
    [config]
  );

  const getCreditsPrice = useCallback(
    (durationDays: number) => {
      if (!config) return 0;
      const duration = config.featured_durations.find(
        (d: any) => d.duration_days === durationDays
      );
      return config.credit_base_price * (duration?.credits_needed || 0);
    },
    [config]
  );

  return {
    highlightAd,
    loading,
    error,
    success,
    currentCredits: credits?.balance || 0,
    getDurationLabel,
    getCreditsPrice,
  };
}
