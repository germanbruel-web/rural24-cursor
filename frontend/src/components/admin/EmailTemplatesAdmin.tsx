/**
 * EmailTemplatesAdmin
 * Panel CMS para editar plantillas de email desde el admin.
 * Ruta: #/email-templates-admin (superadmin only)
 *
 * Funcionalidades:
 * - Lista de plantillas con metadata
 * - Editor de subject + HTML
 * - Referencia de variables disponibles
 * - Preview en iframe
 * - Test send a email arbitrario
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail, Save, Send, Eye, EyeOff, RefreshCw, CheckCircle,
  AlertCircle, Code, Variable, ChevronRight,
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ── Tipos ──────────────────────────────────────────────────────

interface EmailTemplate {
  type:         string;
  subject:      string;
  html_content: string;
  variables:    string[];
  description:  string | null;
  updated_at:   string;
}

const TYPE_LABELS: Record<string, string> = {
  welcome:            'Bienvenida (OAuth)',
  welcome_verify:     'Bienvenida con verificación',
  featured_activated: 'Destacado activado',
  contact_form:       'Formulario de contacto',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  welcome:            <Mail className="w-4 h-4" />,
  welcome_verify:     <Mail className="w-4 h-4" />,
  featured_activated: <CheckCircle className="w-4 h-4" />,
  contact_form:       <Send className="w-4 h-4" />,
};

// ── Helpers ────────────────────────────────────────────────────

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session?.access_token ?? ''}`,
    'Content-Type':  'application/json',
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Componente principal ───────────────────────────────────────

export default function EmailTemplatesAdmin() {
  const [templates, setTemplates]       = useState<EmailTemplate[]>([]);
  const [selected, setSelected]         = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject]   = useState('');
  const [editHtml, setEditHtml]         = useState('');
  const [showPreview, setShowPreview]   = useState(false);
  const [testEmail, setTestEmail]       = useState('');
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [sendingTest, setSendingTest]   = useState(false);
  const [toast, setToast]               = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Fetch ──────────────────────────────────────────────────

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/api/admin/email-templates`, { headers });
      if (!res.ok) throw new Error('Error al cargar plantillas');
      const { data } = await res.json();
      const list: EmailTemplate[] = (data ?? []).map((t: any) => ({
        ...t,
        variables: Array.isArray(t.variables) ? t.variables : JSON.parse(t.variables ?? '[]'),
      }));
      setTemplates(list);
      // Seleccionar el primero por defecto
      if (list.length > 0 && !selected) {
        selectTemplate(list[0]);
      }
    } catch (err) {
      showToast('Error al cargar plantillas.', false);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // ── Selección ──────────────────────────────────────────────

  function selectTemplate(t: EmailTemplate) {
    setSelected(t);
    setEditSubject(t.subject);
    setEditHtml(t.html_content);
    setShowPreview(false);
  }

  const isDirty = selected
    && (editSubject !== selected.subject || editHtml !== selected.html_content);

  // ── Guardar ────────────────────────────────────────────────

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/api/admin/email-templates/${selected.type}`, {
        method:  'PUT',
        headers,
        body:    JSON.stringify({ subject: editSubject, html_content: editHtml }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al guardar');
      }
      // Actualizar lista local
      const updated = { ...selected, subject: editSubject, html_content: editHtml, updated_at: new Date().toISOString() };
      setTemplates(prev => prev.map(t => t.type === selected.type ? updated : t));
      setSelected(updated);
      showToast('Plantilla guardada correctamente.', true);
    } catch (err: any) {
      showToast(err.message || 'Error al guardar.', false);
    } finally {
      setSaving(false);
    }
  }

  // ── Test send ──────────────────────────────────────────────

  async function handleTestSend() {
    if (!selected || !testEmail.trim()) return;
    setSendingTest(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/api/admin/email-templates/${selected.type}/test`, {
        method:  'POST',
        headers,
        body:    JSON.stringify({ to: testEmail.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al enviar');
      }
      showToast(`Email de prueba enviado a ${testEmail.trim()}`, true);
    } catch (err: any) {
      showToast(err.message || 'Error al enviar email de prueba.', false);
    } finally {
      setSendingTest(false);
    }
  }

  // ── Toast ──────────────────────────────────────────────────

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-500 rounded-lg">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Plantillas de Email</h1>
            <p className="text-sm text-gray-500">Editá el asunto y contenido HTML de cada email transaccional</p>
          </div>
        </div>
        <button
          onClick={fetchTemplates}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white
          ${toast.ok ? 'bg-brand-600' : 'bg-red-500'}`}
        >
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Cargando plantillas...
        </div>
      ) : (
        <div className="flex gap-6">

          {/* ── Columna izquierda: lista de plantillas ── */}
          <div className="w-64 shrink-0">
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {templates.map((t, i) => (
                <button
                  key={t.type}
                  onClick={() => selectTemplate(t)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors
                    ${i > 0 ? 'border-t border-gray-100' : ''}
                    ${selected?.type === t.type
                      ? 'bg-brand-50 border-l-2 border-l-brand-500'
                      : 'hover:bg-gray-50'
                    }`}
                >
                  <span className={`${selected?.type === t.type ? 'text-brand-600' : 'text-gray-400'}`}>
                    {TYPE_ICONS[t.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${selected?.type === t.type ? 'text-brand-700' : 'text-gray-700'}`}>
                      {TYPE_LABELS[t.type] ?? t.type}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{t.type}</p>
                  </div>
                  {selected?.type === t.type && <ChevronRight className="w-4 h-4 text-brand-500 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* ── Columna derecha: editor ── */}
          {selected ? (
            <div className="flex-1 min-w-0 space-y-4">

              {/* Info + última edición */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{TYPE_LABELS[selected.type] ?? selected.type}</p>
                  {selected.description && <p className="text-xs text-gray-500 mt-0.5">{selected.description}</p>}
                </div>
                <p className="text-xs text-gray-400 shrink-0">
                  Editado: {formatDate(selected.updated_at)}
                </p>
              </div>

              {/* Variables disponibles */}
              {selected.variables.length > 0 && (
                <div className="border border-dashed border-gray-300 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Variable className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Variables disponibles</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.variables.map(v => (
                      <code
                        key={v}
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono cursor-pointer hover:bg-brand-50 hover:text-brand-700"
                        title="Clic para copiar"
                        onClick={() => navigator.clipboard.writeText(`{{${v}}}`)}
                      >
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Clic en una variable para copiarla. Usá estas variables en el asunto y en el HTML.</p>
                </div>
              )}

              {/* Asunto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asunto del email</label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={e => setEditSubject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Asunto del email..."
                />
              </div>

              {/* Editor HTML + Preview toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Contenido HTML</label>
                  <button
                    onClick={() => setShowPreview(p => !p)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600"
                  >
                    {showPreview ? <><EyeOff className="w-3.5 h-3.5" /> Ocultar preview</> : <><Eye className="w-3.5 h-3.5" /> Ver preview</>}
                  </button>
                </div>

                {showPreview ? (
                  <div className="border border-gray-200 rounded-xl overflow-hidden h-96">
                    <div className="bg-gray-100 px-3 py-1.5 flex items-center gap-2 border-b border-gray-200">
                      <Code className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-500">Preview (datos de muestra)</span>
                    </div>
                    <iframe
                      srcDoc={editHtml || '<p style="padding:24px;color:#6b7280;font-family:sans-serif;">Sin contenido HTML todavía.</p>'}
                      className="w-full h-full bg-white"
                      sandbox="allow-same-origin"
                      title="Email preview"
                    />
                  </div>
                ) : (
                  <textarea
                    value={editHtml}
                    onChange={e => setEditHtml(e.target.value)}
                    rows={16}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y"
                    placeholder="<!DOCTYPE html>&#10;<html>&#10;  <!-- Tu HTML aquí -->&#10;</html>"
                  />
                )}
              </div>

              {/* Acciones: guardar + test */}
              <div className="flex items-center justify-between gap-4 pt-2">

                {/* Test send */}
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                    placeholder="email@prueba.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    onClick={handleTestSend}
                    disabled={sendingTest || !testEmail.trim()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {sendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Enviar prueba
                  </button>
                </div>

                {/* Guardar */}
                <button
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>

              {isDirty && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Hay cambios sin guardar
                </p>
              )}

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Seleccioná una plantilla para editarla.
            </div>
          )}

        </div>
      )}
    </div>
  );
}
