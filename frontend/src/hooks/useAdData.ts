import { useState, useEffect } from 'react';
import { useGlobalSetting } from './useGlobalSetting';
import { supabase } from '../services/supabaseClient';
import { normalizeImages, getFirstImage } from '../utils/imageHelpers';
import { getFormForContext } from '../services/v2/formsService';
import { getOptionListItemsForSelect } from '../services/v2/optionListsService';
import type { CompleteFormV2 } from '../types/v2';
import type { Product } from '../../types';
import type { Ad, OptionLabels } from '../components/pages/ad-detail/types';
import { logger } from '../utils/logger';

export function useAdData(adId: string) {
  const similarAdsLimit = useGlobalSetting<number>('similar_ads_limit', 6);

  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CompleteFormV2 | null>(null);
  const [optionLabels, setOptionLabels] = useState<OptionLabels>({});
  const [similarAds, setSimilarAds] = useState<Product[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [sellerAdsCount, setSellerAdsCount] = useState<number>(0);

  useEffect(() => { loadAd(); }, [adId]);

  useEffect(() => {
    if (!ad) return;
    loadFormAndLabels(ad);
    loadSimilarAds(ad.category_id, ad.subcategory_id, ad.id);
    loadSellerAdsCount(ad.user_id);
  }, [ad?.id]);

  const loadAd = async () => {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adId || '');
      const isShortId = /^[A-Z]{3}\d{5}$/.test(adId || '');

      let query = supabase.from('ads').select('*');
      if (isUuid) query = query.eq('id', adId);
      else if (isShortId) query = query.eq('short_id', adId);
      else query = query.eq('slug', adId);

      const { data, error } = await query.single();
      if (error) {
        if (import.meta.env.DEV) {
          console.warn('[useAdData] Ad not found. Queried:', { adId, isUuid, isShortId }, 'Error:', error.message);
        }
        throw error;
      }

      const normalizedImages = normalizeImages(data.images);

      const [subcatResult, opTypeResult, sellerResult] = await Promise.all([
        data.subcategory_id
          ? supabase.from('subcategories').select('name, display_name, category_id, parent_id').eq('id', data.subcategory_id).single()
          : Promise.resolve({ data: null }),
        data.operation_type_id
          ? supabase.from('operation_types').select('display_name').eq('id', data.operation_type_id).single()
          : Promise.resolve({ data: null }),
        data.user_id
          ? supabase.from('users').select('full_name, email_verified, role, created_at, avatar_url').eq('id', data.user_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      let categoryData = null;
      let parentSubcatData: { id: string; display_name: string } | null = null;

      const [catResult, parentSubcatResult] = await Promise.all([
        subcatResult.data?.category_id
          ? supabase.from('categories').select('name, display_name').eq('id', subcatResult.data.category_id).single()
          : Promise.resolve({ data: null }),
        subcatResult.data?.parent_id
          ? supabase.from('subcategories').select('id, display_name').eq('id', subcatResult.data.parent_id).single()
          : Promise.resolve({ data: null }),
      ]);
      categoryData = catResult.data;
      parentSubcatData = parentSubcatResult.data;

      setAd({
        ...data,
        images: normalizedImages,
        categories: categoryData,
        subcategories: subcatResult.data ?? null,
        subcategory_parent: parentSubcatData,
        operation_types: opTypeResult.data ?? null,
        seller: sellerResult.data ?? null,
      });
    } catch (err) {
      logger.error('[useAdData] Error al cargar aviso:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSellerAdsCount = async (sellerId: string) => {
    try {
      const { count } = await supabase
        .from('ads')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', sellerId)
        .eq('status', 'active');
      setSellerAdsCount(count || 0);
    } catch {
      // non-critical, silenciar
    }
  };

  const loadSimilarAds = async (categoryId: string, subcategoryId: string | undefined, excludeId: string) => {
    setLoadingSimilar(true);
    try {
      // Primero: misma subcategoría
      let items: Product[] = [];

      if (subcategoryId) {
        const { data: subData } = await supabase
          .from('ads')
          .select('id, slug, short_id, title, description, price, currency, location, province, images, user_id, created_at')
          .eq('subcategory_id', subcategoryId)
          .eq('status', 'active')
          .neq('id', excludeId)
          .order('created_at', { ascending: false })
          .limit(similarAdsLimit);

        items = mapToProducts(subData || []);
      }

      // Completar con misma categoría si hay menos del límite
      if (items.length < similarAdsLimit) {
        const existingIds = [excludeId, ...items.map(i => i.id)];
        const { data: catData } = await supabase
          .from('ads')
          .select('id, slug, short_id, title, description, price, currency, location, province, images, user_id, created_at')
          .eq('category_id', categoryId)
          .eq('status', 'active')
          .not('id', 'in', `(${existingIds.join(',')})`)
          .order('created_at', { ascending: false })
          .limit(similarAdsLimit - items.length);

        items = [...items, ...mapToProducts(catData || [])];
      }

      setSimilarAds(items);
    } catch (err) {
      logger.error('[useAdData] Error cargando avisos similares:', err);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const mapToProducts = (rows: any[]): Product[] =>
    rows.map(item => ({
      id: item.id,
      slug: item.slug,
      short_id: item.short_id,
      title: item.title,
      description: item.description || '',
      price: item.price,
      currency: item.currency || 'ARS',
      location: item.location || '',
      province: item.province,
      imageUrl: getFirstImage(item.images || []),
      images: normalizeImages(item.images || []),
      category: '',
      subcategory: undefined,
      sourceUrl: '#',
      isSponsored: false,
      user_id: item.user_id,
      createdAt: item.created_at,
    }));

  const loadFormAndLabels = async (loadedAd: Ad) => {
    let loadedForm = await getFormForContext(loadedAd.category_id, loadedAd.subcategory_id);
    // Fallback: si el aviso está en L3 y no hay template, intentar con L2 padre
    if (!loadedForm && loadedAd.subcategory_parent?.id) {
      loadedForm = await getFormForContext(loadedAd.category_id, loadedAd.subcategory_parent.id);
    }
    setForm(loadedForm);
    if (!loadedForm) return;

    const listIds = [
      ...new Set(loadedForm.fields.filter(f => f.option_list_id).map(f => f.option_list_id as string)),
    ];
    const labels: OptionLabels = {};
    await Promise.all(
      listIds.map(async listId => {
        const items = await getOptionListItemsForSelect(listId);
        labels[listId] = Object.fromEntries(items.map(i => [i.value, i.label]));
      })
    );
    setOptionLabels(labels);
  };

  return { ad, loading, form, optionLabels, similarAds, loadingSimilar, sellerAdsCount };
}
