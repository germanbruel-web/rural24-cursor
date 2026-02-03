// AppHeader.tsx
// Wrapper que combina TopNav + Header - Design System RURAL24
// Mobile: Header único con menú hamburguesa → TopNav como drawer
// Desktop: TopNav (barra superior) + Header (logo + buscador + clima)

import React, { useState } from 'react';
import { TopNav } from './TopNav';
import { Header } from './Header';
import type { Page } from '../../App';

interface AppHeaderProps {
  onNavigate: (page: Page) => void;
  onSearch?: (query: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onNavigate, onSearch }) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      {/* Desktop: TopNav visible */}
      <TopNav 
        onNavigate={onNavigate} 
        showMobileMenu={showMobileMenu}
        onCloseMobileMenu={() => setShowMobileMenu(false)}
      />
      
      {/* Header siempre visible - En mobile tiene botón hamburguesa */}
      <Header 
        onNavigate={onNavigate} 
        onSearch={onSearch}
        onToggleMobileMenu={() => setShowMobileMenu(!showMobileMenu)}
        showMobileMenuButton={true}
      />
    </>
  );
};

export default AppHeader;
