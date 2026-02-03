// AppHeader.tsx
// Wrapper que combina TopNav + Header - Design System RURAL24
// Estructura:
//   TopNav: ¿Cómo funciona? | Planes | Publicar Gratis | User Dropdown
//   Header: Logo (izq) | Espacio vacío (centro) | Buscador (der)

import React from 'react';
import { TopNav } from './TopNav';
import { Header } from './Header';

interface AppHeaderProps {
  onNavigate: (page: string) => void;
  onSearch?: (query: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onNavigate, onSearch }) => {
  return (
    <>
      <TopNav onNavigate={onNavigate} />
      <Header onNavigate={onNavigate} onSearch={onSearch} />
    </>
  );
};

export default AppHeader;
