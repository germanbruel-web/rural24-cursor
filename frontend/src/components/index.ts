/**
 * Components Main Barrel
 * Punto de entrada principal para componentes core
 */

// ============================================================
// CORE COMPONENTS (uso frecuente, carga inmediata)
// ============================================================
export { Header } from './Header';
export { Footer } from './Footer';
export { HeroWithCarousel } from './HeroWithCarousel';
export { HeroSearchBarClon } from './HeroSearchBarClon';
export { FilterSidebar } from './FilterSidebar';
export { SearchResultsPageMinimal } from './SearchResultsPageMinimal';
export { AdDetailPage } from './AdDetailPage';
export { RegisterBanner } from './RegisterBanner';
export { AdvancedSearchBar } from './AdvancedSearchBar';
export { DesignSystemShowcase } from './DesignSystemShowcase';
export { DesignSystemShowcaseSimple } from './DesignSystemShowcaseSimple';

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
