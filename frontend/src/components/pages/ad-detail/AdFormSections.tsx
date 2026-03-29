import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { CompleteFormV2, FormFieldV2 } from '../../../types/v2';
import type { Ad, OptionLabels } from './types';
import { ICON_MAP, getSectionCols, gridColsClass, fieldSpanClass } from './utils';

interface AdFormSectionsProps {
  form: CompleteFormV2 | null;
  ad: Ad;
  optionLabels: OptionLabels;
}

function SectionIcon({ name, className = 'w-4 h-4' }: { name?: string; className?: string }) {
  if (!name) return null;
  const Icon = ICON_MAP[name.toLowerCase()] ?? ICON_MAP[name.replace(/[_\s]/g, '-').toLowerCase()];
  if (!Icon) return null;
  return <Icon className={className} />;
}

function resolveFieldValue(field: FormFieldV2, value: any, optionLabels: OptionLabels): string {
  if (value === null || value === undefined || value === '') return '';
  if (field.field_type === 'checkbox') return value ? 'Sí' : 'No';
  const strValue = String(value);
  if (field.options?.length) {
    const opt = field.options.find(o => o.value === strValue);
    return opt?.label ?? strValue;
  }
  if (field.option_list_id && optionLabels[field.option_list_id]) {
    return optionLabels[field.option_list_id][strValue] ?? strValue;
  }
  if (field.field_type === 'number' && (field.metadata as any)?.suffix) {
    return `${strValue} ${(field.metadata as any).suffix}`;
  }
  return strValue;
}

function renderField(field: FormFieldV2, optionLabels: OptionLabels, attrs: Record<string, any>) {
  const rawValue = attrs[field.field_name];
  if (rawValue === null || rawValue === undefined || rawValue === '') return null;

  const spanClass = fieldSpanClass(field);

  if (field.field_type === 'checkbox_group') {
    const vals: string[] = Array.isArray(rawValue)
      ? rawValue
      : typeof rawValue === 'string'
      ? rawValue.split(',').map(v => v.trim()).filter(Boolean)
      : [];
    if (vals.length === 0) return null;
    return (
      <div key={field.field_name} className={`${spanClass} border-b border-gray-100 pb-3 last:border-0 last:pb-0`}>
        <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          {field.field_label}
        </dt>
        <dd className="flex flex-wrap gap-1.5">
          {vals.map(v => {
            const label = resolveFieldValue(field, v, optionLabels) || v;
            return (
              <span key={v} className="inline-flex items-center gap-1 text-xs bg-brand-50 text-brand-700 rounded-full px-2.5 py-1 font-medium">
                <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                {label}
              </span>
            );
          })}
        </dd>
      </div>
    );
  }

  if (field.field_type === 'checkbox') {
    const isSi = rawValue === true || rawValue === 'true' || rawValue === 'Sí' || rawValue === 'si';
    if (!isSi) return null;
    return (
      <div key={field.field_name} className={`${spanClass} flex items-center gap-2 py-2 border-b border-gray-100 last:border-0`}>
        <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
        <span className="text-sm text-gray-700">{field.field_label}</span>
      </div>
    );
  }

  const displayValue = resolveFieldValue(field, rawValue, optionLabels);
  if (!displayValue) return null;

  return (
    <div key={field.field_name} className={`${spanClass} border-b border-gray-100 pb-3 last:border-0 last:pb-0`}>
      <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
        {field.field_label}
      </dt>
      <dd className="text-sm font-medium text-gray-900">{displayValue}</dd>
    </div>
  );
}

const INTERNAL_ATTRS = new Set([
  'bg_color',   // color visual de card servicios/empleos
  'price_type', // tipo precio interno del wizard
]);

export const AdFormSections: React.FC<AdFormSectionsProps> = ({ form, ad, optionLabels }) => {
  const attrs = ad.attributes;
  if (!attrs || Object.keys(attrs).length === 0) return null;

  if (!form) {
    const cols = 2;
    return (
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Información adicional</h2>
        <dl className={`grid ${gridColsClass(cols)} gap-x-6 gap-y-1`}>
          {Object.entries(attrs).filter(([key]) => !INTERNAL_ATTRS.has(key)).map(([key, val]) =>
            val !== null && val !== '' ? (
              <div key={key} className="border-b border-gray-100 pb-3">
                <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{key}</dt>
                <dd className="text-sm font-medium text-gray-900">{String(val)}</dd>
              </div>
            ) : null
          )}
        </dl>
      </div>
    );
  }

  const sectionedBlocks = form.sections
    .map(section => ({
      section,
      fields: form.fields
        .filter(f => f.section_id === section.id)
        .filter(f => !INTERNAL_ATTRS.has(f.field_name))
        .filter(f => {
          const val = attrs[f.field_name];
          return val !== null && val !== undefined && val !== '';
        })
        .sort((a, b) => a.display_order - b.display_order),
    }))
    .filter(b => b.fields.length > 0);

  const unsectioned = form.fields
    .filter(f => !f.section_id)
    .filter(f => !INTERNAL_ATTRS.has(f.field_name))
    .filter(f => {
      const val = attrs[f.field_name];
      return val !== null && val !== undefined && val !== '';
    });

  if (sectionedBlocks.length === 0 && unsectioned.length === 0) return null;

  return (
    <>
      {sectionedBlocks.map(({ section, fields }) => {
        const cols = getSectionCols(fields);
        return (
          <div key={section.id} className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
              <SectionIcon name={section.icon} className="w-4 h-4 text-brand-600" />
              {section.label}
            </h2>
            <dl className={`grid ${gridColsClass(cols)} gap-x-6 gap-y-1`}>
              {fields.map(f => renderField(f, optionLabels, attrs))}
            </dl>
          </div>
        );
      })}
      {unsectioned.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Otros datos</h2>
          <dl className={`grid ${gridColsClass(getSectionCols(unsectioned))} gap-x-6 gap-y-1`}>
            {unsectioned.map(f => renderField(f, optionLabels, attrs))}
          </dl>
        </div>
      )}
    </>
  );
};
