/**
 * =====================================================
 * FOOTER TYPES - Sistema de Footer Dinámico
 * =====================================================
 * Tipos TypeScript para configuración del footer CMS
 */

// ============ TIPOS BASE ============

export interface FooterConfig {
  column1: FooterContactColumn;
  column2: FooterLinksColumn;
  column3: FooterCategoriesColumn;
  column4: FooterMixedColumn;
}

// ============ COLUMNA 1: CONTACTO ============

export interface FooterContactColumn {
  type: 'contact';
  logoKey: string; // 'footer_logo' - key de site_settings
  slogan: string;
  addresses: ContactItem[];
  phones: ContactItem[];
  emails: ContactItem[];
}

export interface ContactItem {
  id: string;
  icon: string; // Lucide icon name: 'MapPin', 'Phone', 'Mail'
  text: string;
  order: number;
}

// ============ COLUMNA 2: LINKS PERSONALIZADOS ============

export interface FooterLinksColumn {
  type: 'links';
  title: string;
  items: FooterLinkItem[];
}

export interface FooterLinkItem {
  id: string;
  label: string;
  url: string;
  order: number;
  openNewTab?: boolean;
}

// ============ COLUMNA 3: CATEGORÍAS DINÁMICAS ============

export interface FooterCategoriesColumn {
  type: 'categories';
  title: string;
  source: 'dynamic' | 'manual';
  limit: number; // Cantidad máxima a mostrar
  manualItems?: FooterLinkItem[]; // Si source = 'manual'
}

// ============ COLUMNA 4: LINKS + SOCIALES ============

export interface FooterMixedColumn {
  type: 'mixed';
  title: string;
  links: FooterLinkItem[];
  socials: SocialLinkItem[];
}

export interface SocialLinkItem {
  id: string;
  platform: 'twitter' | 'facebook' | 'instagram' | 'whatsapp' | 'youtube' | 'tiktok' | 'linkedin';
  url: string;
  order: number;
}

// ============ HELPERS ============

export type ContactType = 'addresses' | 'phones' | 'emails';
export type ColumnNumber = 2 | 4;

// ============ CATEGORÍAS (para referencia) ============

export interface Category {
  id: string;
  name: string;
  slug: string;
  display_name?: string;
}
