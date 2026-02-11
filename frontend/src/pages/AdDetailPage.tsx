/**
 * AdDetailPage - Página de detalle de un aviso
 * =============================================
 * Este archivo se carga LAZY (solo cuando usuario ve un aviso)
 * 
 * Antes: En bundle principal (503KB)
 * Después: Chunk separado (~30-40KB)
 */

import React from 'react';
import { AdDetailPage as AdDetailComponent } from '../components';
import { navigateTo } from '../hooks/useNavigate';

interface AdDetailPageProps {
  adId?: string;
  onBack?: () => void;
  onSearch?: (params: any) => void;
}

export const AdDetailPage: React.FC<AdDetailPageProps> = ({ 
  adId,
  onBack,
  onSearch,
}) => {
  // Extraer adId de la URL si no se pasa como prop
  const finalAdId = adId || window.location.hash.split('/')[2];

  return (
    <AdDetailComponent 
      adId={finalAdId}
      onBack={onBack || (() => navigateTo('/'))}
      onSearch={onSearch}
    />
  );
};

export default AdDetailPage;
