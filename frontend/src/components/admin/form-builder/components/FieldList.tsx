import React, { useState, useEffect } from 'react';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Info,
  GripVertical,
} from 'lucide-react';
import {
  getFormFields,
  createFormField,
  updateFormField,
  deleteFormField,
  moveFieldUp,
  moveFieldDown,
} from '../../../../services/v2/formFieldsService';
import type { OptionList } from '../../../../services/v2/optionListsService';
import { notify } from '../../../../utils/notifications';
import type { CampoExtendido, Plantilla, ModoSeleccion } from '../types';
import { etiquetaTipo, iconoTipo } from '../constants';
import { FieldEditor } from './FieldEditor';

interface FieldListProps {
  plantilla: Plantilla | null;
  cargando: boolean;
  modo: ModoSeleccion;
  categoriaGlobal?: string;
  onCrearPlantilla: () => Promise<void>;
  onEliminarPlantilla: () => Promise<void>;
  listasOpciones: OptionList[];
}

export function FieldList({ plantilla, cargando, modo, categoriaGlobal, onCrearPlantilla, onEliminarPlantilla, listasOpciones }: FieldListProps) {
  const [campos,         setCampos]         = useState<CampoExtendido[]>([]);
  const [cargandoCampos, setCargandoCampos] = useState(false);
  const [editandoId,     setEditandoId]     = useState<string | 'nuevo' | null>(null);

  useEffect(() => {
    if (!plantilla) { setCampos([]); return; }
    setCargandoCampos(true);
    setEditandoId(null);
    getFormFields(plantilla.id)
      .then(setCampos)
      .catch(console.error)
      .finally(() => setCargandoCampos(false));
  }, [plantilla?.id]);

  const recargar = async () => {
    if (!plantilla) return;
    const f = await getFormFields(plantilla.id);
    setCampos(f);
  };

  const handleAgregar = async (datos: Partial<CampoExtendido>) => {
    if (!plantilla) return;
    const siguienteOrden = campos.length > 0 ? Math.max(...campos.map((f) => f.display_order)) + 1 : 0;
    await createFormField(plantilla.id, datos as any, siguienteOrden);
    await recargar();
    setEditandoId(null);
    notify.success('Campo agregado');
  };

  const handleActualizar = async (campoId: string, datos: Partial<CampoExtendido>) => {
    await updateFormField(campoId, datos as any);
    await recargar();
    setEditandoId(null);
    notify.success('Campo actualizado');
  };

  const handleEliminar = async (campoId: string) => {
    if (!window.confirm('¿Eliminar este campo?')) return;
    await deleteFormField(campoId);
    setCampos((prev) => prev.filter((f) => f.id !== campoId));
    notify.success('Campo eliminado');
  };

  const handleSubir = async (campoId: string) => {
    await moveFieldUp(campoId, campos);
    await recargar();
  };

  const handleBajar = async (campoId: string) => {
    await moveFieldDown(campoId, campos);
    await recargar();
  };

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!plantilla) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600 mb-2">
          {modo === 'global'
            ? 'Esta categoría no tiene formulario global todavía.'
            : 'Esta subcategoría no tiene variante de formulario todavía.'}
        </p>
        {modo === 'variante' && categoriaGlobal && (
          <p className="text-xs text-gray-400 mb-2">
            Al crear la variante, el formulario global de <strong>{categoriaGlobal}</strong> se aplicará automáticamente.
          </p>
        )}
        <button
          onClick={onCrearPlantilla}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm rounded-lg hover:bg-brand-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {modo === 'global' ? 'Crear formulario global' : 'Crear variante'}
        </button>
        <p className="text-xs text-gray-400 mt-3 italic">
          Si ya existía un formulario con este nombre, se reasignará automáticamente.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Nombre interno:</span>
          <code className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{plantilla.name}</code>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            {campos.length} campo{campos.length !== 1 ? 's' : ''}
          </span>
          {modo === 'variante' && (
            <button
              onClick={onEliminarPlantilla}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
              title="Eliminar esta variante y todos sus campos"
            >
              <Trash2 className="w-3 h-3" />
              Eliminar variante
            </button>
          )}
        </div>
      </div>

      {modo === 'variante' && categoriaGlobal && (
        <div className="flex items-start gap-2 mb-4 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            El formulario global de <strong>{categoriaGlobal}</strong> se carga primero.
            Estos campos se muestran <strong>además</strong> de los campos globales.
          </p>
        </div>
      )}

      <div className="space-y-2 mb-4">
        {campos.length === 0 && editandoId !== 'nuevo' && (
          <p className="text-sm text-gray-400 italic py-4 text-center">
            Sin campos todavía. Agregá el primero.
          </p>
        )}

        {cargandoCampos ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
          </div>
        ) : (
          campos.map((campo, idx) => (
            <div key={campo.id}>
              {editandoId === campo.id ? (
                <FieldEditor
                  inicial={campo}
                  listasOpciones={listasOpciones}
                  onGuardar={(datos) => handleActualizar(campo.id, datos)}
                  onCancelar={() => setEditandoId(null)}
                />
              ) : (
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 group hover:border-brand-200 transition-colors">
                  <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0 cursor-grab" />
                  <span className="text-gray-400 flex-shrink-0">{iconoTipo(campo.field_type)}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-800">{campo.field_label}</span>
                    <span className="ml-2 text-xs text-gray-400">{etiquetaTipo(campo.field_type)}</span>
                    {campo.is_required && (
                      <span className="ml-1.5 text-xs text-red-500 font-semibold">*</span>
                    )}
                    {campo.field_width !== 'full' && (
                      <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1 rounded">
                        {campo.field_width === 'half' ? 'Mitad' : 'Tercio'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleSubir(campo.id)}
                      disabled={idx === 0}
                      className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-20"
                      title="Subir"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleBajar(campo.id)}
                      disabled={idx === campos.length - 1}
                      className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-20"
                      title="Bajar"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditandoId(campo.id)}
                      className="p-1 rounded text-gray-400 hover:text-brand-600"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleEliminar(campo.id)}
                      className="p-1 rounded text-gray-400 hover:text-red-500"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {editandoId === 'nuevo' && (
          <FieldEditor
            listasOpciones={listasOpciones}
            onGuardar={handleAgregar}
            onCancelar={() => setEditandoId(null)}
          />
        )}
      </div>

      {editandoId !== 'nuevo' && (
        <button
          onClick={() => setEditandoId('nuevo')}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar campo
        </button>
      )}
    </div>
  );
}
