/**
 * SSR Layout - Layout para páginas SEO
 * Rural24 SEO-First Architecture
 * 
 * Este layout envuelve todas las páginas del grupo (seo)
 */

import type { Metadata, Viewport } from 'next';
import './globals.css';

// ============================================================
// VIEWPORT CONFIG
// ============================================================
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#16a135',
};

// ============================================================
// DEFAULT METADATA
// ============================================================
export const metadata: Metadata = {
  metadataBase: new URL('https://rural24.com'),
  title: {
    default: 'Rural24 - Clasificados del Agro Argentino',
    template: '%s | Rural24'
  },
  description: 'El marketplace #1 del agro argentino. Comprá y vendé maquinaria agrícola, hacienda, insumos e inmuebles rurales.',
  keywords: [
    'clasificados agro',
    'maquinaria agrícola',
    'tractores usados',
    'ganadería',
    'campos en venta',
    'insumos agropecuarios',
    'argentina rural'
  ],
  authors: [{ name: 'Rural24' }],
  creator: 'Rural24',
  publisher: 'Rural24',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Rural24',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@rural24',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'tu-codigo-de-verificacion',
  },
};

// ============================================================
// LAYOUT COMPONENT
// ============================================================
export default function SEOLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // IMPORTANTE: No renderizar <html>/<body> aquí.
  // Solo el root layout (app/layout.tsx) puede tenerlos.
  return <>{children}</>;
}
