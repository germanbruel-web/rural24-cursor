import { supabase } from './supabaseClient';

export interface UserFavorite {
  id: string;
  user_id: string;
  ad_id: string | null;
  subcategory_id: string | null;
  notify_new_ads: boolean;
  created_at: string;
}

export interface FavoriteAd {
  id: string;
  ad_id: string;
  created_at: string;
  ad: {
    id: string;
    title: string;
    slug: string | null;
    price: number | null;
    currency: string | null;
    province: string | null;
    images: string[];
    status: string;
    subcategory_name?: string;
  };
}

export interface FavoriteSubcategory {
  id: string;
  subcategory_id: string;
  notify_new_ads: boolean;
  created_at: string;
  subcategory: {
    id: string;
    name: string;
    display_name: string;
    slug: string;
    category?: { display_name: string };
  };
}

/** Verificar si un aviso está en favoritos del usuario */
export async function isAdFavorited(userId: string, adId: string): Promise<boolean> {
  const { count } = await supabase
    .from('user_favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('ad_id', adId);
  return (count ?? 0) > 0;
}

/** Verificar si una subcategoría está en seguidos */
export async function isSubcategoryFollowed(userId: string, subcategoryId: string): Promise<boolean> {
  const { count } = await supabase
    .from('user_favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('subcategory_id', subcategoryId);
  return (count ?? 0) > 0;
}

/** Verificar múltiples avisos a la vez (para cards) */
export async function getFavoritedAdIds(userId: string, adIds: string[]): Promise<Set<string>> {
  if (adIds.length === 0) return new Set();
  const { data } = await supabase
    .from('user_favorites')
    .select('ad_id')
    .eq('user_id', userId)
    .in('ad_id', adIds);
  return new Set((data ?? []).map(r => r.ad_id).filter(Boolean));
}

/** Guardar / quitar aviso de favoritos (toggle) */
export async function toggleAdFavorite(userId: string, adId: string): Promise<boolean> {
  const already = await isAdFavorited(userId, adId);
  if (already) {
    await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('ad_id', adId);
    return false;
  } else {
    await supabase
      .from('user_favorites')
      .insert({ user_id: userId, ad_id: adId });
    return true;
  }
}

/** Seguir / dejar de seguir subcategoría (toggle) */
export async function toggleSubcategoryFollow(userId: string, subcategoryId: string): Promise<boolean> {
  const already = await isSubcategoryFollowed(userId, subcategoryId);
  if (already) {
    await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('subcategory_id', subcategoryId);
    return false;
  } else {
    await supabase
      .from('user_favorites')
      .insert({ user_id: userId, subcategory_id: subcategoryId, notify_new_ads: true });
    return true;
  }
}

/** Obtener avisos guardados con datos del aviso */
export async function getFavoriteAds(userId: string): Promise<FavoriteAd[]> {
  const { data, error } = await supabase
    .from('user_favorites')
    .select(`
      id, ad_id, created_at,
      ad:ads(id, title, slug, price, currency, province, images, status, subcategory_id)
    `)
    .eq('user_id', userId)
    .not('ad_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).filter(r => r.ad) as unknown as FavoriteAd[];
}

/** Obtener subcategorías seguidas */
export async function getFollowedSubcategories(userId: string): Promise<FavoriteSubcategory[]> {
  const { data, error } = await supabase
    .from('user_favorites')
    .select(`
      id, subcategory_id, notify_new_ads, created_at,
      subcategory:subcategories(
        id, name, display_name, slug,
        category:categories(display_name)
      )
    `)
    .eq('user_id', userId)
    .not('subcategory_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).filter(r => r.subcategory) as unknown as FavoriteSubcategory[];
}
