/**
 * SyncPanel — Panel de sincronización DEV → PROD
 * Solo visible en DEV (import.meta.env.DEV) y para superadmin.
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
    count: number;
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

type ActionState = 'idle' | 'loading' | 'ok' | 'error';

interface ActionResult {
  state: ActionState;
  message?: string;
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

async function callSyncAction(
  path: string,
  body: Record<string, unknown> = {}
): Promise<{ success: boolean; [k: string]: unknown }> {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
  return json;
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

function ActionButton({
  label,
  result,
  onClick,
  destructive = false,
}: {
  label: string;
  result: ActionResult;
  onClick: () => void;
  destructive?: boolean;
}) {
  const isLoading = result.state === 'loading';
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={onClick}
        disabled={isLoading}
        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
          destructive
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-brand-500 hover:bg-brand-600 text-white'
        }`}
      >
        {isLoading ? 'Ejecutando...' : label}
      </button>
      {result.state === 'ok' && (
        <span className="text-xs text-green-700 font-medium">
          ✓ {result.message || 'Completado'}
        </span>
      )}
      {result.state === 'error' && (
        <span className="text-xs text-red-700 font-medium">
          ✗ {result.message || 'Error'}
        </span>
      )}
    </div>
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
  const [showCommits, setShowCommits]       = useState(false);
  const [showMigrations, setShowMigrations] = useState(false);

  // Acciones
  const [migrateResult, setMigrateResult] = useState<ActionResult>({ state: 'idle' });
  const [configResult,  setConfigResult]  = useState<ActionResult>({ state: 'idle' });
  const [prResult,      setPrResult]      = useState<ActionResult>({ state: 'idle' });
  const [deployResult,  setDeployResult]  = useState<ActionResult>({ state: 'idle' });

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

  // ── Handlers de acción ───────────────────────────────────────────────────────

  const handleMigrate = async () => {
    if (!window.confirm('¿Aplicar todas las migraciones pendientes en PROD?')) return;
    setMigrateResult({ state: 'loading' });
    try {
      const json = await callSyncAction('/api/admin/sync/migrate');
      if (json.success) {
        const applied = (json.applied as Array<{ filename: string }>) ?? [];
        setMigrateResult({ state: 'ok', message: `${applied.length} migración(es) aplicada(s)` });
        await load();
      } else {
        setMigrateResult({ state: 'error', message: String(json.error ?? 'Error') });
      }
    } catch (err) {
      setMigrateResult({ state: 'error', message: err instanceof Error ? err.message : 'Error' });
    }
  };

  const handleCloneConfig = async () => {
    if (!window.confirm('¿Clonar configuración de DEV a PROD? Esto sobreescribirá global_settings, global_config, subcategorias y option_lists en PROD.')) return;
    setConfigResult({ state: 'loading' });
    try {
      const json = await callSyncAction('/api/admin/sync/config');
      if (json.success) {
        const results = (json.results as Array<{ table: string; rows: number }>) ?? [];
        const summary = results.map(r => `${r.table}(${r.rows})`).join(', ');
        setConfigResult({ state: 'ok', message: summary });
        await load();
      } else {
        setConfigResult({ state: 'error', message: String(json.error ?? 'Error') });
      }
    } catch (err) {
      setConfigResult({ state: 'error', message: err instanceof Error ? err.message : 'Error' });
    }
  };

  const handleCreatePR = async () => {
    if (!window.confirm('¿Crear PR main → prod en GitHub?')) return;
    setPrResult({ state: 'loading' });
    try {
      const json = await callSyncAction('/api/admin/sync/git-push', { merge: false });
      if (json.success) {
        const pr = json.pr as { number: number; url: string };
        setPrResult({ state: 'ok', message: `PR #${pr.number} creado` });
      } else {
        setPrResult({ state: 'error', message: String(json.error ?? 'Error') });
      }
    } catch (err) {
      setPrResult({ state: 'error', message: err instanceof Error ? err.message : 'Error' });
    }
  };

  const handleDeploy = async () => {
    if (!window.confirm('¿Disparar deploy en Render PROD (frontend + backend)?')) return;
    setDeployResult({ state: 'loading' });
    try {
      const json = await callSyncAction('/api/admin/sync/deploy');
      if (json.success) {
        setDeployResult({ state: 'ok', message: 'Deploy iniciado en Render' });
      } else {
        setDeployResult({ state: 'error', message: String(json.error ?? 'Error') });
      }
    } catch (err) {
      setDeployResult({ state: 'error', message: err instanceof Error ? err.message : 'Error' });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

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
                  className="text-xs text-brand-600 hover:underline mb-3"
                >
                  {showCommits ? 'Ocultar lista' : 'Ver commits'}
                </button>
                {showCommits && (
                  <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto mb-3">
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
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
              <ActionButton
                label="Crear PR main → prod"
                result={prResult}
                onClick={handleCreatePR}
              />
              {prResult.state === 'ok' && (
                <ActionButton
                  label="Deploy PROD (Render)"
                  result={deployResult}
                  onClick={handleDeploy}
                  destructive
                />
              )}
            </div>
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
                  className="text-xs text-brand-600 hover:underline mb-3"
                >
                  {showMigrations ? 'Ocultar' : 'Ver pendientes'}
                </button>
                {showMigrations && (
                  <ul className="mt-2 space-y-1 mb-3">
                    {status.migrations.pending.map(f => (
                      <li key={f} className="text-xs font-mono text-red-700 bg-red-100 px-2 py-1 rounded">
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <ActionButton
                    label="Aplicar migraciones pendientes en PROD"
                    result={migrateResult}
                    onClick={handleMigrate}
                    destructive
                  />
                </div>
              </>
            )}
          </SectionCard>

          {/* ── Sección: Config DB ── */}
          <SectionCard
            title="Configuración DB"
            icon="⚙️"
            ok={status.config.synced}
          >
            <div className="space-y-1 mb-3">
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
            {!status.config.synced && (
              <div className="pt-3 border-t border-gray-200">
                <ActionButton
                  label="Clonar config DEV → PROD"
                  result={configResult}
                  onClick={handleCloneConfig}
                  destructive
                />
              </div>
            )}
          </SectionCard>

          {/* ── Deploy independiente ── */}
          <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4">
            <h3 className="font-bold text-gray-800 mb-3">Deploy manual</h3>
            <ActionButton
              label="Deploy PROD (frontend + backend)"
              result={deployResult}
              onClick={handleDeploy}
              destructive
            />
          </div>

          {/* Footer info */}
          <p className="text-xs text-gray-400 text-center">
            Polling cada 30s · Solo superadmin · Solo en DEV
          </p>
        </>
      )}
    </div>
  );
}
