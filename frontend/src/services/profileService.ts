/**
 * profileService.ts
 * Servicio para gestión de perfiles de usuario (especialmente empresas)
 */

import { supabase } from './supabaseClient';

// ============================================================================
// TIPOS
// ============================================================================

export interface ProfileData {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  mobile?: string;
  province?: string;
  location?: string;
  user_type?: 'particular' | 'empresa';
  
  // Campos unificados de perfil profesional
  display_name?: string;       // Nombre profesional o razón social
  avatar_url?: string;
  bio?: string;                // Descripción personal o de empresa
  services?: string;
  
  // Privacidad (empresa o particular premium)
  privacy_mode?: 'public' | 'private';
  
  // Métricas (solo lectura)
  profile_views?: number;
  profile_contacts_received?: number;
}

export interface ProfileContact {
  id?: string;
  profile_user_id: string;
  sender_user_id?: string;
  sender_first_name: string;
  sender_last_name: string;
  sender_phone: string;
  sender_email: string;
  message: string;
  source_type?: 'profile' | 'ad' | 'search';
  source_ad_id?: string;
  status?: 'unread' | 'read' | 'replied' | 'archived';
  created_at?: string;
}

export interface ProfileMetrics {
  profile_views: number;
  profile_contacts_received: number;
  conversion_rate: number;
  unread_contacts: number;
  views_last_7_days: number;
  contacts_last_7_days: number;
}

// ============================================================================
// FUNCIONES DE PERFIL
// ============================================================================

/**
 * Obtener el perfil completo del usuario actual
 */
export async function getMyProfile(): Promise<{ data: ProfileData | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('No autenticado') };
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Actualizar perfil del usuario
 */
export async function updateProfile(updates: Partial<ProfileData>): Promise<{ error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: new Error('No autenticado') };
    }

    // Combinar first_name y last_name si se proporcionan
    if (updates.first_name !== undefined || updates.last_name !== undefined) {
      const firstName = updates.first_name?.trim() || '';
      const lastName = updates.last_name?.trim() || '';
      updates.full_name = `${firstName} ${lastName}`.trim();
      delete updates.first_name;
      delete updates.last_name;
    }

    // Campos permitidos para actualizar
    const allowedFields = [
      'full_name', 'phone', 'mobile', 'province', 'location',
      'company_name', 'company_cuit', 'avatar_url', 'company_description', 
      'services', 'privacy_mode'
    ];

    const sanitizedUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        sanitizedUpdates[key] = value;
      }
    }

    const { error } = await supabase
      .from('users')
      .update(sanitizedUpdates)
      .eq('id', user.id);

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Subir avatar/logo
 */
export async function uploadAvatar(file: File): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { url: null, error: new Error('No autenticado') };
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
    
    if (!fileExt || !allowedExts.includes(fileExt)) {
      return { url: null, error: new Error('Formato de imagen no válido. Use JPG, PNG o WEBP.') };
    }

    // Limitar tamaño a 2MB
    if (file.size > 2 * 1024 * 1024) {
      return { url: null, error: new Error('La imagen no puede superar 2MB') };
    }

    const fileName = `${user.id}/avatar.${fileExt}`;
    
    // Subir a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { 
        upsert: true,
        contentType: file.type 
      });

    if (uploadError) {
      return { url: null, error: uploadError };
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Agregar timestamp para evitar caché
    const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

    // Actualizar perfil con la URL
    const { error: updateError } = await updateProfile({ avatar_url: urlWithTimestamp });
    if (updateError) {
      return { url: null, error: updateError };
    }

    return { url: urlWithTimestamp, error: null };
  } catch (error) {
    return { url: null, error: error as Error };
  }
}

/**
 * Eliminar avatar
 */
export async function deleteAvatar(): Promise<{ error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: new Error('No autenticado') };
    }

    // Eliminar del storage
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]);

    if (deleteError) {
      console.warn('Error eliminando archivo de storage:', deleteError);
    }

    // Limpiar URL en perfil
    const { error: updateError } = await updateProfile({ avatar_url: '' });
    
    return { error: updateError };
  } catch (error) {
    return { error: error as Error };
  }
}

// ============================================================================
// CONTACTOS DE PERFIL (FORMULARIO ANÓNIMO)
// ============================================================================

/**
 * Enviar contacto a un perfil de empresa
 */
export async function sendProfileContact(contact: Omit<ProfileContact, 'id' | 'status' | 'created_at'>): Promise<{ error: Error | null }> {
  try {
    // Verificar que el perfil destino existe y es empresa
    const { data: targetProfile, error: profileError } = await supabase
      .from('users')
      .select('id, user_type, privacy_mode')
      .eq('id', contact.profile_user_id)
      .single();

    if (profileError || !targetProfile) {
      return { error: new Error('Perfil no encontrado') };
    }

    if (targetProfile.user_type !== 'empresa') {
      return { error: new Error('Solo se pueden contactar perfiles de empresa') };
    }

    // Obtener usuario actual si está logueado
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('profile_contacts')
      .insert({
        ...contact,
        sender_user_id: user?.id || null,
        status: 'unread'
      });

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Obtener contactos recibidos (para empresas)
 */
export async function getMyProfileContacts(
  options: { status?: string; limit?: number; offset?: number } = {}
): Promise<{ data: ProfileContact[]; count: number; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: [], count: 0, error: new Error('No autenticado') };
    }

    let query = supabase
      .from('profile_contacts')
      .select('*', { count: 'exact' })
      .eq('profile_user_id', user.id)
      .order('created_at', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, count, error } = await query;

    if (error) {
      return { data: [], count: 0, error };
    }

    return { data: data || [], count: count || 0, error: null };
  } catch (error) {
    return { data: [], count: 0, error: error as Error };
  }
}

/**
 * Marcar contacto como leído
 */
export async function markContactAsRead(contactId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('profile_contacts')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('id', contactId);

    return { error: error || null };
  } catch (error) {
    return { error: error as Error };
  }
}

// ============================================================================
// MÉTRICAS
// ============================================================================

/**
 * Obtener métricas del perfil (empresas y usuarios premium)
 */
export async function getProfileMetrics(): Promise<{ data: ProfileMetrics | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('No autenticado') };
    }

    const { data, error } = await supabase
      .from('user_metrics_view')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      // Si la vista no existe, devolver métricas vacías
      if (error.code === 'PGRST116') {
        return {
          data: {
            profile_views: 0,
            profile_contacts_received: 0,
            conversion_rate: 0,
            unread_contacts: 0,
            views_last_7_days: 0,
            contacts_last_7_days: 0
          },
          error: null
        };
      }
      return { data: null, error };
    }

    return { 
      data: {
        profile_views: data.profile_views || 0,
        profile_contacts_received: data.profile_contacts_received || 0,
        conversion_rate: data.conversion_rate || 0,
        unread_contacts: data.unread_contacts || 0,
        views_last_7_days: data.views_last_7_days || 0,
        contacts_last_7_days: data.contacts_last_7_days || 0
      }, 
      error: null 
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Registrar vista de perfil (llamar desde página pública)
 */
export async function registerProfileView(
  profileUserId: string,
  sourceType: 'direct' | 'ad' | 'search' | 'external' = 'direct',
  sourceAdId?: string
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Llamar a la función RPC para registrar vista
    await supabase.rpc('increment_profile_view', {
      p_profile_user_id: profileUserId,
      p_visitor_user_id: user?.id || null,
      p_source_type: sourceType,
      p_source_ad_id: sourceAdId || null
    });
  } catch (error) {
    console.warn('Error registrando vista de perfil:', error);
  }
}

/**
 * Obtener perfil público de una empresa (para visitantes)
 */
export async function getPublicProfile(userId: string): Promise<{ data: ProfileData | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        user_type,
        company_name,
        avatar_url,
        company_description,
        services,
        privacy_mode,
        province,
        location,
        phone,
        mobile,
        email
      `)
      .eq('id', userId)
      .eq('user_type', 'empresa')
      .single();

    if (error) {
      return { data: null, error };
    }

    // Si es privado, ocultar datos de contacto
    if (data.privacy_mode === 'private') {
      return {
        data: {
          ...data,
          phone: undefined,
          mobile: undefined,
          email: undefined
        },
        error: null
      };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
