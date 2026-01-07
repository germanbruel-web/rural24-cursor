import React, { useState, useRef, useEffect } from 'react';
import type { Product, Ad } from '../../../types';
import { ProductCard } from '../organisms/ProductCard';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { SUBCATEGORIES } from '../../constants/categories';

interface CategoryCarouselProps {
  title: string;
  category: string;
  products: Product[];
  premiumAds?: Ad[];
  activeAds?: Ad[];
  onViewMore?: (category: string, subcategory?: string) => void;
  onViewDetail?: (adId: string) => void;
}

export const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ title, category, products, premiumAds = [], activeAds = [], onViewMore, onViewDetail }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number>(0);
  const [touchEnd, setTouchEnd] = useState<number>(0);

  // Detectar si es mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Simular carga inicial del carrusel solo cuando no hay productos o están vacíos
  useEffect(() => {
    // Solo mostrar loading si los productos están vacíos (carga inicial)
    if (products.length === 0 && premiumAds.length === 0 && activeAds.length === 0) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      // Si ya hay datos, mostrar inmediatamente
      setIsLoading(false);
    }
  }, [products.length, premiumAds.length, activeAds.length]);

  // Color verde unificado para todas las categorías
  const colors = { border: '#16a135', bg: 'rgba(22, 161, 53, 0.05)' };

  // Iconos por categoría (sincronizado con botones del buscador)
  const categoryIcons: Record<string, string> = {
    'Maquinaria': 'icon-1.png',
    'Ganadería': 'icon-2.png',
    'Insumos': 'icon-3.png',
    'Inmuebles Rurales': 'icon-4.png',
    'Equipos': 'icon-6.png'
  };

  const categoryIcon = categoryIcons[category];

  // Mapeo flexible de categorías para soportar variaciones
  const categoryMap: Record<string, string[]> = {
    'Maquinaria': ['Maquinaria', 'Maquinarias'],
    'Ganadería': ['Ganadería', 'Ganaderia'],
    'Insumos': ['Insumos'],
    'Inmuebles Rurales': ['Inmuebles Rurales', 'Inmuebles', 'Inmobiliarias', 'Inmobiliaria', 'Inmobiliaria Rural'],
    'Equipos': ['Equipos', 'Equipos y Herramientas', 'Herramientas']
  };

  // Filtrar avisos premium (featured:true) de esta categoría y convertirlos a Product
  const premiumProducts: Product[] = premiumAds
    .filter(ad => {
      const adCategory = ad.category;
      const matchesCategory = categoryMap[category]?.some(cat => 
        adCategory?.toLowerCase() === cat.toLowerCase()
      ) || adCategory?.toLowerCase() === category?.toLowerCase();
      
      // Debug: Mostrar por qué se filtra o no
      if (category === 'Maquinarias' && ad.title) {
        console.log(`[Premium] ${ad.title}: category="${adCategory}" matches="${matchesCategory}"`);
      }
      
      return matchesCategory;
    })
    .map(ad => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      price: ad.price,
      currency: ad.currency,
      location: ad.location || 'Sin ubicación',
      province: ad.province,
      imageUrl: ad.images?.[0] || '',
      sourceUrl: ad.external_url || '',
      category: ad.category || category,
      subcategory: ad.subcategory,
      isSponsored: false,
      isPremium: true,
      featured: true, // Todos los avisos de premiumAds tienen featured:true
      tags: ad.tags,
      createdAt: ad.created_at,
      user_id: ad.user_id, // ID del vendedor
      seller: ad.seller, // Información del vendedor para modal de contacto
      brand: ad.brand,
      model: ad.model,
    }));

  // Filtrar avisos activos manuales (no premium, no scrapeados) de esta categoría
  const manualProducts: Product[] = activeAds
    .filter(ad => {
      const adCategory = ad.category;
      const isFeatured = ad.featured;
      const isApproved = ad.approval_status === 'approved';
      
      const matchesCategory = categoryMap[category]?.some(cat => 
        adCategory?.toLowerCase() === cat.toLowerCase()
      ) || adCategory?.toLowerCase() === category?.toLowerCase();
      
      // Debug: Mostrar por qué se filtra o no
      if (category === 'Maquinarias' && ad.title) {
        console.log(`[Manual] ${ad.title}: category="${adCategory}" approved="${isApproved}" featured="${isFeatured}" matches="${matchesCategory}"`);
      }
      
      // Solo avisos manuales aprobados que NO sean featured (los featured ya están en premiumProducts)
      return matchesCategory && isApproved && !isFeatured;
    })
    .map(ad => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      price: ad.price,
      currency: ad.currency,
      location: ad.location || 'Sin ubicación',
      province: ad.province,
      imageUrl: ad.images?.[0] || '',
      sourceUrl: ad.external_url || '',
      category: ad.category || category,
      subcategory: ad.subcategory,
      isSponsored: false,
      isPremium: false,
      featured: false,
      tags: ad.tags,
      createdAt: ad.created_at,
      user_id: ad.user_id,
      seller: ad.seller,
      brand: ad.brand,
      model: ad.model,
    }));

  // HOMEPAGE: Solo mostrar avisos manuales (premium + manuales), NO scrapeados
  // 1. Premium destacados (featured:true)
  // 2. Manuales aprobados (usuarios de la plataforma)
  // Los scrapeados se mostrarán solo en la página de resultados
  const allProducts = [...premiumProducts, ...manualProducts];

  // DEDUPLICAR por ID única para evitar duplicados
  const uniqueIds = new Set<string>();
  const duplicatesFound = new Map<string, string>();
  
  const categoryProducts = allProducts.filter(product => {
    if (uniqueIds.has(product.id)) {
      // Guardar duplicado sin mostrar warning inmediatamente
      if (!duplicatesFound.has(product.id)) {
        duplicatesFound.set(product.id, product.title);
      }
      return false;
    }
    uniqueIds.add(product.id);
    return true;
  });

  // Mostrar resumen de duplicados solo si hay alguno
  if (duplicatesFound.size > 0) {
    console.log(`📊 ${title}: ${categoryProducts.length} productos únicos (${duplicatesFound.size} duplicados removidos de ${allProducts.length} totales)`);
    // Solo mostrar en modo desarrollo si es necesario debuggear
    if (process.env.NODE_ENV === 'development') {
      duplicatesFound.forEach((title, id) => {
        console.debug(`   ↳ Duplicado: ${title}`);
      });
    }
  } else {
    console.log(`📊 ${title}: ${categoryProducts.length} productos únicos (de ${allProducts.length} totales)`);
    console.log(`   Premium: ${premiumProducts.length}, Manual: ${manualProducts.length}, Total activeAds: ${activeAds.length}, Total premiumAds: ${premiumAds.length}`);
  }

  // LIMITAR A 8 AVISOS MÁS RECIENTES (según requerimiento)
  const MAX_PRODUCTS = 8;
  const filledProducts = categoryProducts.slice(0, MAX_PRODUCTS);
  const hasMoreProducts = categoryProducts.length > MAX_PRODUCTS;

  // Homepage: Sin carrusel, mostrar grid de 4 columnas fijo
  // No necesitamos lógica de carrusel

  // Homepage: Mostrar todos los productos (máximo 8) sin carrusel
  const visibleProducts = filledProducts;

  // Mostrar loading skeleton mientras carga
  if (isLoading) {
    return (
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl p-8 bg-white">
            {/* Header skeleton */}
            <div className="flex items-center mb-6 w-full" style={{ minHeight: '72px' }}>
              <div className="flex flex-col items-start justify-center" style={{ width: '20%' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-4 w-20 bg-gray-200 rounded mt-2 animate-pulse" />
              </div>
              <div className="flex items-center justify-center px-2" style={{ width: '60%' }}>
                <div className="w-full bg-gray-200 rounded-lg animate-pulse" style={{ maxWidth: '900px', height: '100px' }} />
              </div>
              <div className="flex flex-col items-center justify-center" style={{ width: '20%' }}>
                <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
            {/* Cards skeleton con icono animado en el centro */}
            <div className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse">
                    <div className="w-full h-48 bg-gray-200 rounded-lg mb-3" />
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-6 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
              {/* Icono de carga animado en el centro */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg">
                  <Loader2 className="w-12 h-12 text-[#16a135] animate-spin" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // No mostrar carousel si no hay productos
  if (categoryProducts.length === 0) {
    // Durante la carga, no mostrar nada (el skeleton ya se mostró arriba)
    if (isLoading) {
      return null;
    }
    
    // Si la categoría es 'Inmuebles', mostrar mensaje especial con CTA
    if (category === 'Inmuebles') {
      return (
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {categoryIcon && (
                  <img 
                    src={`/images/${categoryIcon}`} 
                    alt={title} 
                    className="w-8 h-8 object-contain"
                  />
                )}
                <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
              </div>
            </div>
            
            <div 
              className="rounded-xl p-12 text-center border-2 border-dashed"
              style={{
                backgroundColor: colors.bg,
                borderColor: colors.primary
              }}
            >
              <div className="max-w-2xl mx-auto">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Inmuebles Rurales Disponibles
                </h3>
                <p className="text-gray-600 mb-6">
                  Busca campos, quintas, lotes y propiedades rurales desde portales inmobiliarios con nuestro buscador inteligente.
                </p>
                <button
                  onClick={() => {
                    const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
                    if (searchInput) {
                      searchInput.value = 'campos';
                      searchInput.focus();
                      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="px-6 py-3 rounded-lg font-semibold transition-colors"
                  style={{
                    backgroundColor: colors.primary,
                    color: 'white'
                  }}
                >
                  🔍 Buscar Inmuebles
                </button>
              </div>
            </div>
          </div>
        </section>
      );
    }
    
    // Para categorías vacías, mostrar skeleton de cards
    return (
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl p-4 md:p-8" style={{ backgroundColor: colors.bg }}>
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {title}
              </h2>
            </div>

            {/* Skeleton Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
                  {/* Image skeleton */}
                  <div className="w-full aspect-[4/3] bg-gray-200"></div>
                  
                  {/* Content skeleton */}
                  <div className="p-4 space-y-3">
                    {/* Title */}
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    
                    {/* Location */}
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    
                    {/* Description */}
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                    
                    {/* Price */}
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    
                    {/* Button */}
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Renderizar el carrusel principal si hay productos
  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-xl p-6 md:p-10">
          {/* MOBILE: Layout vertical optimizado */}
          {isMobile ? (
            <>
              {/* MOBILE: Grid de 2 columnas - Título | Banner */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {/* Columna 1: Título y botón */}
                <div className="flex flex-col justify-between">
                  <h2 className="text-lg font-bold text-gray-900 mb-2 tracking-tight">
                    {title}
                  </h2>
                  <button
                    className="px-4 py-2 rounded-xl font-bold text-white text-xs bg-gradient-to-r from-[#16a135] to-[#138a2c] hover:from-[#138a2c] hover:to-[#0f7023] transition-all shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-1.5 w-fit"
                    onClick={() => onViewMore?.(category)}
                  >
                    Ver más
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Columna 2: Banner */}
                <div>
                  <div 
                    id={`banner-${category.toLowerCase()}`}
                    className="relative w-full h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all" 
                    style={{ minHeight: '80px' }}
                  >
                    <div className="text-center">
                      <svg className="w-5 h-5 mx-auto mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-[10px] text-gray-500 font-medium">Publicidad</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* DESKTOP: Grid de 2 columnas - Título | Banner */}
              <div className="grid grid-cols-2 gap-10 mb-10">
                {/* Columna 1: Título */}
                <div className="flex items-center">
                  <div>
                    <h2 className="text-5xl font-black text-gray-900 tracking-tight leading-tight">
                      {title}
                    </h2>
                    <div className="h-1.5 w-24 bg-gradient-to-r from-[#16a135] to-[#0f7023] rounded-full mt-3"></div>
                  </div>
                </div>

                {/* Columna 2: Banner publicitario */}
                <div>
                  <div 
                    id={`banner-${category.toLowerCase()}`}
                    className="relative w-full h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center shadow-md hover:shadow-xl transition-all hover:scale-[1.02]" 
                    style={{ minHeight: '140px' }}
                  >
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-500 font-bold">Espacio Publicitario Disponible</p>
                      <p className="text-xs text-gray-400 mt-1">1140 x 140 px</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Grid de 4 columnas con cards mejorados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-8">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="featured"
                onViewDetail={onViewDetail}
              />
            ))}
          </div>



          {/* Subcategorías con contadores totales (manuales + scrapeados) */}
          {(() => {
            // Mapear variaciones de nombres de categorías a los nombres en SUBCATEGORIES
            const categoryKey = category === 'Maquinaria' ? 'Maquinarias' : category;
            return SUBCATEGORIES[categoryKey];
          })() && (
            <div className={`pt-8 mt-8 border-t-2 border-gray-200 ${isMobile ? 'px-2' : ''}`}>
              <div className={`flex flex-wrap gap-3 items-center ${isMobile ? 'justify-start' : 'justify-center'}`}>
                {(() => {
                  const categoryKey = category === 'Maquinaria' ? 'Maquinarias' : category;
                  return SUBCATEGORIES[categoryKey];
                })()?.map((subcategory, index) => {
                  // Contar TODOS los productos de esta subcategoría (premium + manuales)
                  // Esto incluye tanto los que se muestran en home como los que solo están en resultados
                  const allCategoryProducts = [...premiumProducts, ...manualProducts];
                  const count = allCategoryProducts.filter(p => 
                    p.subcategory?.toLowerCase() === subcategory.toLowerCase()
                  ).length;
                  
                  return (
                    <button
                      key={subcategory}
                      onClick={() => onViewMore?.(category, subcategory)}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all ${isMobile ? 'text-xs' : 'text-sm'} ${
                        count > 0 
                          ? 'bg-gradient-to-r from-[#16a135] to-[#138a2c] text-white hover:from-[#138a2c] hover:to-[#0f7023] shadow-md hover:shadow-lg transform hover:scale-105' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {subcategory} {count > 0 && <span className="ml-1 font-bold">({count})</span>}
                    </button>
                  );
                })}
                {(premiumProducts.length + manualProducts.length) > 0 && (
                  <button
                    onClick={() => onViewMore?.(category)}
                    className={`px-6 py-2 rounded-xl font-bold bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}
                  >
                    Ver todas
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideFromLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes slideFromRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideFromLeft {
          animation: slideFromLeft 0.4s ease-in-out;
        }
        .animate-slideFromRight {
          animation: slideFromRight 0.4s ease-in-out;
        }
      `}</style>
    </section>
  );
}
