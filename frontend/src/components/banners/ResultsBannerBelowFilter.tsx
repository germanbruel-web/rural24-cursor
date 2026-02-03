// ResultsBannerBelowFilter.tsx
// Banner Resultados Debajo del Filtro - Posición sticky
// Dimensiones: 280x250 (formato cuadrado/MPU)

import { useEffect, useState } from 'react';
import { getBelowFilterBanner, incrementBannerImpression, incrementBannerClick } from '../../services/bannersCleanService';
import type { BannerClean } from '@/types';

interface Props {
  category?: string;
}

export const ResultsBannerBelowFilter: React.FC<Props> = ({ category }) => {
  const [banner, setBanner] = useState<BannerClean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanner();
  }, [category]);

  const loadBanner = async () => {
    setLoading(true);
    const data = await getBelowFilterBanner(category);
    console.log('📢 BelowFilterBanner loaded:', data?.client_name || 'none');
    setBanner(data);
    
    // Incrementar impresión
    if (data) {
      incrementBannerImpression(data.id).catch(() => {});
    }
    
    setLoading(false);
  };

  const handleClick = () => {
    if (banner) {
      incrementBannerClick(banner.id).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="mt-4 w-full h-[250px] bg-gray-200 animate-pulse rounded-lg" />
    );
  }

  // Si no hay banner real, mostrar placeholder publicitario
  if (!banner || !banner.desktop_image_url) {
    return (
      <div className="mt-4">
        <a
          href="mailto:info@rural24.com.ar?subject=Consulta%20publicidad%20en%20Rural24"
          className="block w-[280px] h-[250px] bg-gradient-to-br from-[#16a135] to-[#138a2e] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all hover:scale-[1.02] flex flex-col items-center justify-center"
        >
          <div className="text-center text-white px-4">
            <div className="text-4xl mb-2">📢</div>
            <p className="text-lg font-bold">Publicite aquí</p>
            <p className="text-sm opacity-90 mt-1">280 x 250</p>
            <p className="text-xs opacity-75 mt-2">info@rural24.com.ar</p>
          </div>
        </a>
        <div className="text-xs text-gray-400 text-center mt-1">
          Publicidad
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 sticky top-[calc(100vh-280px)]">
      <a
        href={banner.link_url || '#'}
        target={banner.link_url ? '_blank' : '_self'}
        rel="noopener noreferrer"
        onClick={handleClick}
        className="block w-full rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
      >
        <img
          src={banner.desktop_image_url || ''}
          alt={banner.client_name}
          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
          style={{ maxWidth: '280px', maxHeight: '250px' }}
        />
      </a>
      {/* Label discreto */}
      <div className="text-xs text-gray-400 text-center mt-1">
        Publicidad
      </div>
    </div>
  );
};
