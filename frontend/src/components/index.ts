/**
 * Components Main Barrel
 * Punto de entrada principal para componentes core
 */

// ============================================================
// CORE COMPONENTS (uso frecuente, carga inmediata)
// ============================================================
export { Header } from './Header';
export { GlobalSearchBar } from './GlobalSearchBar';
export { SearchSEO } from './SearchSEO';
export { TopNav } from './TopNav';
export { AppHeader } from './AppHeader';
export { Footer } from './Footer';
export { HeroWithCarousel } from './HeroWithCarousel';
export { HeroCategoryButtons } from './HeroCategoryButtons';
export { FilterSidebar } from './FilterSidebar';
export { SearchResultsPageMinimal } from './SearchResultsPageMinimal';
export { AdDetailPage } from './AdDetailPage';
export { RegisterBanner } from './RegisterBanner';
// AdvancedSearchBar DEPRECATED - usar GlobalSearchBar
export { DesignSystemShowcase } from './DesignSystemShowcase';
export { DesignSystemShowcaseSimple } from './DesignSystemShowcaseSimple';
export { SmartBreadcrumb } from './SmartBreadcrumb';

// ============================================================
// RE-EXPORT BARRELS (para imports anidados)
// ============================================================
export * from './admin';
export * from './dashboard';
export * from './auth';
export * from './layouts';
export * from './sections';
export * from './banners';
export * from './pages';
