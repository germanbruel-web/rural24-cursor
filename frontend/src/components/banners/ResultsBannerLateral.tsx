// ResultsBannerLateral.tsx
// Banner Lateral Rotativo - Posición 4 (A-B-C-D)
// Muestra hasta 4 banners en sidebar derecho

import { useEffect, useState } from 'react';
import { getResultsLateralBanners } from '../../services/bannersService';
import type { Banner } from '../../../types';

interface Props {
  category?: string;
}

export const ResultsBannerLateral: React.FC<Props> = ({ category }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanners();
  }, [category]);

  const loadBanners = async () => {
    setLoading(true);
    const data = await getResultsLateralBanners(category);
    console.log('📢 LateralBanners loaded:', data.length);
    setBanners(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <aside className="hidden lg:block w-64 flex-shrink-0 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-full h-[250px] bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </aside>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <aside className="hidden lg:block w-64 flex-shrink-0 space-y-4 sticky top-28">
      {banners.map((banner) => (
        <a
          key={banner.id}
          href={banner.link_url || '#'}
          target={banner.link_url ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className="block rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow group"
        >
          <img
            src={banner.image_url}
            alt={banner.title}
            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Indicador de posición (A, B, C, D) */}
          {banner.position && (
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
              {banner.position}
            </div>
          )}
        </a>
      ))}
    </aside>
  );
};
