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
  return new Promise((resolve) => {
    let resolved = false;

    const finish = (session: any, error: any) => {
      if (resolved) return;
      resolved = true;
      subscription?.unsubscribe();
      resolve({ session, error });
    };

    // Timeout de seguridad: 12 segundos
    const timeout = setTimeout(() => {
      finish(null, new Error('Tiempo de espera agotado al obtener la sesión'));
    }, 12000);

    // Suscribirse al evento SIGNED_IN (Supabase procesa el code PKCE en background)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        clearTimeout(timeout);
        console.log('OAuth SIGNED_IN:', session.user.email);

        // Crear perfil si es nuevo usuario
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .single();

        if (!existingProfile) {
          await createOAuthUserProfile(session.user);
        }

        finish(session, null);
      }
    });

    // Intento inmediato: si la sesión ya está lista (re-login)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session?.user) {
        clearTimeout(timeout);
        finish(session, null);
      } else if (error) {
        clearTimeout(timeout);
        finish(null, error);
      }
    });
  });
}

/**
 * Crear perfil para usuario registrado via OAuth
 * Extrae datos del provider (Google/Facebook) y crea registro en users
 */
export async function createOAuthUserProfile(user: any, providerOverride?: 'google' | 'facebook') {
  try {
    const metadata = user.user_metadata || {};
    
    // Extraer nombre del metadata del proveedor
    const fullName = metadata.full_name || metadata.name || '';
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ');
    
    // Determinar el proveedor
    const provider = providerOverride || user.app_metadata?.provider || 'unknown';
    
    // Obtener plan free
    const { data: freePlan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('name', 'free')
      .single();

    // Crear perfil
    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        first_name: firstName || null,
        last_name: lastName || null,
        full_name: fullName || user.email?.split('@')[0] || 'Usuario',
        avatar_url: metadata.avatar_url || metadata.picture || null,
        account_type: 'persona', // Por defecto, pueden cambiarlo después
        user_type: 'particular',
        subscription_plan_id: freePlan?.id || null,
        email_verified: user.email_confirmed_at ? true : false,
        oauth_provider: provider,
      }, {
        onConflict: 'id',
      });

    if (error) {
      console.error('Error creando perfil OAuth:', error);
    } else {
      console.log('Perfil OAuth creado para:', user.email);
    }
  } catch (error) {
    console.error('Exception creando perfil OAuth:', error);
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
