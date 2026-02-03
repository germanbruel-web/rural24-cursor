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
  return (
    <html lang="es">
      <head>
        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Google Fonts */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
