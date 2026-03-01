'use client';

import { useEffect, useState, useCallback } from 'react';

interface AssetFile {
  name: string;
  path: string;
  size: number;
  ext: string;
}

interface AssetCategory {
  id: string;
  label: string;
  dir: string;
  files: AssetFile[];
}

interface AssetsResponse {
  categories: AssetCategory[];
  total: number;
  frontendPublicExists: boolean;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CmsAssetsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<AssetsResponse | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<AssetFile | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token') ?? sessionStorage.getItem('admin-token');
    if (!t) {
      setError('Token no encontrado. Accedé desde el dashboard.');
      setLoading(false);
      return;
    }
    setToken(t);
    sessionStorage.setItem('admin-token', t);
  }, []);

  const fetchAssets = useCallback(async (category: string, tok: string) => {
    setLoading(true);
    setError('');
    try {
      const url = `/api/admin/cms/public-assets${category !== 'all' ? `?category=${category}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Error al obtener assets');
      }
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchAssets(activeTab, token);
  }, [token, activeTab, fetchAssets]);

  const assetUrl = (filePath: string) =>
    `/api/admin/cms/asset?path=${encodeURIComponent(filePath)}&token=${encodeURIComponent(token ?? '')}`;

  const goBack = () => {
    const tok = token ?? sessionStorage.getItem('admin-token');
    window.location.href = `/admin/dashboard${tok ? `?token=${tok}` : ''}`;
  };

  const TABS = [
    { id: 'all', label: 'Todos' },
    { id: 'logos', label: 'Logos' },
    { id: 'icons', label: 'Íconos UI' },
    { id: 'hero', label: 'Hero' },
    { id: 'pwa-android', label: 'PWA Android' },
    { id: 'pwa-ios', label: 'PWA iOS' },
    { id: 'pwa-win', label: 'PWA Windows' },
    { id: 'root', label: 'Raíz' },
  ];

  // ─── Loading / Error ──────────────────────────────────────────────────────

  if (!token && !error) {
    return <FullCenter>Verificando token...</FullCenter>;
  }

  if (error && !data) {
    return (
      <FullCenter>
        <p style={{ color: '#dc3545', marginBottom: '1rem' }}>{error}</p>
        <button onClick={goBack} style={btnStyle}>← Volver al Dashboard</button>
      </FullCenter>
    );
  }

  // ─── UI principal ─────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div>
          <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: '0.85rem' }}>
            ← Dashboard
          </button>
          <h1 style={{ fontSize: '1.25rem', color: '#333', margin: '0.25rem 0 0 0' }}>
            🔍 PWA Inspector — Assets del Frontend
          </h1>
        </div>
        {data && (
          <span style={{ color: '#666', fontSize: '0.85rem' }}>
            {data.total} imagen{data.total !== 1 ? 'es' : ''}
            {!data.frontendPublicExists && (
              <span style={{ color: '#dc3545', marginLeft: '0.5rem' }}>⚠️ Directorio no encontrado</span>
            )}
          </span>
        )}
      </header>

      {/* Tabs */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '0 2rem',
        display: 'flex',
        gap: '0',
        overflowX: 'auto',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #138A2C' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === tab.id ? '#138A2C' : '#666',
              fontWeight: activeTab === tab.id ? 600 : 400,
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <main style={{ padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {loading && <p style={{ color: '#666', textAlign: 'center', padding: '3rem 0' }}>Cargando assets...</p>}
        {error && <p style={{ color: '#dc3545', padding: '1rem' }}>{error}</p>}

        {data?.categories.map(cat => {
          if (cat.files.length === 0) return null;
          return (
            <section key={cat.id} style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.75rem',
              }}>
                {cat.label} · {cat.dir} · {cat.files.length} archivo{cat.files.length !== 1 ? 's' : ''}
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '0.75rem',
              }}>
                {cat.files.map(file => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedAsset(file)}
                    style={{
                      background: 'white',
                      border: selectedAsset?.path === file.path ? '2px solid #138A2C' : '1px solid #e0e0e0',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'box-shadow 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                  >
                    <div style={{
                      width: '100%',
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f9f9f9',
                      borderRadius: '0.25rem',
                      marginBottom: '0.5rem',
                      overflow: 'hidden',
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={assetUrl(file.path)}
                        alt={file.name}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                        }}
                        loading="lazy"
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 500, color: '#333', margin: 0, wordBreak: 'break-all', lineHeight: 1.3 }}>
                      {file.name}
                    </p>
                    <p style={{ fontSize: '0.65rem', color: '#999', margin: '0.2rem 0 0 0' }}>
                      {formatBytes(file.size)}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          );
        })}

        {data && data.total === 0 && !loading && (
          <p style={{ color: '#666', textAlign: 'center', padding: '3rem 0' }}>
            No se encontraron imágenes en esta categoría.
          </p>
        )}
      </main>

      {/* Modal detalle */}
      {selectedAsset && (
        <div
          onClick={() => setSelectedAsset(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: '2rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: '1rem', padding: '1.5rem',
              maxWidth: '480px', width: '100%', maxHeight: '90vh', overflow: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>{selectedAsset.name}</h3>
              <button
                onClick={() => setSelectedAsset(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#666' }}
              >
                ×
              </button>
            </div>
            <div style={{
              width: '100%', background: '#f0f0f0', borderRadius: '0.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1rem', marginBottom: '1rem', minHeight: '200px',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetUrl(selectedAsset.path)}
                alt={selectedAsset.name}
                style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
              />
            </div>
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
              <dt style={{ color: '#888', fontWeight: 500 }}>Ruta:</dt>
              <dd style={{ color: '#333', margin: 0, wordBreak: 'break-all' }}>{selectedAsset.path}</dd>
              <dt style={{ color: '#888', fontWeight: 500 }}>Tamaño:</dt>
              <dd style={{ color: '#333', margin: 0 }}>{formatBytes(selectedAsset.size)} ({selectedAsset.size.toLocaleString()} bytes)</dd>
              <dt style={{ color: '#888', fontWeight: 500 }}>Formato:</dt>
              <dd style={{ color: '#333', margin: 0 }}>{selectedAsset.ext.toUpperCase()}</dd>
            </dl>
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#aaa', margin: '0 0 0.5rem 0' }}>URL del proxy:</p>
              <code style={{
                display: 'block', background: '#f5f5f5', padding: '0.5rem',
                borderRadius: '0.25rem', fontSize: '0.7rem', wordBreak: 'break-all', color: '#555',
              }}>
                /api/admin/cms/asset?path={selectedAsset.path}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FullCenter({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      {children}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  background: '#138A2C',
  color: 'white',
  border: 'none',
  borderRadius: '0.5rem',
  cursor: 'pointer',
  fontWeight: 500,
};
