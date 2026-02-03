/**
 * SSR Subcategory Page - Página de subcategoría con SSR para SEO
 * Rural24 SEO-First Architecture
 * 
 * URL: /[categoria]/[subcategoria]
 * Ejemplo: /maquinarias-agricolas/tractores
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { 
  getCategoryBySlug,
  getSubcategoryBySlug,
  getSubcategoriesByCategorySlug,
  getAdsBySubcategory,
  getAdsCount
} from '../../utils/ssr-data';
import {
  SSRHeader,
  SSRFooter,
  AdCardGrid,
  SubcategoryList,
  Breadcrumb,
  JsonLdBreadcrumb,
  JsonLdItemList
} from '../../utils/ssr-components';

// ============================================================
// TYPES
// ============================================================
type Props = {
  params: Promise<{ categoria: string; subcategoria: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// ============================================================
// METADATA GENERATION
// ============================================================
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria, subcategoria } = await params;
  
  const [category, subcategory] = await Promise.all([
    getCategoryBySlug(categoria),
    getSubcategoryBySlug(subcategoria, categoria)
  ]);
  
  if (!category || !subcategory) {
    return {
      title: 'Subcategoría no encontrada',
      description: 'La subcategoría que buscás no existe.'
    };
  }
  
  const categoryName = category.display_name || category.name;
  const subcategoryName = subcategory.display_name || subcategory.name;
  const count = await getAdsCount({ subcategorySlug: subcategoria });
  
  return {
    title: `${subcategoryName} - ${categoryName} | Rural24`,
    description: `Explorá ${count} avisos de ${subcategoryName.toLowerCase()} en Argentina. ${categoryName} en Rural24, el marketplace #1 del agro argentino.`,
    keywords: [
      subcategoryName.toLowerCase(),
      `${subcategoryName.toLowerCase()} en venta`,
      `${subcategoryName.toLowerCase()} usados`,
      `${subcategoryName.toLowerCase()} argentina`,
      categoryName.toLowerCase(),
      'rural24'
    ],
    openGraph: {
      title: `${subcategoryName} | Rural24`,
      description: `${count} avisos de ${subcategoryName.toLowerCase()} disponibles`,
      type: 'website',
      locale: 'es_AR',
      siteName: 'Rural24',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${subcategoryName} | Rural24`,
    },
    alternates: {
      canonical: `https://rural24.com/${categoria}/${subcategoria}`
    }
  };
}

// ============================================================
// PAGE COMPONENT
// ============================================================
export default async function SubcategoryPage({ params }: Props) {
  const { categoria, subcategoria } = await params;
  
  // Fetch data en paralelo
  const [category, subcategory, subcategories, ads] = await Promise.all([
    getCategoryBySlug(categoria),
    getSubcategoryBySlug(subcategoria, categoria),
    getSubcategoriesByCategorySlug(categoria),
    getAdsBySubcategory(subcategoria, 24)
  ]);
  
  if (!category || !subcategory) {
    notFound();
  }
  
  const categoryName = category.display_name || category.name;
  const subcategoryName = subcategory.display_name || subcategory.name;
  const totalAds = await getAdsCount({ subcategorySlug: subcategoria });
  
  const breadcrumbItems = [
    { label: categoryName, href: `/${categoria}` },
    { label: subcategoryName, href: `/${categoria}/${subcategoria}` }
  ];

  return (
    <>
      {/* JSON-LD Structured Data */}
      <JsonLdBreadcrumb items={breadcrumbItems} />
      {ads.length > 0 && (
        <JsonLdItemList ads={ads} listName={`${subcategoryName} en Rural24`} />
      )}

      <div className="min-h-screen bg-gray-50">
        <SSRHeader />
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <Breadcrumb items={[
            { label: categoryName, href: `/${categoria}` },
            { label: subcategoryName }
          ]} />
          
          {/* Header de subcategoría */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center text-3xl">
                {subcategory.icon || category.icon || '📦'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {subcategoryName}
                </h1>
                <p className="text-gray-500">
                  {totalAds.toLocaleString('es-AR')} avisos en {categoryName}
                </p>
              </div>
            </div>
            
            {subcategory.description && (
              <p className="text-gray-600">
                {subcategory.description}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              {/* Otras subcategorías */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Otras subcategorías
                </h3>
                <ul className="space-y-2">
                  {subcategories
                    .filter(s => s.slug !== subcategoria)
                    .map((sub) => (
                      <li key={sub.id}>
                        <a 
                          href={`/${categoria}/${sub.slug}`}
                          className="block py-2 px-3 rounded-lg text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                        >
                          {sub.display_name || sub.name}
                        </a>
                      </li>
                    ))}
                </ul>
                
                <a 
                  href={`/${categoria}`}
                  className="block mt-4 text-center text-primary-600 font-medium hover:text-primary-700"
                >
                  ← Ver toda la categoría
                </a>
              </div>
              
              {/* CTA Publicar */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 mt-6 text-white">
                <h3 className="font-bold text-lg mb-2">
                  ¿Tenés {subcategoryName.toLowerCase()} para vender?
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
                  {subcategoryName} en venta
                </h2>
                
                {/* Link a SPA para búsqueda avanzada */}
                <a 
                  href={`http://localhost:5173/#/categoria/${categoria}/${subcategoria}`}
                  className="text-primary-600 font-medium hover:text-primary-700"
                >
                  Filtrar resultados →
                </a>
              </div>
              
              <AdCardGrid ads={ads} />
              
              {/* Paginación */}
              {totalAds > ads.length && (
                <div className="mt-8 text-center">
                  <a 
                    href={`http://localhost:5173/#/categoria/${categoria}/${subcategoria}`}
                    className="inline-block bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors"
                  >
                    Ver los {totalAds.toLocaleString('es-AR')} {subcategoryName.toLowerCase()} →
                  </a>
                </div>
              )}
            </div>
          </div>
          
          {/* Contenido SEO */}
          <section className="mt-12 bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {subcategoryName} en Argentina - Rural24
            </h2>
            <div className="prose prose-lg text-gray-600 max-w-none">
              <p>
                Encontrá los mejores <strong>{subcategoryName.toLowerCase()}</strong> del país en Rural24. 
                Tenemos {totalAds.toLocaleString('es-AR')} avisos de {subcategoryName.toLowerCase()} publicados 
                por vendedores de toda Argentina.
              </p>
              
              <p>
                En la sección de <a href={`/${categoria}`} className="text-primary-600 hover:underline">{categoryName}</a> de 
                Rural24 podés encontrar {subcategoryName.toLowerCase()} nuevos y usados, comparar precios y 
                contactar directamente con los vendedores.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                ¿Por qué elegir Rural24 para comprar {subcategoryName.toLowerCase()}?
              </h3>
              
              <ul>
                <li>✅ Miles de avisos verificados de todo el país</li>
                <li>✅ Contacto directo con vendedores sin intermediarios</li>
                <li>✅ Filtros avanzados para encontrar exactamente lo que buscás</li>
                <li>✅ Plataforma segura diseñada para el agro argentino</li>
              </ul>
              
              <p className="mt-6">
                ¿Tenés {subcategoryName.toLowerCase()} para vender? <a href="http://localhost:5173/#/publicar-aviso" className="text-primary-600 hover:underline font-semibold">Publicá gratis tu aviso</a> y 
                llegá a miles de compradores interesados.
              </p>
            </div>
          </section>
        </main>
        
        <SSRFooter />
      </div>
    </>
  );
}
