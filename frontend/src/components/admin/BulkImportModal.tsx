import React, { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle, Download } from 'lucide-react';

interface BulkImportModalProps {
  type: 'brands' | 'models';
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => Promise<{ success: number; errors: string[] }>;
}

interface ParsedRow {
  data: any;
  rowNumber: number;
  errors: string[];
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  type,
  isOpen,
  onClose,
  onImport,
}) => {
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);

  // Configuración de columnas esperadas
  const columnConfig = type === 'brands' 
    ? {
        columns: ['name', 'display_name', 'country', 'website_url'],
        required: ['name', 'display_name'],
        example: 'john_deere\tJohn Deere\tEstados Unidos\thttps://www.deere.com\ncase_ih\tCase IH\tEstados Unidos\thttps://www.caseih.com',
        template: 'name\tdisplay_name\tcountry\twebsite_url\njohn_deere\tJohn Deere\tEstados Unidos\thttps://www.deere.com',
      }
    : {
        columns: ['brand_name', 'name', 'display_name', 'hp', 'year_from', 'year_to'],
        required: ['brand_name', 'name', 'display_name'],
        example: 'john_deere\tserie_5e\tSerie 5E\t75\t2018\t2024\njohn_deere\tserie_6m\tSerie 6M\t110\t2016\t2024',
        template: 'brand_name\tname\tdisplay_name\thp\tyear_from\tyear_to\njohn_deere\tserie_5e\tSerie 5E\t75\t2018\t2024',
      };

  // Parsear texto pegado
  const parseText = (text: string) => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const parsed: ParsedRow[] = [];

    lines.forEach((line, index) => {
      // Detectar delimitador (tab o coma)
      const delimiter = line.includes('\t') ? '\t' : ',';
      const values = line.split(delimiter).map(v => v.trim());
      
      const row: any = {};
      const errors: string[] = [];

      // Mapear valores a columnas
      columnConfig.columns.forEach((col, i) => {
        row[col] = values[i] || '';
      });

      // Validar campos requeridos
      columnConfig.required.forEach(col => {
        if (!row[col]) {
          errors.push(`Campo "${col}" requerido`);
        }
      });

      // Validaciones específicas
      if (type === 'brands') {
        if (row.name && !/^[a-z0-9_]+$/.test(row.name)) {
          errors.push('name debe ser minúsculas, números y guiones bajos');
        }
      }

      if (type === 'models') {
        if (row.hp && isNaN(parseInt(row.hp))) {
          errors.push('hp debe ser un número');
        }
        if (row.year_from && isNaN(parseInt(row.year_from))) {
          errors.push('year_from debe ser un año válido');
        }
      }

      parsed.push({
        data: row,
        rowNumber: index + 1,
        errors,
      });
    });

    setParsedData(parsed);
  };

  // Procesar importación
  const handleImport = async () => {
    const validRows = parsedData.filter(row => row.errors.length === 0);
    
    if (validRows.length === 0) {
      alert('No hay filas válidas para importar');
      return;
    }

    setImporting(true);
    try {
      const result = await onImport(validRows.map(r => r.data));
      setResult(result);
    } catch (error) {
      console.error('Error importing:', error);
    } finally {
      setImporting(false);
    }
  };

  // Descargar template
  const downloadTemplate = () => {
    const blob = new Blob([columnConfig.template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${type}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setRawText('');
    setParsedData([]);
    setResult(null);
  };

  if (!isOpen) return null;

  const validCount = parsedData.filter(r => r.errors.length === 0).length;
  const errorCount = parsedData.length - validCount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6" />
            <div>
              <h2 className="text-2xl font-bold">
                Importación Masiva de {type === 'brands' ? 'Marcas' : 'Modelos'}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Copia y pega filas desde Excel o Google Sheets
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-blue-800 p-2 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!result ? (
            <>
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Formato esperado:</h3>
                <div className="bg-white rounded p-3 font-mono text-sm mb-3 overflow-x-auto">
                  <pre className="text-gray-700">{columnConfig.example}</pre>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={downloadTemplate}
                    className="text-sm bg-white text-blue-600 px-3 py-1.5 rounded-lg border border-blue-300 hover:bg-blue-50 transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Descargar Template
                  </button>
                  <div className="text-sm text-blue-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Separa columnas con TAB (desde Excel) o comas
                  </div>
                </div>
              </div>

              {/* Textarea */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pega tus datos aquí:
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    parseText(e.target.value);
                  }}
                  placeholder={`Pega aquí tus filas...\n\nEjemplo:\n${columnConfig.example}`}
                  className="w-full h-48 p-4 border-2 border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Preview */}
              {parsedData.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Vista Previa ({parsedData.length} filas detectadas)
                    </h3>
                    <div className="flex gap-3">
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-semibold">{validCount} válidas</span>
                      </div>
                      {errorCount > 0 && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-semibold">{errorCount} con errores</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700">#</th>
                            {columnConfig.columns.map(col => (
                              <th key={col} className="px-3 py-2 text-left font-semibold text-gray-700">
                                {col}
                                {columnConfig.required.includes(col) && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </th>
                            ))}
                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {parsedData.map((row, idx) => (
                            <tr
                              key={idx}
                              className={row.errors.length > 0 ? 'bg-red-50' : 'bg-white hover:bg-gray-50'}
                            >
                              <td className="px-3 py-2 text-gray-500">{row.rowNumber}</td>
                              {columnConfig.columns.map(col => (
                                <td key={col} className="px-3 py-2 font-mono text-xs">
                                  {row.data[col] || <span className="text-gray-400">-</span>}
                                </td>
                              ))}
                              <td className="px-3 py-2">
                                {row.errors.length === 0 ? (
                                  <span className="text-green-600 flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" /> OK
                                  </span>
                                ) : (
                                  <div className="text-red-600 text-xs">
                                    {row.errors.map((err, i) => (
                                      <div key={i} className="flex items-start gap-1">
                                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        <span>{err}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Result */
            <div className="text-center py-12">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
                result.errors.length === 0 ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                <CheckCircle className={`w-10 h-10 ${
                  result.errors.length === 0 ? 'text-green-600' : 'text-yellow-600'
                }`} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Importación Completada!
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Se importaron <span className="font-bold text-green-600">{result.success}</span> registros exitosamente
              </p>
              
              {result.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
                  <h4 className="font-semibold text-yellow-900 mb-2">
                    {result.errors.length} errores encontrados:
                  </h4>
                  <ul className="text-left text-sm text-yellow-800 space-y-1">
                    {result.errors.slice(0, 10).map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                    {result.errors.length > 10 && (
                      <li className="text-yellow-600">... y {result.errors.length - 10} más</li>
                    )}
                  </ul>
                </div>
              )}

              <button
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {!result && parsedData.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-between items-center">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
            >
              Limpiar
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={validCount === 0 || importing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-semibold flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importar {validCount} {type === 'brands' ? 'Marcas' : 'Modelos'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
