/**
 * Admin Components Barrel
 * Componentes del panel de administración
 */

// Paneles principales
export { default as MyAdsPanel } from './MyAdsPanel';
export { default as AdsManagementPanel } from './AdsManagementPanel';
export { default as BannersCleanPanel } from './BannersCleanPanel';
export { UsersPanel } from './UsersPanel';
export { CategoriasAdmin } from './CategoriasAdmin';
export { AttributesAdmin } from './AttributesAdmin';
export { BackendSettings } from './BackendSettings';

// Paneles SuperAdmin - Gestión Comercial
export { default as GlobalSettingsPanel } from './GlobalSettingsPanel';
export { default as PaymentsAdminPanel } from './PaymentsAdminPanel';
export { default as PlansAdmin } from './PlansAdmin';

// Componentes secundarios (solo exportar si se usan externamente)
// export { BannersPanel } from './BannersPanel';
// export { InboxPanel } from './InboxPanel';
