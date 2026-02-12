/**
 * HomePage - Página principal con Hero + Categorías + Featured Ads
 * ==================================================================
 * Este archivo se carga LAZY (solo cuando usuario está en homepage)
 * 
 * Antes: En bundle principal (503KB)
 * Después: Chunk separado (~50-80KB)
 */

import React, { useState, useEffect } from 'react';
import {
  HeroWithCarousel,
  HeroCategoryButtons,
  FeaturedAdsSection,
  HowItWorksSection,
  BannersVipHero,
} from '../components';
import { SearchSEO } from '../components/SearchSEO';
import { getHeroVIPBanners } from '../services/bannersCleanService';
import { getSettingNumber } from '../services/v2/globalSettingsService';
import { navigateTo } from '../hooks/useNavigate';
import type { Banner, BannerClean } from '../../types';

interface HomePageProps {
  onShowAuthModal?: () => void;
  onSearch?: (filters: any) => void;
  onCategoryHover?: (category: string | null) => void;
  onBannerChange?: (banner: Banner | null) => void;
  onAdClick?: (adId: string) => void;
  hoveredCategory?: string | null;
}

export const HomePage: React.FC<HomePageProps> = ({ 
  onShowAuthModal,
  onSearch,
  onCategoryHover,
  onBannerChange,
  onAdClick,
  hoveredCategory,
}) => {
  const [heroBanners, setHeroBanners] = useState<BannerClean[]>([]);
  const [featuredLimit, setFeaturedLimit] = useState<number | null>(null);

  // Cargar banners del hero
  useEffect(() => {
    const loadHeroBanners = async () => {
      try {
        const banners = await getHeroVIPBanners();
        setHeroBanners(banners);
      } catch (error) {
        console.error('[HomePage] Error loading hero banners:', error);
      }
    };

    loadHeroBanners();
  }, []);

  // Cargar configuración de featured ads
  useEffect(() => {
    const loadFeaturedLimit = async () => {
      try {
        const limit = await getSettingNumber('featured_ads_limit_home', 12);
        setFeaturedLimit(limit);
      } catch (error) {
        console.error('[HomePage] Error loading featured limit:', error);
        setFeaturedLimit(12); // Fallback
      }
    };

    loadFeaturedLimit();
  }, []);

  return (
    <main className="flex-1">
      {/* SEO: Structured Data para buscador */}
      <SearchSEO />

      {/* Hero con título, banner y botones */}
      <HeroWithCarousel 
        bannerSlot={
          <div className="max-w-[1200px] mx-auto">
            <BannersVipHero category={hoveredCategory || undefined} />
          </div>
        }
      >
        <HeroCategoryButtons 
          onSearch={onSearch} 
          onCategoryHover={onCategoryHover}
          onBannerChange={onBannerChange}
        />
      </HeroWithCarousel>

      {/* Sección Cómo Funciona */}
      <HowItWorksSection onRegisterClick={onShowAuthModal} />

      {/* 🌟 Avisos Destacados por Categoría */}
      {typeof featuredLimit === 'number' ? (
        <FeaturedAdsSection
          onAdClick={(adId) => {
            if (onAdClick) {
              onAdClick(adId);
            }
            navigateTo(`/ad/${adId}`);
          }}
          onCategoryClick={(categorySlug) => {
            navigateTo('/search', { cat: categorySlug });
          }}
          onSubcategoryClick={(catSlug, subSlug) => {
            navigateTo('/search', { cat: catSlug, sub: subSlug });
          }}
          maxAdsPerCategory={featuredLimit}
        />
      ) : (
        // Loading skeleton
        <section className="py-8 sm:py-12 bg-white" aria-busy="true" aria-label="Cargando avisos destacados">
          <div className="max-w-[1400px] mx-auto px-3 sm:px-4">
            <div className="h-12 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                  <div className="w-full aspect-[4/3] bg-gray-200 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse mt-3" />
                    <div className="h-8 bg-gray-200 rounded animate-pulse mt-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default HomePage;
