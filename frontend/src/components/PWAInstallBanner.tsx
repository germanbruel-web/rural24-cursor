import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

/**
 * Banner de instalación PWA — aparece automáticamente en dispositivos móviles.
 * Android: muestra botón "Instalar" que dispara el prompt nativo de Chrome.
 * iOS:     muestra instrucciones manuales (Compartir → Agregar a inicio).
 * Se oculta si ya está instalada (modo standalone) o fue descartada (7 días).
 */
export function PWAInstallBanner() {
  const { shouldShow, isIOS, triggerInstall, dismiss } = usePWAInstall();

  if (!shouldShow) return null;

  return (
    <>
      <style>{`
        @keyframes pwa-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .pwa-banner {
          animation: pwa-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      <div
        className="pwa-banner"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9998,
          background: 'white',
          borderTop: '1px solid #e5e7eb',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.15)',
          padding: '0.875rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        {/* Ícono de la app */}
        <img
          src="/images/AppImages/android/android-launchericon-192-192.png"
          alt="Rural24"
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        />

        {/* Texto */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#111827', lineHeight: 1.2 }}>
            Instalá Rural24
          </p>
          {isIOS ? (
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.4 }}>
              Tocá{' '}
              <svg
                viewBox="0 0 24 24"
                style={{ width: 13, height: 13, display: 'inline', verticalAlign: 'middle', marginBottom: 1 }}
                fill="none"
                stroke="#6b7280"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              {' '}→ <strong>Agregar a inicio</strong>
            </p>
          ) : (
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#6b7280' }}>
              Accedé más rápido, incluso sin internet
            </p>
          )}
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {!isIOS && (
            <button
              onClick={triggerInstall}
              style={{
                background: '#138A2C',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '0.5rem 1rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Instalar
            </button>
          )}

          <button
            onClick={dismiss}
            aria-label="Cerrar"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              fontSize: '1.5rem',
              lineHeight: 1,
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      </div>
    </>
  );
}
