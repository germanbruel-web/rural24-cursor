/**
 * =====================================================
 * FOOTER DEFAULTS - Configuración por Defecto
 * =====================================================
 */

import type { FooterConfig } from '../types/footer';

/**
 * Configuración por defecto del footer
 * Se usa cuando no existe config en BD o falla el parsing
 */
export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  column1: {
    type: 'contact',
    logoKey: 'footer_logo',
    slogan: 'Conectando el Campo',
    addresses: [
      {
        id: 'addr-1',
        icon: 'MapPin',
        text: 'Buenos Aires, Argentina',
        order: 1
      }
    ],
    phones: [
      {
        id: 'phone-1',
        icon: 'Phone',
        text: '+54 9 11 1234-5678',
        order: 1
      }
    ],
    emails: [
      {
        id: 'email-1',
        icon: 'Mail',
        text: 'contacto@rural24.com',
        order: 1
      }
    ]
  },
  column2: {
    type: 'links',
    title: 'Sobre Nosotros',
    items: [
      {
        id: 'link-2-1',
        label: 'Quiénes somos',
        url: '#/about',
        order: 1,
        openNewTab: false
      },
      {
        id: 'link-2-2',
        label: 'Nuestra historia',
        url: '#/history',
        order: 2,
        openNewTab: false
      },
      {
        id: 'link-2-3',
        label: 'Términos y condiciones',
        url: '#/terms',
        order: 3,
        openNewTab: false
      },
      {
        id: 'link-2-4',
        label: 'Política de privacidad',
        url: '#/privacy',
        order: 4,
        openNewTab: false
      },
      {
        id: 'link-2-5',
        label: 'Preguntas frecuentes',
        url: '#/faq',
        order: 5,
        openNewTab: false
      }
    ]
  },
  column3: {
    type: 'categories',
    title: 'Categorías Principales',
    source: 'dynamic',
    limit: 6
  },
  column4: {
    type: 'mixed',
    title: 'Links del Sitio',
    links: [
      {
        id: 'link-4-1',
        label: 'Novedades',
        url: '#/news',
        order: 1,
        openNewTab: false
      },
      {
        id: 'link-4-2',
        label: 'Blog agropecuario',
        url: '#/blog',
        order: 2,
        openNewTab: false
      },
      {
        id: 'link-4-3',
        label: 'Publicar aviso',
        url: '#/publicar-v2',
        order: 3,
        openNewTab: false
      },
      {
        id: 'link-4-4',
        label: 'Contacto',
        url: '#/contact',
        order: 4,
        openNewTab: false
      }
    ],
    socials: [
      {
        id: 'social-1',
        platform: 'twitter',
        url: 'https://twitter.com/rural24',
        order: 1
      },
      {
        id: 'social-2',
        platform: 'facebook',
        url: 'https://facebook.com/rural24',
        order: 2
      },
      {
        id: 'social-3',
        platform: 'instagram',
        url: 'https://instagram.com/rural24',
        order: 3
      },
      {
        id: 'social-4',
        platform: 'whatsapp',
        url: 'https://wa.me/5491112345678',
        order: 4
      },
      {
        id: 'social-5',
        platform: 'youtube',
        url: 'https://youtube.com/@rural24',
        order: 5
      }
    ]
  }
};

/**
 * Categorías de fallback si BD no retorna resultados
 */
export const FALLBACK_CATEGORIES = [
  { id: 'cat-1', name: 'Maquinarias', slug: 'maquinarias', display_name: 'Maquinarias' },
  { id: 'cat-2', name: 'Ganadería', slug: 'ganaderia', display_name: 'Ganadería' },
  { id: 'cat-3', name: 'Insumos', slug: 'insumos', display_name: 'Insumos' },
  { id: 'cat-4', name: 'Inmuebles', slug: 'inmuebles', display_name: 'Inmuebles' },
  { id: 'cat-5', name: 'Servicios', slug: 'servicios', display_name: 'Servicios' },
  { id: 'cat-6', name: 'Equipos', slug: 'equipos', display_name: 'Equipos' }
];
