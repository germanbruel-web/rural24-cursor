/**
 * SSR Ad Detail Page - Página de detalle de aviso con SSR para SEO
 * Rural24 SEO-First Architecture
 * 
 * URL: /aviso/[slug]
 * Ejemplo: /aviso/tractor-john-deere-7200-abc123
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { 
  getAdBySlug,
  getCategoryBySlug,
  getSubcategoryBySlug,
  getAdsByCategory,
  formatPrice,
  getImageUrl,
  truncateText
} from '../../utils/ssr-data';
import {
  SSRHeader,
  SSRFooter,
  AdCardGrid,
  Breadcrumb,
  JsonLdBreadcrumb,
  JsonLdProduct
} from '../../utils/ssr-components';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ============================================================
// TYPES
// ============================================================
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// ============================================================
// METADATA GENERATION
// ============================================================
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ad = await getAdBySlug(slug);
  
  if (!ad) {
    return {
      title: 'Aviso no encontrado',
      description: 'El aviso que buscás no existe o fue eliminado.'
    };
  }
  
  const imageUrl = getImageUrl(ad);
  const priceText = ad.price_negotiable ? 'Precio a convenir' : formatPrice(ad.price, ad.currency);
  const description = ad.description 
    ? truncateText(ad.description, 160) 
    : `${ad.title} - ${priceText}. ${ad.province || 'Argentina'}`;
  
  return {
    title: `${ad.title} - ${priceText}`,
    description,
    openGraph: {
      title: ad.title,
      description,
      type: 'website',
      locale: 'es_AR',
      siteName: 'Rural24',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: ad.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: ad.title,
      description,
      images: [imageUrl]
    },
    alternates: {
      canonical: `https://rural24.com/aviso/${slug}`
    }
  };
}

// ============================================================
// PAGE COMPONENT
// ============================================================
export default async function AdDetailPage({ params }: Props) {
  const { slug } = await params;
  
  const ad = await getAdBySlug(slug);
  
  if (!ad) {
    notFound();
  }
  
  // Fetch categoría y subcategoría para breadcrumb y avisos relacionados
  const [category, subcategory, relatedAds] = await Promise.all([
    ad.category_id ? getCategoryBySlug(ad.category?.slug) : null,
    ad.subcategory_id ? getSubcategoryBySlug(ad.subcategory?.slug, ad.category?.slug) : null,
    ad.category_id ? getAdsByCategory(ad.category?.slug, 4) : []
  ]);
  
  const categoryName = category?.display_name || category?.name || 'Categoría';
  const categorySlug = category?.slug || ad.category?.slug;
  const subcategoryName = subcategory?.display_name || subcategory?.name;
  const subcategorySlug = subcategory?.slug || ad.subcategory?.slug;
  
  const imageUrl = getImageUrl(ad);
  const priceText = ad.price_negotiable ? 'A convenir' : formatPrice(ad.price, ad.currency);
  
  // Construir breadcrumb
  const breadcrumbItems: { label: string; href?: string }[] = [];
  if (categorySlug) {
    breadcrumbItems.push({ label: categoryName, href: `/${categorySlug}` });
  }
  if (subcategorySlug) {
    breadcrumbItems.push({ label: subcategoryName || '', href: `/${categorySlug}/${subcategorySlug}` });
  }
  breadcrumbItems.push({ label: truncateText(ad.title, 50) });

  // Parsear imágenes
  const images = ad.images || [];
  const allImages = [imageUrl, ...images.slice(1).map((img: any) => 
    typeof img === 'string' ? img : img.url
  )].filter(Boolean);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <JsonLdBreadcrumb items={breadcrumbItems.filter(i => i.href).map(i => ({ label: i.label, href: i.href! }))} />
      <JsonLdProduct ad={ad} category={category} subcategory={subcategory} />

      <div className="min-h-screen bg-gray-50">
        <SSRHeader />
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumbItems} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna principal */}
            <div className="lg:col-span-2">
              {/* Galería de imágenes */}
              <div className="bg-white rounded-xl overflow-hidden shadow-sm mb-6">
                <div className="aspect-[4/3] relative">
                  <img 
                    src={imageUrl} 
                    alt={ad.title}
                    className="w-full h-full object-contain bg-gray-100"
                  />
                  {ad.featured && (
                    <span className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-sm font-bold px-3 py-1 rounded-lg">
                      ⭐ Destacado
                    </span>
                  )}
                </div>
                
                {/* Thumbnails */}
                {allImages.length > 1 && (
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex gap-2 overflow-x-auto">
                      {allImages.slice(0, 6).map((img, index) => (
                        <div 
                          key={index}
                          className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 border-gray-200"
                        >
                          <img 
                            src={img} 
                            alt={`${ad.title} - Imagen ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {allImages.length > 6 && (
                        <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-medium">
                          +{allImages.length - 6}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Descripción */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Descripción</h2>
                <div className="prose prose-lg text-gray-600 max-w-none whitespace-pre-wrap">
                  {ad.description || 'Sin descripción disponible.'}
                </div>
                
                {/* Atributos */}
                {ad.attributes && Object.keys(ad.attributes).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Características</h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(ad.attributes).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-gray-50">
                          <dt className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                          <dd className="font-medium text-gray-900">{String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Card de precio y contacto */}
              <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {ad.title}
                </h1>
                
                <p className="text-3xl font-bold text-primary-600 mb-4">
                  {priceText}
                </p>
                
                {/* Ubicación */}
                <div className="flex items-center gap-2 text-gray-600 mb-6">
                  <span>📍</span>
                  <span>{ad.location || ad.province || 'Argentina'}</span>
                </div>
                
                {/* Botón de contacto - redirige a SPA */}
                <a 
                  href={`${FRONTEND_URL}/#/aviso/${slug}`}
                  className="block w-full bg-primary-500 text-white text-center font-semibold py-3 px-4 rounded-lg hover:bg-primary-600 transition-colors mb-3"
                >
                  Ver contacto del vendedor
                </a>
                
                <a 
                  href={`${FRONTEND_URL}/#/aviso/${slug}?action=whatsapp`}
                  className="block w-full bg-green-500 text-white text-center font-semibold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
                >
                  📱 Contactar por WhatsApp
                </a>
                
                {/* Info del aviso */}
                <div className="mt-6 pt-6 border-t border-gray-100 text-sm text-gray-500">
                  <p>ID: {ad.short_id || ad.id}</p>
                  {ad.created_at && (
                    <p>Publicado: {new Date(ad.created_at).toLocaleDateString('es-AR')}</p>
                  )}
                  {ad.views_count && (
                    <p>👁️ {ad.views_count} visitas</p>
                  )}
                </div>
              </div>
              
              {/* Aviso legal */}
              <div className="bg-yellow-50 rounded-xl p-4 mt-6 text-sm text-yellow-800">
                <p className="font-medium mb-1">⚠️ Consejos de seguridad</p>
                <ul className="text-xs space-y-1">
                  <li>• Verificá el producto antes de pagar</li>
                  <li>• No envíes dinero por adelantado</li>
                  <li>• Reunite en lugares seguros</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Avisos relacionados */}
          {relatedAds.length > 0 && (
            <section className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Avisos similares
                </h2>
                {categorySlug && (
                  <a 
                    href={`/${categorySlug}`}
                    className="text-primary-600 font-medium hover:text-primary-700"
                  >
                    Ver más en {categoryName} →
                  </a>
                )}
              </div>
              
              <AdCardGrid 
                ads={relatedAds.filter(a => a.id !== ad.id).slice(0, 4)} 
              />
            </section>
          )}
        </main>
        
        <SSRFooter />
      </div>
    </>
  );
}
