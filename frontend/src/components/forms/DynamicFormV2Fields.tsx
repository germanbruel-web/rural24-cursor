// ============================================================
// DYNAMIC FORM V2 FIELDS — Sprint 4C
// ============================================================
// Renderiza los campos de un form_template_v2 como componentes
// controlados (values / onChange), sin submit propio.
// Se integra en el wizard de PublicarAviso como reemplazo del
// BackendFormSection cuando hay template en form_templates_v2.
// ============================================================

import React, { useEffect, useState } from 'react';
import type { CompleteFormV2, FormFieldV2, FormSection } from '../../types/v2';
import { getOptionListItemsForSelect } from '../../services/v2/optionListsService';
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

// ─── CAMPO SELECT (con carga lazy de opciones) ─────────────────

function SelectFieldV2({
  field,
  value,
  onChange,
  error,
}: {
  field: FormFieldV2 & { option_list_id?: string | null };
  value: any;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        if (field.option_list_id) {
          // Cargar desde option_list centralizado
          const items = await getOptionListItemsForSelect(field.option_list_id);
          if (!cancelled) setOptions(items);
        } else if (field.options && field.options.length > 0) {
          // Opciones estáticas ya cargadas con el campo
          if (!cancelled) setOptions(field.options);
        } else {
          // Cargar desde form_field_options_v2
          const raw = await getFieldOptions(field.id);
          if (!cancelled)
            setOptions(raw.filter((o) => o.is_active).map((o) => ({
              value: o.option_value,
              label: o.option_label,
            })));
        }
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [field.id, field.option_list_id]);

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
      className={`${inputCls} ${error ? 'border-red-400' : ''}`}
    >
      <option value="">{loading ? 'Cargando...' : (field.placeholder || 'Seleccionar...')}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
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
}: {
  field: FormFieldV2 & { option_list_id?: string | null };
  value: any;
  onChange: (name: string, v: any) => void;
  error?: string;
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
        <SelectFieldV2 field={field} value={value} onChange={handleChange} error={error} />
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
        // text, tags, features, range → input text
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
    // Separar checkboxes del resto para agruparlos en grid diferente
    const checkboxes = fields.filter((f) => f.field_type === 'checkbox');
    const nonCheckboxes = fields.filter((f) => f.field_type !== 'checkbox');

    return (
      <>
        {/* Campos normales: grid según field_width */}
        {nonCheckboxes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {nonCheckboxes.map((field) => {
              const widthCls =
                field.field_width === 'full'
                  ? 'md:col-span-2'
                  : field.field_width === 'third'
                  ? '' // sin span extra en grid 2col
                  : ''; // half = 1 col en grid 2col
              return (
                <div key={field.id} className={widthCls}>
                  <FieldRenderer
                    field={field}
                    value={values[field.field_name]}
                    onChange={onChange}
                    error={errors[field.field_name]}
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
