/**
 * SubcategoriesExpressBar - Links sutiles de subcategorías
 * Diseño: Texto simple con separadores • solo clickeable
 * Minimalista y discreto
 */

import React from 'react';

interface SubcategoryChip {
  id: string;
  name: string;
  slug: string;
  ads_count: number;
  icon?: string;
}

interface SubcategoriesExpressBarProps {
  categorySlug: string;
  subcategories: SubcategoryChip[];
  onSubcategoryClick: (categorySlug: string, subcategorySlug: string) => void;
}

export const SubcategoriesExpressBar: React.FC<SubcategoriesExpressBarProps> = ({
  categorySlug,
  subcategories,
  onSubcategoryClick,
}) => {
  if (subcategories.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-gray-600 mt-6 px-4">
      {subcategories.map((subcat, index) => (
        <React.Fragment key={subcat.id}>
          {index > 0 && <span className="text-gray-400">•</span>}
          <button
            onClick={() => onSubcategoryClick(categorySlug, subcat.slug)}
            disabled={subcat.ads_count === 0}
            className={`
              transition-colors duration-200
              ${subcat.ads_count === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-brand-500 hover:underline cursor-pointer'
              }
            `}
          >
            {subcat.name} ({subcat.ads_count})
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};
