// ====================================================================
// AUTOFILL BUTTON - Un botón para autocompletar título + descripción
// ====================================================================
// Cada click rota entre 4-5 plantillas de la categoría.
// Usa contentTemplates local, sin fetch a BD.
// ====================================================================

import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { generateContent, type ContentContext } from '../../utils/contentTemplates';
import { notify } from '../../utils/notifications';

interface AutofillButtonProps {
  // Contexto para generar contenido
  context: ContentContext;
  
  // Valores actuales
  currentTitle?: string;
  currentDescription?: string;
  
  // Callbacks
  onFill: (title: string, description: string) => void;
  
  // Estilo opcional
  variant?: 'default' | 'compact';
}

export function AutofillButton({
  context,
  currentTitle,
  currentDescription,
  onFill,
  variant = 'default',
}: AutofillButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  
  const hasContent = !!(currentTitle?.trim() || currentDescription?.trim());
  
  const handleClick = () => {
    // Animación
    setIsAnimating(true);
    setClickCount(prev => prev + 1);
    
    // Generar contenido (rota automáticamente entre plantillas)
    const { title, description } = generateContent(context);
    
    // Aplicar
    onFill(title, description);
    
    // Feedback
    notify.success(clickCount === 0 ? 'Autocompletado' : 'Variante aplicada');
    
    // Reset animación
    setTimeout(() => setIsAnimating(false), 300);
  };
  
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
        title="Click para otra variante"
      >
        {isAnimating ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">Autocompletar</span>
      </button>
    );
  }
  
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        w-full flex items-center justify-center gap-2 
        px-4 py-3 rounded-lg font-medium text-sm
        border-2 border-dashed transition-all
        ${hasContent 
          ? 'border-brand-600 text-brand-600 hover:border-brand-600 hover:bg-brand-50'
          : 'border-brand-600 text-brand-600 bg-brand-50 hover:bg-brand-100 hover:border-brand-500'
        }
      `}
    >
      {isAnimating ? (
        <RefreshCw className="w-5 h-5 animate-spin" />
      ) : (
        <Sparkles className="w-5 h-5" />
      )}
      <span>
        {hasContent ? 'Otra variante' : 'Autocompletar'}
      </span>
    </button>
  );
}
