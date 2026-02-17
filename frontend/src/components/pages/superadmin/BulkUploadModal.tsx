import { useState } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  placeholder: string;
  onUpload: (items: string[]) => Promise<{ success: number; errors: string[] }>;
  helpText?: string;
}

export default function BulkUploadModal({
  isOpen,
  onClose,
  title,
  placeholder,
  onUpload,
  helpText
}: BulkUploadModalProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);

  console.log('📦 BulkUploadModal render - isOpen:', isOpen, 'title:', title);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      // Dividir por líneas y limpiar
      const items = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (items.length === 0) {
        setResult({ success: 0, errors: ['No hay items válidos para cargar'] });
        return;
      }

      const uploadResult = await onUpload(items);
      setResult(uploadResult);

      // Si todo fue exitoso, limpiar y cerrar después de 2 segundos
      if (uploadResult.errors.length === 0) {
        setTimeout(() => {
          setText('');
          setResult(null);
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      setResult({ 
        success: 0, 
        errors: [error.message || 'Error al procesar la carga masiva'] 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setText('');
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Help text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">¿Cómo funciona?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Escribe o pega una lista de items</li>
                  <li>Un item por línea</li>
                  <li>Se guardarán automáticamente en la base de datos</li>
                  {helpText && <li>{helpText}</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lista de items (uno por línea)
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none font-mono text-sm"
              disabled={loading}
            />
            <div className="mt-2 text-sm text-gray-500">
              {text.split('\n').filter(l => l.trim()).length} items detectados
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-lg p-4 ${
              result.errors.length === 0 
                ? 'bg-brand-50 border border-brand-200' 
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <p className={`font-medium ${
                result.errors.length === 0 ? 'text-brand-700' : 'text-yellow-800'
              }`}>
                ✅ {result.success} items guardados exitosamente
              </p>
              {result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-yellow-800 mb-1">
                    ⚠️ {result.errors.length} errores:
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {result.errors.slice(0, 5).map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>• ... y {result.errors.length - 5} más</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={loading || !text.trim()}
            className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Procesando...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Cargar {text.split('\n').filter(l => l.trim()).length} items
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
