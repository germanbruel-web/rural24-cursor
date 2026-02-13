import type { UserRole } from '../../types';

// Constante para "todos los roles" - evita repetir arrays
const ALL_ROLES: UserRole[] = ['superadmin', 'revendedor', 'premium', 'free'];

/**
 * Define qué páginas puede acceder cada rol
 */
export const PAGE_PERMISSIONS: Record<string, UserRole[]> = {
  // Páginas públicas (todos)
  home: ALL_ROLES,
  'how-it-works': ALL_ROLES,
  'email-confirm': ALL_ROLES,
  publicar: ALL_ROLES,
  'ad-detail': ALL_ROLES,
  
  // Páginas de perfil (todos los usuarios autenticados)
  profile: ALL_ROLES,
  subscription: ALL_ROLES,
  
  // Mis avisos personales (todos los usuarios autenticados)
  'my-ads': ALL_ROLES,
  contacts: ALL_ROLES,
  inbox: ALL_ROLES,
  
  // Revendedor y SuperAdmin
  users: ['superadmin', 'revendedor'],
  'reseller-points': ['revendedor'],
  
  // Solo SuperAdmin - Publicidad
  banners: ['superadmin'],
  'featured-ads': ['superadmin'],
  coupons: ['superadmin'],
  'credits-config': ['superadmin'],
  'payments-admin': ['superadmin'],
  
  // Solo SuperAdmin - Backend
  settings: ['superadmin'],
  'categories-admin': ['superadmin'],
  'attributes-admin': ['superadmin'],
  'templates-admin': ['superadmin'],
  'backend-settings': ['superadmin'],
  'global-settings': ['superadmin'],
  'sitemap-seo': ['superadmin'],
  'hero-cms': ['superadmin'],
};

/**
 * Verifica si un usuario con el rol dado puede acceder a una página
 */
export function canAccessPage(page: string, userRole?: UserRole): boolean {
  if (!userRole) return false;
  
  const allowedRoles = PAGE_PERMISSIONS[page];
  if (!allowedRoles) return false;
  
  return (allowedRoles as UserRole[]).includes(userRole);
}

/**
 * Obtiene las páginas permitidas para un rol
 */
export function getAllowedPages(userRole?: UserRole): string[] {
  if (!userRole) return [];
  
  return Object.entries(PAGE_PERMISSIONS)
    .filter(([_, roles]) => (roles as UserRole[]).includes(userRole))
    .map(([page]) => page);
}

/**
 * Verifica si el usuario es SuperAdmin
 */
export function isSuperAdmin(userRole?: UserRole): boolean {
  return userRole === 'superadmin';
}

/**
 * Verifica si el usuario es Revendedor o SuperAdmin
 */
export function isAdmin(userRole?: UserRole): boolean {
  return userRole === 'revendedor' || userRole === 'superadmin';
}

/**
 * Verifica si el usuario es Free
 */
export function isFreeUser(userRole?: UserRole): boolean {
  return userRole === 'free';
}

/**
 * Define los ítems del menú según el rol del usuario
 */
export interface MenuItem {
  id: string;
  label: string;
  allowedRoles: UserRole[];
  divider?: boolean;
}

export const MENU_STRUCTURE: MenuItem[] = [
  // ============================================================
  // SECCIÓN 1: MI CUENTA (todos los usuarios)
  // ============================================================
  {
    id: 'divider-mi-cuenta',
    label: 'MI CUENTA',
    allowedRoles: ALL_ROLES,
    divider: true,
  },
  {
    id: 'my-ads',
    label: 'Mis Avisos',
    allowedRoles: ALL_ROLES,
  },
  {
    id: 'inbox',
    label: 'Mensajes',
    allowedRoles: ALL_ROLES,
  },
  {
    id: 'profile',
    label: 'Mi Perfil',
    allowedRoles: ALL_ROLES,
  },
  {
    id: 'subscription',
    label: 'Créditos y Plan',
    allowedRoles: ALL_ROLES,
  },
  
  // ============================================================
  // SECCIÓN 2: GESTIÓN DE AVISOS (SuperAdmin)
  // ============================================================
  {
    id: 'divider-avisos',
    label: 'GESTIÓN AVISOS',
    allowedRoles: ['superadmin'],
    divider: true,
  },
  {
    id: 'featured-ads',
    label: 'Avisos y Destacados',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'categories-admin',
    label: 'Categorías',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'attributes-admin',
    label: 'Atributos Dinámicos',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'templates-admin',
    label: 'Autocompletado',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'users',
    label: 'Usuarios',
    allowedRoles: ['superadmin', 'revendedor'],
  },
  
  // ============================================================
  // SECCIÓN 2.5: MI RED COMERCIAL (Revendedor)
  // ============================================================
  {
    id: 'divider-red-comercial',
    label: 'MI RED COMERCIAL',
    allowedRoles: ['revendedor'],
    divider: true,
  },
  {
    id: 'reseller-points',
    label: 'Puntos de Venta',
    allowedRoles: ['revendedor'],
  },
  
  // ============================================================
  // SECCIÓN 3: COMERCIAL (SuperAdmin)
  // ============================================================
  {
    id: 'divider-comercial',
    label: 'COMERCIAL',
    allowedRoles: ['superadmin'],
    divider: true,
  },
  {
    id: 'banners',
    label: 'Banners',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'coupons',
    label: 'Cupones',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'payments-admin',
    label: 'Cobranzas',
    allowedRoles: ['superadmin'],
  },
  
  // ============================================================
  // SECCIÓN 4: CONFIGURACIÓN (SuperAdmin)
  // ============================================================
  {
    id: 'divider-config',
    label: 'CONFIGURACIÓN',
    allowedRoles: ['superadmin'],
    divider: true,
  },
  {
    id: 'hero-cms',
    label: 'Hero CMS',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'backend-settings',
    label: 'Backend CMS',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'global-settings',
    label: 'Config Global',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'sitemap-seo',
    label: 'Sitemap / SEO',
    allowedRoles: ['superadmin'],
  },
];

/**
 * Filtra los ítems del menú según el rol del usuario
 */
export function getMenuItems(userRole?: UserRole): MenuItem[] {
  if (!userRole) return [];
  
  return MENU_STRUCTURE.filter(item => 
    item.allowedRoles.includes(userRole)
  );
}
