/**
 * Utils Barrel
 * Funciones utilitarias
 */

// URL & Routing
export { extractIdFromUrl, generateSlug, generateAdSlug, extractIdFromSlug, getAdDetailUrl } from './slugUtils';
export { parseFilterParams, buildFilterUrl, toSlug } from './urlFilterUtils';

// Permissions
export { canAccessPage, getAllowedPages, PAGE_PERMISSIONS } from './rolePermissions';

// Content
export { validateContent } from './contentValidator';
export * from './textProcessing';
export * from './adTextGenerator';

// Images
export * from './imageHelpers';
export * from './imageValidation';
export * from './imageDiagnostics';

// Forms
export * from './fileValidation';
export * from './draftManager';
export * from './currency';

// Cards
export { getCardLabel, hasCardLabel } from './cardLabelHelpers';
