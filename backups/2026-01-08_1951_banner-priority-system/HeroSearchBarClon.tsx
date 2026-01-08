import React, { useState, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { ALL_CATEGORIES } from '../constants/categories';
import { PROVINCES } from '../constants/locations';
import type { SearchFilters, Product, Banner } from '../../types';
import { useProducts } from '../hooks/useProducts';
import { getHomepageSearchBanners } from '../services/bannersService';

const CATEGORY_ICONS: Record<string, string> = {
  'Maquinarias': 'icon-1.png',
  'Ganadería': 'icon-2.png',
  'Insumos Agropecuarios': 'icon-3.png',
  'Inmuebles Rurales': 'icon-4.png',
  'Guía del Campo': 'icon-6.png',
};

// Keywords populares por categoría
const POPULAR_KEYWORDS: Record<string, string[]> = {
  'Maquinarias': ['tractor', 'cosechadora', 'sembradora', 'pulverizadora', 'rastra', 'arado'],
  'Ganadería': ['vaca', 'toro', 'vaquillona', 'ternero', 'oveja', 'caballo', 'hacienda'],
  'Insumos Agropecuarios': ['semilla', 'fertilizante', 'herbicida', 'glifosato', 'soja', 'maíz'],
  'Inmuebles Rurales': ['campo', 'hectáreas', 'establecimiento', 'chacra', 'finca'],
  'Guía del Campo': ['herramienta', 'repuesto', 'implemento', 'accesorio']
};

interface HeroSearchBarClonProps {
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

export const HeroSearchBarClon: React.FC<HeroSearchBarClonProps> = ({ 
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
  const { products } = useProducts();

  const loadBannerForCategory = async (category: string) => {
    if (categoryBanners[category]) {
      const banner = categoryBanners[category][0];
      if (onBannerChange) {
        onBannerChange(banner || null);
      }
      return;
    }

    try {
      const banners = await getHomepageSearchBanners(category, 'desktop');
      setCategoryBanners(prev => ({ ...prev, [category]: banners }));
      
      if (onBannerChange) {
        if (banners.length > 0) {
          onBannerChange(banners[0]);
        } else {
          onBannerChange(null);
        }
      }
    } catch (error) {
      console.error('Error cargando banner:', error);
      if (onBannerChange) {
        onBannerChange(null);
      }
    }
  };

  const handleCategoryHover = (category: string | null) => {
    // Solo actualizar cuando hay una categoría (hover in), ignorar hover out
    if (category) {
      setHoveredCategory(category);
      if (onCategoryHover) {
        onCategoryHover(category);
      }
      loadBannerForCategory(category);
    }
  };

  // Cargar banner prioritario al montar (sin categoría específica)
  useEffect(() => {
    const loadInitialBanner = async () => {
      try {
        // Detectar si es mobile o desktop
        const isMobile = window.innerWidth < 768;
        const deviceTarget = isMobile ? 'mobile' : 'desktop';
        
        // Cargar banner sin filtro de categoría para obtener el prioritario
        const banners = await getHomepageSearchBanners(undefined, deviceTarget);
        
        if (banners.length > 0 && onBannerChange) {
          console.log('🎯 Banner inicial cargado:', banners[0].title);
          onBannerChange(banners[0]);
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

  return (
    <div className="w-full max-w-3xl mx-auto mt-8">
      {/* Botones de categorías rápidas - Solo en homepage */}
      {showCategoryButtons && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { name: 'Maquinarias', displayName: 'Maquinarias', icon: 'icon-1.png', id: 'maquinaria' },
            { name: 'Ganadería', displayName: 'Ganadería', icon: 'icon-2.png', id: 'ganaderia' },
            { name: 'Insumos Agropecuarios', displayName: 'Insumos Agropecuarios', icon: 'icon-3.png', id: 'insumos' },
            { name: 'Inmuebles Rurales', displayName: 'Inmuebles Rurales', icon: 'icon-4.png', id: 'inmuebles' },
            { name: 'Guía del Campo', displayName: 'Guía del Campo', icon: 'icon-6.png', id: 'equipos' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                // Scroll suave al carrusel de la categoría
                const element = document.getElementById(cat.id);
                if (element) {
                  const yOffset = -80; // Offset para el header sticky
                  const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }}
              onMouseEnter={() => handleCategoryHover(cat.name)}
              onMouseLeave={() => handleCategoryHover(null)}
              className="rounded-[8px] p-3 transition-all duration-300 hover:scale-105 shadow-lg flex flex-col items-center gap-2 aspect-square justify-center relative overflow-hidden group bg-black hover:bg-[#16a135] border-2 border-black hover:border-green-600 cursor-pointer"
            >
              {/* Efecto de brillo en hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              
              <img 
                src={`/images/icons/${cat.icon}`} 
                alt={cat.displayName}
                className="w-12 h-12 object-contain relative z-10"
              />
              <span className="text-white text-sm font-bold text-center relative z-10 drop-shadow-lg">{cat.displayName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
