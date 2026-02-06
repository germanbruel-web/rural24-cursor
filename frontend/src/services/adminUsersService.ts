/**
 * ============================================================================
 * ADMIN USERS SERVICE - Frontend
 * ============================================================================
 * 
 * Cliente para llamar endpoints admin de usuarios
 */

import { supabase } from './supabaseClient';

interface VerifyEmailResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * 🔐 Verificar email de usuario (Superadmin only)
 * Llama al endpoint /api/admin/verify-email
 * @param userId - ID del usuario a verificar
 * @returns Resultado de la operación
 */
export async function verifyUserEmailAsAdmin(userId: string): Promise<VerifyEmailResult> {
  try {
    // 1️⃣ Obtener JWT del usuario actual
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return {
        success: false,
        error: 'NOT_AUTHENTICATED',
        message: 'No estás autenticado',
      };
    }

    // 2️⃣ Llamar endpoint admin
    const response = await fetch('/api/admin/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'UNKNOWN_ERROR',
        message: data.message || 'Error al verificar email',
      };
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (err: any) {
    console.error('❌ Error en verifyUserEmailAsAdmin:', err);
    return {
      success: false,
      error: 'FETCH_ERROR',
      message: err.message || 'Error de red al verificar email',
    };
  }
}

/**
 * 📧 Resend verification email
 * @param email - Email del usuario
 * @returns Resultado de la operación
 */
export async function resendVerificationEmail(email: string): Promise<VerifyEmailResult> {
  try {
    // Usar RPC de Supabase
    const { data, error } = await supabase.rpc('resend_verification_email', {
      email_input: email,
    });

    if (error) {
      return {
        success: false,
        error: error.code || 'RPC_ERROR',
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
      error: 'FETCH_ERROR',
      message: err.message || 'Error al reenviar email',
    };
  }
}
