/**
 * AppHeader.tsx
 * Wrapper del Header Principal - Design System RURAL24
 * 
 * Integra el nuevo diseño optimizado para conversión:
 * - TopNav con clima y links secundarios
 * - Header con buscador protagonista y CTA destacado
 * - Mobile responsive con menú lateral
 */

import React from 'react';
import { HeaderNew } from './header/index';
import type { Page } from '../../App';

interface AppHeaderProps {
  onNavigate: (page: Page) => void;
  onSearch?: (query: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onNavigate, onSearch }) => {
  return (
    <HeaderNew 
      onNavigate={onNavigate} 
      onSearch={onSearch}
    />
  );
};

export default AppHeader;
