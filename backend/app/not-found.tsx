/**
 * SSR Not Found Page - Página 404 personalizada
 * Rural24 SEO-First Architecture
 */

// Forzar renderizado dinámico para evitar error de pre-render en Next.js 15.5+
// con App Router: '<Html> should not be imported outside of pages/_document'
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { SSRHeader, SSRFooter } from './(seo)/utils/ssr-components';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SSRHeader />
      
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-8xl mb-6">🚜</div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Página no encontrada
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Lo sentimos, la página que buscás no existe o fue movida. 
            Quizás el aviso ya no está disponible.
          </p>
          
          <div className="space-y-4">
            <Link 
              href="/"
              className="block w-full bg-primary-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary-600 transition-colors"
            >
              Volver al inicio
            </Link>
            
            <Link 
              href="/maquinarias-agricolas"
              className="block w-full bg-white text-primary-600 font-semibold py-3 px-6 rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors"
            >
              Explorar maquinarias
            </Link>
          </div>
          
          <p className="mt-8 text-sm text-gray-500">
            ¿Necesitás ayuda? <a href="/contacto" className="text-primary-600 hover:underline">Contactanos</a>
          </p>
        </div>
      </main>
      
      <SSRFooter />
    </div>
  );
}
