/**
 * SSR Category Page - Página de categoría con SSR para SEO
 * Rural24 SEO-First Architecture
 * 
 * URL: /[categoria]
 * Ejemplo: /maquinarias-agricolas
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { 
  getCategoryBySlug, 
  getSubcategoriesByCategorySlug,
  getAdsByCategory,
  getAdsCount
} from '../utils/ssr-data';
import {
  SSRHeader,
  SSRFooter,
  AdCardGrid,
  SubcategoryList,
  Breadcrumb,
  JsonLdBreadcrumb,
  JsonLdItemList
} from '../utils/ssr-components';

// ============================================================
// TYPES
// ============================================================
type Props = {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// ============================================================
// METADATA GENERATION
// ============================================================
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  const category = await getCategoryBySlug(categoria);
  
  if (!category) {
    return {
      title: 'Categoría no encontrada',
      description: 'La categoría que buscás no existe.'
    };
  }
  
  const displayName = category.display_name || category.name;
  const count = await getAdsCount({ categorySlug: categoria });
  
  return {
    title: `${displayName} - Clasificados del Agro | Rural24`,
    description: `Explorá ${count} avisos de ${displayName.toLowerCase()} en Argentina. Comprá y vendé con Rural24, el marketplace #1 del agro argentino.`,
    keywords: [
      displayName.toLowerCase(),
      `${displayName.toLowerCase()} en venta`,
      `${displayName.toLowerCase()} argentina`,
      'clasificados agro',
      'rural24'
    ],
    openGraph: {
      title: `${displayName} | Rural24`,
      description: `${count} avisos de ${displayName.toLowerCase()} disponibles`,
      type: 'website',
      locale: 'es_AR',
      siteName: 'Rural24',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} | Rural24`,
    },
    alternates: {
      canonical: `https://rural24.com/${categoria}`
    }
  };
}

// ============================================================
// PAGE COMPONENT
// ============================================================
export default async function CategoryPage({ params, searchParams }: Props) {
  const { categoria } = await params;
  const queryParams = await searchParams;
  
  // Fetch data en paralelo
  const [category, subcategories, ads] = await Promise.all([
    getCategoryBySlug(categoria),
    getSubcategoriesByCategorySlug(categoria),
    getAdsByCategory(categoria, 24)
  ]);
  
  if (!category) {
    notFound();
  }
  
  const displayName = category.display_name || category.name;
  const totalAds = await getAdsCount({ categorySlug: categoria });
  
  const breadcrumbItems = [
    { label: displayName, href: `/${categoria}` }
  ];

  return (
    <>
      {/* JSON-LD Structured Data */}
      <JsonLdBreadcrumb items={breadcrumbItems} />
      {ads.length > 0 && (
        <JsonLdItemList ads={ads} listName={`${displayName} en Rural24`} />
      )}

      <div className="min-h-screen bg-gray-50">
        <SSRHeader />
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <Breadcrumb items={[{ label: displayName }]} />
          
          {/* Header de categoría */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center text-3xl">
                {category.icon || '📦'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {displayName}
                </h1>
                <p className="text-gray-500">
                  {totalAds.toLocaleString('es-AR')} avisos disponibles
                </p>
              </div>
            </div>
            
            {category.description && (
              <p className="text-gray-600">
                {category.description}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Subcategorías */}
            <aside className="lg:col-span-1">
              {subcategories.length > 0 && (
                <SubcategoryList 
                  subcategories={subcategories} 
                  categorySlug={categoria} 
                />
              )}
              
              {/* CTA Publicar */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 mt-6 text-white">
                <h3 className="font-bold text-lg mb-2">
                  ¿Tenés algo para vender?
                </h3>
                <p className="text-primary-100 text-sm mb-4">
                  Publicá tu aviso gratis y llegá a miles de compradores.
                </p>
                <a 
                  href="http://localhost:5173/#/publicar-aviso"
                  className="block text-center bg-white text-primary-600 font-semibold py-2 px-4 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Publicar Gratis
                </a>
              </div>
            </aside>
            
            {/* Main Content - Avisos */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Avisos en {displayName}
                </h2>
                
                {/* Link a SPA para búsqueda avanzada */}
                <a 
                  href={`http://localhost:5173/#/categoria/${categoria}`}
                  className="text-primary-600 font-medium hover:text-primary-700"
                >
                  Ver con filtros →
                </a>
              </div>
              
              <AdCardGrid ads={ads} />
              
              {/* Paginación simple */}
              {totalAds > ads.length && (
                <div className="mt-8 text-center">
                  <a 
                    href={`http://localhost:5173/#/categoria/${categoria}`}
                    className="inline-block bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors"
                  >
                    Ver los {totalAds.toLocaleString('es-AR')} avisos →
                  </a>
                </div>
              )}
            </div>
          </div>
          
          {/* Contenido SEO */}
          <section className="mt-12 bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {displayName} en Rural24
            </h2>
            <div className="prose prose-lg text-gray-600 max-w-none">
              <p>
                Encontrá los mejores avisos de <strong>{displayName.toLowerCase()}</strong> en Argentina. 
                Rural24 es el marketplace #1 del agro argentino, donde productores y vendedores de 
                todo el país publican sus productos y servicios.
              </p>
              
              {subcategories.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                    Subcategorías de {displayName}
                  </h3>
                  <ul className="columns-2 gap-4">
                    {subcategories.map((sub) => (
                      <li key={sub.id}>
                        <a 
                          href={`/${categoria}/${sub.slug}`}
                          className="text-primary-600 hover:underline"
                        >
                          {sub.display_name || sub.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              
              <p className="mt-6">
                Publicá gratis tus avisos de {displayName.toLowerCase()} y llegá a miles de 
                compradores interesados. En Rural24 conectamos al campo argentino.
              </p>
            </div>
          </section>
        </main>
        
        <SSRFooter />
      </div>
    </>
  );
}
