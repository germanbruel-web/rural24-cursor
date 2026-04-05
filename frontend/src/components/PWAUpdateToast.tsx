import { useState, useEffect } from 'react';

/**
 * PWAUpdateToast — notifica al usuario cuando hay una nueva versión disponible.
 *
 * Con registerType: 'autoUpdate' en VitePWA, el nuevo SW toma control
 * automáticamente (skipWaiting). El evento 'controllerchange' en
 * navigator.serviceWorker se dispara cuando eso ocurre.
 * El toast aparece una sola vez por sesión y propone recargar la página.
 */
export function PWAUpdateToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;

    const handleControllerChange = () => {
      // Evitar loop si el reload dispara otro controllerchange
      if (refreshing) return;
      setVisible(true);
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9997] flex items-center gap-3 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl"
    >
      <span>Nueva versión disponible</span>
      <button
        onClick={() => window.location.reload()}
        className="px-3 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-semibold text-xs transition-colors"
      >
        Actualizar
      </button>
      <button
        onClick={() => setVisible(false)}
        aria-label="Cerrar"
        className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
