/**
 * SyncPanel — Panel de sincronización DEV → PROD
 * Solo visible en DEV (import.meta.env.DEV) y para superadmin.
 *
 * Sync-A: solo visualización de estado (sin acciones destructivas).
 * Sync-B (próximo): botones de acción (migrar, clonar config, push git, deploy).
 */

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const POLL_INTERVAL_MS = 30_000;

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CommitInfo {
  sha: string;
  message: string;
}

interface SyncStatus {
  hasPending: boolean;
  commits: {
    count: number;       // -1 = git no disponible en servidor
    list: CommitInfo[];
  };
  migrations: {
    pending: string[];
    applied: string[];
    total: number;
  };
  config: {
    synced: boolean;
    tables: { name: string; inSync: boolean }[];
  };
  timestamp: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.refreshSession();
  const token = session?.access_token;
  if (!token) throw new Error('No hay sesión activa');
  return token;
}

async function fetchStatus(): Promise<SyncStatus> {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE}/api/admin/sync/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
  return json as SyncStatus;
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
        ok
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
      {label}
    </span>
  );
}

function SectionCard({
  title,
  icon,
  ok,
  children,
}: {
  title: string;
  icon: string;
  ok: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border-2 p-4 ${ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </h3>
        <StatusBadge ok={ok} label={ok ? 'Sincronizado' : 'Pendiente'} />
      </div>
      {children}
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

export default function SyncPanel() {
  const [status, setStatus]   = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [showCommits, setShowCommits]     = useState(false);
  const [showMigrations, setShowMigrations] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchStatus();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  // ── Header banner ────────────────────────────────────────────────────────────

  const allSynced = status && !status.hasPending;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">

      {/* Título */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Sincronización DEV → PROD</h1>
        <p className="text-sm text-gray-500 mt-1">
          Solo visible en entorno DEV. Última actualización: {status ? new Date(status.timestamp).toLocaleTimeString('es-AR') : '—'}
          {' · '}
          <button onClick={load} className="text-brand-500 hover:underline text-sm">
            Actualizar
          </button>
        </p>
      </div>

      {/* Banner global */}
      {loading && (
        <div className="rounded-xl bg-gray-100 border border-gray-200 p-4 text-gray-500 text-sm animate-pulse">
          Verificando estado...
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 text-red-700 text-sm">
          <strong>Error al consultar estado:</strong> {error}
          <br />
          <span className="text-xs">Verificá que el BFF esté corriendo y que SYNC_DEV_DB_URL / SYNC_PROD_DB_URL estén configurados.</span>
        </div>
      )}

      {status && !error && (
        <>
          {/* Banner resumen */}
          <div className={`rounded-xl border-2 p-4 flex items-center gap-3 ${allSynced ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
            <span className="text-2xl">{allSynced ? '✅' : '🔴'}</span>
            <div>
              <p className={`font-bold ${allSynced ? 'text-green-800' : 'text-red-800'}`}>
                {allSynced
                  ? 'PROD está actualizado'
                  : 'PROD tiene cambios pendientes'}
              </p>
              {!allSynced && (
                <p className="text-sm text-red-600">
                  {[
                    status.commits.count > 0 && `${status.commits.count} commit${status.commits.count !== 1 ? 's' : ''}`,
                    status.migrations.pending.length > 0 && `${status.migrations.pending.length} migración${status.migrations.pending.length !== 1 ? 'es' : ''}`,
                    !status.config.synced && 'config desincronizada',
                  ].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>

          {/* ── Sección: Código Git ── */}
          <SectionCard
            title="Código (Git)"
            icon="📦"
            ok={status.commits.count === 0}
          >
            {status.commits.count === -1 ? (
              <p className="text-sm text-gray-500">
                Git no disponible en este servidor. Ejecutá localmente:
                <code className="ml-2 bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                  git log prod..main --oneline
                </code>
              </p>
            ) : status.commits.count === 0 ? (
              <p className="text-sm text-green-700">main y prod están al mismo commit.</p>
            ) : (
              <>
                <p className="text-sm text-red-700 mb-2">
                  <strong>{status.commits.count}</strong> commit{status.commits.count !== 1 ? 's' : ''} en main sin pushear a prod.
                </p>
                <button
                  onClick={() => setShowCommits(v => !v)}
                  className="text-xs text-brand-600 hover:underline"
                >
                  {showCommits ? 'Ocultar lista' : 'Ver commits'}
                </button>
                {showCommits && (
                  <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                    {status.commits.list.map(c => (
                      <li key={c.sha} className="text-xs font-mono text-gray-700">
                        <span className="text-gray-400">{c.sha}</span>
                        {' '}
                        {c.message}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
            {/* Sync-B: botón "Crear PR main→prod" irá aquí */}
          </SectionCard>

          {/* ── Sección: Migraciones DB ── */}
          <SectionCard
            title="Migraciones DB"
            icon="🗄️"
            ok={status.migrations.pending.length === 0}
          >
            <p className="text-sm text-gray-600 mb-2">
              <strong>{status.migrations.applied.length}</strong> aplicadas
              {status.migrations.pending.length > 0 && (
                <> · <strong className="text-red-700">{status.migrations.pending.length} pendientes</strong></>
              )}
              {' '}de {status.migrations.total} totales.
            </p>

            {status.migrations.pending.length > 0 && (
              <>
                <button
                  onClick={() => setShowMigrations(v => !v)}
                  className="text-xs text-brand-600 hover:underline"
                >
                  {showMigrations ? 'Ocultar' : 'Ver pendientes'}
                </button>
                {showMigrations && (
                  <ul className="mt-2 space-y-1">
                    {status.migrations.pending.map(f => (
                      <li key={f} className="text-xs font-mono text-red-700 bg-red-100 px-2 py-1 rounded">
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
            {/* Sync-B: botón "Aplicar migraciones" irá aquí */}
          </SectionCard>

          {/* ── Sección: Config DB ── */}
          <SectionCard
            title="Configuración DB"
            icon="⚙️"
            ok={status.config.synced}
          >
            <div className="space-y-1">
              {status.config.tables.map(t => (
                <div key={t.name} className="flex items-center gap-2 text-sm">
                  <span>{t.inSync ? '✅' : '❌'}</span>
                  <code className="font-mono text-xs text-gray-700">{t.name}</code>
                  <span className={t.inSync ? 'text-green-600' : 'text-red-600'}>
                    {t.inSync ? 'igual en DEV y PROD' : 'desincronizada'}
                  </span>
                </div>
              ))}
            </div>
            {/* Sync-B: botón "Sincronizar config" irá aquí */}
          </SectionCard>

          {/* Footer info */}
          <p className="text-xs text-gray-400 text-center">
            Polling cada 30s · Solo superadmin · Solo en DEV
          </p>
        </>
      )}
    </div>
  );
}
