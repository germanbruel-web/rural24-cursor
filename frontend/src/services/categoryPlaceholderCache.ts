/**
 * Cache de imágenes placeholder por categoría.
 * Carga una vez desde site_settings (default_ad_image_{slug}) y categories.
 * Provee lookup sincrónico para useProductImage.
 */

import { supabase } from './supabaseClient';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../constants/defaultImages';

// category_id → placeholder url
const cache = new Map<string, string>();
let globalFallback = '';
let loading: Promise<void> | null = null;

async function load(): Promise<void> {
  const [{ data: categories }, { data: settings }] = await Promise.all([
    supabase.from('categories').select('id, slug'),
    supabase
      .from('site_settings')
      .select('setting_key, setting_value')
      .or('setting_key.like.default_ad_image_%,setting_key.eq.default_ad_image')
      .not('setting_value', 'is', null),
  ]);

  const settingsMap = new Map<string, string>();
  for (const s of settings || []) {
    if (s.setting_key === 'default_ad_image') {
      globalFallback = s.setting_value;
    } else {
      const slug = s.setting_key.replace('default_ad_image_', '');
      if (s.setting_value) settingsMap.set(slug, s.setting_value);
    }
  }

  for (const cat of categories || []) {
    const url = settingsMap.get(cat.slug);
    if (url) cache.set(cat.id, url);
  }
}

export function initCategoryPlaceholders(): Promise<void> {
  if (!loading) loading = load().catch(console.error) as Promise<void>;
  return loading;
}

export function getCategoryPlaceholder(categoryId?: string): string {
  const fallback = globalFallback || DEFAULT_PLACEHOLDER_IMAGE;
  if (!categoryId) return fallback;
  return cache.get(categoryId) ?? fallback;
}
