/**
 * ============================================================================
 * ADMIN USERS SERVICE - Frontend
 * ============================================================================
 * 
 * Cliente para llamar endpoints admin de usuarios
 */

import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
    const response = await fetch(`${API_URL}/api/admin/verify-email`, {
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
