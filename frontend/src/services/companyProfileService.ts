// ============================================================================
// COMPANY PROFILE SERVICE
// ============================================================================
// Servicio para gestionar perfiles de empresa y catálogos
// ============================================================================

import { supabase } from './supabaseClient';

// ============================================================================
// TIPOS
// ============================================================================

// Mapea a la tabla business_profiles creada en Sprint 3G-B
export interface CompanyProfile {
  id: string;
  user_id: string;
  slug: string;
  company_name: string;
  logo_url: string | null;
  cover_url: string | null;       // banner/portada
  tagline: string | null;
  description: string | null;
  whatsapp: string | null;
  website: string | null;
  social_networks: {
    facebook?: string;
    instagram?: string;
    [key: string]: string | undefined;
  };
  category_id: string | null;
  province: string | null;
  city: string | null;
  is_verified: boolean;
  is_active: boolean;
  profile_views: number;
  created_at: string;
  updated_at: string;
}

export interface Catalog {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  
  // Calculado
  items_count?: number;
}

export interface CatalogItem {
  id: string;
  catalog_id: string;
  title: string;
  description: string | null;
  images: string[];
  price: number | null;
  currency: string;
  price_type: 'fixed' | 'negotiable' | 'consult';
  specs: Record<string, any>;
  is_active: boolean;
  sort_order: number;
  views_count: number;
  contact_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyProfileData {
  company_name: string;
  tagline?: string;
  description?: string;
  whatsapp?: string;
  website?: string;
  social_networks?: { facebook?: string; instagram?: string; [key: string]: string | undefined };
  province?: string;
  city?: string;
  category_id?: string;
}

export interface UpdateCompanyProfileData extends Partial<CreateCompanyProfileData> {
  logo_url?: string;
  cover_url?: string;
}

// ============================================================================
// COMPANY PROFILE CRUD
// ============================================================================

/**
 * Obtiene el perfil de empresa del usuario actual
 */
export async function getMyCompanyProfile(): Promise<CompanyProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error getting company profile:', error);
    return null;
  }
}

/**
 * Obtiene un perfil de empresa por slug o UUID (público)
 * Si el parámetro parece un UUID, busca por id; sino por slug.
 */
export async function getCompanyProfileBySlug(slugOrId: string): Promise<CompanyProfile | null> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq(isUuid ? 'id' : 'slug', slugOrId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error getting company profile by slug/id:', error);
    return null;
  }
}

/**
 * Obtiene un perfil de empresa por ID
 */
export async function getCompanyProfileById(id: string): Promise<CompanyProfile | null> {
  try {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error getting company profile by id:', error);
    return null;
  }
}

/**
 * Crea un perfil de empresa para el usuario actual
 */
export async function createCompanyProfile(data: CreateCompanyProfileData): Promise<CompanyProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  // Generar slug único
  const baseSlug = data.company_name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const { data: profile, error } = await supabase
    .from('business_profiles')
    .insert({
      user_id: user.id,
      slug,
      company_name: data.company_name,
      tagline: data.tagline || null,
      description: data.description || null,
      whatsapp: data.whatsapp || null,
      website: data.website || null,
      social_networks: data.social_networks || {},
      province: data.province || null,
      city: data.city || null,
      category_id: data.category_id || null,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating company profile:', error);
    throw new Error('Error al crear perfil de empresa: ' + error.message);
  }

  return profile;
}

/**
 * Actualiza el perfil de empresa del usuario actual
 */
export async function updateCompanyProfile(data: UpdateCompanyProfileData): Promise<CompanyProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data: profile, error } = await supabase
    .from('business_profiles')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating company profile:', error);
    throw new Error('Error al actualizar perfil: ' + error.message);
  }

  return profile;
}

/**
 * Actualiza el logo de la empresa
 */
export async function updateCompanyLogo(logoUrl: string): Promise<CompanyProfile> {
  return updateCompanyProfile({ logo_url: logoUrl });
}

/**
 * Actualiza el banner/portada de la empresa
 */
export async function updateCompanyBanner(coverUrl: string): Promise<CompanyProfile> {
  return updateCompanyProfile({ cover_url: coverUrl });
}

// ============================================================================
// CATÁLOGOS CRUD
// ============================================================================

/**
 * Obtiene los catálogos de una empresa
 */
export async function getCatalogsByCompany(companyId: string): Promise<Catalog[]> {
  try {
    const { data, error } = await supabase
      .from('catalogs')
      .select(`
        *,
        items:catalog_items(count)
      `)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // Mapear count de items
    return (data || []).map(cat => ({
      ...cat,
      items_count: cat.items?.[0]?.count || 0,
    }));
  } catch (error) {
    console.error('❌ Error getting catalogs:', error);
    return [];
  }
}

/**
 * Obtiene mis catálogos (usuario actual)
 */
export async function getMyCatalogs(): Promise<Catalog[]> {
  const profile = await getMyCompanyProfile();
  if (!profile) return [];
  return getCatalogsByCompany(profile.id);
}

/**
 * Crea un nuevo catálogo
 */
export async function createCatalog(data: {
  name: string;
  description?: string;
  cover_image_url?: string;
}): Promise<Catalog> {
  const profile = await getMyCompanyProfile();
  if (!profile) throw new Error('No tienes un perfil de empresa');

  const slug = data.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const { data: catalog, error } = await supabase
    .from('catalogs')
    .insert({
      company_id: profile.id,
      name: data.name,
      slug,
      description: data.description || null,
      cover_image_url: data.cover_image_url || null,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating catalog:', error);
    throw new Error('Error al crear catálogo: ' + error.message);
  }

  return catalog;
}

/**
 * Actualiza un catálogo
 */
export async function updateCatalog(id: string, data: {
  name?: string;
  description?: string;
  cover_image_url?: string;
  sort_order?: number;
}): Promise<Catalog> {
  const { data: catalog, error } = await supabase
    .from('catalogs')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating catalog:', error);
    throw new Error('Error al actualizar catálogo: ' + error.message);
  }

  return catalog;
}

/**
 * Elimina un catálogo
 */
export async function deleteCatalog(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('catalogs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('❌ Error deleting catalog:', error);
    throw new Error('Error al eliminar catálogo: ' + error.message);
  }

  return true;
}

// ============================================================================
// ITEMS DE CATÁLOGO CRUD
// ============================================================================

/**
 * Obtiene los items de un catálogo
 */
export async function getCatalogItems(catalogId: string): Promise<CatalogItem[]> {
  try {
    const { data, error } = await supabase
      .from('catalog_items')
      .select('*')
      .eq('catalog_id', catalogId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Error getting catalog items:', error);
    return [];
  }
}

/**
 * Crea un item en un catálogo
 */
export async function createCatalogItem(catalogId: string, data: {
  title: string;
  description?: string;
  images?: string[];
  price?: number;
  currency?: string;
  price_type?: 'fixed' | 'negotiable' | 'consult';
  specs?: Record<string, any>;
}): Promise<CatalogItem> {
  const { data: item, error } = await supabase
    .from('catalog_items')
    .insert({
      catalog_id: catalogId,
      title: data.title,
      description: data.description || null,
      images: data.images || [],
      price: data.price || null,
      currency: data.currency || 'USD',
      price_type: data.price_type || 'fixed',
      specs: data.specs || {},
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating catalog item:', error);
    throw new Error('Error al crear producto: ' + error.message);
  }

  return item;
}

/**
 * Actualiza un item de catálogo
 */
export async function updateCatalogItem(id: string, data: {
  title?: string;
  description?: string;
  images?: string[];
  price?: number;
  currency?: string;
  price_type?: 'fixed' | 'negotiable' | 'consult';
  specs?: Record<string, any>;
  sort_order?: number;
}): Promise<CatalogItem> {
  const { data: item, error } = await supabase
    .from('catalog_items')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating catalog item:', error);
    throw new Error('Error al actualizar producto: ' + error.message);
  }

  return item;
}

/**
 * Elimina un item de catálogo
 */
export async function deleteCatalogItem(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('catalog_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('❌ Error deleting catalog item:', error);
    throw new Error('Error al eliminar producto: ' + error.message);
  }

  return true;
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Verifica si el usuario tiene un perfil de empresa
 */
export async function hasCompanyProfile(): Promise<boolean> {
  const profile = await getMyCompanyProfile();
  return profile !== null;
}

/**
 * Verifica si una categoría es "Servicios Rurales"
 */
export function isServiciosRuralesCategory(categoryName: string): boolean {
  const normalized = categoryName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return normalized.includes('servicio') && normalized.includes('rural');
}

/**
 * Obtiene estadísticas del perfil de empresa
 */
export async function getCompanyStats(companyId: string): Promise<{
  totalCatalogs: number;
  totalItems: number;
  totalViews: number;
  totalContacts: number;
}> {
  try {
    // Contar catálogos
    const { count: catalogsCount } = await supabase
      .from('catalogs')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_active', true);

    // Primero obtener los IDs de catálogos
    const { data: catalogsData } = await supabase
      .from('catalogs')
      .select('id')
      .eq('company_id', companyId);
    
    const catalogIds = catalogsData?.map(c => c.id) || [];

    // Obtener items con métricas
    const { data: items } = catalogIds.length > 0 
      ? await supabase
          .from('catalog_items')
          .select('views_count, contact_count, catalog_id')
          .in('catalog_id', catalogIds)
      : { data: [] as { views_count: number; contact_count: number; catalog_id: string }[] };

    const totalViews = (items || []).reduce((sum: number, i) => sum + (i.views_count || 0), 0);
    const totalContacts = (items || []).reduce((sum: number, i) => sum + (i.contact_count || 0), 0);

    return {
      totalCatalogs: catalogsCount || 0,
      totalItems: items?.length || 0,
      totalViews,
      totalContacts,
    };
  } catch (error) {
    console.error('❌ Error getting company stats:', error);
    return { totalCatalogs: 0, totalItems: 0, totalViews: 0, totalContacts: 0 };
  }
}
