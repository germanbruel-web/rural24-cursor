/**
 * useProfileNudge.ts
 * Hook que detecta login reciente y redirige a #/profile.
 * Si el perfil está incompleto → llama a onShowModal (modal branded)
 * Si el perfil está completo   → muestra toast de bienvenida
 *
 * Flujo:
 * 1. LoginForm/OAuthCallback marcan "just_logged_in" en sessionStorage
 * 2. Este hook detecta el flag cuando el perfil se carga
 * 3. Si el perfil está incompleto Y no superó MAX_NUDGES → abre modal
 * 4. Si el perfil está completo → toast de bienvenida
 *
 * Se coloca en App.tsx para que funcione globalmente.
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { navigateTo } from './useNavigate';
import { notify } from '../utils/notifications';
import {
  checkProfileCompleteness,
  consumeJustLoggedIn,
  shouldShowProfileNudge,
  recordProfileNudge,
} from '../utils/profileCompleteness';
import type { ProfileCompletenessResult } from '../utils/profileCompleteness';

interface UseProfileNudgeOptions {
  onShowModal: (data: ProfileCompletenessResult) => void;
}

export function useProfileNudge({ onShowModal }: UseProfileNudgeOptions): void {
  const { profile, loading } = useAuth();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (loading || hasChecked.current) return;
    if (!profile) return;

    const justLoggedIn = consumeJustLoggedIn();
    if (!justLoggedIn) return;

    hasChecked.current = true;

    navigateTo('/profile');

    const result = checkProfileCompleteness(profile);

    if (!result.isComplete && shouldShowProfileNudge(profile.id)) {
      setTimeout(() => {
        onShowModal(result);
        recordProfileNudge(profile.id);
      }, 800);
    } else if (result.isComplete) {
      setTimeout(() => {
        notify.success('¡Bienvenido! Tu perfil está completo.');
      }, 800);
    }
  }, [profile, loading, onShowModal]);
}
