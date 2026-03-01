import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'rural24:pwa-banner-dismissed';
const DISMISS_DAYS = 7;

function wasDismissedRecently(): boolean {
  const stored = localStorage.getItem(DISMISS_KEY);
  if (!stored) return false;
  return Date.now() - parseInt(stored, 10) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [dismissed, setDismissed] = useState(wasDismissedRecently);

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Escuchar cuando la app se instala — ocultar banner
  useEffect(() => {
    const handler = () => setCanInstall(false);
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
      setDeferredPrompt(null);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setDismissed(true);
  };

  // Mostrar si: dispositivo móvil + no está instalada + no fue descartada
  // Android: espera el evento beforeinstallprompt
  // iOS:     muestra instrucciones manuales inmediatamente
  const shouldShow =
    isMobileDevice && !isStandalone && !dismissed && (canInstall || isIOS);

  return { shouldShow, isIOS, canInstall, triggerInstall, dismiss };
}
