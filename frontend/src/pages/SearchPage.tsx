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

interface SearchPageProps {
  results?: any[];
  onBack?: () => void;
  onSearch?: (params: any) => void;
  filterOptions?: any;
  onFilter?: (filters: any) => void;
  onViewDetail?: (adId: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = (props) => {
  // SearchResultsPageMinimal maneja su propio estado
  // usando URL params y contexts
  return (
    <SearchResultsPageMinimal
      key={window.location.hash} // Force re-render on URL change
      {...props}
    />
  );
};

export default SearchPage;
