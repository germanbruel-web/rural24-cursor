// src/services/adsService.ts
import { supabase } from './supabaseClient';
import type { Ad, CreateAdInput, UpdateAdInput } from '../../types';
import type { Product } from '../../types';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../constants/defaultImages';

/**
 * Transformar Ad (de Supabase) a Product (para UI)
 * Normaliza campos de imágenes y asegura compatibilidad
 */
export function transformAdToProduct(ad: Ad): Product {
  console.log('🔍 [transformAdToProduct] INPUT:', { 
    id: ad.id, 
    title: ad.title?.substring(0, 30),
    images: ad.images,
    image_urls: ad.image_urls,
    imagesType: Array.isArray(ad.images) ? 'array' : typeof ad.images,
    imagesLength: Array.isArray(ad.images) ? ad.images.length : 'N/A'
  });

  // Extraer primera imagen desde múltiples posibles campos
  let imageUrl = DEFAULT_PLACEHOLDER_IMAGE; // Fallback Cloudinary
  let imageUrls: string[] = [];

  // Prioridad: images > image_urls > imageUrl directo
  if (ad.images && ad.images.length > 0) {
    console.log('🖼️ [transformAdToProduct] Procesando ad.images:', ad.images);
    // Si images es array de objetos {url, path}, extraer URLs
    imageUrls = ad.images
      .map(img => {
        if (typeof img === 'string') return img;
        if (typeof img === 'object' && img && 'url' in img) return (img as any).url;
        return null;
      })
      .filter(Boolean) as string[];
    imageUrl = imageUrls[0] || imageUrl;
    console.log('✅ [transformAdToProduct] Extraídas de images:', { imageUrl, imageUrlsCount: imageUrls.length });
  } else if (ad.image_urls && ad.image_urls.length > 0) {
    console.log('🖼️ [transformAdToProduct] Procesando ad.image_urls:', ad.image_urls);
    imageUrls = ad.image_urls.filter(Boolean);
    imageUrl = imageUrls[0] || imageUrl;
    console.log('✅ [transformAdToProduct] Extraídas de image_urls:', { imageUrl, imageUrlsCount: imageUrls.length });
  } else {
    console.warn('⚠️ [transformAdToProduct] SIN IMÁGENES - Usando placeholder:', DEFAULT_PLACEHOLDER_IMAGE);
  }

  console.log('🎯 [transformAdToProduct] OUTPUT:', { imageUrl, imageUrlsCount: imageUrls.length });

  // Extraer nombre de categoría si es objeto con name
  let categoryName = ad.category || 'Sin categoría';
  if (typeof ad.category === 'object' && ad.category !== null && 'name' in ad.category) {
    categoryName = (ad.category as any).name;
  }
  
  // Extraer nombre de subcategoría si es objeto con name
  let subcategoryName = ad.subcategory;
  if (typeof ad.subcategory === 'object' && ad.subcategory !== null && 'name' in ad.subcategory) {
    subcategoryName = (ad.subcategory as any).name;
  }

  return {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    price: ad.price,
    currency: ad.currency || 'ARS',
    location: ad.location || ad.province || 'Sin ubicación',
    province: ad.province,
    imageUrl, // Primera imagen
    imageUrls, // Array completo para galería
    sourceUrl: `/ad/${ad.id}`,
    category: categoryName,
    subcategory: subcategoryName,
    isSponsored: false,
    isPremium: ad.featured || false,
    featured: ad.featured || false,
    tags: ad.tags || [],
    createdAt: ad.created_at,
    updatedAt: ad.updated_at,
    attributes: (ad as any).attributes || {},
    brand: ad.brand,
    model: ad.model,
    user_id: ad.user_id,
    seller: ad.seller,
  };
}

/**
 * Obtener límite de avisos según el rol del usuario
 * - Usuarios FREE: máximo 5 avisos
 * - Usuarios PREMIUM: máximo 20 avisos
 * - SuperAdmin: ilimitado
 */
export async function getUserAdLimit(userId?: string): Promise<{ limit: number; current: number }> {
  try {
    if (!userId) {
      return { limit: 5, current: 0 };
    }

    // Obtener el rol del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('Error getting user role:', userError);
      return { limit: 5, current: 0 };
    }

    // Contar avisos activos y pausados del usuario
    const { count } = await supabase
      .from('ads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['active', 'paused']);

    // Determinar límite según rol
    let limit: number;
    if (userData.role === 'superadmin' || userData.role === 'admin') {
      limit = 999999; // Ilimitado para admins
    } else if (userData.role === 'free' || userData.role === 'user') {
      limit = 5; // Máximo 5 para usuarios free
    } else {
      limit = 20; // Premium: máximo 20
    }
    
    return {
      limit,
      current: count || 0,
    };
  } catch (error) {
    console.error('Error getting user ad limit:', error);
    return { limit: 5, current: 0 };
  }
}

// 🚧 UUID genérico para todos los avisos en modo desarrollo
const DEV_USER_UUID = '00000000-0000-0000-0000-000000000000';

/**
 * Crear un nuevo aviso
 * - Usuarios FREE: máximo 10 avisos, aprobación automática
 * - Usuarios PREMIUM/Admin: ilimitado
 * Valida el límite antes de crear
 */
export async function createAd(
  input: CreateAdInput,
  userId?: string
): Promise<{ ad: Ad | null; error: any }> {
  try {
    const effectiveUserId = userId || DEV_USER_UUID;
    
    // Verificar límite de avisos
    const limit = await getUserAdLimit(effectiveUserId);
    if (limit.current >= limit.limit) {
      return { 
        ad: null, 
        error: { 
          message: `Has alcanzado el límite de ${limit.limit} avisos. Elimina o pausa algunos para publicar más.` 
        } 
      };
    }
    
    const { data, error } = await supabase
      .from('ads')
      .insert({
        user_id: effectiveUserId,
        ...input,
        status: 'active',
        approval_status: 'approved', // ✅ Auto-aprobar en MVP
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error insertando aviso:', error);
      return { ad: null, error };
    }
    
    console.log('✅ Aviso creado y publicado:', data);
    return { ad: data as Ad, error: null };
  } catch (error) {
    console.error('❌ Error creating ad:', error);
    return { ad: null, error };
  }
}

/**
 * Obtener todos los avisos (con filtros opcionales)
 */
export async function getAds(filters?: {
  userId?: string;
  status?: string;
  category?: string;
  province?: string;
}): Promise<Ad[]> {
  try {
    let query = supabase
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.category) {
      query = query.eq('category_id', filters.category);
    }
    if (filters?.province) {
      query = query.eq('province', filters.province);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [getAds] Error fetching ads:', error);
      return [];
    }

    console.log('📊 [getAds] Datos raw de Supabase:', data?.length, data);

    // Cargar categorías para mapeo manual
    const categoryIds = [...new Set(data?.map((ad: any) => ad.category_id).filter(Boolean))];
    let categoriesMap: Record<string, string> = {};

    if (categoryIds.length > 0) {
      const { data: catsData } = await supabase
        .from('categories')
        .select('id, display_name')
        .in('id', categoryIds);
      
      if (catsData) {
        categoriesMap = Object.fromEntries(
          catsData.map((c: any) => [c.id, c.display_name])
        );
      }
    }

    // Transformar datos para agregar category como string
    const adsWithCategories = (data || []).map((ad: any) => ({
      ...ad,
      category: categoriesMap[ad.category_id] || 'Sin categoría',
    }));

    console.log('✅ [getAds] Avisos transformados:', adsWithCategories.length);
    return adsWithCategories as Ad[];
  } catch (error) {
    console.error('Error fetching ads:', error);
    return [];
  }
}

/**
 * Obtener avisos activos públicos
 */
export async function getActiveAds(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    console.log('📊 [getActiveAds] Raw data:', data?.length, 'avisos');
    console.log('🖼️ [getActiveAds] Primer aviso images:', data?.[0]?.images);
    
    // Transformar Ad[] a Product[] con normalización de imágenes
    const products = (data || []).map(ad => transformAdToProduct(ad as Ad));
    
    console.log('✅ [getActiveAds] Products transformados:', products.length);
    console.log('🖼️ [getActiveAds] Primer product imageUrl:', products[0]?.imageUrl);
    
    return products;
  } catch (error) {
    console.error('Error fetching active ads:', error);
    return [];
  }
}

/**
 * Obtener avisos premium activos DESTACADOS para el carrusel principal
 * Solo trae avisos con featured: true, aprobados y activos
 */
export async function getPremiumAds(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('status', 'active')
      .eq('featured', true) // SOLO avisos marcados como destacados
      .eq('approval_status', 'approved') // SOLO avisos aprobados
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(12); // Límite para el carrusel

    if (error) throw error;
    
    console.log(`🏆 Avisos destacados para carrusel: ${data?.length || 0}`);
    
    // Transformar a Product[] con imágenes normalizadas
    const products = (data || []).map(ad => transformAdToProduct(ad as Ad));
    
    return products;
  } catch (error) {
    console.error('Error fetching premium ads:', error);
    return [];
  }
}

/**
 * Obtener un aviso por ID con información del vendedor
 * Soporta buscar por UUID completo o por los últimos 6 caracteres (shortId)
 */
export async function getAdById(id: string): Promise<Ad | null> {
  try {
    console.log('🔍 getAdById llamado con ID:', id);
    console.log('   Tipo:', typeof id);
    
    // Obtener el aviso básico primero
    let basicData: any = null;
    let basicError: any = null;
    
    // Intentar buscar por UUID completo primero
    const result = await supabase
      .from('ads')
      .select('*')
      .eq('id', id)
      .single();
    
    basicData = result.data;
    basicError = result.error;

    // Si no se encontró y el ID es corto (6 chars), buscar por coincidencia de final de UUID
    if (basicError && id.length === 6) {
      console.log('🔍 ID corto detectado, buscando por coincidencia de final de UUID...');
      const { data: allAds, error: searchError } = await supabase
        .from('ads')
        .select('*');
      
      if (searchError) {
        console.error('❌ Error buscando por shortId:', searchError);
        return null;
      }
      
      // Buscar UUID que termine con el shortId
      const matchingAd = allAds?.find(ad => ad.id.endsWith(id));
      
      if (matchingAd) {
        basicData = matchingAd;
        basicError = null;
        console.log('✅ Aviso encontrado por shortId:', matchingAd.id);
      }
    }

    if (basicError) {
      console.error('❌ Error en query básica:', basicError);
      return null;
    }

    if (!basicData) {
      console.warn('⚠️ No se encontró aviso con ID:', id);
      return null;
    }

    // Obtener nombres de categoría y subcategoría por separado
    if (basicData.category_id) {
      const { data: catData } = await supabase
        .from('categories')
        .select('display_name')
        .eq('id', basicData.category_id)
        .single();
      
      if (catData) {
        basicData.category = catData.display_name;
      }
    }

    if (basicData.subcategory_id) {
      const { data: subData } = await supabase
        .from('subcategories')
        .select('display_name')
        .eq('id', basicData.subcategory_id)
        .single();
      
      if (subData) {
        basicData.subcategory = subData.display_name;
      }
    }

    console.log('✅ Aviso encontrado (con categorías):', {
      id: basicData.id,
      title: basicData.title,
      category: basicData.category,
      subcategory: basicData.subcategory,
      user_id: basicData.user_id
    });

    // Ahora intentar obtener con el seller
    if (basicData.user_id) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, role, email_verified')
        .eq('id', basicData.user_id)
        .single();

      if (!userError && userData) {
        console.log('✅ Seller encontrado:', userData.email);
        (basicData as any).seller = userData;
      } else {
        console.warn('⚠️ No se pudo obtener seller:', userError);
      }
    }

    // Incrementar contador de vistas (sin esperar)
    supabase
      .from('ads')
      .update({ views_count: (basicData.views_count || 0) + 1 })
      .eq('id', id)
      .then(() => {})
      .catch((err) => console.error('Error updating view count:', err));

    return basicData as Ad;
  } catch (error) {
    console.error('❌ Exception en getAdById:', error);
    return null;
  }
}

/**
 * Actualizar un aviso (solo propietario)
 * 🚧 MODO DESARROLLO: Permite editar sin autenticación
 */
export async function updateAd(id: string, updates: UpdateAdInput): Promise<{ ad: Ad | null; error: any }> {
  try {
    console.log('🚧 MODO DESARROLLO: Actualizando aviso sin validación de usuario');

    const { data, error } = await supabase
      .from('ads')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando aviso:', error);
      return { ad: null, error };
    }
    
    console.log('✅ Aviso actualizado exitosamente:', data);
    return { ad: data as Ad, error: null };
  } catch (error) {
    console.error('❌ Error updating ad:', error);
    return { ad: null, error };
  }
}

/**
 * Eliminar un aviso (solo propietario - soft delete)
 * 🚧 MODO DESARROLLO: Permite eliminar avisos sin autenticación
 */
export async function deleteAd(id: string): Promise<{ error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 🚧 MODO DESARROLLO: Si no hay usuario autenticado, permitir delete
    // En producción, esto estaría protegido por RLS
    if (!user) {
      console.log('🚧 MODO DESARROLLO: Eliminando aviso sin autenticación');
      const { error } = await supabase
        .from('ads')
        .update({ status: 'deleted' })
        .eq('id', id);
      
      if (error) return { error };
      return { error: null };
    }

    // Modo normal: Verificar que el usuario es el propietario
    const { data: existingAd, error: fetchError } = await supabase
      .from('ads')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) return { error: fetchError };

    if (existingAd.user_id !== user.id) {
      return { error: { message: 'No tienes permiso para eliminar este aviso' } };
    }

    // Soft delete: cambiar status a 'deleted'
    const { error } = await supabase
      .from('ads')
      .update({ status: 'deleted' })
      .eq('id', id);

    if (error) return { error };
    return { error: null };
  } catch (error) {
    console.error('Error deleting ad:', error);
    return { error };
  }
}

/**
 * Pausar/reactivar un aviso
 * Obtiene el status actual y lo invierte (active <-> paused)
 */
export async function toggleAdStatus(id: string): Promise<{ error: any }> {
  try {
    // Obtener status actual
    const { data: currentAd, error: fetchError } = await supabase
      .from('ads')
      .select('status')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error obteniendo aviso:', fetchError);
      return { error: fetchError };
    }
    
    if (!currentAd) {
      return { error: { message: 'Aviso no encontrado' } };
    }
    
    // Toggle status: active <-> paused
    const newStatus = currentAd.status === 'active' ? 'paused' : 'active';
    
    // Actualizar
    const { error: updateError } = await supabase
      .from('ads')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (updateError) {
      console.error('Error actualizando status:', updateError);
      return { error: updateError };
    }
    
    console.log(`✅ Status cambiado de ${currentAd.status} a ${newStatus}`);
    return { error: null };
  } catch (error) {
    console.error('Error toggling ad status:', error);
    return { error };
  }
}

/**
 * Activar/desactivar "Mostrar en Homepage" (featured)
 */
export async function toggleFeatured(id: string): Promise<{ error: any }> {
  try {
    // Obtener featured actual y cambiar
    const { data: currentAd } = await supabase
      .from('ads')
      .select('featured')
      .eq('id', id)
      .single();
    
    if (!currentAd) {
      return { error: { message: 'Aviso no encontrado' } };
    }
    
    const newFeatured = !currentAd.featured;
    const { error } = await supabase
      .from('ads')
      .update({ featured: newFeatured })
      .eq('id', id);
    
    return { error };
  } catch (error) {
    console.error('Error toggling featured:', error);
    return { error };
  }
}

/**
 * Obtener avisos del usuario actual
 * 🚧 MODO DESARROLLO: Con devMode activo, devuelve avisos del devUser
 */
export async function getMyAds(devUserId?: string): Promise<Ad[]> {
  try {
    // Si hay devUserId del modo desarrollo, usarlo
    if (devUserId) {
      console.log('🚧 MODO DESARROLLO: Mostrando avisos del usuario dev:', devUserId);
      
      // Si es superadmin-dev, mostrar TODOS
      if (devUserId === 'dev-superadmin') {
        return await getAds();
      }
      
      // En DevMode, todos los avisos usan DEV_USER_UUID
      // Filtrar por ese UUID para obtener avisos de desarrollo
      console.log('🚧 Usando UUID genérico de desarrollo:', DEV_USER_UUID);
      return await getAds({ userId: DEV_USER_UUID });
    }
    
    // Modo normal: obtener usuario de Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log('👤 Usuario autenticado:', user?.id, user?.email);
    
    if (!user) {
      console.log('❌ Sin usuario autenticado');
      return [];
    }

    const ads = await getAds({ userId: user.id });
    console.log('📋 Avisos del usuario:', ads.length, ads);
    return ads;
  } catch (error) {
    console.error('Error fetching my ads:', error);
    return [];
  }
}

/**
 * Aprobar un aviso pendiente (solo SuperAdmin)
 */
export async function approveAd(
  adId: string, 
  adminUserId?: string
): Promise<{ error: any }> {
  try {
    console.log('🟢 Aprobando aviso:', adId);
    
    const { error } = await supabase
      .from('ads')
      .update({
        approval_status: 'approved',
        status: 'active',
        approved_by: adminUserId || null,
        approved_at: new Date().toISOString(),
      })
      .eq('id', adId);

    if (error) {
      console.error('❌ Error aprobando aviso:', error);
      return { error };
    }

    console.log('✅ Aviso aprobado exitosamente');
    return { error: null };
  } catch (error) {
    console.error('❌ Error en approveAd:', error);
    return { error };
  }
}

/**
 * Rechazar un aviso pendiente (solo SuperAdmin)
 */
export async function rejectAd(
  adId: string, 
  reason: string,
  adminUserId?: string
): Promise<{ error: any }> {
  try {
    console.log('🔴 Rechazando aviso:', adId, 'Motivo:', reason);
    
    const { error } = await supabase
      .from('ads')
      .update({
        approval_status: 'rejected',
        status: 'paused',
        rejection_reason: reason,
        approved_by: adminUserId || null,
        approved_at: new Date().toISOString(),
      })
      .eq('id', adId);

    if (error) {
      console.error('❌ Error rechazando aviso:', error);
      return { error };
    }

    console.log('✅ Aviso rechazado exitosamente');
    return { error: null };
  } catch (error) {
    console.error('❌ Error en rejectAd:', error);
    return { error };
  }
}

/**
 * Obtener avisos pendientes de aprobación de usuarios FREE (solo SuperAdmin)
 * Retorna avisos de usuarios con role 'free' o 'free-verificado'
 * Ambos tipos de usuarios FREE requieren moderación antes de publicar
 */
export async function getPendingAds(): Promise<Ad[]> {
  try {
    const { data, error } = await supabase
      .from('ads')
      .select(`
        *,
        seller:users!ads_user_id_fkey (
          id,
          email,
          full_name,
          role,
          email_verified
        )
      `)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending ads:', error);
      return [];
    }

    // Filtrar avisos de usuarios FREE y FREE-VERIFICADO (ambos requieren moderación)
    const freeUserAds = (data as Ad[]).filter(ad => 
      ad.seller?.role === 'free' || ad.seller?.role === 'free-verificado'
    );

    console.log(`📋 Avisos pendientes FREE: ${freeUserAds.length} de ${data.length} totales`);

    return freeUserAds;
  } catch (error) {
    console.error('Error fetching pending ads:', error);
    return [];
  }
}

/**
 * Obtener todos los avisos separados por rol de usuario (solo SuperAdmin)
 */
export async function getAllAdsByRole(filters?: {
  userRole?: 'free' | 'premium';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}): Promise<Ad[]> {
  try {
    let query = supabase
      .from('ads')
      .select(`
        *,
        seller:users!ads_user_id_fkey (
          id,
          email,
          full_name,
          role,
          email_verified
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.approvalStatus) {
      query = query.eq('approval_status', filters.approvalStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching ads by role:', error);
      return [];
    }

    // Filtrar por rol si se especifica
    if (filters?.userRole === 'free') {
      return (data as Ad[]).filter(ad => 
        ad.seller?.role === 'free' || ad.seller?.role === 'free-verificado'
      );
    } else if (filters?.userRole === 'premium') {
      return (data as Ad[]).filter(ad => 
        ad.seller?.role === 'premium-particular' || ad.seller?.role === 'premium-empresa'
      );
    }

    return data as Ad[];
  } catch (error) {
    console.error('Error fetching ads by role:', error);
    return [];
  }
}

/**
 * Convertir un aviso FREE a Premium (Aviso Híbrido)
 * Solo SuperAdmin puede hacer esto
 */
export async function updateAdToHybrid(adId: string): Promise<{ error: any }> {
  try {
    // Obtener el aviso actual
    const { data: currentAd, error: fetchError } = await supabase
      .from('ads')
      .select('*')
      .eq('id', adId)
      .single();

    if (fetchError) throw fetchError;
    if (!currentAd) throw new Error('Aviso no encontrado');

    // Actualizar a Premium: featured = true, approval_status = approved
    const { error: updateError } = await supabase
      .from('ads')
      .update({
        featured: true,
        approval_status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', adId);

    if (updateError) throw updateError;

    console.log(`✨ Aviso ${adId} convertido a Premium (Híbrido)`);
    return { error: null };
  } catch (error) {
    console.error('Error converting ad to hybrid:', error);
    return { error };
  }
}

// ====================================================================
// BÚSQUEDA CON FILTROS DESDE BACKEND API
// ====================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface SearchFiltersParams {
  cat?: string;           // Categoría slug
  sub?: string;           // Subcategoría slug
  prov?: string;          // Provincia
  q?: string;             // Búsqueda texto libre
  min_price?: number;
  max_price?: number;
  limit?: number;
  offset?: number;
  // Atributos dinámicos (cualquier clave extra)
  [key: string]: string | number | undefined;
}

export interface SearchAdsResponse {
  ads: Product[];
  total: number;
  hasMore: boolean;
}

/**
 * Buscar avisos desde Backend API con filtros por slug
 * Esta función consulta el backend BFF que resuelve slugs a IDs
 */
export async function searchAdsFromBackend(filters: SearchFiltersParams): Promise<SearchAdsResponse> {
  try {
    const params = new URLSearchParams();
    
    // Campos reservados y sus mappings (no son atributos JSONB)
    const reservedFields = ['cat', 'sub', 'prov', 'province', 'q', 'min_price', 'max_price', 'limit', 'offset', 'condition', 'city'];
    
    // Convertir filtros a query params para el backend
    if (filters.cat) params.set('cat', filters.cat);
    if (filters.sub) params.set('sub', filters.sub);
    // Aceptar tanto 'prov' como 'province'
    const provinciaValue = filters.prov || filters.province;
    if (provinciaValue) params.set('prov', String(provinciaValue));
    if (filters.q) params.set('search', filters.q);
    if (filters.min_price) params.set('min_price', filters.min_price.toString());
    if (filters.max_price) params.set('max_price', filters.max_price.toString());
    if (filters.limit) params.set('limit', filters.limit.toString());
    if (filters.offset) params.set('offset', filters.offset.toString());
    
    // Pasar atributos dinámicos con prefijo attr_
    for (const [key, value] of Object.entries(filters)) {
      if (!reservedFields.includes(key) && value !== undefined && value !== '') {
        params.set(`attr_${key}`, String(value));
      }
    }
    
    // Siempre traer solo avisos activos y aprobados
    params.set('status', 'active');
    params.set('approval_status', 'approved');
    
    console.log('🔍 searchAdsFromBackend - URL params:', params.toString());

    const response = await fetch(`${API_URL}/api/ads/search?${params.toString()}`);
    
    if (!response.ok) {
      console.error('❌ Error en searchAdsFromBackend:', response.status, response.statusText);
      return { ads: [], total: 0, hasMore: false };
    }

    const data = await response.json();
    
    // Transformar ads del backend a Products para el frontend
    const ads = (data.data || data.ads || []).map((ad: Ad) => transformAdToProduct(ad));
    
    return {
      ads,
      total: data.pagination?.total || ads.length,
      hasMore: data.pagination?.hasMore || false,
    };
  } catch (error) {
    console.error('❌ Error en searchAdsFromBackend:', error);
    return { ads: [], total: 0, hasMore: false };
  }
}

