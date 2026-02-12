/**
 * SearchPage - Página de búsqueda y resultados
 * =============================================
 * Este archivo se carga LAZY (solo cuando usuario hace búsqueda)
 * 
 * Antes: En bundle principal (503KB)
 * Después: Chunk separado (~40-60KB)
 */

import React from 'react';
import { SearchResultsPageMinimal } from '../components';
import { SearchSEO } from '../components/SearchSEO';

interface SearchPageProps {
  results?: any[];
  onBack?: () => void;
  onSearch?: (params: any) => void;
  filterOptions?: any;
  onFilter?: (filters: any) => void;
  onViewDetail?: (adId: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = (props) => {
  // Extraer query de URL hash para SEO
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const currentQuery = hashParams.get('q') || undefined;
  const resultCount = props.results?.length;

  return (
    <>
      <SearchSEO currentQuery={currentQuery} resultCount={resultCount} />
      <SearchResultsPageMinimal
        key={window.location.hash}
        {...props}
      />
    </>
  );
};

export default SearchPage;
