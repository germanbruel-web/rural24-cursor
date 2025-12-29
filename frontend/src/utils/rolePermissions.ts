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
  'ad-finder': ['superadmin'],
  'pending-ads': ['superadmin'],
  users: ['superadmin'],
  banners: ['superadmin'],
  'deleted-ads': ['superadmin'],
  settings: ['superadmin'],
  'featured-ads': ['superadmin'], // Gestión de avisos destacados
  'categories-admin': ['superadmin'], // Solo superadmin puede gestionar categorías
  'attributes-admin': ['superadmin'], // Solo superadmin puede gestionar atributos dinámicos
  'backend-settings': ['superadmin'], // CMS para gestionar contenidos del sitio (logos, placeholders, etc)
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
    id: 'divider-admin',
    label: '--- ADMIN ---',
    allowedRoles: ['superadmin'],
    divider: true,
  },
  {
    id: 'pending-ads',
    label: 'Avisos Pendientes',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'ad-finder',
    label: 'Buscador de Avisos',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'deleted-ads',
    label: 'Avisos Eliminados',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'users',
    label: 'Usuarios',
    allowedRoles: ['superadmin'],
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
    id: 'backend-settings',
    label: 'Backend CMS',
    allowedRoles: ['superadmin'],
  },
  {
    id: 'divider-profile',
    label: '',
    allowedRoles: ['superadmin', 'adminscrap', 'free', 'user', 'admin'],
    divider: true,
  },
  {
    id: 'profile',
    label: 'Mi Perfil',
    allowedRoles: ['superadmin', 'adminscrap', 'free', 'user', 'admin'],
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
