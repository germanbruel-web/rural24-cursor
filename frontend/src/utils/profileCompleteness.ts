/**
 * profileCompleteness.ts
 * Utilidad para verificar completitud del perfil de usuario
 * 
 * Se usa para:
 * - Calcular % de completitud del perfil
 * - Determinar campos faltantes
 * - Controlar nudges post-login (máx 10 veces por usuario)
 * 
 * Campos requeridos para perfil completo:
 * - full_name (nombre completo)
 * - mobile (celular verificado - obligatorio)
 * - province (provincia)
 * - location (localidad)
 */

export interface ProfileCompletenessResult {
  percentage: number;
  missingFields: string[];
  isComplete: boolean;
}

interface ProfileFields {
  full_name?: string | null;
  phone?: string | null;
  mobile?: string | null;
  mobile_verified?: boolean | null;
  province?: string | null;
  location?: string | null;
}

/**
 * Verifica la completitud del perfil del usuario.
 * Retorna porcentaje, campos faltantes y si está completo.
 */
export function checkProfileCompleteness(profile: ProfileFields | null | undefined): ProfileCompletenessResult {
  if (!profile) {
    return {
      percentage: 0,
      missingFields: ['Nombre completo', 'Celular verificado', 'Provincia', 'Localidad'],
      isComplete: false,
    };
  }

  const missingFields: string[] = [];

  if (!profile.full_name?.trim()) {
    missingFields.push('Nombre completo');
  }
  // Celular es obligatorio y debe estar verificado
  if (!profile.mobile?.trim()) {
    missingFields.push('Celular');
  } else if (!profile.mobile_verified) {
    missingFields.push('Celular verificado');
  }
  if (!profile.province?.trim()) {
    missingFields.push('Provincia');
  }
  if (!profile.location?.trim()) {
    missingFields.push('Localidad');
  }

  const totalFields = 4;
  const completedFields = totalFields - missingFields.length;
  const percentage = Math.round((completedFields / totalFields) * 100);

  return {
    percentage,
    missingFields,
    isComplete: missingFields.length === 0,
  };
}

// ── Nudge tracking (localStorage) ──────────────────────────

const NUDGE_KEY_PREFIX = 'profile_nudge_count_';
const MAX_NUDGES = 10;

/**
 * Verifica si se debe mostrar el nudge de perfil incompleto.
 * Retorna false después de MAX_NUDGES (5) veces.
 */
export function shouldShowProfileNudge(userId: string): boolean {
  const count = parseInt(localStorage.getItem(`${NUDGE_KEY_PREFIX}${userId}`) || '0', 10);
  return count < MAX_NUDGES;
}

/**
 * Registra que se mostró un nudge al usuario.
 * Incrementa el contador en localStorage.
 */
export function recordProfileNudge(userId: string): void {
  const count = parseInt(localStorage.getItem(`${NUDGE_KEY_PREFIX}${userId}`) || '0', 10);
  localStorage.setItem(`${NUDGE_KEY_PREFIX}${userId}`, String(count + 1));
}

// ── Session flag para detectar login reciente ──────────────

const JUST_LOGGED_IN_KEY = 'just_logged_in';

/**
 * Marca que el usuario acaba de iniciar sesión.
 * Se usa para trigger el redirect + nudge.
 */
export function setJustLoggedIn(): void {
  sessionStorage.setItem(JUST_LOGGED_IN_KEY, 'true');
}

/**
 * Verifica y consume el flag de login reciente.
 * Retorna true solo una vez (consume el flag).
 */
export function consumeJustLoggedIn(): boolean {
  const value = sessionStorage.getItem(JUST_LOGGED_IN_KEY);
  if (value === 'true') {
    sessionStorage.removeItem(JUST_LOGGED_IN_KEY);
    return true;
  }
  return false;
}
