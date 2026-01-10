// ResultsBannerIntercalated.tsx
// Banner Resultados Intercalado - Posición 3 (648x100)
// Se inserta cada 5 productos en los resultados (random)

import { useEffect, useState } from 'react';
import { getResultsIntercalatedBanner } from '../../services/bannersService';
import type { Banner } from '../../../types';

interface Props {
  category?: string;
  position: number; // Posición en el grid (5, 10, 15, 20...)
}

export const ResultsBannerIntercalated: React.FC<Props> = ({ category, position }) => {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanner();
  }, [category, position]);

  const loadBanner = async () => {
    setLoading(true);
    const data = await getResultsIntercalatedBanner(category);
    console.log(`📢 IntercalatedBanner at position ${position}:`, data?.title);
    setBanner(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="col-span-full w-full h-[100px] bg-gray-200 animate-pulse rounded-lg" />
    );
  }

  if (!banner) {
    return null;
  }

  return (
    <div className="col-span-full my-4">
      <a
        href={banner.link_url || '#'}
        target={banner.link_url ? '_blank' : '_self'}
        rel="noopener noreferrer"
        className="block w-full rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
      >
        <img
          src={banner.image_url}
          alt={banner.title}
          className="w-full h-[100px] object-cover hover:scale-105 transition-transform duration-300"
        />
      </a>
    </div>
  );
};
