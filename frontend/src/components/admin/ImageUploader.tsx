import { useState, useRef, useCallback } from 'react';
import { Upload, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { uploadService } from '@/services/uploadService';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  requiredWidth: number;
  requiredHeight: number;
  maxSizeMB?: number;
}

export function ImageUploader({
  value,
  onChange,
  label,
  requiredWidth,
  requiredHeight,
  maxSizeMB = 2
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImage = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      // Validar tamaño
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        setError(`Imagen muy pesada (${sizeMB.toFixed(1)}MB). Máximo: ${maxSizeMB}MB`);
        resolve(false);
        return;
      }

      // Validar dimensiones
      const img = new Image();
      img.onload = () => {
        if (img.width !== requiredWidth || img.height !== requiredHeight) {
          setError(`Dimensiones incorrectas: ${img.width}x${img.height}. Se requiere: ${requiredWidth}x${requiredHeight}`);
          resolve(false);
        } else {
          setError(null);
          resolve(true);
        }
      };
      img.onerror = () => {
        setError('No se pudo leer la imagen');
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  }, [requiredWidth, requiredHeight, maxSizeMB]);

  const handleUpload = useCallback(async (file: File) => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      // Validar imagen
      const isValid = await validateImage(file);
      if (!isValid) {
        setUploading(false);
        return;
      }

      // Simular progreso durante validación
      setProgress(20);

      // Subir a Cloudinary
      const result = await uploadService.uploadImage(file, 'banners');
      setProgress(100);
      
      onChange(result.url);
      
      // Reset después de éxito
      setTimeout(() => {
        setProgress(0);
        setUploading(false);
      }, 500);

    } catch (err: any) {
      console.error('Error uploading:', err);
      setError(err.message || 'Error subiendo imagen');
      setUploading(false);
      setProgress(0);
    }
  }, [onChange, validateImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleUpload(file);
    } else {
      setError('Por favor selecciona una imagen');
    }
  }, [handleUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  }, [handleUpload]);

  const handleRemove = useCallback(() => {
    onChange('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="text-xs text-gray-500 mb-2">
        📐 {requiredWidth}x{requiredHeight}px · 📦 Max {maxSizeMB}MB
      </div>

      {!value ? (
        // Estado: SIN IMAGEN
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
            dragActive
              ? 'border-[#16a135] bg-green-50'
              : error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploading ? (
            // SUBIENDO
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-[#16a135] mx-auto mb-2 animate-spin" />
              <div className="text-sm font-medium text-gray-700 mb-2">
                Subiendo imagen...
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#16a135] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">{progress}%</div>
            </div>
          ) : (
            // ESTADO INICIAL
            <div className="text-center">
              <Upload className={`w-8 h-8 mx-auto mb-2 ${error ? 'text-red-500' : 'text-gray-400'}`} />
              <div className="text-sm text-gray-600 mb-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[#16a135] font-medium hover:underline"
                >
                  Clic para subir
                </button>
                {' '}o arrastra la imagen aquí
              </div>
              {error && (
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Estado: CON IMAGEN
        <div className="relative group">
          <img
            src={value}
            alt="Preview"
            className="w-full h-32 object-cover rounded-lg border border-gray-300"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Eliminar
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
            <Check className="w-3 h-3" />
          </div>
        </div>
      )}
    </div>
  );
}
