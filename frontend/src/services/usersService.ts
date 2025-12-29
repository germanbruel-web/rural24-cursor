import { supabase } from './supabaseClient';
import type { UserRole, UserType } from '../../types';

export interface UserData {
  id: string;
  email: string;
  full_name?: string;
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
 */
export const getAllUsers = async (): Promise<{ data: UserData[] | null; error: Error | null }> => {
  try {
    console.log('📥 Cargando usuarios desde Supabase...');

    // Obtener usuarios
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Error loading users:', usersError);
      return { data: null, error: usersError };
    }

    // Obtener conteo de avisos por usuario
    const { data: adsCounts, error: adsError } = await supabase
      .from('products')
      .select('seller_id');

    if (adsError) {
      console.warn('⚠️ Error loading ads count:', adsError);
    }

    // Contar avisos por usuario
    const adsCountMap: Record<string, number> = {};
    if (adsCounts) {
      adsCounts.forEach(ad => {
        if (ad.seller_id) {
          adsCountMap[ad.seller_id] = (adsCountMap[ad.seller_id] || 0) + 1;
        }
      });
    }

    // Agregar conteo de avisos a cada usuario
    const usersWithAds = users.map(user => ({
      ...user,
      ads_count: adsCountMap[user.id] || 0,
    }));

    console.log(`✅ ${usersWithAds.length} usuarios cargados`);
    return { data: usersWithAds, error: null };
  } catch (error) {
    console.error('❌ Error en getAllUsers:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Crear un nuevo usuario (Solo SuperAdmin)
 */
export const createUser = async (userData: CreateUserData): Promise<{ data: any; error: Error | null }> => {
  try {
    console.log('🔐 Creando nuevo usuario:', userData.email);

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
      console.error('❌ Error en auth.admin.createUser:', authError);
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
      console.error('❌ Error creando perfil:', profileError);
      return { data: null, error: profileError };
    }

    console.log('✅ Usuario creado:', profileData);
    return { data: profileData, error: null };
  } catch (error) {
    console.error('❌ Error en createUser:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Actualizar usuario
 */
export const updateUser = async (userId: string, updates: UpdateUserData): Promise<{ error: Error | null }> => {
  try {
    console.log('📝 Actualizando usuario:', userId, updates);

    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('❌ Error updating user:', error);
      return { error };
    }

    console.log('✅ Usuario actualizado');
    return { error: null };
  } catch (error) {
    console.error('❌ Error en updateUser:', error);
    return { error: error as Error };
  }
};

/**
 * Cambiar rol de usuario
 */
export const updateUserRole = async (userId: string, newRole: UserRole): Promise<{ error: Error | null }> => {
  try {
    console.log('👑 Cambiando rol de usuario:', userId, 'a', newRole);

    const { error } = await supabase
      .from('users')
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('❌ Error updating role:', error);
      return { error };
    }

    console.log('✅ Rol actualizado a:', newRole);
    return { error: null };
  } catch (error) {
    console.error('❌ Error en updateUserRole:', error);
    return { error: error as Error };
  }
};

/**
 * Verificar email manualmente (SuperAdmin)
 * Actualiza tanto la tabla users como auth.users
 */
export const verifyUserEmail = async (userId: string): Promise<{ error: Error | null }> => {
  try {
    console.log('✅ Verificando email del usuario:', userId);

    // 1. Actualizar en tabla users
    const { error: usersError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (usersError) {
      console.error('❌ Error verificando en users:', usersError);
      return { error: usersError };
    }

    // 2. Actualizar en auth.users (requiere admin)
    try {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        { email_confirm: true }
      );

      if (authError) {
        console.warn('⚠️ No se pudo actualizar auth.users (puede requerir permisos adicionales):', authError);
        // No retornar error, solo advertencia
      } else {
        console.log('✅ Email verificado en auth.users');
      }
    } catch (authError) {
      console.warn('⚠️ Error actualizando auth.users:', authError);
      // Continuar aunque falle el auth
    }

    console.log('✅ Email verificado exitosamente');
    return { error: null };
  } catch (error) {
    console.error('❌ Error en verifyUserEmail:', error);
    return { error: error as Error };
  }
};

/**
 * Eliminar usuario (Solo SuperAdmin)
 * CUIDADO: Esto elimina el usuario y todos sus datos
 */
export const deleteUser = async (userId: string): Promise<{ error: Error | null }> => {
  try {
    console.log('🗑️ Eliminando usuario:', userId);

    // Primero eliminar de la tabla users (el CASCADE se encargará de auth.users)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError);
      return { error: deleteError };
    }

    // También intentar eliminar del auth (requiere permisos de admin)
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch (authError) {
      console.warn('⚠️ No se pudo eliminar del auth (puede ser normal):', authError);
    }

    console.log('✅ Usuario eliminado');
    return { error: null };
  } catch (error) {
    console.error('❌ Error en deleteUser:', error);
    return { error: error as Error };
  }
};

/**
 * Buscar usuarios
 */
export const searchUsers = async (searchTerm: string): Promise<{ data: UserData[] | null; error: Error | null }> => {
  try {
    console.log('🔍 Buscando usuarios:', searchTerm);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error searching users:', error);
      return { data: null, error };
    }

    console.log(`✅ ${data.length} usuarios encontrados`);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error en searchUsers:', error);
    return { data: null, error: error as Error };
  }
};
