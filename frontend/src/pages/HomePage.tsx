/**
 * HomePage - Página principal
 * Hero + CategoryQuickNav + HowItWorks + Secciones dinámicas CMS
 *
 * Las secciones de avisos y banners se gestionan desde:
 *   Admin → Constructor de Homepage (#/home-cms)
 */

import React from 'react';
import {
  HeroWithCarousel,
  HowItWorksSection,
  BannersVipHero,
} from '../components';
import { SearchSEO } from '../components/SearchSEO';
import { CategoryQuickNav } from '../components/CategoryQuickNav';
import { DynamicHomeSections } from '../components/sections/DynamicHomeSections';

interface HomePageProps {
  onShowAuthModal?: () => void;
  onSearch?: (filters: any) => void;
  onCategoryHover?: (category: string | null) => void;
  onBannerChange?: (banner: any) => void;
  onAdClick?: (adId: string) => void;
  hoveredCategory?: string | null;
}

export const HomePage: React.FC<HomePageProps> = ({ onShowAuthModal }) => {
  return (
    <main className="flex-1">
      {/* SEO: Structured Data para buscador */}
      <SearchSEO />

      {/* Hero con banner VIP */}
      <HeroWithCarousel
        bannerSlot={
          <div className="max-w-[1100px] mx-auto">
            <BannersVipHero />
          </div>
        }
      />

      {/* Navegación rápida por categoría — solo mobile */}
      <CategoryQuickNav />

      {/* Sección informativa */}
      <HowItWorksSection onRegisterClick={onShowAuthModal} />

      {/* Secciones dinámicas — configuradas desde Admin → Constructor de Homepage */}
      <DynamicHomeSections />
    </main>
  );
};

export default HomePage;
