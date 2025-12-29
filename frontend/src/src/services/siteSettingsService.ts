/**
 * =====================================================
 * SITE SETTINGS SERVICE - Gestión de Contenidos CMS
 * =====================================================
 * Servicio para manejar configuraciones del sitio
 * (logos, placeholders, textos, etc.)
 */

import { supabase } from './supabaseClient';

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
 * Subir imagen al bucket CMS con cache-busting
 */
export async function uploadCMSImage(
  file: File, 
  folder: string = '',
  onProgress?: (progress: number) => void
): Promise<string | null> {
  try {
    // Verificar permisos
    if (!await isSuperAdmin()) {
      console.error('❌ No tienes permisos para subir imágenes (requiere superadmin)');
      return null;
    }

    // Generar nombre único
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${folder ? folder + '/' : ''}${timestamp}-${random}.${fileExt}`;

    console.log('📤 Subiendo imagen:', {
      nombre: file.name,
      tamaño: `${(file.size / 1024).toFixed(1)} KB`,
      tipo: file.type,
      destino: fileName
    });

    onProgress?.(10);

    // Subir a storage
    const { data, error } = await supabase.storage
      .from('cms-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Error subiendo imagen:', error);
      return null;
    }

    onProgress?.(80);

    // Obtener URL pública con cache-busting
    const { data: publicUrlData } = supabase.storage
      .from('cms-images')
      .getPublicUrl(data.path);

    // Agregar timestamp para evitar cache del navegador
    const cacheBustedUrl = `${publicUrlData.publicUrl}?t=${timestamp}`;

    console.log('✅ Imagen subida exitosamente:', cacheBustedUrl);
    onProgress?.(100);
    
    return cacheBustedUrl;
  } catch (error) {
    console.error('❌ Error en uploadCMSImage:', error);
    return null;
  }
}

/**
 * Actualizar setting con nueva imagen (incluye limpieza de imagen anterior)
 */
export async function updateImageSetting(
  settingKey: string, 
  file: File, 
  folder: string = '',
  onProgress?: (progress: number) => void
): Promise<boolean> {
  try {
    // Verificar permisos
    if (!await isSuperAdmin()) {
      console.error('❌ No tienes permisos (requiere superadmin)');
      return false;
    }

    console.log('🔄 Iniciando actualización de imagen:', settingKey);
    onProgress?.(5);

    // 1. Obtener URL de imagen anterior para eliminarla después
    const { data: oldSetting } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', settingKey)
      .single();

    const oldImageUrl = oldSetting?.setting_value;
    onProgress?.(10);

    // 2. Subir nueva imagen
    const imageUrl = await uploadCMSImage(file, folder, (progress) => {
      // Mapear progreso de subida a 10-85%
      onProgress?.(10 + (progress * 0.75));
    });

    if (!imageUrl) {
      console.error('❌ Error subiendo imagen');
      return false;
    }

    onProgress?.(90);

    // 3. Actualizar setting con nueva URL
    const success = await updateSetting({
      setting_key: settingKey,
      setting_value: imageUrl
    });

    if (!success) {
      console.error('❌ Error actualizando setting');
      return false;
    }

    onProgress?.(95);

    // 4. Eliminar imagen anterior (si existe y no es placeholder)
    if (oldImageUrl && 
        oldImageUrl.includes('/cms-images/') && 
        !oldImageUrl.includes('preview-image')) {
      try {
        await deleteCMSImage(oldImageUrl);
        console.log('🗑️ Imagen anterior eliminada');
      } catch (error) {
        console.warn('⚠️ No se pudo eliminar imagen anterior:', error);
        // No es crítico, continuamos
      }
    }

    onProgress?.(100);
    console.log('✅ Actualización de imagen completada exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error en updateImageSetting:', error);
    return false;
  }
}

/**
 * Eliminar imagen del bucket CMS
 */
export async function deleteCMSImage(imagePath: string): Promise<boolean> {
  try {
    // Verificar permisos
    if (!await isSuperAdmin()) {
      console.error('❌ No tienes permisos (requiere superadmin)');
      return false;
    }

    // Extraer path relativo de la URL (remover dominio y query params)
    const urlWithoutQuery = imagePath.split('?')[0]; // Remover ?t=timestamp
    const path = urlWithoutQuery.split('/cms-images/').pop();
    
    if (!path) {
      console.error('❌ Path inválido:', imagePath);
      return false;
    }

    console.log('🗑️ Eliminando imagen del storage:', path);

    const { error } = await supabase.storage
      .from('cms-images')
      .remove([path]);

    if (error) {
      console.error('❌ Error eliminando imagen:', error);
      return false;
    }

    console.log('✅ Imagen eliminada exitosamente:', path);
    return true;
  } catch (error) {
    console.error('❌ Error en deleteCMSImage:', error);
    return false;
  }
}

/**
 * Listar todas las imágenes del CMS
 */
export async function listCMSImages(): Promise<Array<{ name: string; url: string; size: number; created_at: string }>> {
  try {
    // Verificar permisos
    if (!await isSuperAdmin()) {
      console.error('❌ No tienes permisos (requiere superadmin)');
      return [];
    }

    const { data, error } = await supabase.storage
      .from('cms-images')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('❌ Error listando imágenes:', error);
      return [];
    }

    // Obtener URLs públicas
    const images = data
      .filter(file => !file.id.endsWith('/')) // Filtrar carpetas
      .map(file => {
        const { data: urlData } = supabase.storage
          .from('cms-images')
          .getPublicUrl(file.name);
        
        return {
          name: file.name,
          url: urlData.publicUrl,
          size: file.metadata?.size || 0,
          created_at: file.created_at || new Date().toISOString()
        };
      });

    console.log(`📁 Encontradas ${images.length} imágenes en CMS`);
    return images;
  } catch (error) {
    console.error('❌ Error en listCMSImages:', error);
    return [];
  }
}
