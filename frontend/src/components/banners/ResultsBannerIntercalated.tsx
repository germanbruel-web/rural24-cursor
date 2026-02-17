// ResultsBannerIntercalated.tsx
// Banner Resultados Intercalado - (650x100)
// Se inserta cada N productos en los resultados (configurable desde global_settings)

import { useEffect, useState } from 'react';
import { getIntercalatedBanner, incrementBannerImpression, incrementBannerClick } from '../../services/bannersCleanService';
import type { BannerClean } from '@/types';

interface Props {
  category?: string;
  position: number; // Posición en el grid (5, 10, 15, 20...)
}

export const ResultsBannerIntercalated: React.FC<Props> = ({ category, position }) => {
  const [banner, setBanner] = useState<BannerClean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanner();
  }, [category, position]);

  const loadBanner = async () => {
    setLoading(true);
    const data = await getIntercalatedBanner(category);
    console.log(`📢 IntercalatedBanner at position ${position}:`, data?.client_name);
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
      <div className="col-span-full flex justify-center my-4">
        <div className="w-[650px] max-w-full h-[100px] bg-gray-200 animate-pulse rounded-lg" />
      </div>
    );
  }

  // Si no hay banner real, mostrar placeholder publicitario
  if (!banner || !banner.desktop_image_url) {
    return (
      <div className="col-span-full flex justify-center my-4">
        <a
          href="mailto:info@rural24.com.ar?subject=Consulta%20publicidad%20en%20Rural24"
          className="block w-[650px] max-w-full h-[100px] bg-gradient-to-r from-brand-600 to-brand-700 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all hover:scale-[1.01] flex items-center justify-center"
        >
          <div className="text-center text-white px-4">
            <p className="text-lg font-bold">📢 Publicite aquí</p>
            <p className="text-sm opacity-90">Consulte en info@rural24.com.ar</p>
          </div>
        </a>
      </div>
    );
  }

  return (
    <div className="col-span-full flex justify-center my-4">
      <a
        href={banner.link_url || '#'}
        target={banner.link_url ? '_blank' : '_self'}
        rel="noopener noreferrer"
        onClick={handleClick}
        className="block w-[650px] max-w-full rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
      >
        <img
          src={banner.desktop_image_url}
          alt={banner.client_name}
          className="w-full h-[100px] object-contain hover:scale-105 transition-transform duration-300"
        />
      </a>
    </div>
  );
};
