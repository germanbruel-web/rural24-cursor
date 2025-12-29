/**
 * =====================================================
 * TOAST NOTIFICATION SYSTEM - Sistema de Notificaciones
 * =====================================================
 * Sistema profesional de notificaciones tipo toast
 * con diferentes tipos, animaciones y auto-dismiss
 */

import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X, Loader } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = no auto-dismiss
  onClose?: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 4000,
  onClose
}) => {
  useEffect(() => {
    if (duration > 0 && type !== 'loading') {
      const timer = setTimeout(() => {
        onClose?.(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, type, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'loading':
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'loading':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        ${getStyles()}
        animate-in slide-in-from-right duration-300
        max-w-md w-full
      `}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        {message && (
          <p className="text-sm mt-1 opacity-90">{message}</p>
        )}
      </div>

      {type !== 'loading' && (
        <button
          onClick={() => onClose?.(id)}
          className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
