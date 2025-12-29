import React from 'react';

interface VerifiedBadgeProps {
  verified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  verified,
  size = 'md',
  showLabel = true,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (verified) {
    return (
      <span
        className={`inline-flex items-center gap-1 ${sizeClasses[size]} bg-green-100 text-green-800 rounded-full font-medium`}
      >
        <svg
          className={iconSizes[size]}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        {showLabel && <span>Usuario Verificado</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 ${sizeClasses[size]} bg-gray-100 text-gray-600 rounded-full font-medium`}
    >
      <svg
        className={iconSizes[size]}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      {showLabel && <span>Usuario No Verificado</span>}
    </span>
  );
};

interface UserTypeBadgeProps {
  userType?: 'particular' | 'empresa';
  size?: 'sm' | 'md' | 'lg';
}

export const UserTypeBadge: React.FC<UserTypeBadgeProps> = ({
  userType,
  size = 'md',
}) => {
  if (!userType) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (userType === 'empresa') {
    return (
      <span
        className={`inline-flex items-center gap-1 ${sizeClasses[size]} bg-blue-100 text-blue-800 rounded-full font-medium`}
      >
        <svg
          className={iconSizes[size]}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
            clipRule="evenodd"
          />
        </svg>
        <span>Empresa</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 ${sizeClasses[size]} bg-purple-100 text-purple-800 rounded-full font-medium`}
    >
      <svg
        className={iconSizes[size]}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
          clipRule="evenodd"
        />
      </svg>
      <span>Particular</span>
    </span>
  );
};
