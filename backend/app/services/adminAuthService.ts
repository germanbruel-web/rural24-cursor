/**
 * ============================================================================
 * ADMIN AUTH SERVICE - Verificar email como Superadmin
 * ============================================================================
 * 
 * Endpoint para que superadmin pueda confirmar el email de un usuario
 * Actualiza TANTO auth.users COMO public.users
 */

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ Requiere service role key (SERVIDOR SOLAMENTE)
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

interface VerifyEmailResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * 🔐 Confirmar email de usuario como Superadmin
 * - Actualiza email_confirmed_at en auth.users
 * - Actualiza email_verified en public.users
 * - Solo para superadmin
 * @param userId - ID del usuario a confirmar
 * @returns {VerifyEmailResponse}
 */
export async function verifyEmailAsAdmin(userId: string): Promise<VerifyEmailResponse> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'ERR_INVALID_USER_ID',
        message: 'ID de usuario inválido',
      };
    }

    // 1️⃣ Confirmar email en auth.users usando admin API
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,  // Marca como confirmado
    });

    if (authError) {
      console.error('❌ Error confirmando email en auth.users:', authError);
      return {
        success: false,
        error: authError.code || 'AUTH_ERROR',
        message: authError.message,
      };
    }

    // 2️⃣ Actualizar email_verified en public.users
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({
        email_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (dbError) {
      console.error('❌ Error actualizando public.users:', dbError);
      return {
        success: false,
        error: 'DB_ERROR',
        message: dbError.message,
      };
    }

    console.log('✅ Email confirmado exitosamente para usuario:', userId);
    return {
      success: true,
      message: 'Email confirmado exitosamente. El usuario ya puede iniciar sesión.',
    };
  } catch (err: any) {
    console.error('❌ Error en verifyEmailAsAdmin:', err);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: err.message || 'Error interno al confirmar email',
    };
  }
}

/**
 * 🔐 Resend verification email (opcional)
 */
export async function resendVerificationEmail(email: string): Promise<VerifyEmailResponse> {
  try {
    // Supabase puede resend el email de verification
    const { error } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.code || 'RESEND_ERROR',
        message: error.message,
      };
    }

    return {
      success: true,
      message: `Email de verificación reenviado a ${email}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: err.message,
    };
  }
}
