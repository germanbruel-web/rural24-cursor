import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';
import type { UserRole, UserType } from '../../types';

import { API_CONFIG } from '@/config/api';

/**
 * Helper: Obtener headers con autenticación Bearer
 * @returns Headers con Authorization o null si no hay sesión
 */
async function getAuthHeaders(): Promise<HeadersInit | null> {
  // refreshSession() garantiza que el access_token esté vigente
  const { data: { session } } = await supabase.auth.refreshSession();
  const token = session?.access_token;

  if (!token) {
    // Fallback: intentar con la sesión almacenada
    const { data: { session: stored } } = await supabase.auth.getSession();
    if (!stored?.access_token) {
      logger.error('[usersService] No hay sesión activa para autenticar');
      return null;
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${stored.access_token}`,
    };
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export interface UserData {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  mobile?: string;
  role: UserRole;
  user_type?: UserType;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  ads_count?: number;
  subscription_plan_id?: string | null;
  custom_max_ads?: number | null;
  subscription_plans?: { id: string; name: string; display_name: string } | null;
}

export interface CreateUserData {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  mobile?: string;
  user_type: UserType;
  role: UserRole;
}

export interface UpdateUserData {
  full_name?: string;
  phone?: string;
  mobile?: string;
  role?: UserRole;
  user_type?: UserType;
  email_verified?: boolean;
}

/**
 * Obtener todos los usuarios con conteo de avisos
 * Usa API del backend con service_role para bypass de RLS
 * Requiere autenticación Bearer (superadmin)
 */
export const getAllUsers = async (): Promise<{ data: UserData[] | null; error: Error | null }> => {
  try {
    logger.debug('[usersService] Cargando usuarios desde API backend...');

    // Obtener headers con token de autenticación
    const headers = await getAuthHeaders();
    if (!headers) {
      return {
        data: null,
        error: new Error('No autenticado. Se requiere token Bearer válido.')
      };
    }

    // Fetch con autenticación
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/users`, {
      method: 'GET',
      headers,
    });

    const json = await response.json();

    if (!response.ok) {
      logger.error('[usersService] Error HTTP:', response.status, json.error);
      return {
        data: null,
        error: new Error(json.error || `Error HTTP ${response.status}`)
      };
    }

    if (!json.success) {
      logger.error('[usersService] Error loading users:', json.error);
      return { data: null, error: new Error(json.error) };
    }

    logger.debug(`[usersService] ${json.data?.length || 0} usuarios cargados`);
    return { data: json.data, error: null };
  } catch (error) {
    logger.error('[usersService] Error en getAllUsers:', error);
    return { data: null, error: error as Error };
  }
};


/**
 * Crear un nuevo usuario (Solo SuperAdmin)
 */
export const createUser = async (userData: CreateUserData): Promise<{ data: any; error: Error | null }> => {
  try {
    logger.debug('[usersService] Creando nuevo usuario:', userData.email);

    // Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
      },
    });

    if (authError) {
      logger.error('[usersService] Error en auth.admin.createUser:', authError);
      return { data: null, error: authError };
    }

    if (!authData.user) {
      return { data: null, error: new Error('No se pudo crear el usuario') };
    }

    // Crear perfil en tabla users
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        phone: userData.phone,
        mobile: userData.mobile,
        user_type: userData.user_type,
        role: userData.role,
        email_verified: true,
      })
      .select()
      .single();

    if (profileError) {
      logger.error('[usersService] Error creando perfil:', profileError);
      return { data: null, error: profileError };
    }

    logger.debug('[usersService] Usuario creado:', profileData);
    return { data: profileData, error: null };
  } catch (error) {
    logger.error('[usersService] Error en createUser:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Actualizar usuario
 */
export const updateUser = async (userId: string, updates: UpdateUserData): Promise<{ error: Error | null }> => {
  try {
    logger.debug('[usersService] Actualizando usuario:', userId, updates);

    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      logger.error('[usersService] Error updating user:', error);
      return { error };
    }

    logger.debug('[usersService] Usuario actualizado');
    return { error: null };
  } catch (error) {
    logger.error('[usersService] Error en updateUser:', error);
    return { error: error as Error };
  }
};

/**
 * Cambiar rol de usuario
 * Usa API del backend para bypass de RLS
 * Requiere autenticación Bearer (superadmin)
 */
export const updateUserRole = async (userId: string, newRole: UserRole): Promise<{ error: Error | null }> => {
  try {
    logger.debug('[usersService] Cambiando rol de usuario:', userId, 'a', newRole);

    // Obtener headers con token
    const headers = await getAuthHeaders();
    if (!headers) {
      return { error: new Error('No autenticado') };
    }

    // Llamar API del backend
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/users`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        user_id: userId,
        role: newRole,
        updated_at: new Date().toISOString()
      }),
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      logger.error('[usersService] Error updating role:', json.error);
      return { error: new Error(json.error || 'Error al actualizar rol') };
    }

    logger.debug('[usersService] Rol actualizado a:', newRole);
    return { error: null };
  } catch (error) {
    logger.error('[usersService] Error en updateUserRole:', error);
    return { error: error as Error };
  }
};

/**
 * Asignar plan de suscripción manualmente a un usuario (SuperAdmin)
 * Sincroniza role automáticamente según el plan asignado.
 */
export const adminAssignPlan = async (
  userId: string,
  opts: { subscription_plan_id: string | null; custom_max_ads?: number | null }
): Promise<{ error: Error | null }> => {
  try {
    const headers = await getAuthHeaders();
    if (!headers) return { error: new Error('No autenticado') };

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/users`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ user_id: userId, ...opts }),
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      return { error: new Error(json.error || 'Error al asignar plan') };
    }
    return { error: null };
  } catch (error) {
    logger.error('[usersService] Error en updateUserPlan:', error);
    return { error: error as Error };
  }
};

/**
 * Verificar email manualmente (SuperAdmin)
 * Usa API del backend para bypass de RLS
 * Requiere autenticación Bearer (superadmin)
 */
export const verifyUserEmail = async (userId: string): Promise<{ error: Error | null }> => {
  try {
    logger.debug('[usersService] Verificando email del usuario:', userId);

    // Obtener headers con token
    const headers = await getAuthHeaders();
    if (!headers) {
      return { error: new Error('No autenticado') };
    }

    // Llamar API del backend
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/users`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        user_id: userId,
        email_verified: true,
        updated_at: new Date().toISOString()
      }),
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      logger.error('[usersService] Error verifying email:', json.error);
      return { error: new Error(json.error || 'Error al verificar email') };
    }

    logger.debug('[usersService] Email verificado exitosamente');
    return { error: null };
  } catch (error) {
    logger.error('[usersService] Error en verifyUserEmail:', error);
    return { error: error as Error };
  }
};

/**
 * Eliminar usuario (Solo SuperAdmin)
 * Llama a DELETE /api/admin/users/:userId en el BFF.
 * El BFF usa service_role server-side y aplica las protecciones necesarias.
 */
export const deleteUser = async (userId: string): Promise<{ error: Error | null }> => {
  try {
    const headers = await getAuthHeaders();
    if (!headers) {
      return { error: new Error('No hay sesión activa') };
    }

    const res = await fetch(`${API_CONFIG.BASE_URL}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers,
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      return { error: new Error(json.error || 'Error al eliminar usuario') };
    }

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

/**
 * Buscar usuarios
 */
export const searchUsers = async (searchTerm: string): Promise<{ data: UserData[] | null; error: Error | null }> => {
  try {
    logger.debug('[usersService] Buscando usuarios:', searchTerm);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[usersService] Error searching users:', error);
      return { data: null, error };
    }

    logger.debug(`[usersService] ${data.length} usuarios encontrados`);
    return { data, error: null };
  } catch (error) {
    logger.error('[usersService] Error en searchUsers:', error);
    return { data: null, error: error as Error };
  }
};
