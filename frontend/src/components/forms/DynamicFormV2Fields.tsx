// ============================================================
// DYNAMIC FORM V2 FIELDS — Sprint 4C
// ============================================================
// Renderiza los campos de un form_template_v2 como componentes
// controlados (values / onChange), sin submit propio.
// Se integra en el wizard de PublicarAviso como reemplazo del
// BackendFormSection cuando hay template en form_templates_v2.
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import type { CompleteFormV2, FormFieldV2, FormSection } from '../../types/v2';
import { getOptionListItemsForSelect, getOptionListItemsByName } from '../../services/v2/optionListsService';
import { getFieldOptions } from '../../services/v2/formFieldsService';

// ─── TIPOS ────────────────────────────────────────────────────

interface DynamicFormV2FieldsProps {
  form: CompleteFormV2;
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  errors?: Record<string, string>;
}

type SelectOption = { value: string; label: string };

// ─── ESTILOS COMPARTIDOS ──────────────────────────────────────

const inputCls =
  'w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-lg transition-all duration-200 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-400';

const labelCls = 'block text-sm font-semibold text-gray-700 mb-2';

const helpCls = 'mt-1.5 text-sm text-gray-500';

// ─── HELPERS DE CONDICIONALES ─────────────────────────────────

/**
 * Resuelve el nombre de la option_list a cargar según la configuración
 * del campo y los valores actuales del formulario.
 *
 * Prioridad:
 *  1. Cascada profunda: depends_on_multi + list_map_composite
 *  2. Cascada simple:   depends_on + list_map
 *  3. Sin condicional:  null (se usa option_list_id u options estáticas)
 */
function resolveConditionalList(
  cfg: FormFieldV2['data_source_config'],
  values: Record<string, any>
): string | null {
  if (!cfg) return null;

  // Cascada profunda: todos los padres deben tener valor
  if (cfg.depends_on_multi && cfg.list_map_composite) {
    const allValues = cfg.depends_on_multi.map((f) => values[f] ?? '');
    if (allValues.some((v) => !v)) return null; // algún padre vacío
    const compositeKey = allValues.join('|');
    return cfg.list_map_composite[compositeKey] ?? null;
  }

  // Cascada simple (backward compatible)
  if (cfg.depends_on && cfg.list_map) {
    const parentValue = values[cfg.depends_on] ?? '';
    if (!parentValue) return null;
    return cfg.list_map[parentValue] ?? null;
  }

  return null;
}

/**
 * Determina si un campo está esperando que algún padre tenga valor.
 */
function isWaitingForParents(
  cfg: FormFieldV2['data_source_config'],
  values: Record<string, any>
): boolean {
  if (!cfg) return false;
  if (cfg.depends_on_multi) {
    return cfg.depends_on_multi.some((f) => !values[f]);
  }
  if (cfg.depends_on) {
    return !values[cfg.depends_on];
  }
  return false;
}

/**
 * Calcula la clave de reset: cambia cuando cualquier padre cambia.
 * Se usa como dependencia en useEffect para resetear el campo hijo.
 */
function getParentValuesKey(
  cfg: FormFieldV2['data_source_config'],
  values: Record<string, any>
): string {
  if (!cfg) return '';
  if (cfg.depends_on_multi) {
    return cfg.depends_on_multi.map((f) => values[f] ?? '').join('|');
  }
  if (cfg.depends_on) {
    return values[cfg.depends_on] ?? '';
  }
  return '';
}

/**
 * Evalúa si un campo debe mostrarse según su regla `visible_when`.
 * Sin regla → siempre visible.
 */
export function isFieldVisible(
  field: FormFieldV2,
  values: Record<string, any>
): boolean {
  const vw = field.data_source_config?.visible_when;
  if (!vw) return true;
  const current = values[vw.field] ?? '';
  return Array.isArray(vw.value)
    ? vw.value.includes(current)
    : current === vw.value;
}

// ─── HOOK: CARGA DE OPCIONES (compartido por Select, Radio, Múltiple) ─────────

function useOptionList(
  field: FormFieldV2 & { option_list_id?: string | null },
  values: Record<string, any>,
  onResetValue?: () => void,
) {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);

  const cfg = field.data_source_config;
  const resolvedListName = resolveConditionalList(cfg, values);
  const waitingForParent = isWaitingForParents(cfg, values);
  const parentValuesKey = getParentValuesKey(cfg, values);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if ((cfg?.depends_on || cfg?.depends_on_multi) && onResetValue) onResetValue();
  }, [parentValuesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        if (resolvedListName) {
          const items = await getOptionListItemsByName(resolvedListName);
          if (!cancelled) setOptions(items);
        } else if (!waitingForParent && field.option_list_id) {
          const items = await getOptionListItemsForSelect(field.option_list_id);
          if (!cancelled) setOptions(items);
        } else if (!waitingForParent && field.options?.length) {
          if (!cancelled) setOptions(field.options);
        } else if (!waitingForParent) {
          const raw = await getFieldOptions(field.id);
          if (!cancelled)
            setOptions(raw.filter((o) => o.is_active).map((o) => ({
              value: o.option_value,
              label: o.option_label,
            })));
        } else {
          if (!cancelled) setOptions([]);
        }
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [field.id, field.option_list_id, resolvedListName, waitingForParent]);

  return { options, loading, waitingForParent };
}

// ─── CAMPO SELECT (dropdown) ───────────────────────────────────

function SelectFieldV2({
  field,
  value,
  onChange,
  error,
  values = {},
}: {
  field: FormFieldV2 & { option_list_id?: string | null };
  value: any;
  onChange: (v: string) => void;
  error?: string;
  values?: Record<string, any>;
}) {
  const { options, loading, waitingForParent } = useOptionList(field, values, () => onChange(''));

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading || waitingForParent}
      className={`${inputCls} ${error ? 'border-red-400' : ''} ${waitingForParent ? 'opacity-50' : ''}`}
    >
      <option value="">
        {waitingForParent
          ? 'Seleccioná primero...'
          : loading
          ? 'Cargando...'
          : field.placeholder || 'Seleccionar...'}
      </option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

// ─── CAMPO RADIO ───────────────────────────────────────────────

function RadioFieldV2({
  field,
  value,
  onChange,
  error,
  values = {},
}: {
  field: FormFieldV2 & { option_list_id?: string | null };
  value: any;
  onChange: (v: string) => void;
  error?: string;
  values?: Record<string, any>;
}) {
  const { options, loading, waitingForParent } = useOptionList(field, values, () => onChange(''));

  if (loading || waitingForParent) {
    return (
      <p className="text-sm text-gray-400">
        {waitingForParent ? 'Seleccioná primero...' : 'Cargando...'}
      </p>
    );
  }

  return (
    <div className={`flex flex-wrap gap-x-6 gap-y-3 ${error ? 'p-2 border border-red-400 rounded-lg' : ''}`}>
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="radio"
            name={field.field_name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="w-4 h-4 accent-brand-600 cursor-pointer"
          />
          <span className="text-sm text-gray-700">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

// ─── CAMPO MÚLTIPLE (checkbox_group) ──────────────────────────

function CheckboxGroupFieldV2({
  field,
  value,
  onChange,
  error,
  values = {},
}: {
  field: FormFieldV2 & { option_list_id?: string | null };
  value: any;
  onChange: (v: string[]) => void;
  error?: string;
  values?: Record<string, any>;
}) {
  const { options, loading, waitingForParent } = useOptionList(field, values, () => onChange([]));
  const selected: string[] = Array.isArray(value) ? value : [];

  const toggle = (optValue: string) => {
    if (selected.includes(optValue)) {
      onChange(selected.filter((v) => v !== optValue));
    } else {
      onChange([...selected, optValue]);
    }
  };

  if (loading || waitingForParent) {
    return (
      <p className="text-sm text-gray-400">
        {waitingForParent ? 'Seleccioná primero...' : 'Cargando...'}
      </p>
    );
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${error ? 'p-2 border border-red-400 rounded-lg' : ''}`}>
      {options.map((opt) => {
        const checked = selected.includes(opt.value);
        return (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer select-none group">
            <div
              onClick={() => toggle(opt.value)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                checked
                  ? 'bg-brand-600 border-brand-600'
                  : 'bg-white border-gray-300 group-hover:border-brand-400'
              }`}
            >
              {checked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-sm text-gray-700">{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}

// ─── CAMPO CHECKBOX ───────────────────────────────────────────

function CheckboxFieldV2({
  field,
  value,
  onChange,
}: {
  field: FormFieldV2;
  value: any;
  onChange: (v: boolean) => void;
}) {
  const checked = Boolean(value);

  return (
    <label className="flex items-center gap-3 cursor-pointer select-none group">
      <div
        onClick={() => onChange(!checked)}
        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          checked
            ? 'bg-brand-600 border-brand-600'
            : 'bg-white border-gray-300 group-hover:border-brand-400'
        }`}
      >
        {checked && (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-base text-gray-700">{field.field_label}</span>
    </label>
  );
}

// ─── RENDERIZADOR DE CAMPO INDIVIDUAL ─────────────────────────

function FieldRenderer({
  field,
  value,
  onChange,
  error,
  values = {},
}: {
  field: FormFieldV2 & { option_list_id?: string | null };
  value: any;
  onChange: (name: string, v: any) => void;
  error?: string;
  values?: Record<string, any>;
}) {
  const handleChange = (v: any) => onChange(field.field_name, v);

  // Checkbox: layout especial sin label encima
  if (field.field_type === 'checkbox') {
    return (
      <div>
        <CheckboxFieldV2 field={field} value={value} onChange={handleChange} />
        {field.help_text && <p className={helpCls}>{field.help_text}</p>}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <label className={labelCls}>
        {field.field_label}
        {field.is_required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {field.field_type === 'select' || field.field_type === 'autocomplete' ? (
        <SelectFieldV2 field={field} value={value} onChange={handleChange} error={error} values={values} />
      ) : field.field_type === 'radio' ? (
        <RadioFieldV2 field={field} value={value} onChange={handleChange} error={error} values={values} />
      ) : field.field_type === 'checkbox_group' ? (
        <CheckboxGroupFieldV2 field={field} value={value} onChange={handleChange} error={error} values={values} />
      ) : field.field_type === 'textarea' ? (
        <textarea
          value={value ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          rows={4}
          className={`${inputCls} resize-none ${error ? 'border-red-400' : ''}`}
        />
      ) : field.field_type === 'number' ? (
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => handleChange(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder={field.placeholder ?? ''}
          className={`${inputCls} ${error ? 'border-red-400' : ''}`}
        />
      ) : (
        // text / fallback
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          className={`${inputCls} ${error ? 'border-red-400' : ''}`}
        />
      )}

      {field.help_text && <p className={helpCls}>{field.help_text}</p>}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────

export const DynamicFormV2Fields: React.FC<DynamicFormV2FieldsProps> = ({
  form,
  values,
  onChange,
  errors = {},
}) => {
  // Agrupar campos por section_id
  const sectionMap = new Map<string, FormSection>();
  (form.sections ?? []).forEach((s) => sectionMap.set(s.id, s));

  const fieldsBySection = new Map<string, (FormFieldV2 & { option_list_id?: string | null })[]>();
  const unsectioned: (FormFieldV2 & { option_list_id?: string | null })[] = [];

  [...form.fields]
    .sort((a, b) => a.display_order - b.display_order)
    .forEach((field) => {
      if (field.section_id && sectionMap.has(field.section_id)) {
        const existing = fieldsBySection.get(field.section_id) ?? [];
        fieldsBySection.set(field.section_id, [...existing, field as any]);
      } else {
        unsectioned.push(field as any);
      }
    });

  // Secciones ordenadas
  const orderedSections = [...(form.sections ?? [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  const renderFields = (fields: (FormFieldV2 & { option_list_id?: string | null })[]) => {
    // Filtrar campos ocultos por visible_when antes de renderizar
    // (los campos ocultos no bloquean validación de required)
    const visibleFields = fields.filter((f) => isFieldVisible(f, values));

    // Separar checkboxes del resto para agruparlos en grid diferente
    const checkboxes = visibleFields.filter((f) => f.field_type === 'checkbox');
    const nonCheckboxes = visibleFields.filter((f) => f.field_type !== 'checkbox');

    return (
      <>
        {/* Campos normales: grid de 6 columnas virtuales (full=6, half=3, third=2) */}
        {nonCheckboxes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
            {nonCheckboxes.map((field) => {
              const widthCls =
                field.field_width === 'full'
                  ? 'md:col-span-6'
                  : field.field_width === 'third'
                  ? 'md:col-span-2'
                  : 'md:col-span-3'; // half = 3/6
              return (
                <div key={field.id} className={widthCls}>
                  <FieldRenderer
                    field={field}
                    value={values[field.field_name]}
                    onChange={onChange}
                    error={errors[field.field_name]}
                    values={values}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Checkboxes: grid de 3 columnas */}
        {checkboxes.length > 0 && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${nonCheckboxes.length > 0 ? 'mt-4' : ''}`}>
            {checkboxes.map((field) => (
              <div key={field.id}>
                <FieldRenderer
                  field={field}
                  value={values[field.field_name]}
                  onChange={onChange}
                  error={errors[field.field_name]}
                />
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-8">
      {/* Campos sin sección */}
      {unsectioned.length > 0 && (
        <div>{renderFields(unsectioned)}</div>
      )}

      {/* Secciones definidas */}
      {orderedSections.map((section) => {
        const sectionFields = fieldsBySection.get(section.id) ?? [];
        if (sectionFields.length === 0) return null;

        return (
          <div key={section.id} className="space-y-5">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-lg font-semibold text-gray-900">{section.label}</h3>
            </div>
            {renderFields(sectionFields)}
          </div>
        );
      })}
    </div>
  );
};
