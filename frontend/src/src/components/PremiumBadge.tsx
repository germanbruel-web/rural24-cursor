// src/components/PremiumBadge.tsx
import { Crown } from 'lucide-react';

interface PremiumBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function PremiumBadge({ className = '', size = 'md' }: PremiumBadgeProps) {
  const sizes = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={`
        inline-flex items-center
        bg-gradient-to-r from-[#f0bf43] to-[#daa520]
        text-gray-900 font-bold
        rounded-full
        shadow-lg shadow-[#f0bf43]/40
        ${sizes[size]}
        ${className}
      `}
    >
      <Crown className={iconSizes[size]} fill="currentColor" />
      <span>Premium</span>
    </div>
  );
}
