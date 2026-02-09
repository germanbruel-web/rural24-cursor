/**
 * SSR Components - Componentes UI para páginas SSR
 * Rural24 SEO-First Architecture
 * 
 * Design System: Tailwind CSS con tokens Rural24
 */

import React from 'react';
import { formatPrice, getImageUrl, getAdUrl, truncateText } from './ssr-data';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ============================================================
// DESIGN TOKENS
// ============================================================
const colors = {
  primary: '#16a135',
  primaryDark: '#0d7a28',
  secondary: '#f59e0b',
  background: '#f8fafc',
  text: '#1e293b',
  textMuted: '#64748b',
  border: '#e2e8f0',
  white: '#ffffff',
};

// ============================================================
// LAYOUT COMPONENTS
// ============================================================

export function SSRLayout({ 
  children, 
  title,
  description,
  canonical,
  ogImage
}: { 
  children: React.ReactNode;
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
}) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        {canonical && <link rel="canonical" href={canonical} />}
        
        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        {ogImage && <meta property="og:image" content={ogImage} />}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        
        {/* Tailwind CSS via CDN para SSR */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    primary: {
                      50: '#f0fdf4',
                      100: '#dcfce7',
                      500: '#16a135',
                      600: '#0d7a28',
                      700: '#0a5f1f',
                    }
                  }
                }
              }
            }
          `
        }} />
      </head>
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <SSRHeader />
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
        <SSRFooter />
      </body>
    </html>
  );
}

export function SSRHeader() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <span className="text-xl font-bold text-primary-600">Rural24</span>
          </a>
          
          {/* Navegación */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="/maquinarias-agricolas" className="text-gray-600 hover:text-primary-600 font-medium">
              Maquinarias
            </a>
            <a href="/ganaderia" className="text-gray-600 hover:text-primary-600 font-medium">
              Ganadería
            </a>
            <a href="/insumos-agropecuarios" className="text-gray-600 hover:text-primary-600 font-medium">
              Insumos
            </a>
            <a href="/inmuebles-rurales" className="text-gray-600 hover:text-primary-600 font-medium">
              Inmuebles
            </a>
          </nav>
          
          {/* CTA */}
          <a 
            href={`${FRONTEND_URL}/#/publicar-aviso`} 
            className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors"
          >
            Publicar Gratis
          </a>
        </div>
      </div>
    </header>
  );
}

export function SSRFooter() {
  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🌾</span>
              <span className="text-xl font-bold">Rural24</span>
            </div>
            <p className="text-gray-400 text-sm">
              El marketplace #1 del agro argentino. Comprá y vendé maquinaria, 
              hacienda, insumos e inmuebles rurales.
            </p>
          </div>
          
          {/* Categorías */}
          <div>
            <h3 className="font-semibold mb-4">Categorías</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/maquinarias-agricolas" className="hover:text-white">Maquinarias Agrícolas</a></li>
              <li><a href="/ganaderia" className="hover:text-white">Ganadería</a></li>
              <li><a href="/insumos-agropecuarios" className="hover:text-white">Insumos Agropecuarios</a></li>
              <li><a href="/inmuebles-rurales" className="hover:text-white">Inmuebles Rurales</a></li>
              <li><a href="/servicios-rurales" className="hover:text-white">Servicios Rurales</a></li>
            </ul>
          </div>
          
          {/* Links útiles */}
          <div>
            <h3 className="font-semibold mb-4">Información</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/como-funciona" className="hover:text-white">Cómo funciona</a></li>
              <li><a href="/planes" className="hover:text-white">Planes y precios</a></li>
              <li><a href="/contacto" className="hover:text-white">Contacto</a></li>
              <li><a href="/terminos" className="hover:text-white">Términos y condiciones</a></li>
            </ul>
          </div>
          
          {/* Contacto */}
          <div>
            <h3 className="font-semibold mb-4">Contacto</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📧 info@rural24.com</li>
              <li>📱 WhatsApp: +54 9 11 XXXX-XXXX</li>
              <li>🇦🇷 Argentina</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          © 2026 Rural24. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// AD CARD COMPONENTS
// ============================================================

export function AdCard({ ad }: { ad: any }) {
  const imageUrl = getImageUrl(ad);
  const adUrl = getAdUrl(ad);
  const priceText = ad.price_negotiable ? 'A convenir' : formatPrice(ad.price, ad.currency);
  
  return (
    <a 
      href={adUrl}
      className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
    >
      {/* Imagen */}
      <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
        <img 
          src={imageUrl} 
          alt={ad.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {ad.featured && (
          <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
            ⭐ Destacado
          </span>
        )}
      </div>
      
      {/* Contenido */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
          {ad.title}
        </h3>
        
        <p className="text-lg font-bold text-primary-600 mb-2">
          {priceText}
        </p>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>📍</span>
          <span>{ad.location || ad.province || 'Argentina'}</span>
        </div>
      </div>
    </a>
  );
}

export function AdCardGrid({ ads, title }: { ads: any[]; title?: string }) {
  if (!ads || ads.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay avisos disponibles en esta categoría.
      </div>
    );
  }
  
  return (
    <section>
      {title && (
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} />
        ))}
      </div>
    </section>
  );
}

// ============================================================
// CATEGORY COMPONENTS
// ============================================================

export function CategoryCard({ category, count }: { category: any; count?: number }) {
  return (
    <a 
      href={`/${category.slug}`}
      className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-primary-200"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center text-2xl">
          {category.icon || '📦'}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">
            {category.display_name || category.name}
          </h3>
          {count !== undefined && (
            <p className="text-sm text-gray-500">{count} avisos</p>
          )}
        </div>
      </div>
    </a>
  );
}

export function SubcategoryList({ subcategories, categorySlug }: { subcategories: any[]; categorySlug: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">Subcategorías</h3>
      <ul className="space-y-2">
        {subcategories.map((sub) => (
          <li key={sub.id}>
            <a 
              href={`/${categorySlug}/${sub.slug}`}
              className="block py-2 px-3 rounded-lg text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
            >
              {sub.display_name || sub.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================
// BREADCRUMB
// ============================================================

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm text-gray-500">
        <li>
          <a href="/" className="hover:text-primary-600">Inicio</a>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <span>/</span>
            {item.href ? (
              <a href={item.href} className="hover:text-primary-600">
                {item.label}
              </a>
            ) : (
              <span className="text-gray-900 font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ============================================================
// JSON-LD STRUCTURED DATA
// ============================================================

export function JsonLdOrganization() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Rural24",
    "url": "https://rural24.com",
    "logo": "https://rural24.com/logo.png",
    "description": "El marketplace #1 del agro argentino. Maquinaria agrícola, ganadería, insumos e inmuebles rurales.",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "AR"
    }
  };
  
  return (
    <script 
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function JsonLdBreadcrumb({ items }: { items: { label: string; href: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://rural24.com"
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 2,
        "name": item.label,
        "item": `https://rural24.com${item.href}`
      }))
    ]
  };
  
  return (
    <script 
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function JsonLdProduct({ ad, category, subcategory }: { ad: any; category?: any; subcategory?: any }) {
  const imageUrl = getImageUrl(ad);
  
  const data: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": ad.title,
    "description": ad.description || ad.title,
    "image": imageUrl,
    "sku": ad.short_id,
    "category": subcategory?.display_name || category?.display_name || "Agropecuario",
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "priceCurrency": ad.currency || "ARS",
      "seller": {
        "@type": "Organization",
        "name": "Rural24"
      }
    }
  };
  
  // Solo agregar precio si existe y no es "a convenir"
  if (ad.price && !ad.price_negotiable) {
    data.offers.price = ad.price;
  }
  
  // Agregar ubicación si existe
  if (ad.province || ad.location) {
    data.offers.areaServed = {
      "@type": "Place",
      "name": ad.location || ad.province
    };
  }
  
  return (
    <script 
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function JsonLdItemList({ ads, listName }: { ads: any[]; listName: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": listName,
    "numberOfItems": ads.length,
    "itemListElement": ads.slice(0, 20).map((ad, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://rural24.com${getAdUrl(ad)}`,
      "name": ad.title
    }))
  };
  
  return (
    <script 
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
