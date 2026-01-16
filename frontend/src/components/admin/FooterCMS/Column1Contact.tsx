/**
 * COLUMNA 1: INFORMACIÓN DE CONTACTO
 */

import React, { useState } from 'react';
import { Plus, Trash2, MapPin, Phone, Mail, Upload, X } from 'lucide-react';
import type { FooterContactColumn, ContactItem } from '../../../types/footer';
import { useSiteSetting } from '../../../hooks/useSiteSetting';
import { uploadService } from '../../../services/uploadService';
import { updateImageSetting } from '../../../services/siteSettingsService';
import { useToastHelpers } from '../../../contexts/ToastContext';

interface Props {
  column: FooterContactColumn;
  onChange: (updated: FooterContactColumn) => void;
}

export const Column1Contact: React.FC<Props> = ({ column, onChange }) => {
  const footerLogo = useSiteSetting('footer_logo', '/images/logos/logo.svg');
  const toast = useToastHelpers();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  const handleAddressAdd = () => {
    const newItem: ContactItem = {
      id: `addr-${Date.now()}`,
      icon: 'MapPin',
      text: '',
      order: column.addresses.length + 1
    };
    onChange({ ...column, addresses: [...column.addresses, newItem] });
  };

  const handlePhoneAdd = () => {
    const newItem: ContactItem = {
      id: `phone-${Date.now()}`,
      icon: 'Phone',
      text: '',
      order: column.phones.length + 1
    };
    onChange({ ...column, phones: [...column.phones, newItem] });
  };

  const handleEmailAdd = () => {
    const newItem: ContactItem = {
      id: `email-${Date.now()}`,
      icon: 'Mail',
      text: '',
      order: column.emails.length + 1
    };
    onChange({ ...column, emails: [...column.emails, newItem] });
  };

  const handleRemove = (type: 'addresses' | 'phones' | 'emails', id: string) => {
    const items = column[type];
    if (items.length === 1) {
      alert(`Debe haber al menos 1 ${type === 'addresses' ? 'dirección' : type === 'phones' ? 'teléfono' : 'email'}`);
      return;
    }
    onChange({ ...column, [type]: items.filter(item => item.id !== id) });
  };

  const handleUpdate = (type: 'addresses' | 'phones' | 'emails', id: string, text: string) => {
    const items = column[type];
    const updated = items.map(item => item.id === id ? { ...item, text } : item);
    onChange({ ...column, [type]: updated });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar formato
    if (!file.type.match(/image\/(jpeg|jpg|png|webp|svg\+xml)/)) {
      toast.error('Formato inválido', 'Solo se permiten imágenes JPG, PNG, WEBP o SVG');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Archivo muy grande', 'El logo debe pesar menos de 5MB');
      return;
    }

    setUploadingLogo(true);
    const loadingToast = toast.loading('Subiendo logo...', 'Por favor espera');

    try {
      // Subir imagen
      const result = await uploadService.uploadImage(file, 'logos');
      const imageUrl = typeof result === 'string' ? result : result.url;

      // Actualizar en site_settings
      const success = await updateImageSetting('footer_logo', file, 'footer');

      toast.hide(loadingToast);

      if (success) {
        setPreviewLogo(imageUrl);
        toast.success('Logo actualizado', 'El logo del footer se guardó correctamente');
      } else {
        toast.error('Error', 'No se pudo actualizar el logo');
      }
    } catch (error) {
      toast.hide(loadingToast);
      toast.error('Error al subir', 'Ocurrió un problema al subir el logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setPreviewLogo(null);
  };

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logo del Footer
        </label>
        
        <div className="space-y-3">
          {/* Preview actual */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <img 
              src={previewLogo || footerLogo} 
              alt="Footer Logo" 
              className="h-12 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.src = '/images/logos/logo.svg';
              }}
            />
            <div className="flex-1">
              <span className="text-xs text-gray-600 block">Logo actual</span>
              {previewLogo && (
                <span className="text-xs text-green-600 block mt-1">✓ Cambio pendiente de guardar</span>
              )}
            </div>
            {previewLogo && (
              <button
                onClick={handleRemoveLogo}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Descartar cambios"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Upload button */}
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,image/avif"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
                <Upload className="w-4 h-4" />
                {uploadingLogo ? 'Subiendo...' : 'Cambiar logo'}
              </div>
            </label>
          </div>

          <p className="text-xs text-gray-500">
            Formatos: JPG, PNG, WEBP, SVG, AVIF • Máximo 5MB • Recomendado: fondo transparente
          </p>
        </div>
      </div>

      {/* Slogan */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Slogan
        </label>
        <input
          type="text"
          value={column.slogan}
          onChange={(e) => onChange({ ...column, slogan: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          placeholder="Conectando el Campo"
        />
      </div>

      {/* Direcciones */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Direcciones
          </label>
          <button
            onClick={handleAddressAdd}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Agregar
          </button>
        </div>
        <div className="space-y-2">
          {column.addresses.map(addr => (
            <div key={addr.id} className="flex gap-2">
              <input
                type="text"
                value={addr.text}
                onChange={(e) => handleUpdate('addresses', addr.id, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Buenos Aires, Argentina"
              />
              <button
                onClick={() => handleRemove('addresses', addr.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Teléfonos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Teléfonos
          </label>
          <button
            onClick={handlePhoneAdd}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Agregar
          </button>
        </div>
        <div className="space-y-2">
          {column.phones.map(phone => (
            <div key={phone.id} className="flex gap-2">
              <input
                type="tel"
                value={phone.text}
                onChange={(e) => handleUpdate('phones', phone.id, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="+54 9 11 1234-5678"
              />
              <button
                onClick={() => handleRemove('phones', phone.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Emails */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Emails
          </label>
          <button
            onClick={handleEmailAdd}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Agregar
          </button>
        </div>
        <div className="space-y-2">
          {column.emails.map(email => (
            <div key={email.id} className="flex gap-2">
              <input
                type="email"
                value={email.text}
                onChange={(e) => handleUpdate('emails', email.id, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="contacto@rural24.com"
              />
              <button
                onClick={() => handleRemove('emails', email.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
