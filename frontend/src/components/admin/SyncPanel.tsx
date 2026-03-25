/**
 * SyncPanel — Panel de sincronización LOCAL → DEV → PROD
 * Solo visible en DEV (import.meta.env.DEV) y para superadmin.
 *
 * REGLA DE ORO #0: LOCAL debe ser 100% igual a DEV antes de cualquier acción PROD.
 * Las acciones de PROD están bloqueadas si LOCAL tiene pendientes.
 *
 * Etapa 1: LOCAL → DEV  (archivos commitados + pusheados a main, migraciones en DEV)
 * Etapa 2: DEV   → PROD (commits main→prod, migraciones PROD, config)
 */

import { useEffect, useState, useCallback } from 'react';
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
    dirtyFiles: { count: number; files: string[] };
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
  const { data: { session } } = await supabase.auth.getSession();
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
  body: Record<string, unknown> = {},
  timeoutMs = 120_000
): Promise<{ success: boolean; [k: string]: unknown }> {
  const token = await getAuthToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
  } catch (err) {
    if ((err as { name?: string }).name === 'AbortError') {
      return { success: false, error: 'Timeout: la operación tardó demasiado' };
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function downloadBackup(target: 'dev' | 'prod') {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE}/api/admin/sync/backup?target=${target}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const ts   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `rural24_backup_${target}_${ts}.sql`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

function BackupButton({ target, disabled }: { target: 'dev' | 'prod'; disabled?: boolean }) {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [msg,   setMsg]   = useState('');

  const handle = async () => {
    setState('loading');
    try {
      await downloadBackup(target);
      setState('ok');
      setMsg('Backup descargado');
      setTimeout(() => setState('idle'), 3000);
    } catch (err: unknown) {
      setState('error');
      setMsg(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handle}
        disabled={state === 'loading' || disabled}
        className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-700 hover:bg-gray-800 text-white disabled:opacity-40 transition-colors"
      >
        {state === 'loading' ? 'Generando...' : `Descargar Backup ${target.toUpperCase()}`}
      </button>
      {state === 'ok'    && <span className="text-xs text-green-700 font-medium">✓ {msg}</span>}
      {state === 'error' && <span className="text-xs text-red-700 font-medium">✗ {msg}</span>}
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

export default function SyncPanel() {
  const [status,     setStatus]     = useState<SyncStatus | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Toggles
  const [showDirtyFiles,       setShowDirtyFiles]       = useState(false);
  const [showLocalCommits,     setShowLocalCommits]     = useState(false);
  const [showLocalMigrations,  setShowLocalMigrations]  = useState(false);
  const [showProdCommits,      setShowProdCommits]      = useState(false);
  const [showProdMigrations,   setShowProdMigrations]   = useState(false);

  // Acciones
  const [commitMsg,         setCommitMsg]         = useState('');
  const [commitResult,      setCommitResult]      = useState<ActionResult>({ state: 'idle' });
  const [pushResult,        setPushResult]        = useState<ActionResult>({ state: 'idle' });
  const [migrateDevResult,  setMigrateDevResult]  = useState<ActionResult>({ state: 'idle' });
  const [markDevResult,     setMarkDevResult]     = useState<ActionResult>({ state: 'idle' });
  const [migrateProdResult, setMigrateProdResult] = useState<ActionResult>({ state: 'idle' });
  const [markProdResult,    setMarkProdResult]    = useState<ActionResult>({ state: 'idle' });
  const [configResult,      setConfigResult]      = useState<ActionResult>({ state: 'idle' });
  const [prResult,          setPrResult]          = useState<ActionResult>({ state: 'idle' });
  const [mergeResult,       setMergeResult]       = useState<ActionResult>({ state: 'idle' });
  const [deployResult,      setDeployResult]      = useState<ActionResult>({ state: 'idle' });

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      setError(null);
      const data = await fetchStatus();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleCommit = async () => {
    const msg = commitMsg.trim();
    if (!msg) return;
    setCommitResult({ state: 'loading' });
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/api/admin/sync/git-commit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setCommitResult({ state: 'ok', message: 'Commit creado ✓' });
      setCommitMsg('');
      setTimeout(() => { load(true); setCommitResult({ state: 'idle' }); }, 1500);
    } catch (err: unknown) {
      setCommitResult({ state: 'error', message: err instanceof Error ? err.message : 'Error' });
    }
  };

  const handlePushOriginMain = async () => {
    if (!window.confirm('¿Ejecutar git push origin main?\nSubirá todos los commits locales a GitHub y disparará el redeploy en Render DEV.')) return;
    setPushResult({ state: 'loading' });
    try {
      const json = await callSyncAction('/api/admin/sync/local-push');
      if (json.success) {
        setPushResult({ state: 'ok', message: 'Push a origin/main exitoso — Render DEV redeploya automáticamente' });
        await load();
      } else {
        setPushResult({ state: 'error', message: String(json.error ?? 'Error') });
      }
    } catch (err) {
      setPushResult({ state: 'error', message: err instanceof Error ? err.message : 'Error' });
    }
  };

  const handleMigrateDev = async () => {
    if (!window.confirm('¿Aplicar todas las migraciones pendientes en DEV?\n\nAsegurate de haber descargado el backup antes.')) return;
    setMigrateDevResult({ state: 'loading' });
    try {
      const json = await callSyncAction('/api/admin/sync/migrate', { target: 'dev' });
      const applied = (json.applied as Array<{ filename: string; ok: boolean; error?: string }>) ?? [];
      if (json.success) {
        setMigrateDevResult({ state: 'ok', message: `${applied.length} migración(es) aplicada(s) en DEV` });
        await load();
      } else {
        const failed = applied.find(r => !r.ok);
        setMigrateDevResult({ state: 'error', message: failed?.error ?? String(json.error ?? 'Error desconocido') });
      }
    } catch (err) {
      setMigrateDevResult({ state: 'error', message: err instanceof Error ? err.message : 'Error' });
    }
  };

  const handleMarkDev = async () => {
    if (!window.confirm('¿Marcar TODAS las migraciones pendientes como aplicadas en DEV?\n\nUsá esto si la DB ya tiene el schema pero no está registrado en el tracking.\nNO ejecuta ningún SQL.')) return;
    setMarkDevResult({ state: 'loading' });
    try {
      const json = await callSyncAction('/api/admin/sync/mark', { target: 'dev' });
      if (json.success) {
        const marked = (json.marked as string[]) ?? [];
        setMarkDevResult({ state: 'ok', message: `${marked.length} migración(es) marcadas como aplicadas en DEV` });
        await load();
      } else {
        setMarkDevResult({ state: 'error', message: String(json.error ?? 'Error') });
      }
    } catch (err) {
      setMarkDevResult({ state: 'error', message: err instanceof Error ? err.message : 'Error' });
    }
  };

  const handleMigrateProd = async () => {
    if (!window.confirm('¿Aplicar todas las migraciones pendientes en PROD?\n\nAsegurate de haber descargado el backup de PROD antes.\nEsta acción es irreversible.')) return;
    setMigrateProdResult({ state: 'loading' });
    try {
      const json = await callSyncAction('/api/admin/sync/migrate', { target: 'prod' });
      const applied = (json.applied as Array<{ filename: string; ok: boolean; error?: string }>) ?? [];
      if (json.success) {
        setMigrateProdResult({ state: 'ok', message: `${applied.length} migración(es) aplicada(s) en PROD` });
        await load();
      } else {
        const failed = applied.find(r => !r.ok);
        setMigrateProdResult({ state: 'error', message: failed?.error ?? String(json.error ?? 'Error desconocido') });
      }
    } catch (err) {
      setMigrateProdResult({ state: 'error', message: err instanceof Error ? err.message : 'Error' });
    }
  };

  const handleMarkProd = async () => {
    if (!window.confirm('¿Marcar TODAS las migraciones pendientes como aplicadas en PROD?\n\nNO ejecuta ningún SQL.')) return;
    setMarkProdResult({ state: 'loading' });
    try {
      const json = await callSyncAction('/api/admin/sync/mark', { target: 'prod' });
      if (json.success) {
        const marked = (json.marked as string[]) ?? [];
        setMarkProdResult({ state: 'ok', message: `${marked.length} migración(es) marcadas en PROD` });
        await load();
      } else {
        setMarkProdResult({ state: 'error', message: String(json.error ?? 'Error') });
      }
    } catch (err) {
      setMarkProdResult({ state: 'error', message: err instanceof Error ? err.message : 'Error' });
    }
  };

  const handleCloneConfig = async () => {
    if (!window.confirm('¿Clonar configuración de DEV a PROD?\nSobreescribirá global_settings, global_config, subcategorías y option_lists en PROD.')) return;
    setConfigResult({ state: 'loading' });
    try {
      const json = await callSyncAction('/api/admin/sync/config', {}, 270_000);
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
        if (json.alreadyInSync) {
          setPrResult({ state: 'ok', message: 'main y prod ya están sincronizados' });
        } else {
          const pr = json.pr as { number: number; url: string };
          setPrResult({ state: 'ok', message: `PR #${pr.number} creado` });
        }
      } else {
        setPrResult({ state: 'error', message: String(json.error ?? 'Error') });
      }
    } catch (err) {
      setPrResult({ state: 'error', message: err instanceof Error ? err.message : 'Error' });
    }
  };

  const handleMergePR = async () => {
    if (!window.confirm('¿Mergear PR main → prod en GitHub?\nEsto actualiza la rama prod con todos los commits de main.')) return;
    setMergeResult({ state: 'loading' });
    try {
      const json = await callSyncAction('/api/admin/sync/git-push', { merge: true });
      if (json.success) {
        if (json.alreadyInSync) {
          setMergeResult({ state: 'ok', message: 'main y prod ya están sincronizados' });
        } else {
          const pr = json.pr as { number: number; url: string };
          setMergeResult({ state: 'ok', message: `PR #${pr.number} mergeado ✓` });
        }
      } else {
        setMergeResult({ state: 'error', message: String(json.error ?? 'Error') });
      }
    } catch (err) {
      setMergeResult({ state: 'error', message: err instanceof Error ? err.message : 'Error' });
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

  // ── Gate de PROD: bloqueado si LOCAL tiene pendientes ─────────────────────
  const localOk = status
    ? !status.local.hasPending
    : false;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-5">

      {/* Título */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Sincronización LOCAL → DEV → PROD</h1>
        <p className="text-sm text-gray-500 mt-1">
          Última actualización: {status ? new Date(status.timestamp).toLocaleTimeString('es-AR') : '—'}
          {' · '}
          <button onClick={() => load(true)} className="text-brand-500 hover:underline text-sm">
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </p>
      </div>

      {/* Regla de oro */}
      <div className="rounded-xl border-2 border-brand-400 bg-brand-50 px-4 py-3 text-sm text-brand-800">
        <strong>Regla de oro:</strong> LOCAL = DEV antes de cualquier acción en PROD.
        El código debe estar 100% commitado y pusheado a <code className="bg-white/60 px-1 rounded">main</code> antes de tocar PROD.
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
                ) : status.local.dirtyFiles?.count > 0 ? (
                  <span className="text-xs text-orange-600 font-medium">
                    {status.local.dirtyFiles.count} archivos sin commitear
                  </span>
                ) : status.local.unpushedCommits.count === 0 ? (
                  <span className="text-xs text-green-600 font-medium">Pusheado ✓</span>
                ) : (
                  <span className="text-xs text-amber-700 font-medium">
                    {status.local.unpushedCommits.count} commits sin pushear
                  </span>
                )}
              </div>
              {status.local.dirtyFiles?.count > 0 && (
                <div className="mt-2 space-y-2">
                  <button
                    onClick={() => setShowDirtyFiles(v => !v)}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    {showDirtyFiles ? 'Ocultar archivos' : `Ver ${status.local.dirtyFiles.count} archivos`}
                  </button>
                  {showDirtyFiles && (
                    <ul className="text-xs text-gray-600 bg-gray-50 rounded p-2 space-y-0.5 max-h-40 overflow-y-auto font-mono">
                      {status.local.dirtyFiles.files.map(f => (
                        <li key={f} className="truncate">{f}</li>
                      ))}
                    </ul>
                  )}
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={commitMsg}
                      onChange={e => setCommitMsg(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCommit()}
                      placeholder="Mensaje de commit..."
                      className="flex-1 text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <button
                      onClick={handleCommit}
                      disabled={!commitMsg.trim() || commitResult.state === 'loading'}
                      className="text-xs px-3 py-1.5 rounded bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      {commitResult.state === 'loading' ? 'Commiteando...' : 'Commitear'}
                    </button>
                  </div>
                  {commitResult.state === 'ok' && (
                    <p className="text-xs text-green-600">{commitResult.message}</p>
                  )}
                  {commitResult.state === 'error' && (
                    <p className="text-xs text-red-600">{commitResult.message}</p>
                  )}
                </div>
              )}
              {status.local.unpushedCommits.count > 0 && (
                <>
                  <button onClick={() => setShowLocalCommits(v => !v)} className="text-xs text-brand-600 hover:underline">
                    {showLocalCommits ? 'Ocultar' : 'Ver commits'}
                  </button>
                  {showLocalCommits && <CommitList list={status.local.unpushedCommits.list} />}
                  <div className="mt-3">
                    <ActionButton
                      label="git push origin main"
                      result={pushResult}
                      onClick={handlePushOriginMain}
                    />
                  </div>
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
              {/* Backup siempre disponible para DEV */}
              <div className="mt-2">
                <BackupButton target="dev" />
              </div>
              {status.local.migrations.pending.length > 0 && (
                <>
                  <button onClick={() => setShowLocalMigrations(v => !v)} className="text-xs text-brand-600 hover:underline mb-2 mt-3 block">
                    {showLocalMigrations ? 'Ocultar' : 'Ver pendientes'}
                  </button>
                  {showLocalMigrations && <MigrationList files={status.local.migrations.pending} />}
                  <div className="mt-3 flex flex-col gap-2">
                    <ActionButton
                      label="Aplicar migraciones en DEV"
                      result={migrateDevResult}
                      onClick={handleMigrateDev}
                      destructive
                    />
                    <ActionButton
                      label="Marcar como aplicadas (sin ejecutar SQL)"
                      result={markDevResult}
                      onClick={handleMarkDev}
                    />
                  </div>
                </>
              )}
            </div>

          </div>

          {/* ══════════════════════════════════════════════════════════════════
              ETAPA 2 — DEV → PROD
              BLOQUEADO si LOCAL tiene pendientes
          ══════════════════════════════════════════════════════════════════ */}
          <StepHeader step={2} label="DEV → PROD" ok={!status.prod.hasPending} />

          {/* Gate: aviso de bloqueo */}
          {!localOk && (
            <div className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
              <strong>Bloqueado.</strong> Completá la Etapa 1 antes de operar PROD.
              <br />
              <span className="text-xs">LOCAL debe tener cero archivos sin commitear y cero commits sin pushear a <code className="bg-white/60 px-1 rounded">origin/main</code>.</span>
            </div>
          )}

          <div className={`space-y-3 pl-2 border-l-2 ml-3 ${localOk ? 'border-gray-200' : 'border-red-200 opacity-60 pointer-events-none'}`}>

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
                <ActionButton label="Crear PR main → prod" result={prResult} onClick={handleCreatePR} disabled={!localOk} />
                <ActionButton label="Mergear PR" result={mergeResult} onClick={handleMergePR} disabled={!localOk} />
                <ActionButton label="Deploy PROD" result={deployResult} onClick={handleDeploy} destructive disabled={!localOk} />
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
              {/* Backup PROD — siempre disponible aunque el resto esté bloqueado */}
              <div className="mt-2 pointer-events-auto opacity-100">
                <BackupButton target="prod" />
              </div>
              {status.prod.migrations.pending.length > 0 && (
                <>
                  <button onClick={() => setShowProdMigrations(v => !v)} className="text-xs text-brand-600 hover:underline mb-2 mt-3 block">
                    {showProdMigrations ? 'Ocultar' : 'Ver pendientes'}
                  </button>
                  {showProdMigrations && <MigrationList files={status.prod.migrations.pending} />}
                  <div className="mt-3 flex flex-col gap-2">
                    <ActionButton
                      label="Aplicar migraciones en PROD"
                      result={migrateProdResult}
                      onClick={handleMigrateProd}
                      destructive
                      disabled={!localOk}
                    />
                    <ActionButton
                      label="Marcar como aplicadas (sin ejecutar SQL)"
                      result={markProdResult}
                      onClick={handleMarkProd}
                      disabled={!localOk}
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
                <div className="flex flex-col gap-2">
                  <ActionButton
                    label="Clonar config DEV → PROD"
                    result={configResult}
                    onClick={handleCloneConfig}
                    destructive
                    disabled={!localOk}
                  />
                  <button
                    onClick={async () => {
                      const token = await getAuthToken();
                      const r = await fetch(`${API_BASE}/api/admin/sync/config-debug`, { headers: { Authorization: `Bearer ${token}` } });
                      const data = await r.json();
                      const diffs = data.diff?.filter((d: { match: boolean }) => !d.match) ?? [];
                      console.log('[config-debug] Filas diferentes:', JSON.stringify(diffs, null, 2));
                      alert(`${diffs.length} fila(s) diferente(s) en global_settings.\nRevisá la consola (F12) para ver el detalle.`);
                    }}
                    className="text-xs text-gray-500 hover:text-brand-600 underline text-left"
                  >
                    Ver diferencias en consola (debug)
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ── Snapshots ─────────────────────────────────────────────── */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-gray-700">Snapshots / Backups manuales</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Descargá backups SQL de tablas de configuración (no incluye datos de usuarios).
              Para backup completo de datos, usá el dashboard de Supabase → Backups.
            </p>
            <div className="flex flex-wrap gap-3">
              <BackupButton target="dev" />
              <BackupButton target="prod" />
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Guardá los archivos .sql en un lugar seguro (Drive, carpeta local).
              Para restaurar: ejecutar el SQL manualmente en el dashboard de Supabase.
            </p>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Polling cada 30s · Solo superadmin · Solo en DEV
          </p>
        </>
      )}
    </div>
  );
}
