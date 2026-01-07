
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
// TIPOS PARA SISTEMA DE BANNERS
// ============================================

export type BannerType = 
  | 'homepage_search'       // Banner Buscador Dinámico (Homepage - Pos 1) - 1200x200
  | 'homepage_carousel'     // Banner Categoría Carrusel (Homepage - Pos 2) - 648x100
  | 'results_intercalated'  // Banner Resultados Intercalado cada 5 (Pos 3) - 648x100
  | 'results_lateral';      // Banner Lateral Rotativo A-B-C-D (Pos 4) - Variable

export type BannerPosition = 'A' | 'B' | 'C' | 'D';

export type DeviceTarget = 'desktop' | 'mobile' | 'both';

export interface Banner {
  id: string;
  type: BannerType;
  title: string;
  image_url: string;
  link_url?: string;
  category?: string;
  position?: BannerPosition;  // Solo para 'results_lateral'
  device_target: DeviceTarget;  // Dispositivo objetivo
  is_active: boolean;
  display_order: number;
  impressions?: number;
  clicks?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBannerInput {
  type: BannerType;
  title: string;
  image_url: string;
  link_url?: string;
  category?: string;
  position?: BannerPosition;
  device_target?: DeviceTarget;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateBannerInput {
  title?: string;
  image_url?: string;
  link_url?: string;
  category?: string;
  position?: BannerPosition;
  is_active?: boolean;
  display_order?: number;
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