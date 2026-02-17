/**
 * AvatarUpload.tsx
 * Componente reutilizable para subir foto de perfil o logo
 */

import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User, Building2 } from 'lucide-react';

interface AvatarUploadProps {
  currentUrl?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  type?: 'personal' | 'company';
  disabled?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32'
};

const iconSizes = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-14 h-14'
};

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentUrl,
  onUpload,
  onRemove,
  size = 'lg',
  type = 'personal',
  disabled = false,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validar tipo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic'];
    if (!validTypes.includes(file.type)) {
      alert('Formato no válido. Use JPG, PNG, WebP, AVIF o HEIC.');
      return;
    }

    // Validar tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no puede superar 2MB.');
      return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Subir
    setIsUploading(true);
    try {
      await onUpload(file);
    } catch (error) {
      console.error('Error uploading:', error);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = async () => {
    if (onRemove) {
      setIsUploading(true);
      try {
        await onRemove();
        setPreviewUrl(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const displayUrl = previewUrl || currentUrl;
  const PlaceholderIcon = type === 'company' ? Building2 : User;

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Avatar Circle */}
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full
          overflow-hidden
          border-4
          ${dragOver ? 'border-brand-500 border-dashed' : 'border-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          bg-gray-100
          flex items-center justify-center
          transition-all
          hover:border-brand-500/50
        `}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
        ) : displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <PlaceholderIcon className={`${iconSizes[size]} text-gray-400`} />
        )}
      </div>

      {/* Upload Button */}
      <button
        type="button"
        onClick={() => !disabled && fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className={`
          absolute bottom-0 right-0
          ${size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10'}
          rounded-full
          bg-brand-600
          text-white
          flex items-center justify-center
          shadow-lg
          hover:bg-brand-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        `}
      >
        <Camera className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
      </button>

      {/* Remove Button (si hay imagen) */}
      {displayUrl && onRemove && !disabled && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleRemove(); }}
          disabled={isUploading}
          className={`
            absolute top-0 right-0
            ${size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'}
            rounded-full
            bg-red-500
            text-white
            flex items-center justify-center
            shadow-lg
            hover:bg-red-600
            disabled:opacity-50
            transition-colors
          `}
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Hidden Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/heic"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Helper Text */}
      {dragOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-brand-500/20 rounded-full" />
          <Upload className="w-8 h-8 text-brand-500 z-10" />
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;
