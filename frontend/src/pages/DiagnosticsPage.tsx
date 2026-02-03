/**
 * 🔬 PÁGINA DE DIAGNÓSTICOS
 * Panel profesional para debugging de imágenes
 */

import React, { useState } from 'react';
import { diagnoseAd, runFullDiagnostics, testImageLoad, ImageDiagnostic } from '../utils/imageDiagnostics';
import { supabase } from '../services/supabaseClient';

export const DiagnosticsPage: React.FC = () => {
  const [adId, setAdId] = useState('');
  const [logs, setLogs] = useState<ImageDiagnostic[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [recentAds, setRecentAds] = useState<any[]>([]);

  React.useEffect(() => {
    loadRecentAds();
  }, []);

  const loadRecentAds = async () => {
    const { data } = await supabase
      .from('ads')
      .select('id, title, created_at, images')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (data) setRecentAds(data);
  };

  const runDiagnostic = async (id: string) => {
    setIsRunning(true);
    setLogs([]);
    
    const diagnostics = await diagnoseAd(id);
    setLogs(diagnostics.getLogs());
    
    setIsRunning(false);
  };

  const runFullDiag = async () => {
    setIsRunning(true);
    await runFullDiagnostics();
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-8 mb-8 text-white">
          <h1 className="text-4xl font-bold mb-2">🔬 Panel de Diagnósticos</h1>
          <p className="text-purple-100">Sistema profesional de debugging de imágenes</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Diagnostic by ID */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Diagnosticar por ID</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={adId}
                onChange={(e) => setAdId(e.target.value)}
                placeholder="UUID del aviso"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => runDiagnostic(adId)}
                disabled={isRunning || !adId}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isRunning ? 'Analizando...' : 'Analizar'}
              </button>
            </div>
          </div>

          {/* Full System Diagnostic */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Diagnóstico Completo</h2>
            <button
              onClick={runFullDiag}
              disabled={isRunning}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isRunning ? 'Ejecutando...' : '🚀 Ejecutar Diagnóstico Completo'}
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Analiza el último aviso publicado y verifica toda la cadena de imágenes
            </p>
          </div>
        </div>

        {/* Recent Ads */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">📋 Avisos Recientes</h2>
          <div className="space-y-2">
            {recentAds.map((ad) => (
              <div
                key={ad.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{ad.title}</p>
                  <p className="text-xs text-gray-500">
                    {ad.id} • {new Date(ad.created_at).toLocaleString()}
                    {ad.images && ` • ${Array.isArray(ad.images) ? ad.images.length : 0} imágenes`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAdId(ad.id);
                    runDiagnostic(ad.id);
                  }}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                >
                  Diagnosticar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        {logs.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">📊 Resultados del Diagnóstico</h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  ✅ {logs.filter(l => l.status === 'success').length}
                </span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                  ⚠️ {logs.filter(l => l.status === 'warning').length}
                </span>
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                  ❌ {logs.filter(l => l.status === 'error').length}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    log.status === 'success'
                      ? 'bg-green-50 border-green-500'
                      : log.status === 'warning'
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {log.status === 'success' ? '✅' : log.status === 'warning' ? '⚠️' : '❌'}
                      </span>
                      <span className="font-bold text-gray-900">{log.step}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{log.message}</p>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                      Ver datos técnicos
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="font-bold text-blue-900 mb-2">💡 Cómo usar este panel</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. Selecciona un aviso reciente o ingresa un ID manualmente</li>
            <li>2. Click en "Analizar" para diagnosticar ese aviso específico</li>
            <li>3. O ejecuta "Diagnóstico Completo" para análisis profundo del último aviso</li>
            <li>4. Revisa los logs en la consola del navegador (F12) para detalles adicionales</li>
            <li>5. Los resultados se muestran aquí con código de colores por severidad</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
