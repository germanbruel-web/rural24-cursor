/**
 * SyncPanel — Panel de sincronización LOCAL → DEV → PROD
 * Solo visible en DEV (import.meta.env.DEV) y para superadmin.
 *
 * Etapa 1: LOCAL → DEV  (migraciones pendientes en Supabase DEV, commits sin pushear)
 * Etapa 2: DEV   → PROD (migraciones pendientes en PROD, config, deploy)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const POLL_INTERVAL_MS = 30_000;

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CommitInfo { sha: string; message: string }

interface MigrationsStatus {
  pending: string[];
  applied: string[];
  total: number;
}

interface SyncStatus {
  hasPending: boolean;
  local: {
    hasPending: boolean;
    unpushedCommits: { count: number; list: CommitInfo[] };
    migrations: MigrationsStatus;
  };
  prod: {
    hasPending: boolean;
    commits: { count: number; list: CommitInfo[] };
    migrations: MigrationsStatus;
    config: {
      synced: boolean;
      tables: { name: string; inSync: boolean }[];
    };
  };
  timestamp: string;
}

type ActionState = 'idle' | 'loading' | 'ok' | 'error';
interface ActionResult { state: ActionState; message?: string }

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
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StepHeader({ step, label, ok }: { step: number; label: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${
      ok ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'
    }`}>
      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ${
        ok ? 'bg-green-500 text-white' : 'bg-amber-400 text-white'
      }`}>
        {ok ? '✓' : step}
      </span>
      <span className={`font-bold text-sm ${ok ? 'text-green-800' : 'text-amber-800'}`}>
        {label}
      </span>
      <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-white/60">
        {ok ? 'Sincronizado' : 'Pendiente'}
      </span>
    </div>
  );
}

function ActionButton({
  label,
  result,
  onClick,
  destructive = false,
  disabled = false,
}: {
  label: string;
  result: ActionResult;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const isLoading = result.state === 'loading';
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={onClick}
        disabled={isLoading || disabled}
        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 ${
          destructive
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-brand-500 hover:bg-brand-600 text-white'
        }`}
      >
        {isLoading ? 'Ejecutando...' : label}
      </button>
      {result.state === 'ok' && (
        <span className="text-xs text-green-700 font-medium">✓ {result.message || 'Completado'}</span>
      )}
      {result.state === 'error' && (
        <span className="text-xs text-red-700 font-medium">✗ {result.message || 'Error'}</span>
      )}
    </div>
  );
}

function CommitList({ list }: { list: CommitInfo[] }) {
  return (
    <ul className="mt-2 space-y-1 max-h-36 overflow-y-auto">
      {list.map(c => (
        <li key={c.sha} className="text-xs font-mono text-gray-700">
          <span className="text-gray-400">{c.sha}</span> {c.message}
        </li>
      ))}
    </ul>
  );
}

function MigrationList({ files }: { files: string[] }) {
  return (
    <ul className="mt-2 space-y-1">
      {files.map(f => (
        <li key={f} className="text-xs font-mono text-red-700 bg-red-100 px-2 py-1 rounded">
          {f}
        </li>
      ))}
    </ul>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

export default function SyncPanel() {
  const [status, setStatus]   = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Toggles
  const [showLocalCommits,     setShowLocalCommits]     = useState(false);
  const [showLocalMigrations,  setShowLocalMigrations]  = useState(false);
  const [showProdCommits,      setShowProdCommits]      = useState(false);
  const [showProdMigrations,   setShowProdMigrations]   = useState(false);

  // Acciones
  const [migrateDevResult,  setMigrateDevResult]  = useState<ActionResult>({ state: 'idle' });
  const [migrateProdResult, setMigrateProdResult] = useState<ActionResult>({ state: 'idle' });
  const [configResult,      setConfigResult]      = useState<ActionResult>({ state: 'idle' });
  const [prResult,          setPrResult]          = useState<ActionResult>({ state: 'idle' });
  const [deployResult,      setDeployResult]      = useState<ActionResult>({ state: 'idle' });

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

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleMigrateDev = async () => {
    if (!window.confirm('¿Aplicar todas las migraciones pendientes en DEV?')) return;
    setMigrateDevResult({ state: 'loading' });
    try {
      const json = await callSyncAction('/api/admin/sync/migrate', { target: 'dev' });
      if (json.success) {
        const applied = (json.applied as Array<{ filename: string }>) ?? [];
        setMigrateDevResult({ state: 'ok', message: `${applied.length} migración(es) aplicada(s) en DEV` });
        await load();
      } else {
        setMigrateDevResult({ state: 'error', message: String(json.error ?? 'Error') });
      }
    } catch (err) {
      setMigrateDevResult({ state: 'error', message: err instanceof Error ? err.message : 'Error' });
    }
  };

  const handleMigrateProd = async () => {
    if (!window.confirm('¿Aplicar todas las migraciones pendientes en PROD?')) return;
    setMigrateProdResult({ state: 'loading' });
    try {
      const json = await callSyncAction('/api/admin/sync/migrate', { target: 'prod' });
      if (json.success) {
        const applied = (json.applied as Array<{ filename: string }>) ?? [];
        setMigrateProdResult({ state: 'ok', message: `${applied.length} migración(es) aplicada(s) en PROD` });
        await load();
      } else {
        setMigrateProdResult({ state: 'error', message: String(json.error ?? 'Error') });
      }
    } catch (err) {
      setMigrateProdResult({ state: 'error', message: err instanceof Error ? err.message : 'Error' });
    }
  };

  const handleCloneConfig = async () => {
    if (!window.confirm('¿Clonar configuración de DEV a PROD?\nSobreescribirá global_settings, global_config, subcategorías y option_lists en PROD.')) return;
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
        setDeployResult({ state: 'ok', message: 'Deploy iniciado en Render PROD' });
      } else {
        setDeployResult({ state: 'error', message: String(json.error ?? 'Error') });
      }
    } catch (err) {
      setDeployResult({ state: 'error', message: err instanceof Error ? err.message : 'Error' });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-5">

      {/* Título */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Sincronización LOCAL → DEV → PROD</h1>
        <p className="text-sm text-gray-500 mt-1">
          Última actualización: {status ? new Date(status.timestamp).toLocaleTimeString('es-AR') : '—'}
          {' · '}
          <button onClick={load} className="text-brand-500 hover:underline text-sm">Actualizar</button>
        </p>
      </div>

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
          {/* ══════════════════════════════════════════════════════════════════
              ETAPA 1 — LOCAL → DEV
          ══════════════════════════════════════════════════════════════════ */}
          <StepHeader step={1} label="LOCAL → DEV" ok={!status.local.hasPending} />

          <div className="space-y-3 pl-2 border-l-2 border-gray-200 ml-3">

            {/* Commits sin pushear */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-gray-700">Código (Git)</span>
                {status.local.unpushedCommits.count === -1 ? (
                  <span className="text-xs text-gray-400">git no disponible</span>
                ) : status.local.unpushedCommits.count === 0 ? (
                  <span className="text-xs text-green-600 font-medium">Pusheado ✓</span>
                ) : (
                  <span className="text-xs text-amber-700 font-medium">
                    {status.local.unpushedCommits.count} commits sin pushear
                  </span>
                )}
              </div>
              {status.local.unpushedCommits.count > 0 && (
                <>
                  <button onClick={() => setShowLocalCommits(v => !v)} className="text-xs text-brand-600 hover:underline">
                    {showLocalCommits ? 'Ocultar' : 'Ver commits'}
                  </button>
                  {showLocalCommits && <CommitList list={status.local.unpushedCommits.list} />}
                  <p className="text-xs text-gray-500 mt-2">
                    Ejecutá <code className="bg-gray-100 px-1 rounded">git push origin main</code> para subir a Render DEV.
                  </p>
                </>
              )}
              {status.local.unpushedCommits.count === -1 && (
                <p className="text-xs text-gray-500">
                  Verificá localmente: <code className="bg-gray-100 px-1 rounded">git log origin/main..HEAD --oneline</code>
                </p>
              )}
            </div>

            {/* Migraciones en DEV */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-gray-700">Migraciones DB (DEV)</span>
                {status.local.migrations.pending.length === 0 ? (
                  <span className="text-xs text-green-600 font-medium">
                    {status.local.migrations.applied.length}/{status.local.migrations.total} aplicadas ✓
                  </span>
                ) : (
                  <span className="text-xs text-amber-700 font-medium">
                    {status.local.migrations.pending.length} pendientes
                  </span>
                )}
              </div>
              {status.local.migrations.pending.length > 0 && (
                <>
                  <button onClick={() => setShowLocalMigrations(v => !v)} className="text-xs text-brand-600 hover:underline mb-2">
                    {showLocalMigrations ? 'Ocultar' : 'Ver pendientes'}
                  </button>
                  {showLocalMigrations && <MigrationList files={status.local.migrations.pending} />}
                  <div className="mt-3">
                    <ActionButton
                      label="Aplicar migraciones en DEV"
                      result={migrateDevResult}
                      onClick={handleMigrateDev}
                      destructive
                    />
                  </div>
                </>
              )}
            </div>

          </div>

          {/* ══════════════════════════════════════════════════════════════════
              ETAPA 2 — DEV → PROD
          ══════════════════════════════════════════════════════════════════ */}
          <StepHeader step={2} label="DEV → PROD" ok={!status.prod.hasPending} />

          <div className="space-y-3 pl-2 border-l-2 border-gray-200 ml-3">

            {/* Código main→prod */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-gray-700">Código (Git main→prod)</span>
                {status.prod.commits.count === -1 ? (
                  <span className="text-xs text-gray-400">git no disponible en servidor</span>
                ) : status.prod.commits.count === 0 ? (
                  <span className="text-xs text-green-600 font-medium">Sincronizado ✓</span>
                ) : (
                  <span className="text-xs text-red-700 font-medium">
                    {status.prod.commits.count} commits pendientes
                  </span>
                )}
              </div>
              {status.prod.commits.count > 0 && (
                <>
                  <button onClick={() => setShowProdCommits(v => !v)} className="text-xs text-brand-600 hover:underline mb-2">
                    {showProdCommits ? 'Ocultar' : 'Ver commits'}
                  </button>
                  {showProdCommits && <CommitList list={status.prod.commits.list} />}
                </>
              )}
              <div className="mt-3 flex flex-wrap gap-3">
                <ActionButton label="Crear PR main → prod" result={prResult} onClick={handleCreatePR} />
                <ActionButton label="Deploy PROD" result={deployResult} onClick={handleDeploy} destructive />
              </div>
            </div>

            {/* Migraciones en PROD */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-gray-700">Migraciones DB (PROD)</span>
                {status.prod.migrations.pending.length === 0 ? (
                  <span className="text-xs text-green-600 font-medium">
                    {status.prod.migrations.applied.length}/{status.prod.migrations.total} aplicadas ✓
                  </span>
                ) : (
                  <span className="text-xs text-red-700 font-medium">
                    {status.prod.migrations.pending.length} pendientes
                  </span>
                )}
              </div>
              {status.prod.migrations.pending.length > 0 && (
                <>
                  <button onClick={() => setShowProdMigrations(v => !v)} className="text-xs text-brand-600 hover:underline mb-2">
                    {showProdMigrations ? 'Ocultar' : 'Ver pendientes'}
                  </button>
                  {showProdMigrations && <MigrationList files={status.prod.migrations.pending} />}
                  <div className="mt-3">
                    <ActionButton
                      label="Aplicar migraciones en PROD"
                      result={migrateProdResult}
                      onClick={handleMigrateProd}
                      destructive
                    />
                  </div>
                </>
              )}
            </div>

            {/* Config DEV vs PROD */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-gray-700">Configuración DB</span>
                {status.prod.config.synced ? (
                  <span className="text-xs text-green-600 font-medium">Sincronizada ✓</span>
                ) : (
                  <span className="text-xs text-red-700 font-medium">Desincronizada</span>
                )}
              </div>
              <div className="space-y-1 mb-3">
                {status.prod.config.tables.map(t => (
                  <div key={t.name} className="flex items-center gap-2 text-sm">
                    <span>{t.inSync ? '✅' : '❌'}</span>
                    <code className="font-mono text-xs text-gray-700">{t.name}</code>
                    <span className={t.inSync ? 'text-green-600 text-xs' : 'text-red-600 text-xs'}>
                      {t.inSync ? 'igual en DEV y PROD' : 'desincronizada'}
                    </span>
                  </div>
                ))}
              </div>
              {!status.prod.config.synced && (
                <ActionButton
                  label="Clonar config DEV → PROD"
                  result={configResult}
                  onClick={handleCloneConfig}
                  destructive
                />
              )}
            </div>

          </div>

          <p className="text-xs text-gray-400 text-center">
            Polling cada 30s · Solo superadmin · Solo en DEV
          </p>
        </>
      )}
    </div>
  );
}
