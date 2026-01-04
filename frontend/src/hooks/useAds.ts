/**
 * useAds Hook
 * Hook para obtener y crear anuncios
 */

import { useState, useEffect, useCallback } from 'react';
import { adsApi, Ad, AdFilters, CreateAdPayload } from '@/services/api';

export function useAds(filters: AdFilters = {}) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adsApi.getAll(filters);
      setAds(data.ads);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ads');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  return { ads, pagination, loading, error, refetch: fetchAds };
}

export function useAd(id: string | null) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setAd(null);
      return;
    }

    async function fetchAd() {
      try {
        setLoading(true);
        const data = await adsApi.getById(id);
        setAd(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ad');
      } finally {
        setLoading(false);
      }
    }

    fetchAd();
  }, [id]);

  return { ad, loading, error };
}

export function useCreateAd() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const createAd = async (payload: CreateAdPayload): Promise<Ad | null> => {
    try {
      setLoading(true);
      setError(null);
      setFieldErrors({});
      const ad = await adsApi.create(payload);
      return ad;
    } catch (err: any) {
      setError(err.message || 'Failed to create ad');
      if (err.fields) {
        setFieldErrors(err.fields);
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createAd, loading, error, fieldErrors };
}
