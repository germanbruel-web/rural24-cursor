/**
 * AvatarUploadBlock — Wizard block para subir foto de perfil
 * Sube a Cloudinary vía BFF (/api/uploads, folder: users)
 * y actualiza avatarUrl en el wizard state.
 */
import { useState, useRef } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import type { WizardBlockProps } from '../wizardTypes';
import { formStyles } from '../../../constants/styles';
import { API_URL } from '../../../services/api/client';
import { supabase } from '../../../services/supabaseClient';

const lbl = formStyles.label;

interface Props extends Pick<WizardBlockProps, 'avatarUrl' | 'setAvatarUrl'> {}

export function AvatarUploadBlock({ avatarUrl, setAvatarUrl }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authHeaders: Record<string, string> = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'users');
      formData.append('website', ''); // honeypot

      const res = await fetch(`${API_URL}/api/uploads`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al subir la imagen');
      }

      const data = await res.json();
      setAvatarUrl(data.url);
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
      // Limpiar input para permitir re-selección del mismo archivo
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className={lbl}>Foto de perfil</label>
      <p className="text-xs text-gray-500">
        Tu foto aparecerá en la tarjeta del aviso. Podés cambiarla en cualquier momento desde tu perfil.
      </p>

      <div className="flex items-center gap-4">
        {/* Preview circular */}
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border-4 border-brand-100 shadow"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center shadow">
              <User className="w-8 h-8 text-gray-400" />
            </div>
          )}

          {/* Botón de cámara encima */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-md transition-colors disabled:opacity-60"
          >
            {uploading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Camera className="w-4 h-4" />
            }
          </button>
        </div>

        {/* Texto / acción */}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50 text-left"
          >
            {uploading ? 'Subiendo...' : avatarUrl ? 'Cambiar foto' : 'Subir foto'}
          </button>
          <p className="text-xs text-gray-400">JPG, PNG o WebP · máx 10 MB</p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/heic"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
