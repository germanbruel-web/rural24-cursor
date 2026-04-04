/**
 * =====================================================
 * SITE SETTINGS SERVICE - Gestión de Contenidos CMS
 * =====================================================
 * Servicio para manejar configuraciones del sitio
 * (logos, placeholders, textos, etc.)
 */

import { supabase } from './supabaseClient';

import { API_CONFIG } from '@/config/api';

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: 'text' | 'image' | 'json' | 'html';
  section: 'header' | 'footer' | 'content' | 'general';
  description: string | null;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingPayload {
  setting_key: string;
  setting_value: string;
}

/**
 * Verificar si el usuario es SuperAdmin
 */
async function isSuperAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('⚠️ No hay usuario autenticado');
      return false;
    }

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('❌ Error verificando rol:', error);
      return false;
    }

    return data?.role === 'superadmin';
  } catch (error) {
    console.error('❌ Error en isSuperAdmin:', error);
    return false;
  }
}

/**
 * Obtener todas las configuraciones del sitio
 */
export async function getAllSettings(): Promise<SiteSetting[]> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('section', { ascending: true })
      .order('setting_key', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo settings:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getAllSettings:', error);
    throw error;
  }
}

/**
 * Obtener configuraciones por sección
 */
export async function getSettingsBySection(section: string): Promise<SiteSetting[]> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('section', section)
      .order('setting_key', { ascending: true });

    if (error) {
      console.error(`❌ Error obteniendo settings de sección ${section}:`, error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getSettingsBySection:', error);
    throw error;
  }
}

/**
 * Obtener un setting por key
 */
export async function getSetting(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .single();

    if (error) {
      console.error(`❌ Error obteniendo setting ${key}:`, error);
      return null;
    }

    return data?.setting_value || null;
  } catch (error) {
    console.error('❌ Error en getSetting:', error);
    return null;
  }
}

/**
 * Actualizar un setting (solo superadmin)
 */
export async function updateSetting(payload: UpdateSettingPayload): Promise<boolean> {
  try {
    // Verificar permisos
    if (!await isSuperAdmin()) {
      console.error('❌ No tienes permisos para actualizar settings (requiere superadmin)');
      return false;
    }

    const { error } = await supabase
      .from('site_settings')
      .update({ 
        setting_value: payload.setting_value,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', payload.setting_key);

    if (error) {
      console.error('❌ Error actualizando setting:', error);
      return false;
    }

    console.log('✅ Setting actualizado:', payload.setting_key);
    return true;
  } catch (error) {
    console.error('❌ Error en updateSetting:', error);
    return false;
  }
}

/**
 * Subir imagen CMS a Cloudinary via BFF (superadmin only).
 * settingKey determina la carpeta: logos → rural24/app/logos/ (sin env prefix)
 */
export async function uploadCMSImage(
  file: File,
  settingKey: string = '',
  onProgress?: (progress: number) => void
): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.error('❌ No hay sesión activa');
      return null;
    }

    onProgress?.(10);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('settingKey', settingKey);

    onProgress?.(20);

    const res = await fetch(`${API_CONFIG.BASE_URL}/api/admin/site-settings/upload-image`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
      body: formData,
    });

    onProgress?.(80);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
      console.error('❌ Error subiendo imagen:', err);
      return null;
    }

    const { url } = await res.json();
    onProgress?.(100);
    return url;
  } catch (error) {
    console.error('❌ Error en uploadCMSImage:', error);
    return null;
  }
}

/**
 * Actualizar setting con nueva imagen via Cloudinary BFF.
 */
export async function updateImageSetting(
  settingKey: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<boolean> {
  try {
    onProgress?.(5);

    // 1. Subir nueva imagen a Cloudinary via BFF
    const imageUrl = await uploadCMSImage(file, settingKey, (progress) => {
      onProgress?.(5 + (progress * 0.8));
    });

    if (!imageUrl) {
      console.error('❌ Error subiendo imagen');
      return false;
    }

    onProgress?.(90);

    // 2. Actualizar setting con nueva URL
    const success = await updateSetting({
      setting_key: settingKey,
      setting_value: imageUrl,
    });

    if (!success) {
      console.error('❌ Error actualizando setting');
      return false;
    }

    onProgress?.(100);
    return true;
  } catch (error) {
    console.error('❌ Error en updateImageSetting:', error);
    return false;
  }
}

/**
 * Eliminar imagen CMS de Cloudinary via BFF (superadmin only).
 */
export async function deleteCMSImage(publicId: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.error('❌ No hay sesión activa');
      return false;
    }

    const res = await fetch(`${API_CONFIG.BASE_URL}/api/admin/site-settings/delete-image`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ public_id: publicId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
      console.error('❌ Error eliminando imagen:', err);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error en deleteCMSImage:', error);
    return false;
  }
}

/**
 * Listar imágenes CMS desde Cloudinary via BFF (superadmin only).
 */
export async function listCMSImages(): Promise<Array<{ name: string; url: string; public_id: string; size: number; created_at: string }>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.error('❌ No hay sesión activa');
      return [];
    }

    const res = await fetch(`${API_CONFIG.BASE_URL}/api/admin/site-settings/list-images`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });

    if (!res.ok) {
      console.error('❌ Error listando imágenes');
      return [];
    }

    const { images } = await res.json();
    return images ?? [];
  } catch (error) {
    console.error('❌ Error en listCMSImages:', error);
    return [];
  }
}
