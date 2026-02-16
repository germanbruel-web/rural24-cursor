/**
 * useProfileNudge.ts
 * Hook que detecta login reciente y redirige a #/profile
 * con notificación de completitud de perfil.
 * 
 * Flujo:
 * 1. LoginForm/OAuthCallback marcan "just_logged_in" en sessionStorage
 * 2. Este hook detecta el flag cuando el perfil se carga
 * 3. Si el perfil está incompleto Y no superó 5 nudges → redirige + notifica
 * 4. Si el perfil está completo → redirige sin nudge
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

export function useProfileNudge(): void {
  const { profile, loading } = useAuth();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Esperar a que cargue el perfil
    if (loading || hasChecked.current) return;

    // Solo actuar si hay perfil y flag de login reciente
    if (!profile) return;

    const justLoggedIn = consumeJustLoggedIn();
    if (!justLoggedIn) return;

    // Marcar como procesado para esta sesión del hook
    hasChecked.current = true;

    // Siempre redirigir al perfil después de login
    navigateTo('/profile');

    // Verificar completitud y mostrar notificación si corresponde
    const { isComplete, missingFields, percentage } = checkProfileCompleteness(profile);

    if (!isComplete && shouldShowProfileNudge(profile.id)) {
      // Delay para que la navegación ocurra primero
      setTimeout(() => {
        const missing = missingFields.join(', ');
        notify.info(
          `Tu perfil está al ${percentage}%. Completá: ${missing} para generar más confianza en el mercado.`
        );
        recordProfileNudge(profile.id);
      }, 800);
    } else if (isComplete) {
      setTimeout(() => {
        notify.success('¡Bienvenido! Tu perfil está completo.');
      }, 800);
    }
  }, [profile, loading]);
}
