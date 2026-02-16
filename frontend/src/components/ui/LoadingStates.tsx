/**
 * Componente de Loading Skeleton para formularios
 * Mejora UX mostrando estructura mientras carga datos
 */

import React from 'react';

interface LoadingSkeletonProps {
  type: 'form' | 'dropdown' | 'card' | 'list';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type, count = 1 }) => {
  const baseClasses = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded-lg";

  if (type === 'form') {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-3">
          <div className={`${baseClasses} h-8 w-48`} />
          <div className={`${baseClasses} h-4 w-full max-w-md`} />
        </div>

        {/* Form Fields Skeleton */}
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className={`${baseClasses} h-4 w-32`} />
            <div className={`${baseClasses} h-12 w-full`} />
          </div>
        ))}

        {/* Button Skeleton */}
        <div className={`${baseClasses} h-12 w-full max-w-xs`} />
      </div>
    );
  }

  if (type === 'dropdown') {
    return (
      <div className="space-y-2">
        <div className={`${baseClasses} h-4 w-24`} />
        <div className={`${baseClasses} h-12 w-full`} />
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <div className={`${baseClasses} h-48 w-full`} />
        <div className="space-y-2">
          <div className={`${baseClasses} h-6 w-3/4`} />
          <div className={`${baseClasses} h-4 w-full`} />
          <div className={`${baseClasses} h-4 w-5/6`} />
        </div>
        <div className="flex justify-between">
          <div className={`${baseClasses} h-8 w-24`} />
          <div className={`${baseClasses} h-8 w-32`} />
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className={`${baseClasses} h-12 w-12 rounded-full`} />
            <div className="flex-1 space-y-2">
              <div className={`${baseClasses} h-4 w-3/4`} />
              <div className={`${baseClasses} h-3 w-1/2`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

/**
 * Componente de estado vacío (Empty State)
 * Muestra mensaje cuando no hay datos disponibles
 */

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-600 mb-6 max-w-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

/**
 * Componente de Error State
 * Muestra mensaje de error con opción de reintentar
 */

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Error al cargar datos',
  message,
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 text-red-500">
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 mb-6 max-w-sm">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reintentar
        </button>
      )}
    </div>
  );
};

/**
 * Componente de Progress Bar
 * Muestra progreso de carga
 */

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full space-y-2">
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm">
          {label && <span className="text-gray-700">{label}</span>}
          {showPercentage && <span className="text-gray-500">{clampedProgress}%</span>}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-brand-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Componente de Spinner
 * Loader simple animado
 */

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'text-blue-600',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${color}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};
