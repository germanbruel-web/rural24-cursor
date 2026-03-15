import React, { useEffect, useRef, useState } from 'react';
import { X, Headphones, Lightbulb, Megaphone, Loader2, CheckCircle2, ImagePlus, Trash2 } from 'lucide-react';

const MAX_FILES      = 3;
const MAX_SIZE_MB    = 3;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type Tipo = 'soporte' | 'sugerencias' | 'publicidad';

interface TipoOption {
  value: Tipo;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const TIPOS: TipoOption[] = [
  {
    value: 'soporte',
    label: 'Soporte',
    description: 'Problemas técnicos o con tu cuenta',
    icon: <Headphones className="w-5 h-5" />,
  },
  {
    value: 'sugerencias',
    label: 'Sugerencias',
    description: 'Ideas para mejorar la plataforma',
    icon: <Lightbulb className="w-5 h-5" />,
  },
  {
    value: 'publicidad',
    label: 'Consultas Publicidad',
    description: 'Banners, patrocinios y espacios comerciales',
    icon: <Megaphone className="w-5 h-5" />,
  },
];

interface ContactoDrawerProps {
  onClose: () => void;
}

interface FormState {
  tipo: Tipo | null;
  nombre: string;
  email: string;
  telefono: string;
  mensaje: string;
}

const EMPTY: FormState = { tipo: null, nombre: '', email: '', telefono: '', mensaje: '' };

type Status = 'idle' | 'sending' | 'success' | 'error';

export const ContactoDrawer: React.FC<ContactoDrawerProps> = ({ onClose }) => {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setFileError(null);
    const next = [...files];
    for (const f of Array.from(incoming)) {
      if (next.length >= MAX_FILES) {
        setFileError(`Máximo ${MAX_FILES} imágenes adjuntas.`);
        break;
      }
      if (!ALLOWED_TYPES.includes(f.type)) {
        setFileError(`"${f.name}" no es un formato válido (JPG, PNG, WEBP, GIF).`);
        continue;
      }
      if (f.size > MAX_SIZE_BYTES) {
        setFileError(`"${f.name}" supera los ${MAX_SIZE_MB}MB permitidos.`);
        continue;
      }
      next.push(f);
    }
    setFiles(next);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileError(null);
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const set = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.tipo) next.tipo = 'Seleccioná un tipo de consulta';
    if (!form.nombre.trim() || form.nombre.trim().length < 2) next.nombre = 'El nombre es obligatorio';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Email inválido';
    if (!form.mensaje.trim() || form.mensaje.trim().length < 10) next.mensaje = 'El mensaje debe tener al menos 10 caracteres';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('sending');
    setServerError(null);
    try {
      const fd = new FormData();
      fd.append('tipo', form.tipo!);
      fd.append('nombre', form.nombre.trim());
      fd.append('email', form.email.trim());
      if (form.telefono.trim()) fd.append('telefono', form.telefono.trim());
      fd.append('mensaje', form.mensaje.trim());
      files.forEach(f => fd.append('adjuntos', f));

      const res = await fetch('/api/contact', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? 'Error al enviar. Intentá de nuevo.');
        setStatus('error');
        return;
      }
      setStatus('success');
    } catch {
      setServerError('Error de conexión. Revisá tu internet e intentá de nuevo.');
      setStatus('error');
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true" />

      {/* Drawer — #7 mobile width */}
      <div className="drawer-enter fixed inset-y-0 right-0 z-50 w-full sm:w-[80vw] lg:w-1/2 bg-white shadow-2xl flex">

        {/* Panel izquierdo — formulario */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* Header — #4 subtítulo + acento brand */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="w-1 h-6 bg-brand-500 rounded-full inline-block shrink-0" />
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-tight">Contacto</h2>
                <p className="text-xs text-gray-500 mt-0.5">Respondemos en menos de 24 hs hábiles</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content — scrollable, sin el submit */}
          <div className="flex-1 overflow-y-auto px-6 py-6">

            {status === 'success' ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
                <CheckCircle2 className="w-12 h-12 text-brand-500" />
                <h3 className="text-2xl font-bold text-gray-900">¡Mensaje enviado!</h3>
                <p className="text-gray-500 max-w-sm text-sm">
                  Recibimos tu consulta. Te responderemos a la brevedad al email que indicaste.
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form id="contacto-form" onSubmit={handleSubmit} noValidate className="space-y-5">

                {/* Selector de tipo — #2 bg base + radio indicator */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">¿Con qué podemos ayudarte?</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {TIPOS.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => set('tipo', t.value)}
                        className={`relative flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                          form.tipo === t.value
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-gray-200 bg-gray-50/50 hover:border-brand-300 hover:bg-brand-50/40'
                        }`}
                      >
                        {/* Radio indicator — esquina superior derecha */}
                        <span className={`absolute top-3 right-3 w-4 h-4 rounded-full border-2 transition-colors ${
                          form.tipo === t.value
                            ? 'border-brand-500 bg-brand-500'
                            : 'border-gray-300 bg-white'
                        }`} />
                        <span className={form.tipo === t.value ? 'text-brand-600' : 'text-gray-500'}>
                          {t.icon}
                        </span>
                        <span className={`text-sm font-semibold ${form.tipo === t.value ? 'text-brand-700' : 'text-gray-800'}`}>
                          {t.label}
                        </span>
                        <span className="text-xs text-gray-500 leading-snug pr-4">{t.description}</span>
                      </button>
                    ))}
                  </div>
                  {errors.tipo && <p className="mt-1.5 text-xs text-red-500">{errors.tipo}</p>}
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={e => set('nombre', e.target.value)}
                    placeholder="Tu nombre completo"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                      errors.nombre ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="tu@email.com"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                      errors.email ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>

                {/* Teléfono (solo publicidad) */}
                {form.tipo === 'publicidad' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="tel"
                      value={form.telefono}
                      onChange={e => set('telefono', e.target.value)}
                      placeholder="+54 9 ..."
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                  </div>
                )}

                {/* Mensaje */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mensaje <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.mensaje}
                    onChange={e => set('mensaje', e.target.value)}
                    placeholder="Contanos cómo podemos ayudarte..."
                    rows={5}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none ${
                      errors.mensaje ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.mensaje
                      ? <p className="text-xs text-red-500">{errors.mensaje}</p>
                      : <span />
                    }
                    <span className="text-xs text-gray-400">{form.mensaje.length}/2000</span>
                  </div>
                </div>

                {/* Adjuntos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Imágenes adjuntas{' '}
                    <span className="text-gray-400 font-normal">(opcional · hasta {MAX_FILES}, máx. {MAX_SIZE_MB}MB c/u)</span>
                  </label>

                  {/* Previews */}
                  {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {files.map((f, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                          <img
                            src={URL.createObjectURL(f)}
                            alt={f.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            aria-label="Eliminar imagen"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botón agregar */}
                  {files.length < MAX_FILES && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        className="hidden"
                        onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <ImagePlus className="w-4 h-4" />
                        Adjuntar imagen{files.length > 0 ? ` (${files.length}/${MAX_FILES})` : ''}
                      </button>
                    </>
                  )}

                  {fileError && <p className="mt-1.5 text-xs text-red-500">{fileError}</p>}
                </div>

                {/* Error servidor */}
                {serverError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {serverError}
                  </div>
                )}

              </form>
            )}
          </div>

          {/* Footer fijo con submit — #1 sin espacio vacío */}
          {status !== 'success' && (
            <div className="px-6 py-4 border-t border-gray-100 bg-white">
              <button
                type="submit"
                form="contacto-form"
                disabled={status === 'sending'}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'sending'
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</>
                  : 'Enviar mensaje'
                }
              </button>
            </div>
          )}

        </div>{/* fin panel izquierdo */}

        {/* Separador 1px con gradiente — #6 */}
        <div className="hidden lg:block w-px shrink-0 bg-gradient-to-b from-transparent via-gray-200 to-transparent" />

        {/* Panel derecho — imagen — #3 overlay brand, #5 object-position, #5 texto */}
        <div className="hidden lg:block w-[40%] shrink-0 relative overflow-hidden">
          <img
            src="/images/hero/hero-1.jpeg"
            alt="Campo agrícola"
            className="absolute inset-0 w-full h-full object-cover object-[30%_50%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-950/30 via-transparent to-brand-950/75" />
        </div>

      </div>
    </>
  );
};
