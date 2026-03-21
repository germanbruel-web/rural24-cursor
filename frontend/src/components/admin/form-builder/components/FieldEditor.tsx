import React, { useState } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import type { OptionList } from '../../../../services/v2/optionListsService';
import type { FormFieldV2 } from '../../../../types/v2';
import type { CampoExtendido, TipoCampo } from '../types';
import { TIPOS_CAMPO, TIPOS_CON_OPCIONES } from '../constants';

interface FieldEditorProps {
  inicial?: CampoExtendido | null;
  listasOpciones: OptionList[];
  onGuardar: (datos: Partial<CampoExtendido>) => Promise<void>;
  onCancelar: () => void;
}

export function FieldEditor({ inicial, listasOpciones, onGuardar, onCancelar }: FieldEditorProps) {
  const [etiqueta,        setEtiqueta]        = useState(inicial?.field_label ?? '');
  const [tipo,            setTipo]            = useState<TipoCampo>(inicial?.field_type ?? 'text');
  const [obligatorio,     setObligatorio]     = useState(inicial?.is_required ?? false);
  const [ancho,           setAncho]           = useState(inicial?.field_width ?? 'full');
  const [textoEjemplo,    setTextoEjemplo]    = useState(inicial?.placeholder ?? '');
  const [ayuda,           setAyuda]           = useState(inicial?.help_text ?? '');
  const [listaOpcionesId, setListaOpcionesId] = useState<string>(inicial?.option_list_id ?? '');
  const [guardando,       setGuardando]       = useState(false);

  const necesitaOpciones = TIPOS_CON_OPCIONES.has(tipo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!etiqueta.trim()) return;
    setGuardando(true);
    try {
      await onGuardar({
        field_label:    etiqueta.trim(),
        field_type:     tipo,
        is_required:    obligatorio,
        field_width:    ancho as FormFieldV2['field_width'],
        placeholder:    textoEjemplo.trim() || null,
        help_text:      ayuda.trim() || null,
        option_list_id: necesitaOpciones ? (listaOpcionesId || null) : null,
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-brand-50 border border-brand-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Etiqueta del campo *</label>
          <input
            type="text"
            value={etiqueta}
            onChange={(e) => setEtiqueta(e.target.value)}
            placeholder="Ej: Año de fabricación"
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de campo</label>
          <select
            value={tipo}
            onChange={(e) => { setTipo(e.target.value as TipoCampo); setListaOpcionesId(''); }}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {TIPOS_CAMPO.map((ft) => (
              <option key={ft.valor} value={ft.valor}>{ft.etiqueta}</option>
            ))}
          </select>
        </div>
      </div>

      {necesitaOpciones && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Lista de opciones predefinidas</label>
          <select
            value={listaOpcionesId}
            onChange={(e) => setListaOpcionesId(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">— Ingresar opciones manualmente —</option>
            {listasOpciones.map((ol) => (
              <option key={ol.id} value={ol.id}>{ol.display_name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">Ancho:</span>
          {(['full', 'half', 'third'] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setAncho(w)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                ancho === w
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'border-gray-300 text-gray-600 hover:border-brand-400'
              }`}
            >
              {w === 'full' ? 'Completo' : w === 'half' ? 'Mitad' : 'Tercio'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700 ml-auto">
          <input
            type="checkbox"
            checked={obligatorio}
            onChange={(e) => setObligatorio(e.target.checked)}
            className="rounded border-gray-300 text-brand-500"
          />
          Obligatorio
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Texto de ejemplo</label>
          <input
            type="text"
            value={textoEjemplo}
            onChange={(e) => setTextoEjemplo(e.target.value)}
            placeholder="Ej: 2022"
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Texto de ayuda</label>
          <input
            type="text"
            value={ayuda}
            onChange={(e) => setAyuda(e.target.value)}
            placeholder="Ej: Ingresá el año de fabricación"
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancelar}
          className="flex items-center gap-1 text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100"
        >
          <X className="w-3.5 h-3.5" /> Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando || !etiqueta.trim()}
          className="flex items-center gap-1 text-sm px-3 py-1.5 bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-50"
        >
          {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {inicial ? 'Guardar cambios' : 'Agregar campo'}
        </button>
      </div>
    </form>
  );
}
