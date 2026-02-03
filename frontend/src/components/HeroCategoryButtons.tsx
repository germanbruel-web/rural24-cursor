import React, { useState, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { ALL_CATEGORIES } from '../constants/categories';
import { PROVINCES } from '../constants/locations';
import type { SearchFilters, Product, Banner } from '../../types';
import { useProducts } from '../hooks/useProducts';
import { getHomepageBanners } from '../services/bannersService';
import { getCategories, getCategoryIcons, type CategoryIcon } from '../services/categoriesService';

// Mapeo de iconos por slug de categoría (FALLBACK si no hay en BD)
const CATEGORY_ICON_MAP: Record<string, string> = {
  'maquinarias-agricolas': '/images/icons/icon-1.png',
  'ganaderia': '/images/icons/icon-2.png',
  'insumos-agropecuarios': '/images/icons/icon-3.png',
  'inmuebles-rurales': '/images/icons/icon-4.png',
  'servicios-rurales': '/images/icons/icon-6.png',
};

// Keywords populares por categoría (para sugerencias de búsqueda)
const POPULAR_KEYWORDS: Record<string, string[]> = {
  'Maquinarias': ['tractor', 'cosechadora', 'sembradora', 'pulverizadora', 'rastra', 'arado'],
  'Maquinarias Agrícolas': ['tractor', 'cosechadora', 'sembradora', 'pulverizadora', 'rastra', 'arado'],
  'Ganadería': ['vaca', 'toro', 'vaquillona', 'ternero', 'oveja', 'caballo', 'hacienda'],
  'Insumos Agropecuarios': ['semilla', 'fertilizante', 'herbicida', 'glifosato', 'soja', 'maíz'],
  'Inmuebles Rurales': ['campo', 'hectáreas', 'establecimiento', 'chacra', 'finca'],
  'Servicios Rurales': ['veterinario', 'transporte', 'alambrador', 'servicio', 'profesional'],
  'Guía del Campo': ['herramienta', 'repuesto', 'implemento', 'accesorio'] // Fallback
};

interface HeroCategoryButtonsProps {
  onSearch: (filters: SearchFilters) => void;
  showCategoryButtons?: boolean;
  onCategoryHover?: (category: string | null) => void;
  onBannerChange?: (banner: Banner | null) => void;
}

interface Suggestion {
  text: string;
  type: 'category' | 'keyword' | 'product' | 'province' | 'locality';
  category?: string;
  icon?: string;
}

// Tipo para categoría de BD
interface CategoryFromDB {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  icon?: string;
  sort_order?: number;
}

export const HeroCategoryButtons: React.FC<HeroCategoryButtonsProps> = ({ 
  onSearch, 
  showCategoryButtons = true, 
  onCategoryHover, 
  onBannerChange 
}) => {
  const [query, setQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [showQuerySuggestions, setShowQuerySuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [selectedQueryIndex, setSelectedQueryIndex] = useState(-1);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(-1);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [categoryBanners, setCategoryBanners] = useState<Record<string, Banner[]>>({});
  const [categories, setCategories] = useState<CategoryFromDB[]>([]);
  const [categoryIcons, setCategoryIcons] = useState<CategoryIcon[]>([]);
  const [allBanners, setAllBanners] = useState<Banner[]>([]); // Todos los banners para random
  const [defaultBanner, setDefaultBanner] = useState<Banner | null>(null); // Banner random inicial
  const { products } = useProducts();

  // Cargar categorías e iconos desde BD al montar
  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, icons] = await Promise.all([
          getCategories(),
          getCategoryIcons()
        ]);
        setCategories(cats || []);
        setCategoryIcons(icons || []);
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };
    loadData();
  }, []);

  const loadBannerForCategory = async (category: string) => {
    // Si ya tenemos banners cacheados para esta categoría
    if (categoryBanners[category] && categoryBanners[category].length > 0) {
      const banner = categoryBanners[category][0];
      if (onBannerChange) {
        onBannerChange(banner);
      }
      return;
    }

    try {
      const banners = await getHomepageBanners(category);
      setCategoryBanners(prev => ({ ...prev, [category]: banners }));
      
      if (onBannerChange) {
        if (banners.length > 0) {
          onBannerChange(banners[0]);
        } else {
          // Si no hay banner para esta categoría, mantener el default
          if (defaultBanner) {
            onBannerChange(defaultBanner);
          }
        }
      }
    } catch (error) {
      console.error('Error cargando banner:', error);
      // En error, mantener el banner default
      if (onBannerChange && defaultBanner) {
        onBannerChange(defaultBanner);
      }
    }
  };

  const handleCategoryHover = (category: string | null) => {
    // Solo actuar cuando hay una categoría (hover in)
    // El banner se mantiene "sticky" hasta que el usuario haga hover en otra categoría
    if (category) {
      setHoveredCategory(category);
      if (onCategoryHover) {
        onCategoryHover(category);
      }
      loadBannerForCategory(category);
    }
    // Ya no reseteamos al hacer hover out - el banner permanece en la última categoría
  };

  // Cargar TODOS los banners y seleccionar uno random al montar
  useEffect(() => {
    const loadInitialBanner = async () => {
      try {
        // Cargar TODOS los banners VIP (sin filtro de categoría)
        const banners = await getHomepageBanners(undefined);
        
        if (banners.length > 0) {
          setAllBanners(banners);
          
          // Seleccionar uno random como default
          const randomIndex = Math.floor(Math.random() * banners.length);
          const randomBanner = banners[randomIndex];
          
          setDefaultBanner(randomBanner);
          
          if (onBannerChange) {
            console.log('🎲 Banner random inicial:', randomBanner.title);
            onBannerChange(randomBanner);
          }
        }
      } catch (error) {
        console.error('Error cargando banner inicial:', error);
      }
    };

    loadInitialBanner();
  }, []); // Solo al montar

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-dropdown')) {
        setShowQuerySuggestions(false);
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obtener sugerencias inteligentes para el campo "¿Qué buscás?"
  const getQuerySuggestions = (): Suggestion[] => {
    if (!query.trim()) return [];
    
    const queryLower = query.toLowerCase();
    const suggestions: Suggestion[] = [];

    // 1. Buscar en categorías
    ALL_CATEGORIES.forEach(cat => {
      if (cat.toLowerCase().includes(queryLower)) {
        suggestions.push({ 
          text: cat, 
          type: 'category',
          icon: CATEGORY_ICONS[cat]
        });
      }
    });

    // 2. Buscar en keywords populares
    Object.entries(POPULAR_KEYWORDS).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (keyword.toLowerCase().includes(queryLower)) {
          suggestions.push({ 
            text: keyword, 
            type: 'keyword',
            category
          });
        }
      });
    });

    // 3. Buscar en títulos de productos premium
    const premiumProducts = products.filter(p => p.isPremium || p.isSponsored);
    premiumProducts.forEach(product => {
      if (product.title.toLowerCase().includes(queryLower)) {
        suggestions.push({ 
          text: product.title, 
          type: 'product',
          category: product.category
        });
      }
    });

    // 4. Buscar en títulos de productos scrapeados
    const scrapedProducts = products.filter(p => !p.isPremium && !p.isSponsored);
    scrapedProducts.slice(0, 10).forEach(product => {
      if (product.title.toLowerCase().includes(queryLower)) {
        suggestions.push({ 
          text: product.title, 
          type: 'product',
          category: product.category
        });
      }
    });

    // Eliminar duplicados y limitar a 8
    const uniqueSuggestions = suggestions.filter((item, index, self) =>
      index === self.findIndex((t) => t.text === item.text)
    );

    return uniqueSuggestions.slice(0, 8);
  };

  // Obtener sugerencias para el campo "¿Dónde?"
  const getLocationSuggestions = (): Suggestion[] => {
    if (!locationQuery.trim()) return [];
    
    const queryLower = locationQuery.toLowerCase();
    const suggestions: Suggestion[] = [];

    // 1. Buscar en provincias
    PROVINCES.forEach(prov => {
      if (prov.toLowerCase().startsWith(queryLower)) {
        suggestions.push({ 
          text: prov, 
          type: 'province'
        });
      }
    });

    // 2. Buscar en localidades de productos (solo si hay provincias que coinciden)
    const locations = [...new Set(products.map(p => p.location).filter(Boolean))];
    locations.forEach(loc => {
      if (loc && loc.toLowerCase().includes(queryLower)) {
        suggestions.push({ 
          text: loc, 
          type: 'locality'
        });
      }
    });

    // Eliminar duplicados y limitar a 8
    const uniqueSuggestions = suggestions.filter((item, index, self) =>
      index === self.findIndex((t) => t.text === item.text)
    );

    return uniqueSuggestions.slice(0, 8);
  };

  const handleSearchClick = () => {
    if (!query.trim()) return;

    const filters: SearchFilters = {
      query: query.trim(),
    };

    if (locationQuery.trim()) {
      filters.province = locationQuery.trim();
    }

    onSearch(filters);
    setShowQuerySuggestions(false);
    setShowLocationSuggestions(false);
  };

  const handleQueryKeyPress = (e: React.KeyboardEvent) => {
    const suggestions = getQuerySuggestions();
    
    if (e.key === 'Enter') {
      if (selectedQueryIndex >= 0 && suggestions[selectedQueryIndex]) {
        setQuery(suggestions[selectedQueryIndex].text);
        setShowQuerySuggestions(false);
        setSelectedQueryIndex(-1);
      } else {
        handleSearchClick();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedQueryIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedQueryIndex(prev => 
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Escape') {
      setShowQuerySuggestions(false);
      setSelectedQueryIndex(-1);
    }
  };

  const handleLocationKeyPress = (e: React.KeyboardEvent) => {
    const suggestions = getLocationSuggestions();
    
    if (e.key === 'Enter') {
      if (selectedLocationIndex >= 0 && suggestions[selectedLocationIndex]) {
        setLocationQuery(suggestions[selectedLocationIndex].text);
        setShowLocationSuggestions(false);
        setSelectedLocationIndex(-1);
      } else {
        handleSearchClick();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedLocationIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedLocationIndex(prev => 
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Escape') {
      setShowLocationSuggestions(false);
      setSelectedLocationIndex(-1);
    }
  };

  const querySuggestions = getQuerySuggestions();
  const locationSuggestions = getLocationSuggestions();

  // Detectar mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handler para navegar a la categoría
  const handleCategoryClick = (slug: string) => {
    const element = document.getElementById(slug);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-8">
      {/* Botones de categorías - Layout diferente Mobile vs Desktop */}
      {showCategoryButtons && categories.length > 0 && (
        <>
          {/* ========== MOBILE: Lista vertical con botones rectangulares ========== */}
          <div className="md:hidden flex flex-col gap-2">
            {categories.map((cat) => {
              const slug = cat.slug || cat.name.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
              
              const categoryName = cat.display_name || cat.name;
              const iconFromDB = categoryIcons.find(icon => 
                icon.name.toLowerCase() === categoryName.toLowerCase() ||
                icon.name.toLowerCase().includes(categoryName.toLowerCase().split(' ')[0])
              );
              
              const iconUrl = iconFromDB?.url_light 
                || (cat.icon ? `/images/icons/${cat.icon}` : null)
                || CATEGORY_ICON_MAP[slug] 
                || '/images/icons/icon-1.png';
              
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(slug)}
                  className="flex items-center gap-3 w-full px-4 py-3 bg-black hover:bg-[#16a135] rounded transition-colors duration-200 active:scale-[0.98]"
                >
                  <img 
                    src={iconUrl} 
                    alt={categoryName}
                    className="w-8 h-8 object-contain flex-shrink-0"
                  />
                  <span className="text-white text-sm font-semibold text-left flex-1">
                    {categoryName}
                  </span>
                  <svg 
                    className="w-4 h-4 text-white/60" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>

          {/* ========== DESKTOP: Grid cuadrado con hover ========== */}
          <div className="hidden md:grid grid-cols-5 gap-3">
            {categories.map((cat) => {
              const slug = cat.slug || cat.name.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
              
              const categoryName = cat.display_name || cat.name;
              const iconFromDB = categoryIcons.find(icon => 
                icon.name.toLowerCase() === categoryName.toLowerCase() ||
                icon.name.toLowerCase().includes(categoryName.toLowerCase().split(' ')[0])
              );
              
              const iconUrl = iconFromDB?.url_light 
                || (cat.icon ? `/images/icons/${cat.icon}` : null)
                || CATEGORY_ICON_MAP[slug] 
                || '/images/icons/icon-1.png';
              
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(slug)}
                  onMouseEnter={() => handleCategoryHover(categoryName)}
                  className="rounded-[8px] p-3 transition-all duration-300 hover:scale-105 shadow-lg flex flex-col items-center gap-2 aspect-square justify-center relative overflow-hidden group bg-black hover:bg-[#16a135] border-2 border-black hover:border-green-600 cursor-pointer"
                >
                  {/* Efecto de brillo en hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                  
                  <img 
                    src={iconUrl} 
                    alt={categoryName}
                    className="w-12 h-12 object-contain relative z-10"
                  />
                  <span className="text-white text-sm font-bold text-center relative z-10 drop-shadow-lg">
                    {categoryName}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
