import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  title: string;
  initialData?: any;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'checkbox';
    placeholder?: string;
    required?: boolean;
    options?: { value: string | number; label: string }[];
  }[];
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSave,
  title,
  initialData,
  fields
}: CategoryModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Reset form with default values
      const defaults: any = {};
      fields.forEach(field => {
        if (field.type === 'checkbox') {
          defaults[field.name] = false;
        } else if (field.type === 'number') {
          defaults[field.name] = 0;
        } else {
          defaults[field.name] = '';
        }
      });
      setFormData(defaults);
    }
    setError('');
  }, [initialData, fields, isOpen]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    const missingFields = fields
      .filter(field => field.required && !formData[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      setError(`Campos requeridos: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fields.map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === 'text' && (
                <input
                  type="text"
                  value={formData[field.name] || ''}
                  onChange={e => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none"
                />
              )}

              {field.type === 'number' && (
                <input
                  type="number"
                  value={formData[field.name] || 0}
                  onChange={e => handleChange(field.name, parseInt(e.target.value))}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none"
                />
              )}

              {field.type === 'select' && (
                <select
                  value={formData[field.name] || ''}
                  onChange={e => handleChange(field.name, e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none bg-white"
                >
                  <option value="">Seleccionar...</option>
                  {field.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {field.type === 'checkbox' && (
                <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-brand-500">
                  <input
                    type="checkbox"
                    checked={formData[field.name] || false}
                    onChange={e => handleChange(field.name, e.target.checked)}
                    className="w-5 h-5 text-brand-500 rounded focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700">{field.placeholder}</span>
                </label>
              )}
            </div>
          ))}

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
