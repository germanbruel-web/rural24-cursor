import React, { useState, useCallback, useMemo, Suspense, lazy, useEffect } from "react";
import { HelmetProvider } from 'react-helmet-async';

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
  AuthModal,
  EmailConfirmationPage,
  OAuthCallbackPage,
  DashboardLayout,
} from "./src/components";
import { BottomNav } from "./src/components/BottomNav";

// ============================================================
// HOOKS & CONTEXTS (Agrupados por barrel)
// ============================================================
import { useProducts, useCategoryPrefetch, useRealtimeCategories, OfflineBanner } from "./src/hooks";
import { PWAInstallBanner } from "./src/components/PWAInstallBanner";
import { useAuth, CategoryProvider, ToastProvider, AccountProvider } from "./src/contexts";
import { useProfileNudge } from './src/hooks/useProfileNudge';

// ============================================================
// SERVICES
// ============================================================
import { smartSearch, getPremiumProducts } from "./src/services";
import { getHeroVIPBanners } from "./src/services/bannersCleanService";
import { getSettingNumber } from "./src/services/v2/globalSettingsService";

// ============================================================
// UTILS & CONSTANTS
// ============================================================
import { extractIdFromUrl, canAccessPage } from "./src/utils";
import { PROVINCES, ALL_CATEGORIES } from "./src/constants";
import { navigateTo } from './src/hooks/useNavigate';

// ============================================================
// LAZY LOADED COMPONENTS (Code Splitting - Mejora LCP)
// Componentes pesados que no se necesitan en el render inicial
// ============================================================

// Main Pages (NUEVO - Route-based code splitting)
const HomePage = lazy(() => import("./src/pages/HomePage"));
const SearchPage = lazy(() => import("./src/pages/SearchPage"));
const AdDetailPageLazy = lazy(() => import("./src/pages/AdDetailPage"));

// Admin Panel Components (solo para admins)
const MyAdsPanel = lazy(() => import("./src/components/admin/MyAdsPanel"));
const CouponsAdminPanel = lazy(() => import("./src/components/admin/CouponsAdminPanel"));
const BannersCleanPanel = lazy(() => import("./src/components/admin/BannersCleanPanel"));
const UsersPanel = lazy(() => import("./src/components/admin/UsersPanel").then(m => ({ default: m.UsersPanel })));
const TaxonomiaAdmin = lazy(() => import("./src/components/admin/TaxonomiaAdmin").then(m => ({ default: m.TaxonomiaAdmin })));
const AttributesAdmin = lazy(() => import("./src/components/admin/AttributesAdmin").then(m => ({ default: m.AttributesAdmin })));
const OptionListsAdmin = lazy(() => import("./src/components/admin/OptionListsTab").then(m => ({ default: m.OptionListsTab })));
const TemplatesAdmin = lazy(() => import("./src/components/admin/TemplatesAdmin").then(m => ({ default: m.TemplatesAdmin })));
const BackendSettings = lazy(() => import("./src/components/admin/BackendSettings").then(m => ({ default: m.BackendSettings })));
const GlobalSettingsPanel = lazy(() => import("./src/components/admin/GlobalSettingsPanel"));
const PaymentsAdminPanel = lazy(() => import("./src/components/admin/PaymentsAdminPanel"));
const SitemapSeoPanel = lazy(() => import("./src/components/admin/SitemapSeoPanel"));
const SuperAdminCreditsConfig = lazy(() => import("./src/components/admin/SuperAdminCreditsConfig").then(m => ({ default: m.SuperAdminCreditsConfig })));
const HeroCmsPanel = lazy(() => import("./src/components/admin/HeroCmsPanel"));

// Dashboard Components (solo para usuarios autenticados)
const MessagesPanel = lazy(() => import("./src/components/dashboard/MessagesPanel").then(m => ({ default: m.MessagesPanel })));
const ProfilePanel = lazy(() => import("./src/components/dashboard/ProfilePanel").then(m => ({ default: m.ProfilePanel })));
const SubscriptionPanel = lazy(() => import("./src/components/dashboard/SubscriptionPanel").then(m => ({ default: m.SubscriptionPanel })));
const ReceivedContactsView = lazy(() => import("./src/components/dashboard/ReceivedContactsView").then(m => ({ default: m.ReceivedContactsView })));
const MisEmpresasPanel = lazy(() => import("./src/components/dashboard/MisEmpresasPanel").then(m => ({ default: m.MisEmpresasPanel })));
const DashboardPanel = lazy(() => import("./src/components/dashboard/DashboardPanel").then(m => ({ default: m.DashboardPanel })));

// Pages (rutas secundarias)
const HowItWorksPage = lazy(() => import("./src/components/pages/HowItWorksPage").then(m => ({ default: m.HowItWorksPage })));
const PricingPage = lazy(() => import("./src/components/pages/PricingPage").then(m => ({ default: m.PricingPage })));
const PublicarAviso = lazy(() => import("./src/components/pages/PublicarAviso"));
const ExampleMigratedPage = lazy(() => import("./src/components/pages/ExampleMigratedPage").then(m => ({ default: m.ExampleMigratedPage })));

// Empresa Components (Servicios Rurales B2B)
const CompanyProfilePage = lazy(() => import("./src/components/empresa/CompanyProfilePage").then(m => ({ default: m.CompanyProfilePage })));
const EmpresaPublicPage = lazy(() => import("./src/components/pages/EmpresaPublicPage").then(m => ({ default: m.EmpresaPublicPage })));

// Dev/Test Pages (solo desarrollo - bloqueadas en producción)
const TestDynamicForm = import.meta.env.DEV ? lazy(() => import("./src/pages/TestDynamicForm").then(m => ({ default: m.TestDynamicForm }))) : null;
const APITestPage = import.meta.env.DEV ? lazy(() => import("./src/pages/APITest")) : null;
const DiagnosticsPage = import.meta.env.DEV ? lazy(() => import("./src/pages/DiagnosticsPage").then(m => ({ default: m.DiagnosticsPage }))) : null;
const DesignSystemShowcaseSimple = lazy(() => import("./src/components/DesignSystemShowcaseSimple").then(m => ({ default: m.DesignSystemShowcaseSimple })));
const PaymentResultPage = lazy(() => import("./src/pages/PaymentResultPage"));
const FeaturedCheckoutPage = lazy(() => import("./src/pages/FeaturedCheckoutPage"));

// ============================================================
// LOADING FALLBACK COMPONENT
// ============================================================
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export type Page = 'home' | 'my-ads' | 'inbox' | 'all-ads' | 'ads-management' | 'ad-detail' | 'profile' | 'subscription' | 'users' | 'banners' | 'settings' | 'contacts' | 'email-confirm' | 'auth-callback' | 'how-it-works' | 'publicar-v2' | 'publicar-v3' | 'test-form' | 'categories-admin' | 'attributes-admin' | 'option-lists' | 'templates-admin' | 'backend-settings' | 'global-settings' | 'payments-admin' | 'sitemap-seo' | 'pricing' | 'contact' | 'design-showcase' | 'design-system' | 'example-migration' | 'api-test' | 'diagnostics' | 'pending-ads' | 'deleted-ads' | 'publicar' | 'ad-finder' | 'coupons' | 'company-profile' | 'hero-cms' | 'credits-config' | 'payment-result' | 'featured-checkout' | 'mis-empresas' | 'dashboard';

/**
 * Componente principal de Rural24 - Clasificados de Agronegocios
 */
const App: React.FC = () => {
  return (
    <HelmetProvider>
      <ToastProvider>
        <CategoryProvider>
          <AccountProvider>
            <OfflineBanner />
            <PWAInstallBanner />
            <AppContent />
            <BottomNav />
          </AccountProvider>
        </CategoryProvider>
      </ToastProvider>
    </HelmetProvider>
  );
};

const AppContent: React.FC = () => {
  // ⚡ Persistir página actual en localStorage para mantener estado al refrescar (F5)
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    // Intentar recuperar del hash primero
    const hash = window.location.hash;
    
    if (hash.startsWith('#/auth/confirm')) return 'email-confirm';
    if (hash.startsWith('#/auth/callback')) return 'auth-callback';
    if (hash === '#/preguntas-frecuentes-rural24' || hash === '#/how-it-works') return 'how-it-works';
    if (hash === '#/contacto-rural24') return 'contact';
    if (hash === '#/design-showcase') return 'design-showcase';
    if (hash === '#/design-system') return 'design-system';
    if (hash === '#/example-migration') return 'example-migration';
    if (hash === '#/api-test') return 'api-test';
    if (hash === '#/diagnostics') return 'diagnostics';
    if (hash === '#/precios-rural24' || hash === '#/pricing' || hash === '#/planes') return 'pricing';
    if (hash === '#/test-form') return 'test-form';
    // Wizard de publicación
    if (hash === '#/publicar' || hash === '#/publicar-v3' || hash === '#/publicar-aviso' || 
        hash.startsWith('#/publicar-v3?') || hash.startsWith('#/publicar-aviso?') || 
        hash.startsWith('#/publicar?')) return 'publicar-v3';
    if (hash.startsWith('#/edit/')) return 'publicar-v3';
    if (hash.startsWith('#/ad/')) return 'ad-detail';
    if (hash.startsWith('#/empresa/')) return 'company-profile';
    if (hash === '#/dashboard/contacts') return 'contacts';

    if (hash === '#/my-ads') return 'my-ads';
    if (hash === '#/inbox') return 'inbox';
    if (hash === '#/pending-ads') return 'pending-ads';
    if (hash === '#/users') return 'users';
    if (hash === '#/ads-management') return 'my-ads'; // redirect legacy route
    if (hash === '#/featured-queue') return 'my-ads'; // redirect legacy route
    if (hash === '#/banners') return 'banners';
    if (hash === '#/featured-ads') return 'my-ads';
    if (hash === '#/coupons') return 'coupons';
    if (hash === '#/credits-config') return 'credits-config';
    if (hash === '#/categories-admin') return 'categories-admin';
    if (hash === '#/attributes-admin') return 'attributes-admin';
    if (hash === '#/option-lists') return 'option-lists';
    if (hash === '#/templates-admin') return 'templates-admin';
    if (hash === '#/backend-settings') return 'backend-settings';
    if (hash === '#/deleted-ads') return 'deleted-ads';
    if (hash === '#/dashboard/sitemap-seo') return 'sitemap-seo';
    if (hash === '#/hero-cms') return 'hero-cms';
    if (hash === '#/payment-result') return 'payment-result';
    if (hash === '#/featured-checkout') return 'featured-checkout';
    if (hash === '#/profile') return 'profile';
    if (hash === '#/subscription') return 'profile'; // Subscription integrada en profile
    if (hash === '#/mis-empresas') return 'mis-empresas';
    if (hash === '#/dashboard') return 'dashboard';
    
    // Si no hay hash específico o es #/ (home), ir a home y limpiar localStorage
    localStorage.removeItem('currentPage');
    return 'home';
  });
  
  const { products, isLoading, getFilterOptions, refetch } = useProducts();
  const { profile, loading: authLoading } = useAuth();
  
  // 🔔 Redirect post-login a perfil + nudge de completitud
  useProfileNudge();
  
  // ⚡ Wrapper para setCurrentPage que persiste en localStorage
  const navigateToPage = useCallback((page: Page) => {
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
      'ads-management': '#/my-ads',
      'users': '#/users',
      'banners': '#/banners',
      'categories-admin': '#/categories-admin',
      'attributes-admin': '#/attributes-admin',
      'option-lists': '#/option-lists',
      'templates-admin': '#/templates-admin',
      'backend-settings': '#/backend-settings',
      'global-settings': '#/global-settings',
      'payments-admin': '#/payments-admin',
      'sitemap-seo': '#/dashboard/sitemap-seo',
      'hero-cms': '#/hero-cms',
      'credits-config': '#/credits-config',
      'profile': '#/profile',
      'subscription': '#/subscription',
      'contacts': '#/dashboard/contacts',
      'how-it-works': '#/preguntas-frecuentes-rural24',
      'contact': '#/contacto-rural24',
      'publicar-v3': '#/publicar-v3',
      'test-form': '#/test-form',
      'api-test': '#/api-test',
      'pricing': '#/precios-rural24',
      'design-system': '#/design-system',
      'home': '#/',
      'payment-result': '#/payment-result',
      'featured-checkout': '#/featured-checkout',
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
  // premiumAds y activeAds eliminados — no se renderizan en homepage
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
      else if (hash === '#/preguntas-frecuentes-rural24' || hash === '#/how-it-works') {
        navigateToPage('how-it-works');
      }
      // Routing para Contacto
      else if (hash === '#/contacto-rural24') {
        navigateToPage('contact');
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
      else if (hash === '#/mis-empresas') {
        navigateToPage('mis-empresas');
      }
      else if (hash === '#/dashboard') {
        navigateToPage('dashboard');
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
      else if (hash === '#/option-lists') {
        navigateToPage('option-lists');
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
      else if (hash === '#/featured-queue' || hash === '#/featured-ads') {
        navigateToPage('my-ads');
      }
      else if (hash === '#/payments-admin') {
        navigateToPage('payments-admin');
      }
      else if (hash === '#/payment-result') {
        navigateToPage('payment-result');
      }
      else if (hash === '#/featured-checkout') {
        navigateToPage('featured-checkout');
      }
      else if (hash === '#/profile') {
        navigateToPage('profile');
      }
      else if (hash === '#/subscription') {
        navigateToPage('subscription');
      }
      // Routing para perfil de empresa: #/empresa/:slug
      else if (hash.startsWith('#/empresa/')) {
        navigateToPage('company-profile');
      }
      // Routing para Precios
      else if (hash === '#/precios-rural24' || hash === '#/pricing' || hash === '#/planes') {
        navigateToPage('pricing');
      }
      // Routing para Contacto
      else if (hash === '#/contacto-rural24') {
        navigateToPage('contact');
      }
      // Routing para dashboard - redirigir a Mis Avisos
      else if (hash.startsWith('#/dashboard')) {
        navigateTo('/my-ads');
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

  // ❌ ELIMINADO: getPremiumAds() + getActiveAds() cargaban ~200+ filas
  // que nunca se renderizan en homepage. Las búsquedas usan backend API directamente.

  // Cargar todos los banners para carousel en mobile (usa caché 60s de bannersCleanService)
  React.useEffect(() => {
    if (!isMobile) return;

    const loadAllBanners = async () => {
      try {
        const banners = await getHeroVIPBanners(undefined) as unknown as Banner[];
        const mobileBanners = banners.filter(b => (b as any).device_target === 'mobile' || (b as any).device_target === 'both' || !(b as any).device_target);
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

  // Detectar retorno desde MercadoPago Checkout Pro (mobile redirect o popup en mismo tab)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mpCallback = params.get('mp_callback');
    if (!mpCallback) return;

    // Limpiar params de la URL sin recargar la página
    window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    sessionStorage.removeItem('mp_payment_id');

    // Si estamos dentro de un popup de checkout Desktop → notificar al padre y cerrar
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'mp_callback', status: mpCallback }, window.location.origin);
      window.close();
      return;
    }

    // Flujo mobile (redirect directo) → navegar a página de resultado
    sessionStorage.setItem('mp_result', mpCallback);
    navigateToPage('payment-result');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Recibir resultado desde el popup de checkout Desktop
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== 'mp_callback') return;
      sessionStorage.removeItem('mp_payment_id');
      sessionStorage.setItem('mp_result', e.data.status);
      navigateToPage('payment-result');
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigateToPage]);

  // Función para scroll al top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Búsqueda inteligente con filtros avanzados (legacy client-side)
  const handleAdvancedSearch = useCallback(
    async (filters: SearchFilters) => {
      // Cargar productos si aún no están (lazy load)
      if (products.length === 0) await refetch();
      
      setSearchFilters(filters);
      const filtered = smartSearch(products, filters);
      setSearchResults(filtered);
      setIsSearching(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [products, refetch]
  );

  // Búsqueda simple - Navegar a URL con query para que el backend resuelva
  const handleSearch = useCallback(
    (query: string) => {
      // Convertir query a slug para URL amigable
      const slug = query.trim().toLowerCase().replace(/\s+/g, '-');
      // Navegar a página de búsqueda con el query como parámetro
      navigateTo('/search', { q: query.trim() });
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

  // Obtener productos premium (solo usado en búsqueda)
  const premiumProducts = useMemo(() => getPremiumProducts(products), [products]);

  // Usar TODAS las categorías y provincias disponibles (no solo las de productos existentes)
  const availableCategories = useMemo(() => ALL_CATEGORIES, []);
  const availableProvinces = useMemo(() => [...PROVINCES], []);
  const availableTags = useMemo(() => 
    [...new Set(products.flatMap(p => p.tags || []))],
    [products]
  );

  // Estado actual de la app (solo en dev)
  if (import.meta.env.DEV) {
    console.log('🎯 Estado actual - currentPage:', currentPage, 'isSearching:', isSearching);
  }

  // Determinar si debe usar Dashboard Layout
  const isDashboardPage = ['dashboard', 'profile', 'subscription', 'users', 'my-ads', 'inbox', 'banners', 'coupons', 'settings', 'contacts', 'categories-admin', 'attributes-admin', 'option-lists', 'templates-admin', 'backend-settings', 'global-settings', 'payments-admin', 'sitemap-seo', 'hero-cms', 'design-system', 'mis-empresas'].includes(currentPage);

  // Render con Dashboard Layout
  if (isDashboardPage) {
    // Esperar a que cargue el perfil antes de verificar permisos en páginas protegidas
    const isProtectedPage = ['users', 'banners', 'coupons', 'credits-config', 'settings', 'categories-admin', 'attributes-admin', 'option-lists', 'templates-admin', 'backend-settings', 'global-settings', 'payments-admin', 'sitemap-seo', 'hero-cms', 'design-system'].includes(currentPage);
    
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
        navigateTo('/');
      }, 0);
      
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página.</p>
            <button 
              onClick={() => {
                navigateToPage('home');
                navigateTo('/');
              }}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
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
                {currentPage === 'subscription' && <ProfilePanel />}
                {currentPage === 'contacts' && <ReceivedContactsView />}
                {currentPage === 'users' && canAccessPage('users', profile?.role) && <UsersPanel />}
                {currentPage === 'my-ads' && <MyAdsPanel />}
                {currentPage === 'inbox' && <MessagesPanel />}
                {currentPage === 'banners' && canAccessPage('banners', profile?.role) && <BannersCleanPanel />}
                {currentPage === 'categories-admin' && canAccessPage('categories-admin', profile?.role) && <TaxonomiaAdmin />}
                {currentPage === 'attributes-admin' && canAccessPage('attributes-admin', profile?.role) && <AttributesAdmin />}
                {currentPage === 'option-lists' && canAccessPage('option-lists', profile?.role) && <OptionListsAdmin />}
                {currentPage === 'templates-admin' && canAccessPage('templates-admin', profile?.role) && <TemplatesAdmin />}
                {currentPage === 'backend-settings' && canAccessPage('backend-settings', profile?.role) && <BackendSettings />}
                {currentPage === 'global-settings' && canAccessPage('global-settings', profile?.role) && <GlobalSettingsPanel />}
                {currentPage === 'coupons' && canAccessPage('coupons', profile?.role) && <CouponsAdminPanel />}
                {currentPage === 'payments-admin' && canAccessPage('payments-admin', profile?.role) && <PaymentsAdminPanel />}
                {currentPage === 'sitemap-seo' && canAccessPage('sitemap-seo', profile?.role) && <SitemapSeoPanel />}
                {currentPage === 'hero-cms' && canAccessPage('hero-cms', profile?.role) && <HeroCmsPanel />}
                {currentPage === 'credits-config' && canAccessPage('credits-config', profile?.role) && <SuperAdminCreditsConfig />}
                {currentPage === 'mis-empresas' && canAccessPage('mis-empresas', profile?.role) && <MisEmpresasPanel />}
                {currentPage === 'dashboard' && <DashboardPanel />}
                {currentPage === 'design-system' && canAccessPage('design-system', profile?.role) && <DesignSystemShowcaseSimple />}
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

  // Página de callback OAuth (Google, Facebook)
  if (currentPage === 'auth-callback') {
    return (
      <OAuthCallbackPage 
        onComplete={() => navigateToPage('home')}
        onError={(error) => console.error('OAuth error:', error)}
      />
    );
  }

  // Página de Design System Showcase (solo dev)
  if (currentPage === 'design-showcase') {
    if (!import.meta.env.DEV || !DesignSystemShowcaseSimple) {
      navigateToPage('home');
      return null;
    }
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

  // Página pública de Empresa — Sprint 6D
  if (currentPage === 'company-profile') {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader
          onNavigate={(page) => {
            navigateToPage(page);
            if (page === 'home') handleBackToHome();
          }}
          onSearch={handleSearch}
        />
        <Suspense fallback={<LoadingFallback />}>
          <EmpresaPublicPage />
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

  // Página de prueba: Formulario Dinámico (solo dev)
  if (currentPage === 'test-form') {
    if (!import.meta.env.DEV || !TestDynamicForm) {
      navigateToPage('home');
      return null;
    }
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
              navigateTo('/how-it-works');
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

  // Página de Contacto
  if (currentPage === 'contact') {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <AppHeader
          onNavigate={(page) => { navigateToPage(page); if (page === 'home') handleBackToHome(); }}
          onSearch={handleSearch}
        />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Contacto</h1>
            <p className="text-gray-500">Sección en desarrollo. Próximamente.</p>
            <button
              onClick={() => { navigateToPage('home'); handleBackToHome(); }}
              className="mt-6 px-6 py-2.5 bg-brand-600 text-white rounded-full font-semibold hover:bg-brand-500 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Página de prueba de API (solo dev)
  if (currentPage === 'api-test') {
    if (!import.meta.env.DEV || !APITestPage) {
      navigateToPage('home');
      return null;
    }
    return <Suspense fallback={<LoadingFallback />}><APITestPage /></Suspense>;
  }

  // Página de resultado de pago MercadoPago
  if (currentPage === 'payment-result') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <PaymentResultPage />
      </Suspense>
    );
  }

  if (currentPage === 'featured-checkout') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <FeaturedCheckoutPage />
      </Suspense>
    );
  }

  // Página de diagnósticos de imágenes (solo dev)
  if (currentPage === 'diagnostics') {
    if (!import.meta.env.DEV || !DiagnosticsPage) {
      navigateToPage('home');
      return null;
    }
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
            navigateTo('/how-it-works');
          }
        }}
        onSearch={handleSearch}
      />

      {currentPage === 'ad-detail' && selectedAdId ? (
        <Suspense fallback={<LoadingFallback />}>
          <AdDetailPageLazy />
        </Suspense>
      ) : isSearching ? (
        // VISTA DE BÚSQUEDA - Lazy loaded  
        <Suspense fallback={<LoadingFallback />}>
          <SearchPage />
        </Suspense>
      ) : (
        // VISTA DE INICIO - Lazy loaded
        <Suspense fallback={<LoadingFallback />}>
          <HomePage 
            onShowAuthModal={() => setShowAuthModal(true)}
            onSearch={handleAdvancedSearch}
            onCategoryHover={setHoveredCategory}
            onBannerChange={setCurrentBanner}
            onAdClick={(adId) => {
              setSelectedAdId(adId);
              setCurrentPage('ad-detail');
            }}
            hoveredCategory={hoveredCategory}
          />
        </Suspense>
      )}

      {/* Botón flotante Scroll to Top */}
      {showScrollTop && currentPage === 'home' && !isSearching && (
        <button
          onClick={scrollToTop}
          className="hidden md:flex fixed bottom-8 right-8 z-50 bg-brand-600 hover:bg-brand-500 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 group"
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
