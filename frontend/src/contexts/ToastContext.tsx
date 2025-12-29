/**
 * =====================================================
 * TOAST CONTEXT - Contexto Global de Notificaciones
 * =====================================================
 * Provee sistema de notificaciones accesible desde cualquier componente
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastProps, ToastType } from '../components/ui/Toast';

interface ToastContextValue {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => string;
  hideToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const newToast: ToastProps = { ...toast, id, onClose: hideToast };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, clearAll }}>
      {children}
      
      {/* Toast Container - Fixed position */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-2">
          {toasts.map(toast => (
            <Toast key={toast.id} {...toast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

// Helper hooks para tipos específicos
export const useToastHelpers = () => {
  const { showToast, hideToast } = useToast();

  return {
    success: (title: string, message?: string, duration?: number) =>
      showToast({ type: 'success', title, message, duration }),
    
    error: (title: string, message?: string, duration?: number) =>
      showToast({ type: 'error', title, message, duration }),
    
    info: (title: string, message?: string, duration?: number) =>
      showToast({ type: 'info', title, message, duration }),
    
    loading: (title: string, message?: string) =>
      showToast({ type: 'loading', title, message, duration: 0 }),
    
    hide: hideToast
  };
};
