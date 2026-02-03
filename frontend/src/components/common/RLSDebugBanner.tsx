import { AlertTriangle, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * RLS Debug Banner
 * Muestra advertencia cuando RLS está deshabilitado (solo en desarrollo)
 */
export function RLSDebugBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Solo mostrar en modo desarrollo
    if (import.meta.env.DEV) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-2 shadow-lg">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div className="text-sm">
            <strong>🚨 DEBUG MODE:</strong> RLS deshabilitado en tabla <code className="bg-red-700 px-2 py-0.5 rounded">ads</code>
            {' '} - Todos los avisos son visibles
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline hover:text-red-100 flex items-center gap-1"
          >
            <Shield className="w-3 h-3" />
            Re-habilitar RLS
          </a>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white hover:text-red-100 text-xl leading-none"
            title="Ocultar (sigue activo)"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
