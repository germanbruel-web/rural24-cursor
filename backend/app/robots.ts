/**
 * Robots.txt - Configuración para crawlers
 * Rural24 SEO-First Architecture
 * 
 * URL: /robots.txt
 */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://rural24.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',           // No indexar endpoints API
          '/admin/',         // No indexar admin
          '/_next/',         // No indexar assets internos
          '/private/',       // No indexar rutas privadas
          '/*?*',            // No indexar URLs con query params
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
