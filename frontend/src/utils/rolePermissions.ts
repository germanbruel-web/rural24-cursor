import type { UserRole } from '../../types';

/**
 * Define qué páginas puede acceder cada rol
 */
export const PAGE_PERMISSIONS: Record<string, UserRole[]> = {
  // Páginas públicas (todos)
  home: ['superadmin', 'admin', 'premium', 'basic', 'verified', 'free', 'user'],
  'how-it-works': ['superadmin', 'admin', 'premium', 'basic', 'verified', 'free', 'user'],
  'email-confirm': ['superadmin', 'admin', 'premium', 'basic', 'verified', 'free', 'user'],
  publicar: ['superadmin', 'admin', 'premium', 'basic', 'verified', 'free', 'user'],
  'ad-detail': ['superadmin', 'admin', 'premium', 'basic', 'verified', 'free', 'user'],
  
  // Páginas de perfil (todos los usuarios autenticados)
  profile: ['superadmin', 'admin', 'premium', 'basic', 'verified', 'free', 'user'],
  subscription: ['superadmin', 'admin', 'premium', 'basic', 'verified', 'free', 'user'],
  
  // Mis avisos personales (todos los usuarios autenticados)
  'my-ads': ['superadmin', 'admin', 'premium', 'basic', 'verified', 'free', 'user'],
  contacts: ['superadmin', 'admin', 'premium', 'basic', 'verified', 'free', 'user'],
  inbox: ['superadmin', 'admin', 'premium', 'basic', 'verified', 'free', 'user'],
  
  // Admin y SuperAdmin (Revendedores)
  users: ['superadmin', 'admin'], // Crear/gestionar usuarios
  'ads-management': ['superadmin', 'admin'], // Crear/gestionar avisos para clientes
  
  // Solo SuperAdmin - Publicidad
  banners: ['superadmin'],
  'featured-ads': ['superadmin'],
  coupons: ['superadmin'],
  'payments-admin': ['superadmin'],
  
  // Solo SuperAdmin - Backend
  settings: ['superadmin'],
  'categories-admin': ['superadmin'],
  'attributes-admin': ['superadmin'],
  'templates-admin': ['superadmin'],
  'backend-settings': ['superadmin'],
  'global-settings': ['superadmin'],
  'sitemap-seo': ['superadmin'],
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
 * Verifica si el usuario es Admin o SuperAdmin (Revendedor)
 */
export function isAdmin(userRole?: UserRole): boolean {
  return userRole === 'admin' || userRole === 'superadmin';
}

/**
 * Verifica si el usuario es Free (no puede acceder a paneles admin)
 */
export function isFreeUser(userRole?: UserRole): boolean {
  return userRole === 'free' || userRole === 'user';
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
  // SECCIÓN: MI CUENTA (Usuario personal)
  // ============================================================
  {
    id: 'divider-mi-cuenta',
    label: 'MI CUENTA',
    allowedRoles: ['superadmin', 'admin', 'premium', 'basic', 'verified', 'free', 'user'],
    divider: true,
  },
  {
    id: 'my-ads',
    label: 'Mis Avisos',
    allowedRoles: ['superadmin', 'admin', 'premium', 'basic', 'verified', 'free', 'user'],
  },
  {
    id: 'inbox',
    label: 'Mensajes',
    allowedRoles: ['superadmin', 'admin', 'premium', 'basic', 'verified', 'free', 'user'],
  },
  {
    id: 'profile',
    label: 'Mi Perfil',
    allowedRoles: ['superadmin', 'admin', 'premium', 'basic', 'verified', 'free', 'user'],
  },
  {
    id: 'subscription',
    label: 'Mi Plan (Créditos)',
    allowedRoles: ['superadmin', 'admin', 'premium', 'basic', 'verified', 'free', 'user'],
  },
  
  // ============================================================
  // SECCIÓN: PUBLICIDAD (solo SuperAdmin)
  // ============================================================
  {
    id: 'divider-publicidad',
    label: 'PUBLICIDAD',
    allowedRoles: ['superadmin'],
    divider: true,
  },
  {
    id: 'banners',
    label: 'Banners',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'featured-ads',
    label: 'Avisos Destacados',
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
  // SECCIÓN: BACKEND (solo SuperAdmin)
  // ============================================================
  {
    id: 'divider-backend',
    label: 'BACKEND',
    allowedRoles: ['superadmin'],
    divider: true,
  },
  {
    id: 'users',
    label: 'Gestión de Usuarios',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'ads-management',
    label: 'Gestión de Avisos',
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
    label: 'Sitemap',
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
