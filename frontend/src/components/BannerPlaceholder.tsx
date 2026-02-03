// src/components/BannerPlaceholder.tsx
import React from 'react';

interface BannerPlaceholderProps {
  width?: string | number;
  height?: string | number;
  position?: string;
  className?: string;
}

export const BannerPlaceholder: React.FC<BannerPlaceholderProps> = ({
  width = '100%',
  height = '250px',
  position = 'Banner',
  className = '',
}) => {
  return (
    <div
      className={`bg-gray-200 border-2 border-gray-300 rounded-lg flex items-center justify-center ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    >
      <div className="text-center p-4">
        <p className="text-sm text-gray-500 font-medium">Espacio reservado para banner publicitario</p>
      </div>
    </div>
  );
};

interface BannerSectionProps {
  title: string;
  children: React.ReactNode;
}

export const BannerSection: React.FC<BannerSectionProps> = ({ title, children }) => {
  return (
    <section className="py-6">
      <div className="max-w-[1400px] mx-auto px-4">
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">{title}</p>
        {children}
      </div>
    </section>
  );
};
