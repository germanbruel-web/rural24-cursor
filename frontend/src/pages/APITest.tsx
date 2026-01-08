/**
 * API TEST PAGE
 * Página de prueba para validar integración Frontend ↔️ Backend
 * 
 * URL: /api-test
 */

import { useState } from 'react';
import { catalogServiceV2 } from '../services/catalogServiceV2';
import { getMigrationStatus } from '../config/features';

interface TestResult {
  name: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  duration?: number;
  data?: any;
  error?: string;
}

export default function APITestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const migrationStatus = getMigrationStatus();

  const updateResult = (name: string, update: Partial<TestResult>) => {
    setResults((prev) => {
      const existing = prev.find((r) => r.name === name);
      if (existing) {
        return prev.map((r) => (r.name === name ? { ...r, ...update } : r));
      }
      return [...prev, { name, status: 'idle', ...update }];
    });
  };

  const runTest = async (name: string, testFn: () => Promise<any>) => {
    updateResult(name, { status: 'loading' });
    const startTime = performance.now();

    try {
      const data = await testFn();
      const duration = performance.now() - startTime;
      updateResult(name, { status: 'success', duration, data });
    } catch (error: any) {
      const duration = performance.now() - startTime;
      updateResult(name, {
        status: 'error',
        duration,
        error: error.message || 'Unknown error',
      });
    }
  };

  const runAllTests = async () => {
    setResults([]);

    // Test 1: Health Check (directo)
    await runTest('Health Check', async () => {
      const response = await fetch('http://localhost:3000/api/health');
      return response.json();
    });

    // Test 2: Categorías
    await runTest('Get Categories', async () => {
      const response = await fetch('http://localhost:3000/api/config/categories');
      return response.json();
    });

    // Test 3: Marcas (tractores)
    await runTest('Get Brands (tractores)', async () => {
      const response = await fetch(
        'http://localhost:3000/api/config/brands?subcategoryId=d290f1ee-6c54-4b01-90e6-d701748f0851'
      );
      return response.json();
    });

    // Test 4: Modelos (John Deere)
    await runTest('Get Models (John Deere)', async () => {
      const response = await fetch(
        'http://localhost:3000/api/config/models?brandId=f47ac10b-58cc-4372-a567-0e02b2c3d479'
      );
      return response.json();
    });

    // Test 5: Form Config (tractores)
    await runTest('Get Form Config (tractores)', async () => {
      const response = await fetch(
        'http://localhost:3000/api/config/form/d290f1ee-6c54-4b01-90e6-d701748f0851'
      );
      return response.json();
    });

    // Test 6: Ads List
    await runTest('Get Ads List', async () => {
      const response = await fetch('http://localhost:3000/api/ads');
      return response.json();
    });

    // Test 7: Ads List (active)
    await runTest('Get Ads List (active)', async () => {
      const response = await fetch('http://localhost:3000/api/ads?status=active');
      return response.json();
    });

    // Test 8: CatalogServiceV2 - Categories
    await runTest('CatalogServiceV2.getCategoriesWithSubcategories()', async () => {
      return await catalogServiceV2.getCategoriesWithSubcategories();
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧪 API Integration Test Suite
          </h1>
          
          {/* Migration Status */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold">Backend Mode:</span>{' '}
              <span
                className={
                  migrationStatus.isUsingBackend ? 'text-green-600' : 'text-orange-600'
                }
              >
                {migrationStatus.isUsingBackend ? '✅ Fastify API' : '⚠️ Supabase Direct'}
              </span>
            </div>
            <div>
              <span className="font-semibold">Fallback:</span>{' '}
              <span
                className={
                  migrationStatus.hasFallback ? 'text-blue-600' : 'text-gray-600'
                }
              >
                {migrationStatus.hasFallback ? '✅ Enabled' : '❌ Disabled'}
              </span>
            </div>
            <div>
              <span className="font-semibold">Environment:</span>{' '}
              <span className="text-gray-700">{migrationStatus.environment}</span>
            </div>
          </div>

          <button
            onClick={runAllTests}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            🚀 Run All Tests
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={result.name}
              className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${
                result.status === 'loading'
                  ? 'border-blue-500'
                  : result.status === 'success'
                  ? 'border-green-500'
                  : result.status === 'error'
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
            >
              {/* Test Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {result.status === 'loading' && '⏳ '}
                  {result.status === 'success' && '✅ '}
                  {result.status === 'error' && '❌ '}
                  {result.name}
                </h3>
                {result.duration !== undefined && (
                  <span className="text-sm text-gray-500">
                    {result.duration.toFixed(0)}ms
                  </span>
                )}
              </div>

              {/* Loading */}
              {result.status === 'loading' && (
                <div className="text-blue-600 text-sm">Testing...</div>
              )}

              {/* Error */}
              {result.status === 'error' && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                  <strong>Error:</strong> {result.error}
                </div>
              )}

              {/* Success - Data */}
              {result.status === 'success' && result.data && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-900 mb-2">
                    View Response Data
                  </summary>
                  <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-96 text-xs">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {results.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">
              Click "Run All Tests" to start integration testing
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
