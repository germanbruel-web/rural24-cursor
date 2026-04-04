import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { UploadedImage } from '../components/SimpleImageUploader/SimpleImageUploader';

import { API_CONFIG } from '@/config/api';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return fetch(`${API_CONFIG.BASE_URL}${endpoint}`, { ...options, headers });
}

export interface EditarAvisoState {
  ad: Record<string, any> | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
  hasChanges: boolean;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  currency: 'ARS' | 'USD';
  setCurrency: (v: 'ARS' | 'USD') => void;
  priceNegotiable: boolean;
  setPriceNegotiable: (v: boolean) => void;
  province: string;
  setProvince: (v: string) => void;
  locality: string;
  setLocality: (v: string) => void;
  images: UploadedImage[];
  setImages: (v: UploadedImage[]) => void;
  attributeValues: Record<string, any>;
  setAttributeValues: (v: Record<string, any>) => void;
  subcategoryId: string | null;
  categoryPath: string;
  status: string;
  setStatus: (v: string) => void;
  handleSave: () => Promise<void>;
  handleCategoryChange: (subcategoryId: string, path: string) => void;
}

export function useEditarAviso(adId: string): EditarAvisoState {
  const [ad, setAd] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [priceNegotiable, setPriceNegotiable] = useState(false);
  const [province, setProvince] = useState('');
  const [locality, setLocality] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>({});
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [categoryPath, setCategoryPath] = useState('');
  const [status, setStatus] = useState('active');

  const [originalAd, setOriginalAd] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (!adId) return;
    loadAd();
  }, [adId]);

  async function loadAd() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/ads/${adId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error cargando aviso');
      }
      const { data } = await res.json();
      setAd(data);
      setOriginalAd(data);

      setTitle(data.title || '');
      setDescription(data.description || '');
      setPrice(data.price != null ? String(data.price) : '');
      setCurrency(data.currency || 'ARS');
      setPriceNegotiable(data.price_negotiable || false);
      setProvince(data.province || '');
      setLocality(data.location || '');
      setStatus(data.status || 'active');
      setSubcategoryId(data.subcategory_id || null);
      setAttributeValues(data.attributes || {});

      if (data.images && data.images.length > 0) {
        const mapped: UploadedImage[] = data.images.map((img: any, idx: number) => ({
          url: typeof img === 'string' ? img : img.url,
          path: typeof img === 'string' ? img : (img.path || img.url),
          status: 'success' as const,
          progress: 100,
          sortOrder: idx,
          isPrimary: idx === 0,
        }));
        setImages(mapped);
      }

      if (data.subcategory_id) {
        const path = await buildCategoryPath(data.subcategory_id, data.category_id);
        setCategoryPath(path);
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando aviso');
    } finally {
      setLoading(false);
    }
  }

  async function buildCategoryPath(subId: string, catId?: string): Promise<string> {
    try {
      const { data: sub } = await supabase
        .from('subcategories')
        .select('display_name, parent_id, category_id')
        .eq('id', subId)
        .single();

      const resolvedCatId = catId || sub?.category_id;

      const { data: cat } = resolvedCatId
        ? await supabase.from('categories').select('display_name').eq('id', resolvedCatId).single()
        : { data: null };

      if (sub?.parent_id) {
        const { data: parent } = await supabase
          .from('subcategories')
          .select('display_name')
          .eq('id', sub.parent_id)
          .single();
        return [cat?.display_name, parent?.display_name, sub?.display_name].filter(Boolean).join(' > ');
      }

      return [cat?.display_name, sub?.display_name].filter(Boolean).join(' > ');
    } catch {
      return '';
    }
  }

  const hasChanges = useCallback((): boolean => {
    if (!originalAd) return false;
    if (title !== (originalAd.title || '')) return true;
    if (description !== (originalAd.description || '')) return true;
    if (price !== (originalAd.price != null ? String(originalAd.price) : '')) return true;
    if (currency !== (originalAd.currency || 'ARS')) return true;
    if (priceNegotiable !== (originalAd.price_negotiable || false)) return true;
    if (province !== (originalAd.province || '')) return true;
    if (locality !== (originalAd.location || '')) return true;
    if (status !== (originalAd.status || 'active')) return true;
    if (subcategoryId !== (originalAd.subcategory_id || null)) return true;
    if (JSON.stringify(attributeValues) !== JSON.stringify(originalAd.attributes || {})) return true;

    const origImageUrls = (originalAd.images || []).map((img: any) =>
      typeof img === 'string' ? img : img.url
    );
    const currImageUrls = images.filter(i => i.status === 'success').map(i => i.url);
    if (JSON.stringify(origImageUrls) !== JSON.stringify(currImageUrls)) return true;

    return false;
  }, [originalAd, title, description, price, currency, priceNegotiable, province, locality, status, subcategoryId, attributeValues, images]);

  const handleSave = useCallback(async () => {
    if (!originalAd) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const diff: Record<string, any> = {};

      if (title !== (originalAd.title || '')) diff.title = title;
      if (description !== (originalAd.description || '')) diff.description = description;
      if (price !== (originalAd.price != null ? String(originalAd.price) : '')) {
        diff.price = price ? Number(price) : null;
      }
      if (currency !== (originalAd.currency || 'ARS')) diff.currency = currency;
      if (priceNegotiable !== (originalAd.price_negotiable || false)) diff.price_negotiable = priceNegotiable;
      if (province !== (originalAd.province || '')) diff.province = province;
      if (locality !== (originalAd.location || '')) diff.location = locality;
      if (status !== (originalAd.status || 'active')) diff.status = status;
      if (subcategoryId !== (originalAd.subcategory_id || null)) diff.subcategory_id = subcategoryId;
      if (JSON.stringify(attributeValues) !== JSON.stringify(originalAd.attributes || {})) {
        diff.attributes = attributeValues;
      }

      const origImageUrls = (originalAd.images || []).map((img: any) =>
        typeof img === 'string' ? img : img.url
      );
      const currImages = images.filter(i => i.status === 'success');
      const currImageUrls = currImages.map(i => i.url);
      if (JSON.stringify(origImageUrls) !== JSON.stringify(currImageUrls)) {
        diff.images = currImages.map(i => ({ url: i.url!, path: i.path || i.url! }));
      }

      if (Object.keys(diff).length === 0) {
        setSaveSuccess(true);
        return;
      }

      const res = await fetchWithAuth(`/api/ads/${adId}`, {
        method: 'PATCH',
        body: JSON.stringify(diff),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al guardar');
      }

      setAd(data.data);
      setOriginalAd(data.data);
      setSaveSuccess(true);
    } catch (err: any) {
      setSaveError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }, [adId, originalAd, title, description, price, currency, priceNegotiable, province, locality, status, subcategoryId, attributeValues, images]);

  const handleCategoryChange = useCallback((newSubcategoryId: string, path: string) => {
    setSubcategoryId(newSubcategoryId);
    setCategoryPath(path);
    setAttributeValues({});
  }, []);

  return {
    ad,
    loading,
    error,
    saving,
    saveError,
    saveSuccess,
    hasChanges: hasChanges(),
    title, setTitle,
    description, setDescription,
    price, setPrice,
    currency, setCurrency,
    priceNegotiable, setPriceNegotiable,
    province, setProvince,
    locality, setLocality,
    images, setImages,
    attributeValues, setAttributeValues,
    subcategoryId,
    categoryPath,
    status, setStatus,
    handleSave,
    handleCategoryChange,
  };
}
