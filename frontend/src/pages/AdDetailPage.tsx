/**
 * AdDetailPage - Página de detalle de un aviso
 * =============================================
 * Este archivo se carga LAZY (solo cuando usuario ve un aviso)
 * 
 * Antes: En bundle principal (503KB)
 * Después: Chunk separado (~30-40KB)
 */

import React from 'react';
import { AdDetail } from '../components/pages/AdDetail';
import { navigateTo } from '../hooks/useNavigate';

interface AdDetailPageProps {
  adId?: string;
  onBack?: () => void;
}

export const AdDetailPage: React.FC<AdDetailPageProps> = ({ adId, onBack }) => {
  const finalAdId = adId || window.location.hash.split('/')[2];

  return (
    <AdDetail
      adId={finalAdId}
      onBack={onBack || (() => navigateTo('/'))}
    />
  );
};

export default AdDetailPage;
