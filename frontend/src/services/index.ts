/**
 * Services Barrel
 * Servicios de la aplicación
 */

// Ads & Products
export { getPremiumAds, getActiveAds, getAdById, createAd, updateAd, deleteAd, searchAdsFromBackend } from './adsService';
export type { SearchFiltersParams, SearchAdsResponse } from './adsService';
export { smartSearch, getPremiumProducts } from './smartSearch';

// Banners
export { getHomepageBanners } from './bannersService';
export * from './bannersCleanService';

// Categories & Catalog (exportar solo desde catalogService para evitar duplicados)
export * from './catalogService';
export * from './filtersService';

// Users & Auth
export * from './authService';
export * from './usersService';
export * from './contactService';
export * from './subscriptionService';

// Config & Settings
export * from './siteSettingsService';
export * from './footerService';

// Upload & Images
export * from './uploadService';
export * from './imageOptimizer';

// API client (exportar solo el cliente, no todo)
export { fetchApi } from './api/client';
export { categoriesApi, type Category, type Subcategory, type CategoriesResponse } from './api/categories';
