/**
 * Hooks Barrel
 * Custom hooks de la aplicación
 */

// Core hooks
export { useProducts } from './useProducts';
export { useAds } from './useAds';
export { useCategories, useCategory, useSubcategory } from './useCategories';

// Feature hooks
export { useDynamicFilters } from './useDynamicFilters';
export { useCategoryPrefetch } from './useCategoryPrefetch';
export { useRealtimeCategories } from './useRealtimeCategories';
export { useSiteSetting } from './useSiteSetting';
export { useFooterConfig } from './useFooterConfig';
export { useSearchSuggestions } from './useSearchSuggestions';

// UI hooks
export { useImageUpload } from './useImageUpload';
export { useProductImage } from './useProductImage';
export { OfflineBanner, useOnlineStatus } from './useOnlineStatus';

// Navigation
export { useNavigate, navigateTo, buildHashUrl } from './useNavigate';
