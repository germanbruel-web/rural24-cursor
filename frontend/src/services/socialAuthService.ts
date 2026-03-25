/**
 * socialAuthService.ts
 * Servicio para autenticación con proveedores sociales (Google, Facebook)
 * 
 * ⚠️ CONFIGURACIÓN REQUERIDA EN SUPABASE:
 * 1. Dashboard → Authentication → Providers
 * 2. Habilitar Google/Facebook
 * 3. Configurar Client ID y Secret de cada proveedor
 * 4. Agregar redirect URLs
 * 
 * 📝 NOTAS PARA DESARROLLO:
 * - Google funciona en localhost
 * - Facebook requiere HTTPS (usar ngrok o similar)
 * - Los botones mostrarán error si no está configurado el proveedor
 */

import { supabase } from './supabaseClient';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

// Verificar si los proveedores están habilitados (se puede expandir)
export const SOCIAL_AUTH_CONFIG = {
  google: {
    enabled: true, // Cambiar a true cuando esté configurado en Supabase
    name: 'Google',
  },
  facebook: {
    enabled: true, // Cambiar a true cuando esté configurado en Supabase
    name: 'Facebook',
  },
};

// ============================================================================
// FUNCIONES DE LOGIN SOCIAL
// ============================================================================

/**
 * Iniciar sesión con Google
 * Redirige al usuario a la página de login de Google
 */
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Usar hash para mantener compatibilidad con el routing de la app
        redirectTo: `${window.location.origin}/#/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Error Google OAuth:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Exception en signInWithGoogle:', error);
    return { data: null, error };
  }
}

/**
 * Iniciar sesión con Facebook
 * Redirige al usuario a la página de login de Facebook
 * ⚠️ Requiere HTTPS en producción
 */
export async function signInWithFacebook() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        // Usar hash para mantener compatibilidad con el routing de la app
        redirectTo: `${window.location.origin}/#/auth/callback`,
        scopes: 'email,public_profile',
      },
    });

    if (error) {
      console.error('Error Facebook OAuth:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Exception en signInWithFacebook:', error);
    return { data: null, error };
  }
}

/**
 * Manejar callback de OAuth
 * Se llama después de que el usuario regresa del proveedor
 * Supabase maneja esto automáticamente, pero podemos usarlo para lógica adicional
 */
export async function handleOAuthCallback(): Promise<{ session: any; error: any }> {
  try {
    // El hash router genera URLs con doble #:
    //   /#/auth/callback#access_token=...&refresh_token=...
    // Supabase no detecta el token automáticamente — lo extraemos manualmente.
    const fullHash = window.location.hash; // "#/auth/callback#access_token=..."

    const accessTokenMatch  = fullHash.match(/access_token=([^&]+)/);
    const refreshTokenMatch = fullHash.match(/refresh_token=([^&]+)/);

    if (accessTokenMatch && refreshTokenMatch) {
      const access_token  = decodeURIComponent(accessTokenMatch[1]);
      const refresh_token = decodeURIComponent(refreshTokenMatch[1]);

      const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });

      if (error) return { session: null, error };
      if (!data.session?.user) return { session: null, error: new Error('Sesión vacía tras setSession') };

      // Crear/actualizar perfil (upsert: nuevo usuario o actualizar nombre vacío)
      await createOAuthUserProfile(data.session.user);

      // Limpiar tokens de la URL
      window.history.replaceState(null, '', window.location.pathname + '#/auth/callback');

      return { session: data.session, error: null };
    }

    // Fallback: sesión ya establecida (re-login sin token en URL)
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error: error ?? null };

  } catch (error: any) {
    console.error('Exception en handleOAuthCallback:', error);
    return { session: null, error };
  }
}

/**
 * Crear perfil para usuario registrado via OAuth
 * Extrae datos del provider (Google/Facebook) y crea registro en users
 */
export async function createOAuthUserProfile(user: any, providerOverride?: 'google' | 'facebook') {
  try {
    const metadata = user.user_metadata || {};

    // Google puede devolver full_name, name, o given_name + family_name por separado
    const firstName = metadata.given_name || metadata.first_name || (metadata.full_name || metadata.name || '').split(' ')[0] || null;
    const lastName  = metadata.family_name || metadata.last_name  || (metadata.full_name || metadata.name || '').split(' ').slice(1).join(' ') || null;
    const fullName  = metadata.full_name || metadata.name
      || [firstName, lastName].filter(Boolean).join(' ')
      || user.email?.split('@')[0]
      || 'Usuario';
    
    // Determinar el proveedor
    const provider = providerOverride || user.app_metadata?.provider || 'unknown';
    
    // Obtener plan free
    const { data: freePlan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('name', 'free')
      .single();

    // Verificar si ya existe perfil con nombre cargado
    const { data: existing } = await supabase
      .from('users')
      .select('id, first_name, full_name')
      .eq('id', user.id)
      .single();

    // Solo actualizar nombre si el perfil no tiene nombre cargado aún
    const shouldUpdateName = !existing?.first_name && !existing?.full_name;

    // Crear/actualizar perfil
    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        ...(shouldUpdateName ? {
          first_name: firstName || null,
          last_name: lastName || null,
          full_name: fullName || user.email?.split('@')[0] || 'Usuario',
        } : {}),
        avatar_url: metadata.avatar_url || metadata.picture || null,
        user_type: 'particular',
        subscription_plan_id: freePlan?.id || null,
        email_verified: user.email_confirmed_at ? true : false,
      }, {
        onConflict: 'id',
      });

    if (error) {
      console.error('Error creando perfil OAuth:', error);
      throw new Error(`No se pudo crear el perfil: ${error.message}`);
    }
  } catch (error) {
    console.error('Exception creando perfil OAuth:', error);
    throw error;
  }
}

/**
 * Desvincular cuenta social (para futuro uso)
 */
export async function unlinkSocialAccount(provider: 'google' | 'facebook') {
  // TODO: Implementar cuando sea necesario
  console.log('Unlinking', provider, '- not implemented yet');
  return { error: new Error('Not implemented') };
}

// Export como objeto para imports más limpios
export const socialAuthService = {
  signInWithGoogle,
  signInWithFacebook,
  handleOAuthCallback,
  createOAuthUserProfile,
  unlinkSocialAccount,
  SOCIAL_AUTH_CONFIG,
};
