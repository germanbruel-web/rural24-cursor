/**
 * SearchSEO.tsx
 * Componente para optimización SEO de búsquedas
 * 
 * Features:
 * - Structured Data (JSON-LD) para sugerencias
 * - Meta tags dinámicos
 * - Pre-renderizado de queries populares
 * - Sitemap data para crawlers
 */

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';

interface SearchSuggestion {
  query: string;
  category?: string;
  url: string;
  count?: number;
}

interface SearchSEOProps {
  suggestions?: SearchSuggestion[];
  currentQuery?: string;
  resultCount?: number;
}

export const SearchSEO: React.FC<SearchSEOProps> = ({
  suggestions = [],
  currentQuery,
  resultCount,
}) => {
  const [popularQueries, setPopularQueries] = useState<SearchSuggestion[]>([]);

  useEffect(() => {
    // Cargar sugerencias populares desde API o usar las props
    if (suggestions.length > 0) {
      setPopularQueries(suggestions);
    } else {
      loadPopularQueries();
    }
  }, [suggestions]);

  const loadPopularQueries = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/search/popular`);
      
      if (response.ok) {
        const data = await response.json();
        setPopularQueries(data.queries || []);
      }
    } catch (error) {
      console.debug('No se pudieron cargar queries populares para SEO');
    }
  };

  // Structured Data para búsquedas
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Rural24',
    url: 'https://rural24.com.ar',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://rural24.com.ar/#/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  // Sugerencias como ItemList para SEO
  const suggestionsStructuredData = popularQueries.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Búsquedas Populares en Rural24',
    description: 'Las búsquedas más populares de productos agrícolas, maquinarias y servicios rurales',
    itemListElement: popularQueries.map((suggestion, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: suggestion.query,
      url: `https://rural24.com.ar${suggestion.url}`,
    })),
  } : null;

  // Meta tags dinámicos según búsqueda actual
  const title = currentQuery
    ? `${currentQuery} - Búsqueda en Rural24`
    : 'Rural24 - Marketplace Agrícola - Tractores, Campos, Maquinarias';

  const description = currentQuery
    ? `Encontrá ${currentQuery} en Rural24. ${
        resultCount ? `${resultCount} resultados disponibles.` : ''
      } El marketplace líder del campo argentino.`
    : 'Encontrá tractores, cosechadoras, campos en venta, semillas y más. El marketplace más completo del agro argentino con miles de productos y servicios.';

  const keywords = [
    'rural24',
    'agro',
    'campo',
    'maquinaria agrícola',
    'tractores',
    'cosechadoras',
    'campos en venta',
    'semillas',
    ...(currentQuery ? [currentQuery] : []),
    ...popularQueries.slice(0, 5).map(s => s.query),
  ].join(', ');

  return (
    <>
      <Helmet>
        {/* Basic Meta Tags */}
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />

        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Rural24" />
        <meta property="og:locale" content="es_AR" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>

        {suggestionsStructuredData && (
          <script type="application/ld+json">
            {JSON.stringify(suggestionsStructuredData)}
          </script>
        )}

        {/* Canonical URL */}
        {currentQuery && (
          <link
            rel="canonical"
            href={`https://rural24.com.ar/#/search?q=${encodeURIComponent(
              currentQuery
            )}`}
          />
        )}

        {/* Preconnect to API */}
        <link rel="preconnect" href={import.meta.env.VITE_API_URL || ''} />
        <link rel="dns-prefetch" href={import.meta.env.VITE_API_URL || ''} />
      </Helmet>

      {/* Hidden SEO content - Los crawlers lo leen, los usuarios no lo ven */}
      <div className="sr-only" aria-hidden="true">
        <h2>Búsquedas Populares</h2>
        <ul>
          {popularQueries.map((suggestion, index) => (
            <li key={index}>
              <a href={suggestion.url}>{suggestion.query}</a>
              {suggestion.category && ` en ${suggestion.category}`}
            </li>
          ))}
        </ul>

        <h2>Categorías Principales</h2>
        <nav>
          <ul>
            <li><a href="/#/search?cat=maquinarias">Maquinarias Agrícolas</a></li>
            <li><a href="/#/search?cat=campos">Campos en Venta</a></li>
            <li><a href="/#/search?cat=ganaderia">Ganadería</a></li>
            <li><a href="/#/search?cat=agricultura">Agricultura</a></li>
            <li><a href="/#/search?cat=servicios">Servicios del Campo</a></li>
          </ul>
        </nav>
      </div>
    </>
  );
};

/**
 * Hook para generar sitemap data de búsquedas populares
 */
export function useSearchSitemapData() {
  const [sitemapUrls, setSitemapUrls] = useState<string[]>([]);

  useEffect(() => {
    loadSitemapData();
  }, []);

  const loadSitemapData = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/search/popular?limit=50`);
      
      if (response.ok) {
        const data = await response.json();
        const urls = (data.queries || []).map((q: any) => 
          `https://rural24.com.ar/#/search?q=${encodeURIComponent(q.query)}`
        );
        setSitemapUrls(urls);
      }
    } catch (error) {
      console.debug('Error cargando sitemap data');
    }
  };

  return sitemapUrls;
}
