/**
 * SSR Home Page - Página principal con SSR para SEO
 * Rural24 SEO-First Architecture
 * 
 * URL: /
 * Esta página renderiza contenido SEO-friendly en el servidor
 */

import { Metadata } from 'next';
import { 
  getCategories, 
  getFeaturedAds, 
  getRecentAds,
  getAdsCount 
} from './utils/ssr-data';
import {
  SSRHeader,
  SSRFooter,
  AdCardGrid,
  CategoryCard,
  JsonLdOrganization,
  JsonLdItemList
} from './utils/ssr-components';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ============================================================
// METADATA
// ============================================================
export const metadata: Metadata = {
  title: 'Rural24 - Clasificados del Agro Argentino | Maquinaria, Hacienda, Insumos',
  description: 'El marketplace #1 del agro argentino. Comprá y vendé maquinaria agrícola, hacienda, insumos agropecuarios e inmuebles rurales. Publicá gratis tus avisos.',
  keywords: [
    'maquinaria agrícola',
    'tractores usados',
    'ganadería argentina',
    'insumos agropecuarios',
    'campos en venta',
    'clasificados del agro',
    'agro argentino',
    'rural24'
  ],
  openGraph: {
    title: 'Rural24 - Clasificados del Agro Argentino',
    description: 'El marketplace #1 del agro argentino. Maquinaria, hacienda, insumos e inmuebles rurales.',
    type: 'website',
    locale: 'es_AR',
    siteName: 'Rural24',
    images: [
      {
        url: 'https://rural24.com/og-home.jpg',
        width: 1200,
        height: 630,
        alt: 'Rural24 - Clasificados del Agro'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rural24 - Clasificados del Agro Argentino',
    description: 'El marketplace #1 del agro argentino'
  },
  alternates: {
    canonical: 'https://rural24.com'
  }
};

// ============================================================
// PAGE COMPONENT
// ============================================================
export default async function HomePage() {
  // Fetch data en paralelo
  const [categories, featuredAds, recentAds, totalAds] = await Promise.all([
    getCategories(),
    getFeaturedAds(8),
    getRecentAds(12),
    getAdsCount()
  ]);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <JsonLdOrganization />
      {featuredAds.length > 0 && (
        <JsonLdItemList ads={featuredAds} listName="Avisos destacados en Rural24" />
      )}

      <div className="min-h-screen bg-gray-50">
        <SSRHeader />
        
        <main>
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-primary-600 to-primary-700 text-white py-16">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                El Marketplace del Agro Argentino
              </h1>
              <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
                Comprá y vendé maquinaria agrícola, hacienda, insumos e inmuebles rurales. 
                Más de {totalAds.toLocaleString('es-AR')} avisos activos.
              </p>
              
              {/* Search Bar (decorativo, redirige a SPA) */}
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl p-2 flex gap-2 shadow-lg">
                  <input 
                    type="text" 
                    placeholder="¿Qué estás buscando? Ej: tractor John Deere, novillos, semillas..."
                    className="flex-1 px-4 py-3 text-gray-900 rounded-lg focus:outline-none"
                    onClick={() => {
                      // Redirige a la SPA para búsqueda interactiva
                    }}
                    readOnly
                  />
                  <a 
                    href={`${FRONTEND_URL}/#/buscar`}
                    className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600"
                  >
                    Buscar
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Categorías */}
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Explorá por Categoría
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          </section>

          {/* Avisos Destacados */}
          {featuredAds.length > 0 && (
            <section className="py-12 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">
                    ⭐ Avisos Destacados
                  </h2>
                  <a 
                    href={`${FRONTEND_URL}/#/destacados`}
                    className="text-primary-600 font-medium hover:text-primary-700"
                  >
                    Ver todos →
                  </a>
                </div>
                
                <AdCardGrid ads={featuredAds} />
              </div>
            </section>
          )}

          {/* Avisos Recientes */}
          {recentAds.length > 0 && (
            <section className="py-12 bg-white">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">
                    🆕 Publicados Recientemente
                  </h2>
                  <a 
                    href={`${FRONTEND_URL}/#/recientes`}
                    className="text-primary-600 font-medium hover:text-primary-700"
                  >
                    Ver todos →
                  </a>
                </div>
                
                <AdCardGrid ads={recentAds} />
              </div>
            </section>
          )}

          {/* CTA Publicar */}
          <section className="py-16 bg-gradient-to-r from-yellow-400 to-yellow-500">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold text-yellow-900 mb-4">
                ¿Tenés algo para vender?
              </h2>
              <p className="text-yellow-800 mb-8 text-lg">
                Publicá tu aviso gratis y llegá a miles de compradores del agro argentino.
              </p>
              <a 
                href={`${FRONTEND_URL}/#/publicar-aviso`}
                className="inline-block bg-yellow-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-800 transition-colors"
              >
                Publicar Aviso Gratis
              </a>
            </div>
          </section>

          {/* Información SEO */}
          <section className="py-12 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Rural24: Tu portal de clasificados del agro
              </h2>
              
              <div className="prose prose-lg text-gray-600">
                <p>
                  <strong>Rural24</strong> es el marketplace líder para el sector agropecuario argentino. 
                  Conectamos productores, vendedores y compradores de todo el país en una plataforma 
                  moderna, segura y fácil de usar.
                </p>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                  ¿Qué podés encontrar en Rural24?
                </h3>
                
                <ul className="space-y-2">
                  <li>
                    <a href="/maquinarias-agricolas" className="text-primary-600 hover:underline">
                      <strong>Maquinaria Agrícola:</strong>
                    </a> Tractores, cosechadoras, sembradoras, pulverizadoras, implementos y repuestos 
                    de todas las marcas.
                  </li>
                  <li>
                    <a href="/ganaderia" className="text-primary-600 hover:underline">
                      <strong>Ganadería:</strong>
                    </a> Hacienda vacuna, equinos, porcinos, ovinos, aves y más. Genética de calidad 
                    de los mejores establecimientos.
                  </li>
                  <li>
                    <a href="/insumos-agropecuarios" className="text-primary-600 hover:underline">
                      <strong>Insumos Agropecuarios:</strong>
                    </a> Semillas, fertilizantes, agroquímicos, alimentos balanceados, productos 
                    veterinarios y más.
                  </li>
                  <li>
                    <a href="/inmuebles-rurales" className="text-primary-600 hover:underline">
                      <strong>Inmuebles Rurales:</strong>
                    </a> Campos en venta y alquiler, chacras, establecimientos productivos en todas 
                    las provincias.
                  </li>
                  <li>
                    <a href="/servicios-rurales" className="text-primary-600 hover:underline">
                      <strong>Servicios Rurales:</strong>
                    </a> Contratistas, transporte de hacienda, servicios agrícolas, asesoramiento 
                    técnico y más.
                  </li>
                </ul>
                
                <p className="mt-6">
                  Con <strong>Rural24</strong> publicás tus avisos de forma gratuita y llegás a 
                  miles de potenciales compradores en todo el país. Nuestra plataforma está 
                  diseñada específicamente para las necesidades del campo argentino.
                </p>
              </div>
            </div>
          </section>
        </main>
        
        <SSRFooter />
      </div>
    </>
  );
}
