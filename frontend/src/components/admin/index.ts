/**
 * Admin Components Barrel
 * Componentes del panel de administración
 */

// Paneles principales
export { default as MyAdsPanel } from './MyAdsPanel';
// AdsManagementPanel eliminado - absorbido por SuperAdminFeaturedPanel
export { default as BannersCleanPanel } from './BannersCleanPanel';
export { UsersPanel } from './UsersPanel';
export { CategoriasAdmin } from './CategoriasAdmin';
export { AttributesAdmin } from './AttributesAdmin';
export { BackendSettings } from './BackendSettings';

// Paneles SuperAdmin - Gestión Comercial
export { default as GlobalSettingsPanel } from './GlobalSettingsPanel';
export { default as PaymentsAdminPanel } from './PaymentsAdminPanel';
export { default as PlansAdmin } from './PlansAdmin';
export { default as SuperAdminFeaturedPanel } from './SuperAdminFeaturedPanel';
