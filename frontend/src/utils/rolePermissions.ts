import type { UserRole } from '../../types';

/**
 * Define qué páginas puede acceder cada rol
 */
export const PAGE_PERMISSIONS: Record<string, UserRole[]> = {
  // Páginas públicas (todos)
  home: ['superadmin', 'adminscrap', 'free', 'user', 'admin'],
  'how-it-works': ['superadmin', 'adminscrap', 'free', 'user', 'admin'],
  'email-confirm': ['superadmin', 'adminscrap', 'free', 'user', 'admin'],
  publicar: ['superadmin', 'adminscrap', 'free', 'user', 'admin'],
  'ad-detail': ['superadmin', 'adminscrap', 'free', 'user', 'admin'],
  
  // Páginas de perfil (todos los usuarios autenticados)
  profile: ['superadmin', 'adminscrap', 'free', 'user', 'admin'],
  subscription: ['superadmin', 'adminscrap', 'free', 'user', 'admin'],
  
  // Mis avisos personales (todos los usuarios autenticados)
  'my-ads': ['superadmin', 'adminscrap', 'free', 'user', 'admin'],
  contacts: ['superadmin', 'adminscrap', 'free', 'user', 'admin'],
  inbox: ['superadmin', 'adminscrap', 'free', 'user', 'admin'],
  
  // Solo SuperAdmin
  users: ['superadmin'],
  'all-ads': ['superadmin'], // Nuevo panel unificado de gestión
  banners: ['superadmin'],
  settings: ['superadmin'],
  'categories-admin': ['superadmin'],
  'attributes-admin': ['superadmin'],
  'templates-admin': ['superadmin'],
  'backend-settings': ['superadmin'],
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
  // SECCIÓN: GENERAL
  {
    id: 'home',
    label: 'Inicio',
    allowedRoles: ['superadmin', 'adminscrap', 'free', 'user', 'admin'],
  },
  {
    id: 'my-ads',
    label: 'Mis Avisos',
    allowedRoles: ['superadmin', 'adminscrap', 'free', 'user', 'admin'],
  },
  {
    id: 'inbox',
    label: 'Mensajes',
    allowedRoles: ['superadmin', 'adminscrap', 'free', 'user', 'admin'],
  },
  {
    id: 'profile',
    label: 'Mi Perfil',
    allowedRoles: ['superadmin', 'adminscrap', 'free', 'user', 'admin'],
  },
  
  // SECCIÓN: ADMINISTRADOR (solo SuperAdmin)
  {
    id: 'divider-admin',
    label: '--- ADMINISTRADOR ---',
    allowedRoles: ['superadmin'],
    divider: true,
  },
  {
    id: 'users',
    label: 'Usuarios',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'all-ads',
    label: 'Avisos',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'banners',
    label: 'Banners',
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
    label: 'Plantillas Contenido',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'backend-settings',
    label: 'Backend CMS',
    allowedRoles: ['superadmin'],
  },
  
  // SECCIÓN: HERRAMIENTAS DE DESARROLLO
  {
    id: 'divider-dev',
    label: '--- DEV TOOLS ---',
    allowedRoles: ['superadmin'],
    divider: true,
  },
  {
    id: 'diagnostics',
    label: '🔬 Diagnósticos',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'design-showcase',
    label: '🎨 Design System',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'example-migration',
    label: '📦 Migration Guide',
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
