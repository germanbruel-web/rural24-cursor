// SmartBreadcrumb.tsx
// Breadcrumb inteligente que muestra jerarquía real de navegación
// Mejora UX mostrando: Inicio > Categoría > Subcategoría · N resultados

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbSegment {
  label: string;
  href?: string;
  isActive: boolean;
}

interface SmartBreadcrumbProps {
  searchQuery?: string;
  categoryName?: string;
  categorySlug?: string;
  subcategoryName?: string;
  subcategorySlug?: string;
  resultCount: number;
  onNavigate?: (path: string) => void;
}

export const SmartBreadcrumb: React.FC<SmartBreadcrumbProps> = ({
  searchQuery,
  categoryName,
  categorySlug,
  subcategoryName,
  subcategorySlug,
  resultCount,
  onNavigate
}) => {
  const segments: BreadcrumbSegment[] = [
    { 
      label: 'Inicio', 
      href: '#/', 
      isActive: false 
    }
  ];

  // Caso 1: Búsqueda con categoría detectada automáticamente
  if (categoryName) {
    segments.push({
      label: categoryName,
      href: categorySlug ? `#/search?cat=${categorySlug}` : undefined,
      isActive: !subcategoryName
    });

    if (subcategoryName) {
      segments.push({
        label: subcategoryName,
        href: categorySlug && subcategorySlug 
          ? `#/search?cat=${categorySlug}&sub=${subcategorySlug}` 
          : undefined,
        isActive: true
      });
    }
  } 
  // Caso 2: Búsqueda por texto sin categoría detectada
  else if (searchQuery) {
    segments.push({ 
      label: `Resultados para "${searchQuery}"`, 
      isActive: true 
    });
  }

  const handleClick = (href?: string) => {
    if (href && onNavigate) {
      onNavigate(href);
    } else if (href) {
      window.location.hash = href.replace('#', '');
    }
  };

  return (
    <nav 
      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm mb-2 sm:mb-4 flex-wrap"
      aria-label="Breadcrumb"
    >
      {segments.map((seg, i) => (
        <React.Fragment key={i}>
          {seg.href ? (
            <button
              onClick={() => handleClick(seg.href)}
              className="flex items-center gap-0.5 sm:gap-1 text-gray-600 hover:text-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-sm px-0.5 sm:px-1"
              aria-current={seg.isActive ? 'page' : undefined}
            >
              {i === 0 && <Home size={12} className="inline sm:w-[14px] sm:h-[14px]" />}
              <span className={`${seg.isActive ? 'font-semibold text-gray-900' : ''} max-w-[100px] sm:max-w-none truncate`}>
                {seg.label}
              </span>
            </button>
          ) : (
            <span 
              className={`flex items-center gap-0.5 sm:gap-1 max-w-[100px] sm:max-w-none truncate ${
                seg.isActive ? 'text-gray-900 font-semibold' : 'text-gray-600'
              }`}
              aria-current={seg.isActive ? 'page' : undefined}
            >
              {i === 0 && <Home size={12} className="inline sm:w-[14px] sm:h-[14px]" />}
              {seg.label}
            </span>
          )}
          
          {i < segments.length - 1 && (
            <ChevronRight size={12} className="text-gray-400 sm:w-[16px] sm:h-[16px]" aria-hidden="true" />
          )}
        </React.Fragment>
      ))}
      
      <span className="text-gray-400 ml-0.5 sm:ml-1 text-[10px] sm:text-sm whitespace-nowrap">
        · {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
      </span>
    </nav>
  );
};

export default SmartBreadcrumb;
