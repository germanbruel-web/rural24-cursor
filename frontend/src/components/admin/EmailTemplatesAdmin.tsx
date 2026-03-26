/**
 * EmailTemplatesAdmin — Sprint 11C+
 * Panel CMS para editar plantillas de email.
 * Ruta: #/email-templates-admin (superadmin only)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mail, Save, Send, Eye, Code, RefreshCw, CheckCircle,
  AlertCircle, Variable, ChevronRight, Image as ImageIcon,
  Trash2, Upload, Copy, X, LayoutTemplate,
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface EmailTemplate {
  type: string;
  subject: string;
  html_content: string;
  variables: string[];
  description: string | null;
  updated_at: string;
}

interface MediaImage {
  id: string;
  url: string;
  public_id: string;
  filename: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  created_at: string;
}

type EditorTab = 'presets' | 'html';
type ViewMode  = 'split' | 'code' | 'preview';

// ─────────────────────────────────────────────
// LABELS / ICONS
// ─────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  welcome:            'Bienvenida (OAuth)',
  welcome_verify:     'Bienvenida con verificación',
  featured_activated: 'Destacado activado',
  contact_form:       'Formulario de contacto',
};

// ─────────────────────────────────────────────
// 4 PRESETS HTML (email-safe, Rural24 branded)
// ─────────────────────────────────────────────

const PRESETS = [
  {
    id: 1,
    name: 'Notificación',
    desc: 'Header verde · mensaje · botón CTA',
    // Thumbnail layout descriptor
    layout: ['header', 'greeting', 'title', 'body', 'button', 'footer'],
    html: (vars: string[]) => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rural24</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.07);">

        <!-- Header -->
        <tr>
          <td style="background:#65a30d;padding:24px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:-0.5px;">
              Rural<span style="background:#ffffff;color:#65a30d;border-radius:4px;padding:0 6px;margin-left:2px;">24</span>
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 32px;">
            <p style="margin:0 0 6px 0;color:#6b7280;font-size:14px;">
              Hola, <strong style="color:#111827;">${vars.includes('to_name') ? '{{to_name}}' : vars.includes('first_name') ? '{{first_name}}' : 'usuario'}</strong>
            </p>
            <h2 style="margin:0 0 16px 0;color:#111827;font-size:22px;font-weight:bold;line-height:1.3;">
              Título principal
            </h2>
            <p style="margin:0 0 28px 0;color:#374151;font-size:15px;line-height:1.75;">
              Escribí aquí el cuerpo del mensaje. Podés usar las variables disponibles
              como referencia para personalizar este email.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#65a30d;border-radius:8px;">
                  <a href="#" style="display:inline-block;padding:13px 30px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">
                    Ver en Rural24
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- FIRMA — pegá aquí tu firma en HTML puro -->
        <!-- <tr><td style="padding:0 32px 24px 32px;">TU FIRMA AQUÍ</td></tr> -->

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.6;">
              Rural24 — Clasificados Agrarios de Argentina<br>
              <a href="https://rural24.com.ar" style="color:#65a30d;text-decoration:none;">rural24.com.ar</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
  {
    id: 2,
    name: 'Bienvenida',
    desc: 'Header · 3 features cards · botón',
    layout: ['header', 'greeting', 'title', 'cards', 'button', 'footer'],
    html: (vars: string[]) => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rural24</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.07);">

        <!-- Header -->
        <tr>
          <td style="background:#65a30d;padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:-0.5px;">
              Rural<span style="background:#ffffff;color:#65a30d;border-radius:4px;padding:0 6px;margin-left:2px;">24</span>
            </h1>
          </td>
        </tr>

        <!-- Greeting + Title -->
        <tr>
          <td style="padding:36px 32px 24px 32px;">
            <p style="margin:0 0 6px 0;color:#6b7280;font-size:14px;">
              Hola, <strong style="color:#111827;">${vars.includes('first_name') ? '{{first_name}}' : vars.includes('to_name') ? '{{to_name}}' : 'usuario'}</strong>
            </p>
            <h2 style="margin:0 0 14px 0;color:#111827;font-size:22px;font-weight:bold;line-height:1.3;">
              ¡Bienvenido a Rural24!
            </h2>
            <p style="margin:0;color:#374151;font-size:15px;line-height:1.75;">
              Ya sos parte de la comunidad de clasificados agrarios más grande de Argentina.
            </p>
          </td>
        </tr>

        <!-- Feature cards -->
        <tr>
          <td style="padding:0 32px 28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="31%" style="background:#f9fafb;border-radius:8px;padding:16px;text-align:center;vertical-align:top;">
                  <p style="margin:0 0 6px 0;font-size:22px;">🌾</p>
                  <p style="margin:0 0 4px 0;font-size:12px;font-weight:bold;color:#111827;">Publicá gratis</p>
                  <p style="margin:0;font-size:11px;color:#6b7280;">Hacienda, insumos y maquinaria</p>
                </td>
                <td width="4%"></td>
                <td width="31%" style="background:#f9fafb;border-radius:8px;padding:16px;text-align:center;vertical-align:top;">
                  <p style="margin:0 0 6px 0;font-size:22px;">🔍</p>
                  <p style="margin:0 0 4px 0;font-size:12px;font-weight:bold;color:#111827;">Buscá avisos</p>
                  <p style="margin:0;font-size:11px;color:#6b7280;">Filtrá por provincia y precio</p>
                </td>
                <td width="4%"></td>
                <td width="31%" style="background:#f9fafb;border-radius:8px;padding:16px;text-align:center;vertical-align:top;">
                  <p style="margin:0 0 6px 0;font-size:22px;">⭐</p>
                  <p style="margin:0 0 4px 0;font-size:12px;font-weight:bold;color:#111827;">Destacá</p>
                  <p style="margin:0;font-size:11px;color:#6b7280;">Aparecé primero en búsquedas</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 32px 36px 32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#65a30d;border-radius:8px;">
                  <a href="https://rural24.com.ar" style="display:inline-block;padding:13px 30px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">
                    Ir a Rural24
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.6;">
              Rural24 — Clasificados Agrarios de Argentina<br>
              <a href="https://rural24.com.ar" style="color:#65a30d;text-decoration:none;">rural24.com.ar</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
  {
    id: 3,
    name: 'Con imagen',
    desc: 'Imagen hero · contenido · botón',
    layout: ['image', 'title', 'body', 'button', 'footer'],
    html: (_vars: string[]) => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rural24</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.07);">

        <!-- Logo bar -->
        <tr>
          <td style="background:#65a30d;padding:16px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;">
              Rural<span style="background:#ffffff;color:#65a30d;border-radius:4px;padding:0 5px;margin-left:2px;">24</span>
            </h1>
          </td>
        </tr>

        <!-- Hero image — reemplazá la URL por una imagen de tu Media Library -->
        <tr>
          <td style="padding:0;">
            <img
              src="https://res.cloudinary.com/rural24/image/upload/rural24/app/placeholder-email.jpg"
              alt="Rural24"
              width="560"
              style="display:block;width:100%;max-width:560px;height:auto;"
            />
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 32px;">
            <h2 style="margin:0 0 14px 0;color:#111827;font-size:22px;font-weight:bold;line-height:1.3;">
              Título del mensaje
            </h2>
            <p style="margin:0 0 28px 0;color:#374151;font-size:15px;line-height:1.75;">
              Escribí aquí el cuerpo del mensaje. Este diseño es ideal para comunicaciones
              con imagen destacada: novedades, campañas o anuncios importantes.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#65a30d;border-radius:8px;">
                  <a href="#" style="display:inline-block;padding:13px 30px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">
                    Ver más
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.6;">
              Rural24 — Clasificados Agrarios de Argentina<br>
              <a href="https://rural24.com.ar" style="color:#65a30d;text-decoration:none;">rural24.com.ar</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
  {
    id: 4,
    name: 'Alerta',
    desc: 'Aviso urgente · info destacada · botón',
    layout: ['header-amber', 'icon', 'title', 'info-box', 'button', 'footer'],
    html: (vars: string[]) => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rural24</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.07);">

        <!-- Header amber -->
        <tr>
          <td style="background:#d97706;padding:24px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:-0.5px;">
              Rural<span style="background:#ffffff;color:#d97706;border-radius:4px;padding:0 6px;margin-left:2px;">24</span>
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 32px;">
            <p style="margin:0 0 6px 0;color:#6b7280;font-size:14px;">
              Hola, <strong style="color:#111827;">${vars.includes('to_name') ? '{{to_name}}' : vars.includes('first_name') ? '{{first_name}}' : 'usuario'}</strong>
            </p>
            <h2 style="margin:0 0 16px 0;color:#111827;font-size:22px;font-weight:bold;line-height:1.3;">
              ⚠️ Título de la alerta
            </h2>
            <p style="margin:0 0 20px 0;color:#374151;font-size:15px;line-height:1.75;">
              Describí aquí el motivo del aviso. Este diseño es ideal para notificaciones
              urgentes, vencimientos o acciones requeridas.
            </p>

            <!-- Info box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:14px;color:#92400e;line-height:1.6;">
                    <strong>Información importante:</strong><br>
                    Agregá aquí los datos clave que el usuario necesita saber.
                  </p>
                </td>
              </tr>
            </table>

            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#d97706;border-radius:8px;">
                  <a href="#" style="display:inline-block;padding:13px 30px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">
                    Tomar acción
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.6;">
              Rural24 — Clasificados Agrarios de Argentina<br>
              <a href="https://rural24.com.ar" style="color:#65a30d;text-decoration:none;">rural24.com.ar</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
];

// ─────────────────────────────────────────────
// PRESET THUMBNAIL
// ─────────────────────────────────────────────

function PresetThumbnail({ layout, accentColor = '#65a30d' }: { layout: string[]; accentColor?: string }) {
  const blockMap: Record<string, React.ReactNode> = {
    'header':       <div style={{ background: accentColor, height: 18, borderRadius: '4px 4px 0 0' }} />,
    'header-amber': <div style={{ background: '#d97706', height: 18, borderRadius: '4px 4px 0 0' }} />,
    'image':        <div style={{ background: '#d1d5db', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 14, color: '#9ca3af' }}>🖼</span></div>,
    'greeting':     <div style={{ background: '#f3f4f6', height: 6, borderRadius: 3, margin: '6px 8px 3px' }} />,
    'title':        <div style={{ background: '#374151', height: 9, borderRadius: 3, margin: '3px 8px', width: '75%' }} />,
    'body':         <><div style={{ background: '#d1d5db', height: 5, borderRadius: 3, margin: '5px 8px 2px' }} /><div style={{ background: '#d1d5db', height: 5, borderRadius: 3, margin: '2px 8px', width: '80%' }} /></>,
    'cards':        <div style={{ display: 'flex', gap: 3, margin: '6px 8px' }}>
                      {[0,1,2].map(i => <div key={i} style={{ flex: 1, background: '#f9fafb', borderRadius: 4, height: 28 }} />)}
                    </div>,
    'info-box':     <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 4, height: 18, margin: '5px 8px' }} />,
    'button':       <div style={{ margin: '8px 8px', display: 'flex' }}><div style={{ background: accentColor, borderRadius: 5, height: 12, width: 56 }} /></div>,
    'icon':         <div style={{ textAlign: 'center', margin: '4px 0', fontSize: 14 }}>⚠️</div>,
    'footer':       <div style={{ background: '#f9fafb', height: 16, borderRadius: '0 0 4px 4px', marginTop: 4 }} />,
  };

  return (
    <div style={{ width: 100, background: '#f3f4f6', borderRadius: 6, padding: 4, border: '1px solid #e5e7eb' }}>
      <div style={{ background: '#fff', borderRadius: 4, overflow: 'hidden', minHeight: 120 }}>
        {layout.map((block, i) => (
          <div key={i}>{blockMap[block] ?? null}</div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${session?.access_token ?? ''}` };
}

function formatBytes(b: number | null) {
  if (!b) return '';
  if (b < 1024) return `${b}B`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)}KB`;
  return `${(b / 1048576).toFixed(1)}MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function EmailTemplatesAdmin() {
  // Template list
  const [templates, setTemplates]     = useState<EmailTemplate[]>([]);
  const [selected, setSelected]       = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editHtml, setEditHtml]       = useState('');
  const [liveHtml, setLiveHtml]       = useState('');   // debounced for iframe

  // Editor
  const [editorTab, setEditorTab]   = useState<EditorTab>('presets');
  const [viewMode, setViewMode]     = useState<ViewMode>('split');
  const textareaRef                 = useRef<HTMLTextAreaElement>(null);

  // Media library
  const [mediaOpen, setMediaOpen]       = useState(false);
  const [mediaImages, setMediaImages]   = useState<MediaImage[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Actions
  const [saving, setSaving]         = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmail, setTestEmail]   = useState('');
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Debounce preview ────────────────────────

  useEffect(() => {
    const t = setTimeout(() => setLiveHtml(editHtml), 450);
    return () => clearTimeout(t);
  }, [editHtml]);

  // ── Fetch templates ──────────────────────────

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/api/admin/email-templates`, { headers });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      const list: EmailTemplate[] = (data ?? []).map((t: any) => ({
        ...t,
        variables: Array.isArray(t.variables) ? t.variables : JSON.parse(t.variables ?? '[]'),
      }));
      setTemplates(list);
      if (list.length > 0 && !selected) selectTemplate(list[0]);
    } catch {
      showToast('Error al cargar plantillas.', false);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // ── Template selection ───────────────────────

  function selectTemplate(t: EmailTemplate) {
    setSelected(t);
    setEditSubject(t.subject);
    setEditHtml(t.html_content);
    setEditorTab(t.html_content ? 'html' : 'presets');
  }

  const isDirty = selected && (editSubject !== selected.subject || editHtml !== selected.html_content);

  // ── Apply preset ─────────────────────────────

  function applyPreset(presetIdx: number) {
    if (!selected) return;
    const preset = PRESETS[presetIdx];
    const html = preset.html(selected.variables);
    setEditHtml(html);
    setEditorTab('html');
    showToast(`Diseño "${preset.name}" aplicado. Editá el HTML y guardá.`, true);
  }

  // ── Insert at cursor ─────────────────────────

  function insertAtCursor(text: string) {
    const ta = textareaRef.current;
    if (!ta) { setEditHtml(prev => prev + text); return; }
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const next  = editHtml.substring(0, start) + text + editHtml.substring(end);
    setEditHtml(next);
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + text.length; ta.focus(); }, 0);
  }

  // ── Save ─────────────────────────────────────

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/api/admin/email-templates/${selected.type}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: editSubject, html_content: editHtml }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error); }
      const updated = { ...selected, subject: editSubject, html_content: editHtml, updated_at: new Date().toISOString() };
      setTemplates(prev => prev.map(t => t.type === selected.type ? updated : t));
      setSelected(updated);
      showToast('Plantilla guardada.', true);
    } catch (err: any) {
      showToast(err.message || 'Error al guardar.', false);
    } finally {
      setSaving(false);
    }
  }

  // ── Test send ─────────────────────────────────

  async function handleTest() {
    if (!selected || !testEmail.trim()) return;
    setSendingTest(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/api/admin/email-templates/${selected.type}/test`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail.trim() }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error); }
      showToast(`Email de prueba enviado a ${testEmail.trim()}`, true);
    } catch (err: any) {
      showToast(err.message || 'Error al enviar.', false);
    } finally {
      setSendingTest(false);
    }
  }

  // ── Media Library ────────────────────────────

  async function openMedia() {
    setMediaOpen(true);
    if (mediaImages.length > 0) return;
    setMediaLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/api/admin/email-templates/media`, { headers });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      setMediaImages(data ?? []);
    } catch {
      showToast('Error al cargar la biblioteca.', false);
    } finally {
      setMediaLoading(false);
    }
  }

  async function uploadMedia(file: File) {
    setMediaUploading(true);
    try {
      const headers = await authHeaders();
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE}/api/admin/email-templates/media`, { method: 'POST', headers, body: fd });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error); }
      const { data } = await res.json();
      setMediaImages(prev => [data, ...prev]);
      showToast('Imagen subida correctamente.', true);
    } catch (err: any) {
      showToast(err.message || 'Error al subir imagen.', false);
    } finally {
      setMediaUploading(false);
    }
  }

  async function deleteMedia(id: string) {
    if (!window.confirm('¿Eliminar esta imagen?')) return;
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/api/admin/email-templates/media/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error();
      setMediaImages(prev => prev.filter(m => m.id !== id));
      showToast('Imagen eliminada.', true);
    } catch {
      showToast('Error al eliminar.', false);
    }
  }

  function insertImage(url: string) {
    const tag = `<img src="${url}" alt="" width="560" style="display:block;width:100%;max-width:560px;height:auto;" />`;
    insertAtCursor(tag);
    setMediaOpen(false);
    showToast('Imagen insertada en el HTML.', true);
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    showToast('URL copiada al portapapeles.', true);
  }

  // ── Toast ─────────────────────────────────────

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

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
            <p className="text-sm text-gray-500">Editá diseño, asunto y contenido HTML de cada email transaccional</p>
          </div>
        </div>
        <button onClick={fetchTemplates} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white
          ${toast.ok ? 'bg-brand-600' : 'bg-red-500'}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Cargando...
        </div>
      ) : (
        <div className="flex gap-5">

          {/* ── Columna izquierda: lista ── */}
          <div className="w-56 shrink-0">
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {templates.map((t, i) => (
                <button key={t.type} onClick={() => selectTemplate(t)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors
                    ${i > 0 ? 'border-t border-gray-100' : ''}
                    ${selected?.type === t.type ? 'bg-brand-50 border-l-2 border-l-brand-500' : 'hover:bg-gray-50'}`}>
                  <Mail className={`w-4 h-4 shrink-0 ${selected?.type === t.type ? 'text-brand-600' : 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${selected?.type === t.type ? 'text-brand-700' : 'text-gray-700'}`}>
                      {TYPE_LABELS[t.type] ?? t.type}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{t.type}</p>
                  </div>
                  {selected?.type === t.type && <ChevronRight className="w-3.5 h-3.5 text-brand-400 shrink-0" />}
                </button>
              ))}
            </div>

            {/* Status del template seleccionado */}
            {selected && (
              <div className="mt-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-0.5">Última edición</p>
                <p className="text-xs text-gray-700">{formatDate(selected.updated_at)}</p>
                <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                  ${selected.html_content ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${selected.html_content ? 'bg-green-500' : 'bg-amber-500'}`} />
                  {selected.html_content ? 'Personalizado' : 'Usando fallback'}
                </div>
              </div>
            )}
          </div>

          {/* ── Columna derecha: editor ── */}
          {selected ? (
            <div className="flex-1 min-w-0">

              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4 w-fit">
                <button onClick={() => setEditorTab('presets')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${editorTab === 'presets' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  <LayoutTemplate className="w-4 h-4" />
                  Diseños
                </button>
                <button onClick={() => setEditorTab('html')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${editorTab === 'html' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Code className="w-4 h-4" />
                  Ver HTML / Código
                </button>
              </div>

              {/* ─── TAB: DISEÑOS ─── */}
              {editorTab === 'presets' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Elegí un diseño base para comenzar. El HTML del diseño elegido reemplazará el contenido actual.
                    Podés personalizarlo desde la pestaña <strong>Ver HTML / Código</strong>.
                  </p>

                  <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                    {PRESETS.map((preset, idx) => (
                      <div key={preset.id}
                        className="border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-3 hover:border-brand-300 hover:bg-brand-50 transition-colors">
                        <PresetThumbnail
                          layout={preset.layout}
                          accentColor={preset.id === 4 ? '#d97706' : '#65a30d'}
                        />
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-800">{preset.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{preset.desc}</p>
                        </div>
                        <button onClick={() => applyPreset(idx)}
                          className="w-full py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors">
                          Usar este diseño
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Variables disponibles */}
                  {selected.variables.length > 0 && (
                    <div className="border border-dashed border-gray-300 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Variable className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Variables de esta plantilla
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selected.variables.map(v => (
                          <code key={v}
                            onClick={() => { navigator.clipboard.writeText(`{{${v}}}`); showToast(`{{${v}}} copiado`, true); }}
                            className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono cursor-pointer hover:bg-brand-50 hover:text-brand-700">
                            {`{{${v}}}`}
                          </code>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Clic en una variable para copiarla. Usálas dentro del HTML del diseño elegido.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ─── TAB: HTML ─── */}
              {editorTab === 'html' && (
                <div className="space-y-4">

                  {/* Asunto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asunto del email</label>
                    <input type="text" value={editSubject} onChange={e => setEditSubject(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Asunto..." />
                  </div>

                  {/* Variables + toolbar */}
                  <div className="flex items-start justify-between gap-4">
                    {selected.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {selected.variables.map(v => (
                          <code key={v}
                            onClick={() => insertAtCursor(`{{${v}}}`)}
                            className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono cursor-pointer hover:bg-brand-50 hover:text-brand-700"
                            title="Clic para insertar en el editor">
                            {`{{${v}}}`}
                          </code>
                        ))}
                      </div>
                    )}
                    {/* View mode toggle */}
                    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg shrink-0">
                      {([['code', 'Código', Code], ['split', 'Split', Eye], ['preview', 'Preview', Eye]] as const).map(([mode, label, Icon]) => (
                        <button key={mode} onClick={() => setViewMode(mode)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all
                            ${viewMode === mode ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                          <Icon className="w-3.5 h-3.5" />{label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Editor + Preview */}
                  <div className={`border border-gray-200 rounded-xl overflow-hidden ${viewMode === 'split' ? 'flex' : ''}`}
                    style={{ height: 420 }}>

                    {/* Código */}
                    {(viewMode === 'code' || viewMode === 'split') && (
                      <div className={`flex flex-col ${viewMode === 'split' ? 'w-1/2 border-r border-gray-200' : 'w-full'}`}>
                        <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 flex items-center gap-2">
                          <Code className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500">HTML</span>
                          <button onClick={() => openMedia()}
                            className="ml-auto flex items-center gap-1 px-2 py-0.5 text-xs text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50">
                            <ImageIcon className="w-3 h-3" /> Insertar imagen
                          </button>
                        </div>
                        <textarea ref={textareaRef} value={editHtml} onChange={e => setEditHtml(e.target.value)}
                          className="flex-1 px-4 py-3 text-xs font-mono text-gray-800 resize-none focus:outline-none"
                          placeholder="<!DOCTYPE html>&#10;<html>&#10;  <!-- Elegí un diseño desde la pestaña Diseños o escribí tu HTML aquí -->&#10;</html>"
                          spellCheck={false}
                        />
                      </div>
                    )}

                    {/* Preview */}
                    {(viewMode === 'preview' || viewMode === 'split') && (
                      <div className={`flex flex-col ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
                        <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 flex items-center gap-2">
                          <Eye className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500">Preview en tiempo real</span>
                        </div>
                        <iframe
                          srcDoc={liveHtml || '<div style="padding:32px;color:#9ca3af;font-family:sans-serif;font-size:14px;">El preview aparece aquí.</div>'}
                          className="flex-1 bg-white"
                          sandbox="allow-same-origin"
                          title="Email preview"
                        />
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-3">
                    <button onClick={() => openMedia()}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                      <ImageIcon className="w-4 h-4" /> Media Library
                    </button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                      <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)}
                        placeholder="email@prueba.com"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-48" />
                      <button onClick={handleTest} disabled={sendingTest || !testEmail.trim()}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap">
                        {sendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Enviar prueba
                      </button>
                    </div>
                    <button onClick={handleSave} disabled={saving || !isDirty}
                      className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50">
                      {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>

                  {isDirty && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Cambios sin guardar
                    </p>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Seleccioná una plantilla para comenzar.
            </div>
          )}
        </div>
      )}

      {/* ─── MEDIA LIBRARY DRAWER ─── */}
      {mediaOpen && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setMediaOpen(false)} />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-2xl flex flex-col drawer-enter">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-brand-600" />
                <h2 className="text-base font-semibold text-gray-900">Media Library</h2>
                <span className="text-xs text-gray-400">({mediaImages.length})</span>
              </div>
              <button onClick={() => setMediaOpen(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Upload */}
            <div className="px-5 py-3 border-b border-gray-100">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadMedia(f); e.target.value = ''; }} />
              <button onClick={() => fileInputRef.current?.click()} disabled={mediaUploading}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-brand-300 rounded-xl text-sm font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50 transition-colors">
                {mediaUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {mediaUploading ? 'Subiendo...' : 'Subir imagen a Cloudinary'}
              </button>
              <p className="text-xs text-gray-400 text-center mt-1">JPG, PNG, WebP, GIF, SVG — máx 5MB</p>
            </div>

            {/* Grid de imágenes */}
            <div className="flex-1 overflow-y-auto p-4">
              {mediaLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Cargando...
                </div>
              ) : mediaImages.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin imágenes todavía.<br />Subí tu primera imagen arriba.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {mediaImages.map(img => (
                    <div key={img.id} className="group border border-gray-200 rounded-xl overflow-hidden hover:border-brand-300 transition-colors">
                      {/* Thumbnail */}
                      <div className="relative bg-gray-50 aspect-video overflow-hidden cursor-pointer"
                        onClick={() => insertImage(img.url)}>
                        <img src={img.url} alt={img.filename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-brand-600/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">Insertar</span>
                        </div>
                      </div>
                      {/* Meta */}
                      <div className="p-2">
                        <p className="text-xs text-gray-700 truncate" title={img.filename}>{img.filename}</p>
                        <p className="text-xs text-gray-400">{formatBytes(img.bytes)}</p>
                        {/* Actions */}
                        <div className="flex gap-1 mt-2">
                          <button onClick={() => copyUrl(img.url)} title="Copiar URL"
                            className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-gray-600 bg-gray-50 rounded hover:bg-gray-100">
                            <Copy className="w-3 h-3" /> URL
                          </button>
                          <button onClick={() => deleteMedia(img.id)} title="Eliminar"
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer info */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                Clic en una imagen para insertarla en el editor.<br />
                Las imágenes se guardan en <code className="text-brand-600">rural24/{'{env}'}/cms/email-media/</code>
              </p>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
