
import React from 'react';
import type { Category } from '../../types';

interface CategoryCardProps {
  category: Category;
  onSelectCategory: (categoryName: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onSelectCategory }) => {
  return (
    <button
      onClick={() => onSelectCategory(category.name)}
      className="flex flex-col items-center justify-center space-y-2 p-4 bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-32 h-32 md:w-40 md:h-40"
    >
      <category.icon className="h-10 w-10 md:h-12 md:w-12 text-[#795548]" />
      <span className="text-gray-800 font-semibold text-center text-sm md:text-base">{category.name}</span>
    </button>
  );
};
