/**
 * Hook para detectar estado de conexión a internet
 * Muestra indicador visual cuando no hay conexión
 */

import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('✅ Conexión restaurada');
      setIsOnline(true);
      setShowOfflineNotice(false);
    };

    const handleOffline = () => {
      console.log('🚫 Sin conexión a internet');
      setIsOnline(false);
      setShowOfflineNotice(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check inicial
    if (!navigator.onLine) {
      setShowOfflineNotice(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, showOfflineNotice };
}

/**
 * Componente de banner de estado offline
 * Muestra banner persistente cuando no hay conexión
 */

export function OfflineBanner() {
  const { showOfflineNotice } = useOnlineStatus();

  if (!showOfflineNotice) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white py-3 px-4 shadow-lg animate-slide-down"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
          <div>
            <p className="font-semibold">Sin conexión a internet</p>
            <p className="text-sm text-red-100">Verifica tu conexión de red. Los datos se cargarán automáticamente al reconectar.</p>
          </div>
        </div>
        
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-white text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reintentar
        </button>
      </div>
    </div>
  );
}

/**
 * Componente inline de estado offline para formularios
 * Muestra mensaje contextual cuando falla carga por red
 */

interface OfflineMessageProps {
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function OfflineMessage({ 
  message = 'No se pudo cargar. Verifica tu conexión.',
  onRetry,
  showRetry = true 
}: OfflineMessageProps) {
  const { isOnline } = useOnlineStatus();

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {isOnline ? (
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-red-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
          )}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-800">
            {message}
          </p>
          {!isOnline && (
            <p className="text-xs text-yellow-700 mt-1">
              🔴 Sin conexión a internet
            </p>
          )}
        </div>
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="ml-3 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium hover:bg-yellow-200 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}
