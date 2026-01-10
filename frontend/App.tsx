import React, { useState, useCallback, useMemo } from "react";
import { useProducts } from "./src/hooks/useProducts";
import type { FilterOptions, SearchFilters, Banner } from "./types";
import { Header } from "./src/components/Header";
import { HeroWithCarousel } from "./src/components/HeroWithCarousel";
import { FilterSidebar } from "./src/components/FilterSidebar";
import { ProductCard } from "./src/components/ProductCard";
import { AdvancedSearchBar } from "./src/components/AdvancedSearchBar";
import { CategoryCarousel } from "./src/components/sections/CategoryCarousel";
import { smartSearch, getPremiumProducts } from "./src/services/smartSearch";
import { extractIdFromUrl } from "./src/utils/slugUtils";
import MyAdsPanel from "./src/components/admin/MyAdsPanel";
import { MessagesPanel } from "./src/components/dashboard/MessagesPanel";
import AllAdsPanel from "./src/components/admin/AllAdsPanel";
import { UsersPanel } from "./src/components/admin/UsersPanel";
import BannersCleanPanel from "./src/components/admin/BannersCleanPanel";
import { CategoriasAdmin } from "./src/components/admin/CategoriasAdmin";
import { AttributesAdmin } from "./src/components/admin/AttributesAdmin";
import { BackendSettings } from "./src/components/admin/BackendSettings";
import { AdDetailPage } from "./src/components/AdDetailPage";
import { ProfilePanel } from "./src/components/dashboard/ProfilePanel";
import { SubscriptionPanel } from "./src/components/dashboard/SubscriptionPanel";
import { ReceivedContactsView } from "./src/components/dashboard/ReceivedContactsView";
import { DashboardLayout } from "./src/components/layouts/DashboardLayout";
import { FeaturedAdsSection } from "./src/components/sections/FeaturedAdsSection";
import { BannersVipHero } from "./src/components/banners/BannersVipHero";
import { getPremiumAds, getActiveAds } from "./src/services/adsService";
import { getHomepageBanners } from "./src/services/bannersService";
// Banners integrados en componentes
import type { Ad } from "./types";
import { PROVINCES } from "./src/constants/locations";
import { ALL_CATEGORIES } from "./src/constants/categories";
import { SearchResultsPageMinimal } from "./src/components/SearchResultsPageMinimal";
import { HeroSearchBarClon } from "./src/components/HeroSearchBarClon";
import { RegisterBanner } from "./src/components/RegisterBanner";
import { HowItWorksSection } from "./src/components/sections/HowItWorksSection";
import { HowItWorksPage } from "./src/components/pages/HowItWorksPage";
import { EmailConfirmationPage } from "./src/components/auth/EmailConfirmationPage";
import AuthModal from "./src/components/auth/AuthModal";
import PublicarAviso from "./src/components/pages/PublicarAviso";
import { TestDynamicForm } from "./src/pages/TestDynamicForm";
import { PricingPage } from "./src/components/pages/PricingPage";
import { DesignSystemShowcase } from "./src/components/DesignSystemShowcase";
import { DesignSystemShowcaseSimple } from "./src/components/DesignSystemShowcaseSimple";
import { ExampleMigratedPage } from "./src/components/pages/ExampleMigratedPage";
import APITestPage from "./src/pages/APITest";

import { useAuth } from "./src/contexts/AuthContext";
import { CategoryProvider } from "./src/contexts/CategoryContext";
import { canAccessPage } from "./src/utils/rolePermissions";
import { useCategoryPrefetch } from "./src/hooks/useCategoryPrefetch";
import { useRealtimeCategories } from "./src/hooks/useRealtimeCategories";
import { OfflineBanner } from "./src/hooks/useOnlineStatus";
import { ToastProvider } from "./src/contexts/ToastContext";import { Footer } from "./src/components/Footer";import { useSiteSetting } from "./src/hooks/useSiteSetting";
import { DiagnosticsPage } from "./src/pages/DiagnosticsPage";

type Page = 'home' | 'my-ads' | 'inbox' | 'all-ads' | 'ad-detail' | 'profile' | 'subscription' | 'users' | 'banners' | 'settings' | 'contacts' | 'email-confirm' | 'how-it-works' | 'publicar-v2' | 'publicar-v3' | 'test-form' | 'categories-admin' | 'attributes-admin' | 'backend-settings' | 'pricing' | 'design-showcase' | 'example-migration' | 'api-test' | 'diagnostics';

/**
 * Componente principal de AgroBuscador
 */
const App: React.FC = () => {
  return (
    <ToastProvider>
      <CategoryProvider>
        <OfflineBanner />
        <AppContent />
      </CategoryProvider>
    </ToastProvider>
  );
};

const AppContent: React.FC = () => {
  // ⚡ Persistir página actual en localStorage para mantener estado al refrescar (F5)
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    // Intentar recuperar del hash primero
    const hash = window.location.hash;
    
    if (hash.startsWith('#/auth/confirm')) return 'email-confirm';
    if (hash === '#/how-it-works') return 'how-it-works';
    if (hash === '#/design-showcase') return 'design-showcase';
    if (hash === '#/example-migration') return 'example-migration';
    if (hash === '#/api-test') return 'api-test';
    if (hash === '#/diagnostics') return 'diagnostics';
    if (hash === '#/pricing' || hash === '#/planes') return 'pricing';
    if (hash === '#/test-form') return 'test-form';
    // Wizard de publicación
    if (hash === '#/publicar' || hash === '#/publicar-v3' || hash === '#/publicar-aviso' || 
        hash.startsWith('#/publicar-v3?') || hash.startsWith('#/publicar-aviso?') || 
        hash.startsWith('#/publicar?')) return 'publicar-v3';
    if (hash.startsWith('#/edit/')) return 'publicar-v3';
    if (hash.startsWith('#/ad/')) return 'ad-detail';
    if (hash === '#/dashboard/contacts') return 'contacts';

    if (hash === '#/my-ads') return 'my-ads';
    if (hash === '#/inbox') return 'inbox';
    if (hash === '#/pending-ads') return 'pending-ads';
    if (hash === '#/users') return 'users';
    if (hash === '#/banners') return 'banners';
    if (hash === '#/featured-ads') return 'featured-ads';
    if (hash === '#/categories-admin') return 'categories-admin';
    if (hash === '#/attributes-admin') return 'attributes-admin';
    if (hash === '#/backend-settings') return 'backend-settings';
    if (hash === '#/deleted-ads') return 'deleted-ads';
    if (hash === '#/profile') return 'profile';
    if (hash === '#/subscription') return 'subscription';
    
    // Si no hay hash específico o es #/ (home), ir a home y limpiar localStorage
    localStorage.removeItem('currentPage');
    return 'home';
  });
  
  const { products, isLoading, getFilterOptions, refetch } = useProducts();
  const { profile, loading: authLoading } = useAuth();
  
  // ⚡ Wrapper para setCurrentPage que persiste en localStorage
  const navigateToPage = useCallback((page: Page) => {
    console.log('🧭 Navegando a:', page);
    console.log('👤 Usuario actual:', profile?.email, 'Rol:', profile?.role);
    console.log('🔐 Puede acceder a categories-admin?', canAccessPage('categories-admin', profile?.role));
    setCurrentPage(page);
    
    // Guardar en localStorage para persistir al refrescar
    if (page !== 'home') {
      localStorage.setItem('currentPage', page);
    } else {
      localStorage.removeItem('currentPage');
    }
    
    // Actualizar hash para que la URL refleje la página actual
    const hashMap: Record<string, string> = {
      'my-ads': '#/my-ads',
      'inbox': '#/inbox',
      'all-ads': '#/all-ads',
      'users': '#/users',
      'banners': '#/banners',
      'categories-admin': '#/categories-admin',
      'attributes-admin': '#/attributes-admin',
      'backend-settings': '#/backend-settings',
      'profile': '#/profile',
      'subscription': '#/subscription',
      'contacts': '#/dashboard/contacts',
      'how-it-works': '#/how-it-works',
      'publicar-v3': '#/publicar-v3',
      'test-form': '#/test-form',
      'api-test': '#/api-test',
      'pricing': '#/pricing',
      'home': '#/'
    };
    
    // Solo actualizar hash si la página tiene uno asignado y no estamos ya en ese hash
    // IMPORTANTE: No reescribir si ya estamos en la página correcta (preservar query params)
    const currentHash = window.location.hash;
    const targetHash = hashMap[page];
    
    if (targetHash && !currentHash.startsWith(targetHash)) {
      window.history.replaceState(null, '', targetHash);
    }
  }, []);
  
  // ⚡ Prefetch inteligente de categorías populares
  useCategoryPrefetch({
    enabled: true,
    popularCategories: ['maquinarias', 'ganaderia'],
    delayMs: 2000 // Espera 2s para no bloquear carga inicial
  });
  
  // 🔄 Sincronización en tiempo real (opcional, no crítico)
  const { isConnected: realtimeConnected } = useRealtimeCategories(false); // Deshabilitado por defecto
  
  // Para habilitar Realtime, cambiar a: useRealtimeCategories(true)

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [searchResults, setSearchResults] = useState(products);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [premiumAds, setPremiumAds] = useState<Product[]>([]);
  const [activeAds, setActiveAds] = useState<Product[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [currentBanner, setCurrentBanner] = useState<Banner | null>(null);
  const [allBanners, setAllBanners] = useState<Banner[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
  const [adToEdit, setAdToEdit] = useState<Ad | undefined>(undefined);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register'>('login');

  // Hash-based routing
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      // Scroll to top cuando cambia la página
      window.scrollTo(0, 0);
      
      // Routing para confirmación de email
      if (hash.startsWith('#/auth/confirm')) {
        navigateToPage('email-confirm');
      }
      // Routing para "¿Cómo funciona?"
      else if (hash === '#/how-it-works') {
        navigateToPage('how-it-works');
      }
      // Routing para publicar aviso V3 (wizard con atributos dinámicos)
      else if (hash === '#/publicar-v3' || hash === '#/publicar-aviso' || 
               hash.startsWith('#/publicar-v3?') || hash.startsWith('#/publicar-aviso?') || 
               (hash === '#/publicar')) {
        console.log('📝 Navegando a PublicarAviso');
        navigateToPage('publicar-v3');
      }
      // Routing para publicar aviso V2 - Nuevo formulario mobile-first
      else if (hash === '#/publicar-v2' || hash.startsWith('#/publicar-v2?')) {
        navigateToPage('publicar-v2');
      }
      // Routing para editar aviso
      else if (hash.startsWith('#/edit/')) {
        const adId = hash.replace('#/edit/', '');
        console.log('✏️ Navegando a editar aviso:', adId);
        setSelectedAdId(adId);
        navigateToPage('publicar-v3');
      }
      // Routing para detalle de aviso: #/ad/:id o #/ad/:slug
      else if (hash.startsWith('#/ad/')) {
        const slugOrId = hash.replace('#/ad/', '');
        const adId = extractIdFromUrl(slugOrId); // Extrae ID desde slug o UUID
        console.log('🔍 Navegando a detalle de aviso:', { slugOrId, extractedId: adId });
        setSelectedAdId(adId);
        navigateToPage('ad-detail');
      } 
      // Routing para páginas de admin/dashboard
      else if (hash === '#/dashboard/contacts' || hash === '#/contacts') {
        navigateToPage('contacts');
      }
      else if (hash === '#/my-ads') {
        navigateToPage('my-ads');
      }
      else if (hash === '#/inbox') {
        navigateToPage('inbox');
      }
      else if (hash === '#/all-ads') {
        navigateToPage('all-ads');
      }
      else if (hash === '#/users') {
        navigateToPage('users');
      }
      else if (hash === '#/banners') {
        navigateToPage('banners');
      }
      else if (hash === '#/categories-admin') {
        navigateToPage('categories-admin');
      }
      else if (hash === '#/attributes-admin') {
        navigateToPage('attributes-admin');
      }
      else if (hash === '#/backend-settings') {
        navigateToPage('backend-settings');
      }
      else if (hash === '#/profile') {
        navigateToPage('profile');
      }
      else if (hash === '#/subscription') {
        navigateToPage('subscription');
      }
      // Routing para dashboard - redirigir a Mis Avisos
      else if (hash.startsWith('#/dashboard')) {
        window.location.hash = '#/my-ads';
        return;
      }
      // Si no hay hash, mantener la página actual (ya inicializada desde localStorage)
      // Solo navegar a home si explícitamente se navega a #/ o se limpia el hash manualmente
      else if (hash === '#/') {
        navigateToPage('home');
        setSelectedAdId(null);
      }
      // Si hash === '' (vacío), no hacer nada - mantener estado actual
    };

    // Handle initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []); // ✅ FIX: Removed products dependency to prevent infinite loop

  // Mobile detection
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cargar avisos premium y activos al montar
  React.useEffect(() => {
    const loadAds = async () => {
      const [premium, active] = await Promise.all([
        getPremiumAds(),
        getActiveAds()
      ]);
      setPremiumAds(premium);
      setActiveAds(active);
    };
    loadAds();
  }, []);

  // Cargar todos los banners para carousel en mobile
  React.useEffect(() => {
    if (!isMobile) return;

    const loadAllBanners = async () => {
      try {
        const banners = await getHomepageBanners(undefined);
        // Filtrar solo mobile si es necesario
        const mobileBanners = banners.filter(b => b.device_target === 'mobile' || b.device_target === 'both');
        setAllBanners(mobileBanners);
      } catch (error) {
        console.error('❌ Error loading banners for mobile carousel:', error);
      }
    };
    
    loadAllBanners();
  }, [isMobile]);

  // Listener para abrir modal de autenticación desde eventos personalizados
  React.useEffect(() => {
    const handleOpenAuthModal = (e: CustomEvent) => {
      const { view } = e.detail || {};
      if (view === 'login' || view === 'register') {
        setAuthModalView(view);
        setShowAuthModal(true);
      }
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal as EventListener);
    return () => window.removeEventListener('openAuthModal', handleOpenAuthModal as EventListener);
  }, []);

  // Control de visibilidad del botón scroll to top
  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Función para scroll al top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Búsqueda inteligente con filtros avanzados
  const handleAdvancedSearch = useCallback(
    (filters: SearchFilters) => {
      console.log('🔍 Búsqueda iniciada con filtros:', filters);
      setSearchFilters(filters);
      const filtered = smartSearch(products, filters);
      console.log('✅ Resultados encontrados:', filtered.length);
      setSearchResults(filtered);
      setIsSearching(true); // Cambiar a vista de resultados
      console.log('📄 isSearching activado');
      // Scroll al top cuando se va a resultados
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [products]
  );

  // Búsqueda simple (compatible con SearchBar antiguo)
  const handleSearch = useCallback(
    (query: string) => {
      handleAdvancedSearch({ query });
    },
    [handleAdvancedSearch]
  );

  const handleBackToHome = () => {
    setIsSearching(false);
    setSearchFilters({});
    setSearchResults(products);
    setActiveFilters({});
    setAdToEdit(undefined); // Limpiar aviso a editar
    setSelectedAdId(null); // Limpiar ID seleccionado
  };

  const filterOptions: FilterOptions = useMemo(() => getFilterOptions(), [getFilterOptions]);

  // Obtener productos premium
  const premiumProducts = useMemo(() => getPremiumProducts(products), [products]);

  // Usar TODAS las categorías y provincias disponibles (no solo las de productos existentes)
  const availableCategories = useMemo(() => ALL_CATEGORIES, []);
  const availableProvinces = useMemo(() => [...PROVINCES], []);
  const availableTags = useMemo(() => 
    [...new Set(products.flatMap(p => p.tags || []))],
    [products]
  );

  console.log('🎯 Estado actual - currentPage:', currentPage, 'isSearching:', isSearching);

  // Determinar si debe usar Dashboard Layout
  const isDashboardPage = ['profile', 'subscription', 'users', 'my-ads', 'inbox', 'all-ads', 'banners', 'settings', 'contacts', 'categories-admin', 'attributes-admin', 'backend-settings'].includes(currentPage);

  // Render con Dashboard Layout
  if (isDashboardPage) {
    // Verificar permisos para la página actual
    if (!canAccessPage(currentPage, profile?.role)) {
      // Redirigir a home si no tiene permisos
      setTimeout(() => {
        navigateToPage('home');
        window.location.hash = '#/';
      }, 0);
      
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página.</p>
            <button 
              onClick={() => {
                navigateToPage('home');
                window.location.hash = '#/';
              }}
              className="px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#0e7d25]"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="h-screen overflow-hidden">
        <DashboardLayout currentPage={currentPage} onNavigate={(page) => {
            navigateToPage(page);
            if (page === 'home') {
              handleBackToHome();
            }
          }}>
            {/* Mostrar loading mientras se carga el perfil para páginas protegidas */}
            {authLoading && (currentPage === 'categories-admin' || currentPage === 'users' || currentPage === 'all-ads') && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando perfil...</p>
                </div>
              </div>
            )}
            
            {/* Renderizar contenido cuando no está loading o la página no requiere auth */}
            {!authLoading && (
              <>
                {console.log('🎯 APP.TSX RENDER:', { currentPage, role: profile?.role, canAccess: canAccessPage('categories-admin', profile?.role) })}
                {currentPage === 'profile' && <ProfilePanel />}
                {currentPage === 'subscription' && <SubscriptionPanel />}
                {currentPage === 'contacts' && <ReceivedContactsView />}
                {currentPage === 'users' && canAccessPage('users', profile?.role) && <UsersPanel />}
                {currentPage === 'my-ads' && <MyAdsPanel />}
                {currentPage === 'inbox' && <MessagesPanel />}
                {currentPage === 'all-ads' && canAccessPage('all-ads', profile?.role) && <AllAdsPanel />}
                {currentPage === 'banners' && canAccessPage('banners', profile?.role) && <BannersCleanPanel />}
                {currentPage === 'categories-admin' && canAccessPage('categories-admin', profile?.role) && <CategoriasAdmin />}
                {currentPage === 'attributes-admin' && canAccessPage('attributes-admin', profile?.role) && <AttributesAdmin />}
                {currentPage === 'backend-settings' && canAccessPage('backend-settings', profile?.role) && <BackendSettings />}
                {currentPage === 'settings' && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-2xl font-bold mb-4">Configuración</h2>
                    <p className="text-gray-600">Panel de configuración en desarrollo...</p>
                  </div>
                )}
              </>
            )}
          </DashboardLayout>
        </div>
    );
  }

  // Página de confirmación de email
  if (currentPage === 'email-confirm') {
    return <EmailConfirmationPage />;
  }

  // Página de Design System Showcase
  if (currentPage === 'design-showcase') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header onNavigate={(page) => {
          navigateToPage(page);
          if (page === 'home') {
            handleBackToHome();
          }
        }} />
        <DesignSystemShowcaseSimple />
        <Footer />
      </div>
    );
  }

  // Página de Ejemplo de Migración
  if (currentPage === 'example-migration') {
    return (
      <ExampleMigratedPage 
        onNavigate={(page) => {
          navigateToPage(page);
          if (page === 'home') {
            handleBackToHome();
          }
        }} 
      />
    );
  }

  // Página de Planes/Pricing
  if (currentPage === 'pricing') {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header onNavigate={(page) => {
          navigateToPage(page);
          if (page === 'home') {
            handleBackToHome();
          }
        }} />
        <PricingPage />
        <Footer />
      </div>
    );
  }

  // Nuevo formulario de publicar/editar aviso (mobile-first)
  if (currentPage === 'publicar-v3') {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header onNavigate={(page) => {
          navigateToPage(page);
          if (page === 'home') {
            handleBackToHome();
          }
        }} />
        <PublicarAviso />
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          initialView={authModalView}
        />
      </div>
    );
  }

  // Página de prueba: Formulario Dinámico
  if (currentPage === 'test-form') {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header onNavigate={(page) => {
          navigateToPage(page);
          if (page === 'home') {
            handleBackToHome();
          }
        }} />
        <TestDynamicForm />
      </div>
    );
  }

  // Página "¿Cómo funciona?"
  if (currentPage === 'how-it-works') {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header onNavigate={(page) => {
          navigateToPage(page);
          if (page === 'home') {
            handleBackToHome();
          } else if (page === 'how-it-works') {
            window.location.hash = '#/how-it-works';
          }
        }} />
        <HowItWorksPage />
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode="signup"
        />
      </div>
    );
  }

  // Página de prueba de API
  if (currentPage === 'api-test') {
    return <APITestPage />;
  }

  // Página de diagnósticos de imágenes
  if (currentPage === 'diagnostics') {
    return <DiagnosticsPage />;
  }

  // Render normal para home, búsqueda y detalle
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header onNavigate={(page) => {
          navigateToPage(page);
          if (page === 'home') {
            handleBackToHome();
          } else if (page === 'how-it-works') {
            window.location.hash = '#/how-it-works';
          }
        }} />

      {currentPage === 'ad-detail' && selectedAdId ? (
        <AdDetailPage 
          adId={selectedAdId} 
          onBack={() => {
            window.location.hash = '#/';
          }}
          onSearch={handleAdvancedSearch}
        />
      ) : isSearching ? (
        // VISTA DE BÚSQUEDA - Página minimalista estilo Google
        <SearchResultsPageMinimal
          results={searchResults}
          searchQuery={searchFilters.query}
          onBack={handleBackToHome}
          onSearch={handleAdvancedSearch}
          filterOptions={filterOptions}
          onFilter={(filters) => {
            setActiveFilters(filters);
            const filtered = smartSearch(products, { ...searchFilters, ...filters });
            setSearchResults(filtered);
          }}
          onViewDetail={(adId) => {
            window.location.hash = `#/ad/${adId}`;
          }}
        />
      ) : (
        // VISTA DE INICIO
        <main className="flex-1">
          {/* Hero con buscador avanzado y botones de categorías */}
          <HeroWithCarousel>
            <HeroSearchBarClon 
              onSearch={handleAdvancedSearch} 
              onCategoryHover={setHoveredCategory}
              onBannerChange={setCurrentBanner}
            />
          </HeroWithCarousel>

          {/* Banner VIP Hero - DEBAJO de los botones negros */}
          <section className="relative -mt-16 z-20 px-4">
            <div className="max-w-7xl mx-auto">
              <BannersVipHero category={hoveredCategory || undefined} />
            </div>
          </section>

          {/* Sección Cómo Funciona */}
          <HowItWorksSection onRegisterClick={() => setShowAuthModal(true)} />

          {/* 🌟 Avisos Destacados por Categoría (Seleccionados por Superadmin) */}
          <FeaturedAdsSection
            onAdClick={(adId) => {
              setSelectedAdId(adId);
              setCurrentPage('ad-detail');
              window.location.hash = `#/ad/${adId}`;
            }}
            onCategoryClick={(categorySlug) => {
              handleAdvancedSearch({ categories: [categorySlug] });
            }}
            onSubcategoryClick={(catSlug, subSlug) => {
              handleAdvancedSearch({ 
                categories: [catSlug],
                subcategories: [subSlug]
              });
            }}
          />

          {/* Sistema de avisos destacados dinámico - ya integrado arriba con FeaturedAdsSection */}
        </main>
      )}

      {/* Botón flotante Scroll to Top */}
      {showScrollTop && currentPage === 'home' && !isSearching && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 bg-[#16a135] hover:bg-[#138a2e] text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 group"
          aria-label="Volver arriba"
        >
          <svg 
            className="w-6 h-6 group-hover:translate-y-[-2px] transition-transform" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Footer Principal Dinámico */}
      <Footer onCategoryClick={(category) => handleAdvancedSearch({ categories: [category] })} />

      {/* Modal de Autenticación Global */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        initialView={authModalView}
      />
    </div>
  );
};


export default App;