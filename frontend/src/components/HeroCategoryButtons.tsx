import type { SearchFilters } from '../../types';

interface HeroCategoryButtonsProps {
  onSearch?: (filters: SearchFilters) => void;
  showCategoryButtons?: boolean;
  onCategoryHover?: (category: string | null) => void;
}

// Componente obsoleto — botones de categoría mobile eliminados (Sprint 3G-B)
export const HeroCategoryButtons: React.FC<HeroCategoryButtonsProps> = () => null;
