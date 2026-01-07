/**
 * Modal Molecule - Componente de modal del Design System
 * Implementa overlay, cierre con ESC, bloqueo de scroll
 */

import React, { useEffect, useCallback } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '../../../design-system/utils';
import { X } from 'lucide-react';
import { Button } from '../../atoms/Button';

const modalVariants = cva(
  [
    'relative bg-white rounded-lg shadow-xl',
    'max-h-[90vh] overflow-y-auto',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-sm w-full',
        md: 'max-w-md w-full',
        lg: 'max-w-lg w-full',
        xl: 'max-w-xl w-full',
        '2xl': 'max-w-2xl w-full',
        '4xl': 'max-w-4xl w-full',
        full: 'max-w-full w-full m-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface ModalProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalVariants> {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      className,
      size,
      open,
      onClose,
      title,
      description,
      footer,
      showCloseButton = true,
      closeOnOverlayClick = true,
      closeOnEscape = true,
      children,
      ...props
    },
    ref
  ) => {
    // Cierre con tecla ESC
    const handleEscape = useCallback(
      (event: KeyboardEvent) => {
        if (closeOnEscape && event.key === 'Escape') {
          onClose();
        }
      },
      [closeOnEscape, onClose]
    );

    // Bloquear scroll del body cuando modal está abierto
    useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden';
        if (closeOnEscape) {
          document.addEventListener('keydown', handleEscape);
        }
      }

      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    }, [open, closeOnEscape, handleEscape]);

    if (!open) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />

        {/* Modal Content */}
        <div
          ref={ref}
          className={cn(modalVariants({ size }), 'relative z-10', className)}
          {...props}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
              <div className="flex-1">
                {title && (
                  <h2
                    id="modal-title"
                    className="text-xl font-semibold text-gray-900"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="modal-description"
                    className="mt-1 text-sm text-gray-500"
                  >
                    {description}
                  </p>
                )}
              </div>

              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="ml-4 -mr-2 -mt-2"
                  aria-label="Cerrar modal"
                >
                  <X size={20} />
                </Button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-4">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

export { modalVariants };
export default Modal;
