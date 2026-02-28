/**
 * accountService.ts
 * Operaciones de seguridad y gestión de cuenta del usuario:
 *  - Cambio de contraseña
 *  - Cambio de email
 *  - Solicitud de eliminación de cuenta
 */

import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================================================
// TIPOS
// ============================================================================

export interface ChangePasswordInput {
  newPassword: string;
  confirmPassword: string;
}

export interface ChangeEmailInput {
  newEmail: string;
  confirmEmail: string;
}

export interface DeletionRequestInput {
  reason: string;
}

export interface AccountActionResult {
  success: boolean;
  error?: string;
}

export interface DeletionRequestResult extends AccountActionResult {
  requestId?: string;
  existingRequest?: boolean;
}

// ============================================================================
// CONTRASEÑA
// ============================================================================

/**
 * Detecta si el usuario se autenticó con un proveedor OAuth (Google, GitHub, etc.)
 * comparando los identities del usuario.
 */
export async function detectAuthProvider(): Promise<'email' | 'oauth' | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const identities = user.identities ?? [];
    const hasEmail = identities.some(i => i.provider === 'email');
    const hasOAuth = identities.some(i => i.provider !== 'email');

    if (hasOAuth && !hasEmail) return 'oauth';
    return 'email';
  } catch {
    return null;
  }
}

/**
 * Cambia la contraseña del usuario autenticado.
 * Valida que las contraseñas coincidan y cumplan mínimo de seguridad.
 */
export async function changePassword(input: ChangePasswordInput): Promise<AccountActionResult> {
  const { newPassword, confirmPassword } = input;

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'Las contraseñas no coinciden.' };
  }
  if (newPassword.length < 8) {
    return { success: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Error al cambiar la contraseña.' };
  }
}

// ============================================================================
// EMAIL
// ============================================================================

/**
 * Inicia el flujo de cambio de email.
 * Supabase envía un correo de confirmación al nuevo email.
 * El cambio NO es efectivo hasta que el usuario confirme desde ese correo.
 */
export async function changeEmail(input: ChangeEmailInput): Promise<AccountActionResult> {
  const { newEmail, confirmEmail } = input;

  if (!newEmail || !newEmail.includes('@')) {
    return { success: false, error: 'El email ingresado no es válido.' };
  }
  if (newEmail !== confirmEmail) {
    return { success: false, error: 'Los emails no coinciden.' };
  }

  // Obtener email actual para evitar envío redundante
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email?.toLowerCase() === newEmail.toLowerCase()) {
    return { success: false, error: 'El nuevo email es igual al actual.' };
  }

  try {
    const { error } = await supabase.auth.updateUser(
      { email: newEmail },
      // emailRedirectTo permite personalizar la URL de confirmación
      // Supabase enviará el enlace al NUEVO email para que el usuario confirme
    );
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Error al iniciar cambio de email.' };
  }
}

// ============================================================================
// ELIMINACIÓN DE CUENTA
// ============================================================================

/**
 * Envía al superadmin una solicitud de baja de cuenta.
 * La cuenta NO se elimina de inmediato — el superadmin la procesa.
 */
export async function requestAccountDeletion(
  input: DeletionRequestInput
): Promise<DeletionRequestResult> {
  const { reason } = input;

  if (!reason || reason.trim().length < 10) {
    return { success: false, error: 'Por favor explicá el motivo (mínimo 10 caracteres).' };
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'No autenticado.' };
    }

    const res = await fetch(`${API_URL}/api/user/deletion-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ reason: reason.trim() }),
    });

    const json = await res.json();

    if (res.status === 409) {
      return { success: false, existingRequest: true, error: json.error };
    }

    if (!res.ok) {
      return { success: false, error: json.error ?? 'Error al enviar la solicitud.' };
    }

    return { success: true, requestId: json.requestId };
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Error de conexión.' };
  }
}

/**
 * Verifica si el usuario ya tiene una solicitud de eliminación activa.
 */
export async function getActiveDeletionRequest(): Promise<{
  exists: boolean;
  request?: { id: string; status: string; created_at: string };
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { exists: false };

    const res = await fetch(`${API_URL}/api/user/deletion-request`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!res.ok) return { exists: false };

    const json = await res.json();
    if (json.request && ['pending', 'processing'].includes(json.request.status)) {
      return { exists: true, request: json.request };
    }
    return { exists: false };
  } catch {
    return { exists: false };
  }
}
