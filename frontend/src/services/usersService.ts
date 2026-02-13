import { supabase } from './supabaseClient';
import type { UserRole, UserType } from '../../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Helper: Obtener headers con autenticación Bearer
 * @returns Headers con Authorization o null si no hay sesión
 */
async function getAuthHeaders(): Promise<HeadersInit | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    console.error('No hay sesion activa para autenticar');
    return null;
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
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
    console.log('Cargando usuarios desde API backend...');

    // Obtener headers con token de autenticación
    const headers = await getAuthHeaders();
    if (!headers) {
      return { 
        data: null, 
        error: new Error('No autenticado. Se requiere token Bearer válido.') 
      };
    }

    // Fetch con autenticación
    const response = await fetch(`${API_BASE}/api/admin/users`, {
      method: 'GET',
      headers,
    });

    const json = await response.json();

    if (!response.ok) {
      console.error('Error HTTP:', response.status, json.error);
      return { 
        data: null, 
        error: new Error(json.error || `Error HTTP ${response.status}`) 
      };
    }

    if (!json.success) {
      console.error('Error loading users:', json.error);
      return { data: null, error: new Error(json.error) };
    }

    console.log(`${json.data?.length || 0} usuarios cargados`);
    return { data: json.data, error: null };
  } catch (error) {
    console.error('Error en getAllUsers:', error);
    return { data: null, error: error as Error };
  }
};


/**
 * Crear un nuevo usuario (Solo SuperAdmin)
 */
export const createUser = async (userData: CreateUserData): Promise<{ data: any; error: Error | null }> => {
  try {
    console.log('Creando nuevo usuario:', userData.email);

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
      console.error('Error en auth.admin.createUser:', authError);
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
      console.error('Error creando perfil:', profileError);
      return { data: null, error: profileError };
    }

    console.log('Usuario creado:', profileData);
    return { data: profileData, error: null };
  } catch (error) {
    console.error('Error en createUser:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Actualizar usuario
 */
export const updateUser = async (userId: string, updates: UpdateUserData): Promise<{ error: Error | null }> => {
  try {
    console.log('Actualizando usuario:', userId, updates);

    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user:', error);
      return { error };
    }

    console.log('Usuario actualizado');
    return { error: null };
  } catch (error) {
    console.error('Error en updateUser:', error);
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
    console.log('Cambiando rol de usuario:', userId, 'a', newRole);

    // Obtener headers con token
    const headers = await getAuthHeaders();
    if (!headers) {
      return { error: new Error('No autenticado') };
    }

    // Llamar API del backend
    const response = await fetch(`${API_BASE}/api/admin/users`, {
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
      console.error('Error updating role:', json.error);
      return { error: new Error(json.error || 'Error al actualizar rol') };
    }

    console.log('Rol actualizado a:', newRole);
    return { error: null };
  } catch (error) {
    console.error('Error en updateUserRole:', error);
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
    console.log('Verificando email del usuario:', userId);

    // Obtener headers con token
    const headers = await getAuthHeaders();
    if (!headers) {
      return { error: new Error('No autenticado') };
    }

    // Llamar API del backend
    const response = await fetch(`${API_BASE}/api/admin/users`, {
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
      console.error('Error verifying email:', json.error);
      return { error: new Error(json.error || 'Error al verificar email') };
    }

    console.log('Email verificado exitosamente');
    return { error: null };
  } catch (error) {
    console.error('Error en verifyUserEmail:', error);
    return { error: error as Error };
  }
};

/**
 * Eliminar usuario (Solo SuperAdmin)
 * CUIDADO: Esto elimina el usuario y todos sus datos
 * NOTA: Usa supabase.auth.admin que requiere service_role
 * TODO: Migrar a endpoint backend DELETE /api/admin/users/:userId
 */
export const deleteUser = async (userId: string): Promise<{ error: Error | null }> => {
  try {
    console.log('Eliminando usuario:', userId);

    // NOTA: auth.admin.deleteUser requiere service_role key en el cliente
    // Esto funciona si SUPABASE_SERVICE_ROLE_KEY está configurado
    // En producción, migrar a endpoint backend con withAuth guard
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return { error: deleteError };
    }

    // El CASCADE en la BD eliminará automáticamente:
    // - Perfil en tabla users
    // - Anuncios del usuario
    // - Mensajes
    // - Otros datos relacionados
    console.log('Usuario eliminado (CASCADE eliminara datos relacionados)');
    return { error: null };
  } catch (error) {
    console.error('Error en deleteUser:', error);
    return { error: error as Error };
  }
};

/**
 * Buscar usuarios
 */
export const searchUsers = async (searchTerm: string): Promise<{ data: UserData[] | null; error: Error | null }> => {
  try {
    console.log('Buscando usuarios:', searchTerm);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching users:', error);
      return { data: null, error };
    }

    console.log(`${data.length} usuarios encontrados`);
    return { data, error: null };
  } catch (error) {
    console.error('Error en searchUsers:', error);
    return { data: null, error: error as Error };
  }
};
