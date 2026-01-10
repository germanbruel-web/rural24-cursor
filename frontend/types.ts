
import React from 'react';

export interface Product {
  id: string;
  title: string;
  description: string;
  price?: number;
  currency: string;
  location: string;
  province?: string;
  imageUrl: string; // Primera imagen para thumbnail
  imageUrls?: string[]; // Array completo para galería
  image_urls?: string[]; // Alias alternativo (legacy)
  sourceUrl: string;
  category: string;
  subcategory?: string;
  isSponsored: boolean;
  isPremium?: boolean;
  featured?: boolean; // Destacado en carrusel principal
  userType?: 'free' | 'premium-particular' | 'premium-empresa';
  tags?: string[];
  relevanceScore?: number;
  createdAt?: string;
  updatedAt?: string;
  enrichedData?: EnrichedData;
  attributes?: Record<string, any>; // JSONB de atributos dinámicos
  brand?: string; // Marca (campo fijo legacy)
  model?: string; // Modelo (campo fijo legacy)
  // Información del vendedor (para productos de usuarios)
  user_id?: string;
  seller?: {
    id: string;
    email: string;
    full_name?: string;
    role: UserRole;
    email_verified: boolean;
  };
}

export interface Category {
  id: string;
  name: string;
  // FIX: Import React to resolve React.FC and React.SVGProps types.
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

export interface EnrichedData {
  category?: string;
  brand?: string;
  power?: string;
  condition?: string;
  [key: string]: any;
}

export interface FilterOptions {
    categories: string[];
    subcategories: string[];
    locations: string[];
    provinces: string[];
    priceRange: { min: number; max: number };
    tags: string[];
}

export interface SearchFilters {
  query?: string;
  categories?: string[];
  subcategories?: string[];
  provinces?: string[];
  locations?: string[];
  tags?: string[];
  isPremium?: boolean;
  userType?: 'free' | 'premium-particular' | 'premium-empresa';
}

// ============================================
// TIPOS PARA SISTEMA DE AVISOS
// ============================================

export interface Ad {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price?: number;
  currency: string;
  location?: string;
  province?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  year?: string;
  condition?: string;
  images?: string[];
  image_urls?: string[];
  tags?: string[];
  contact_email?: string;
  status: 'active' | 'paused' | 'expired' | 'deleted';
  approval_status?: 'pending' | 'approved' | 'rejected'; // Para usuarios free
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  featured?: boolean; // Aparece en carrusel destacado
  created_at: string;
  updated_at: string;
  expires_at?: string;
  views_count: number;
  enriched_data?: EnrichedData;
  // Información del vendedor (join con tabla users)
  seller?: {
    id: string;
    email: string;
    full_name?: string;
    role: UserRole;
    email_verified: boolean;
    created_at?: string;
  };
}

export interface CreateAdInput {
  title: string;
  description: string;
  price?: number;
  currency?: string;
  discount?: number; // % descuento pago contado
  location?: string;
  province?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  year?: string;
  condition?: string;
  images?: string[];
  tags?: string[];
  featured?: boolean;
  contact_email?: string;
  expires_at?: string;
  // Condiciones comerciales
  tiene_financiacion?: boolean; // Si tiene financiación disponible
  cuotas_disponibles?: number[]; // Array de cuotas: [12, 24, 48]
  entrega_inmediata?: boolean;
  canje_usado?: boolean; // Acepta canje por usado + efectivo
  canje_cereal?: boolean; // Acepta canje por cereal + efectivo
  envio_incluido?: boolean;
  envio_km?: string;
}

export interface UpdateAdInput extends Partial<CreateAdInput> {
  status?: 'active' | 'paused' | 'expired' | 'deleted';
}

// ============================================
// TIPOS PARA SISTEMA DE BANNERS HOMEPAGE
// ============================================

export type BannerType = 
  | 'homepage_vip'          // Banner VIP Hero (1200x200 desktop, 480x100 mobile)
  | 'homepage_category'     // Banner Categorías Homepage (650x120)
  | 'results_lateral'       // Banner Lateral Resultados (300x600 desktop, 320x100 mobile)
  | 'results_intercalated'  // Banner Intercalado Resultados (648x100 desktop, 320x100 mobile)
  | 'homepage_search'       // [LEGACY] Banner Buscador Dinámico
  | 'homepage_carousel';    // [LEGACY] Banner Categoría Carrusel

export type DeviceTarget = 'desktop' | 'mobile' | 'both';

export type BannerPosition = 'A' | 'B' | 'C' | 'D'; // Posiciones laterales

export interface Banner {
  id: string;
  type: BannerType;
  client_name?: string;  // Nombre del cliente/anunciante (opcional)
  title: string;
  image_url: string;
  link_url?: string;
  category?: string;  // Categoría específica (NULL = todas)
  position?: BannerPosition;  // Posición lateral (solo results_lateral)
  device_target: DeviceTarget;
  is_active: boolean;
  is_featured?: boolean;  // ⭐ Destacado: aparece predeterminadamente
  starts_at?: string;  // 📅 Fecha inicio programada (NULL = inmediato)
  expires_at?: string; // 📅 Fecha expiración (NULL = sin expiración)
  impressions?: number;
  clicks?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBannerInput {
  type: BannerType;
  client_name?: string;
  title?: string;
  image_url: string;
  link_url?: string;
  category?: string;
  position?: BannerPosition;
  device_target: DeviceTarget;
  is_active?: boolean;
  is_featured?: boolean;
  starts_at?: string;
  expires_at?: string;
}

export interface UpdateBannerInput {
  title?: string;
  client_name?: string;
  image_url?: string;
  link_url?: string;
  category?: string;
  position?: BannerPosition;
  device_target?: DeviceTarget;
  is_active?: boolean;
  is_featured?: boolean;
  starts_at?: string;
  expires_at?: string;
}

// ============================================
// NUEVOS TIPOS PARA BANNERS_CLEAN (2026-01-10)
// ============================================

export type BannerPlacement = 'hero_vip' | 'category_carousel';

export interface BannerClean {
  id: string;
  placement: BannerPlacement;
  category: string;  // 'all', 'inmuebles', 'vehiculos', 'maquinarias', 'insumos', 'empleos'
  client_name: string;
  link_url?: string;
  desktop_image_url?: string;  // 1200x200 (solo hero_vip)
  mobile_image_url?: string;   // 480x100 (solo hero_vip)
  carousel_image_url?: string; // 650x100 (solo category_carousel)
  is_active: boolean;
  starts_at?: string;
  expires_at?: string;
  impressions: number;
  clicks: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBannerCleanInput {
  placement: BannerPlacement;
  category: string;
  client_name: string;
  link_url?: string;
  desktop_image_url?: string;
  mobile_image_url?: string;
  carousel_image_url?: string;
  is_active?: boolean;
  starts_at?: string;
  expires_at?: string;
}

export interface UpdateBannerCleanInput {
  placement?: BannerPlacement;
  category?: string;
  client_name?: string;
  title?: string;
  link_url?: string;
  desktop_image_url?: string;
  mobile_image_url?: string;
  carousel_image_url?: string;
  is_active?: boolean;
  starts_at?: string;
  expires_at?: string;
}

// ================================================
// TIPOS: Sistema de Roles (SIMPLIFICADO - 3 ROLES)
// ================================================

// Sistema de roles: SuperAdmin, AdminScrap, Free
export type UserRole = 'superadmin' | 'adminscrap' | 'free' | 'user' | 'admin';

// Tipo de usuario: Particular o Empresa
export type UserType = 'particular' | 'empresa';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  mobile?: string;
  role: UserRole;
  user_type?: UserType;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  ad_id: string;
  ad_owner_id: string;
  sender_user_id: string; // ⚠️ OBLIGATORIO - requiere autenticación
  sender_name: string;
  sender_last_name: string; // Ahora obligatorio
  sender_phone: string; // Ahora obligatorio
  sender_email: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  // Relación con el aviso (populated by enrichMessagesWithAds)
  ads?: {
    id: string;
    title: string;
    price?: number;
    location?: string;
    images?: Array<{ url: string; order?: number }>;
    image_urls?: string[];
    category?: string;
    subcategory?: string;
  };
}

export interface CreateContactMessageInput {
  ad_id: string;
  ad_owner_id: string;
  sender_user_id: string; // ⚠️ OBLIGATORIO - requiere autenticación
  sender_name: string;
  sender_last_name: string; // Ahora obligatorio
  sender_phone: string; // Ahora obligatorio
  sender_email: string;
  message: string;
}