/**
 * HomePage - Página principal
 * Hero + CategoryQuickNav + HowItWorks + Secciones dinámicas CMS
 *
 * Las secciones de avisos y banners se gestionan desde:
 *   Admin → Constructor de Homepage (#/home-cms)
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
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
  onSearch?: (filters: unknown) => void;
  onCategoryHover?: (category: string | null) => void;
  onBannerChange?: (banner: unknown) => void;
  onAdClick?: (adId: string) => void;
  hoveredCategory?: string | null;
}

export const HomePage: React.FC<HomePageProps> = ({ onShowAuthModal }) => {
  return (
    <main className="flex-1">
      {/* SEO: Structured Data para buscador */}
      <SearchSEO />

      {/* SEO: Organization schema */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Rural24',
            url: 'https://rural24.com.ar',
            logo: 'https://rural24.com.ar/images/logos/rural24-dark.webp',
            description: 'Clasificados agropecuarios de Argentina. Comprá y vendé ganado, maquinaria, insumos e inmuebles rurales.',
            address: { '@type': 'PostalAddress', addressCountry: 'AR' },
          })}
        </script>
      </Helmet>

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
