import React, { useState, useCallback, useMemo, Suspense, lazy, useEffect } from "react";

// ============================================================
// TYPES
// ============================================================
import type { FilterOptions, SearchFilters, Banner, Ad, Product } from "./types";

// ============================================================
// CORE COMPONENTS (Critical Path - No Lazy Loading)
// ============================================================
import {
  AppHeader,
  Footer,
  HeroWithCarousel,
  HeroCategoryButtons,
  SearchResultsPageMinimal,
  AdDetailPage,
  AuthModal,
  EmailConfirmationPage,
  DashboardLayout,
  FeaturedAdsSection,
  HowItWorksSection,
  BannersVipHero,
} from "./src/components";

// ============================================================
// HOOKS & CONTEXTS (Agrupados por barrel)
// ============================================================
import { useProducts, useCategoryPrefetch, useRealtimeCategories, OfflineBanner } from "./src/hooks";
import { useAuth, CategoryProvider, ToastProvider } from "./src/contexts";

// ============================================================
// SERVICES
// ============================================================
import { smartSearch, getPremiumProducts, getPremiumAds, getActiveAds, getHomepageBanners } from "./src/services";
import { getSettingNumber } from "./src/services/v2/globalSettingsService";

// ============================================================
// UTILS & CONSTANTS
// ============================================================
import { extractIdFromUrl, canAccessPage } from "./src/utils";
import { PROVINCES, ALL_CATEGORIES } from "./src/constants";

// ============================================================
// LAZY LOADED COMPONENTS (Code Splitting - Mejora LCP)
// Componentes pesados que no se necesitan en el render inicial
// ============================================================

// Admin Panel Components (solo para admins)
const MyAdsPanel = lazy(() => import("./src/components/admin/MyAdsPanel"));
const AdsManagementPanel = lazy(() => import("./src/components/admin/AdsManagementPanel"));
const BannersCleanPanel = lazy(() => import("./src/components/admin/BannersCleanPanel"));
const UsersPanel = lazy(() => import("./src/components/admin/UsersPanel").then(m => ({ default: m.UsersPanel })));
const CategoriasAdmin = lazy(() => import("./src/components/admin/CategoriasAdmin").then(m => ({ default: m.CategoriasAdmin })));
const AttributesAdmin = lazy(() => import("./src/components/admin/AttributesAdmin").then(m => ({ default: m.AttributesAdmin })));
const ContentTemplatesAdmin = lazy(() => import("./src/components/admin/ContentTemplatesAdmin").then(m => ({ default: m.ContentTemplatesAdmin })));
const BackendSettings = lazy(() => import("./src/components/admin/BackendSettings").then(m => ({ default: m.BackendSettings })));
const GlobalSettingsPanel = lazy(() => import("./src/components/admin/GlobalSettingsPanel"));
const PaymentsAdminPanel = lazy(() => import("./src/components/admin/PaymentsAdminPanel"));
const SitemapSeoPanel = lazy(() => import("./src/components/admin/SitemapSeoPanel"));

// Dashboard Components (solo para usuarios autenticados)
const MessagesPanel = lazy(() => import("./src/components/dashboard/MessagesPanel").then(m => ({ default: m.MessagesPanel })));
const ProfilePanel = lazy(() => import("./src/components/dashboard/ProfilePanel").then(m => ({ default: m.ProfilePanel })));
const SubscriptionPanel = lazy(() => import("./src/components/dashboard/SubscriptionPanel").then(m => ({ default: m.SubscriptionPanel })));
const ReceivedContactsView = lazy(() => import("./src/components/dashboard/ReceivedContactsView").then(m => ({ default: m.ReceivedContactsView })));

// Pages (rutas secundarias)
const HowItWorksPage = lazy(() => import("./src/components/pages/HowItWorksPage").then(m => ({ default: m.HowItWorksPage })));
const PricingPage = lazy(() => import("./src/components/pages/PricingPage").then(m => ({ default: m.PricingPage })));
const PublicarAviso = lazy(() => import("./src/components/pages/PublicarAviso"));
const ExampleMigratedPage = lazy(() => import("./src/components/pages/ExampleMigratedPage").then(m => ({ default: m.ExampleMigratedPage })));

// Dev/Test Pages (solo desarrollo)
const TestDynamicForm = lazy(() => import("./src/pages/TestDynamicForm").then(m => ({ default: m.TestDynamicForm })));
const APITestPage = lazy(() => import("./src/pages/APITest"));
const DiagnosticsPage = lazy(() => import("./src/pages/DiagnosticsPage").then(m => ({ default: m.DiagnosticsPage })));
const DesignSystemShowcaseSimple = lazy(() => import("./src/components/DesignSystemShowcaseSimple").then(m => ({ default: m.DesignSystemShowcaseSimple })));

// ============================================================
// LOADING FALLBACK COMPONENT
// ============================================================
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

type Page = 'home' | 'my-ads' | 'inbox' | 'all-ads' | 'ads-management' | 'ad-detail' | 'profile' | 'subscription' | 'users' | 'banners' | 'settings' | 'contacts' | 'email-confirm' | 'how-it-works' | 'publicar-v2' | 'publicar-v3' | 'test-form' | 'categories-admin' | 'attributes-admin' | 'templates-admin' | 'backend-settings' | 'global-settings' | 'featured-queue' | 'payments-admin' | 'sitemap-seo' | 'pricing' | 'design-showcase' | 'example-migration' | 'api-test' | 'diagnostics' | 'pending-ads' | 'deleted-ads' | 'publicar' | 'ad-finder' | 'featured-ads';

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
    if (hash === '#/ads-management') return 'ads-management';
    if (hash === '#/banners') return 'banners';
    if (hash === '#/featured-ads') return 'featured-ads';
    if (hash === '#/categories-admin') return 'categories-admin';
    if (hash === '#/attributes-admin') return 'attributes-admin';
    if (hash === '#/templates-admin') return 'templates-admin';
    if (hash === '#/backend-settings') return 'backend-settings';
    if (hash === '#/deleted-ads') return 'deleted-ads';
    if (hash === '#/dashboard/sitemap-seo') return 'sitemap-seo';
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
      'ads-management': '#/ads-management',
      'users': '#/users',
      'banners': '#/banners',
      'categories-admin': '#/categories-admin',
      'attributes-admin': '#/attributes-admin',
      'templates-admin': '#/templates-admin',
      'backend-settings': '#/backend-settings',
      'global-settings': '#/global-settings',
      'featured-queue': '#/featured-queue',
      'payments-admin': '#/payments-admin',
      'sitemap-seo': '#/dashboard/sitemap-seo',
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
  // Inicializar isSearching basado en el hash actual
  const [isSearching, setIsSearching] = useState(() => {
    return window.location.hash.startsWith('#/search');
  });
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
  
  // Estado global para el límite de avisos destacados en HomePage (desde Config Global)
  const [homepageFeaturedLimit, setHomepageFeaturedLimit] = useState<number | null>(null);

  // Hash-based routing
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      // Scroll to top cuando cambia la página
      window.scrollTo(0, 0);
      
      // Routing para búsqueda: #/search?cat=X&sub=Y&prov=Z
      if (hash.startsWith('#/search')) {
        console.log('🔍 Navegando a página de búsqueda:', hash);
        setIsSearching(true);
        navigateToPage('home'); // Mantener home como página base
        return;
      }
      
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
        // ✅ FIX: Pasar el slug completo para que getAdById pueda buscar por slug o UUID
        // extractIdFromUrl solo se usa para logging, no para la búsqueda
        console.log('🔍 Navegando a detalle de aviso:', { slugOrId });
        // ✅ FIX: Limpiar isSearching para que AdDetailPage tome prioridad en el render
        setIsSearching(false);
        setSelectedAdId(slugOrId); // Pasar slug completo, getAdById soporta slug, UUID y shortId
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
      else if (hash === '#/templates-admin') {
        navigateToPage('templates-admin');
      }
      else if (hash === '#/backend-settings') {
        navigateToPage('backend-settings');
      }
      else if (hash === '#/global-settings') {
        navigateToPage('global-settings');
      }
      else if (hash === '#/featured-queue') {
        navigateToPage('featured-queue');
      }
      else if (hash === '#/payments-admin') {
        navigateToPage('payments-admin');
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
      else if (hash === '#/' || hash === '' || hash === '#') {
        setIsSearching(false); // Salir de modo búsqueda
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

  // Cargar límite de avisos destacados desde configuración global
  useEffect(() => {
    getSettingNumber('homepage_featured_ads_limit', 12).then(setHomepageFeaturedLimit);
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

  // Búsqueda simple - Navegar a URL con query para que el backend resuelva
  const handleSearch = useCallback(
    (query: string) => {
      // Convertir query a slug para URL amigable
      const slug = query.trim().toLowerCase().replace(/\s+/g, '-');
      // Navegar a página de búsqueda con el query como parámetro
      window.location.hash = `#/search?q=${encodeURIComponent(query.trim())}`;
      // También activar estado de búsqueda para mostrar la página correcta
      setIsSearching(true);
      setSearchFilters({ query: query.trim() });
    },
    []
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
  const isDashboardPage = ['profile', 'subscription', 'users', 'my-ads', 'inbox', 'ads-management', 'banners', 'settings', 'contacts', 'categories-admin', 'attributes-admin', 'templates-admin', 'backend-settings', 'global-settings', 'payments-admin', 'sitemap-seo'].includes(currentPage);

  // Render con Dashboard Layout
  if (isDashboardPage) {
    // Esperar a que cargue el perfil antes de verificar permisos en páginas protegidas
    const isProtectedPage = ['users', 'ads-management', 'banners', 'categories-admin', 'attributes-admin', 'templates-admin', 'backend-settings', 'global-settings', 'payments-admin', 'sitemap-seo'].includes(currentPage);
    
    if (authLoading && isProtectedPage) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando perfil...</p>
          </div>
        </div>
      );
    }
    
    // Verificar permisos para la página actual (solo después de que cargue el perfil)
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
            {/* Renderizar contenido */}
            {!authLoading && (
              <Suspense fallback={<LoadingFallback />}>
                {currentPage === 'profile' && <ProfilePanel />}
                {currentPage === 'subscription' && <SubscriptionPanel />}
                {currentPage === 'contacts' && <ReceivedContactsView />}
                {currentPage === 'users' && canAccessPage('users', profile?.role) && <UsersPanel />}
                {currentPage === 'my-ads' && <MyAdsPanel />}
                {currentPage === 'inbox' && <MessagesPanel />}
                {currentPage === 'ads-management' && canAccessPage('ads-management', profile?.role) && <AdsManagementPanel />}
                {currentPage === 'banners' && canAccessPage('banners', profile?.role) && <BannersCleanPanel />}
                {currentPage === 'categories-admin' && canAccessPage('categories-admin', profile?.role) && <CategoriasAdmin />}
                {currentPage === 'attributes-admin' && canAccessPage('attributes-admin', profile?.role) && <AttributesAdmin />}
                {currentPage === 'templates-admin' && canAccessPage('templates-admin', profile?.role) && <ContentTemplatesAdmin />}
                {currentPage === 'backend-settings' && canAccessPage('backend-settings', profile?.role) && <BackendSettings />}
                {currentPage === 'global-settings' && canAccessPage('global-settings', profile?.role) && <GlobalSettingsPanel />}
                {currentPage === 'payments-admin' && canAccessPage('payments-admin', profile?.role) && <PaymentsAdminPanel />}
                {currentPage === 'sitemap-seo' && canAccessPage('sitemap-seo', profile?.role) && <SitemapSeoPanel />}
                {currentPage === 'settings' && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-2xl font-bold mb-4">Configuración</h2>
                    <p className="text-gray-600">Panel de configuración en desarrollo...</p>
                  </div>
                )}
              </Suspense>
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
        <AppHeader 
          onNavigate={(page) => {
            navigateToPage(page);
            if (page === 'home') {
              handleBackToHome();
            }
          }}
          onSearch={handleSearch}
        />
        <Suspense fallback={<LoadingFallback />}>
          <DesignSystemShowcaseSimple />
        </Suspense>
        <Footer />
      </div>
    );
  }

  // Página de Ejemplo de Migración
  if (currentPage === 'example-migration') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ExampleMigratedPage 
          onNavigate={(page) => {
            navigateToPage(page);
            if (page === 'home') {
              handleBackToHome();
            }
          }} 
        />
      </Suspense>
    );
  }

  // Página de Planes/Pricing
  if (currentPage === 'pricing') {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <AppHeader 
          onNavigate={(page) => {
            navigateToPage(page);
            if (page === 'home') {
              handleBackToHome();
            }
          }}
          onSearch={handleSearch}
        />
        <Suspense fallback={<LoadingFallback />}>
          <PricingPage />
        </Suspense>
        <Footer />
      </div>
    );
  }

  // Nuevo formulario de publicar/editar aviso (mobile-first)
  if (currentPage === 'publicar-v3') {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <AppHeader 
          onNavigate={(page) => {
            navigateToPage(page);
            if (page === 'home') {
              handleBackToHome();
            }
          }}
          onSearch={handleSearch}
        />
        <Suspense fallback={<LoadingFallback />}>
          <PublicarAviso />
        </Suspense>
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
        <AppHeader 
          onNavigate={(page) => {
            navigateToPage(page);
            if (page === 'home') {
              handleBackToHome();
            }
          }}
          onSearch={handleSearch}
        />
        <Suspense fallback={<LoadingFallback />}>
          <TestDynamicForm />
        </Suspense>
      </div>
    );
  }

  // Página "¿Cómo funciona?"
  if (currentPage === 'how-it-works') {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <AppHeader 
          onNavigate={(page) => {
            navigateToPage(page);
            if (page === 'home') {
              handleBackToHome();
            } else if (page === 'how-it-works') {
              window.location.hash = '#/how-it-works';
            }
          }}
          onSearch={handleSearch}
        />
        <Suspense fallback={<LoadingFallback />}>
          <HowItWorksPage />
        </Suspense>
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialView="register"
        />
      </div>
    );
  }

  // Página de prueba de API
  if (currentPage === 'api-test') {
    return <Suspense fallback={<LoadingFallback />}><APITestPage /></Suspense>;
  }

  // Página de diagnósticos de imágenes
  if (currentPage === 'diagnostics') {
    return <Suspense fallback={<LoadingFallback />}><DiagnosticsPage /></Suspense>;
  }

  // Render normal para home, búsqueda y detalle
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <AppHeader 
        onNavigate={(page) => {
          navigateToPage(page);
          if (page === 'home') {
            handleBackToHome();
          } else if (page === 'how-it-works') {
            window.location.hash = '#/how-it-works';
          }
        }}
        onSearch={handleSearch}
      />

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
          categorySlug={searchFilters.categories?.[0]?.toLowerCase().replace(/\s+/g, '-')}
          subcategorySlug={searchFilters.subcategories?.[0]?.toLowerCase().replace(/\s+/g, '-')}
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
          {/* Hero con botones de categorías */}
          <HeroWithCarousel>
            <HeroCategoryButtons 
              onSearch={handleAdvancedSearch} 
              onCategoryHover={setHoveredCategory}
              onBannerChange={setCurrentBanner}
            />
          </HeroWithCarousel>

          {/* Banner VIP Hero - DEBAJO de los botones negros */}
          <section className="relative -mt-16 z-20 px-4">
            <div className="max-w-[1400px] mx-auto">
              <BannersVipHero category={hoveredCategory || undefined} />
            </div>
          </section>

          {/* Sección Cómo Funciona */}
          <HowItWorksSection onRegisterClick={() => setShowAuthModal(true)} />

          {/* 🌟 Avisos Destacados por Categoría (Seleccionados por Superadmin) */}
          {/* Setting dinámico para cantidad de avisos destacados */}
          {/** UX: loading skeleton si el setting no está listo **/}
          {typeof homepageFeaturedLimit === 'number' ? (
            <FeaturedAdsSection
              onAdClick={(adId) => {
                setSelectedAdId(adId);
                setCurrentPage('ad-detail');
                window.location.hash = `#/ad/${adId}`;
              }}
              onCategoryClick={(categorySlug) => {
                window.location.hash = `#/search?cat=${categorySlug}`;
              }}
              onSubcategoryClick={(catSlug, subSlug) => {
                window.location.hash = `#/search?cat=${catSlug}&sub=${subSlug}`;
              }}
              maxAdsPerCategory={homepageFeaturedLimit}
            />
          ) : (
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
