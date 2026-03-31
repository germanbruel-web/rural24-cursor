import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { CompleteFormV2, FormFieldV2 } from '../../../types/v2';
import type { Ad, OptionLabels } from './types';
import { ICON_MAP, FIELD_NAME_ICON_MAP, getFieldWidthClass } from './utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdFormSectionsProps {
  form: CompleteFormV2 | null;
  ad: Ad;
  optionLabels: OptionLabels;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INTERNAL_ATTRS = new Set(['bg_color', 'price_type']);
const TEXTAREA_MAX = 200;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const humanizeKey = (key: string): string =>
  key.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const humanizeSlug = (val: string): string => {
  if (/^[a-z0-9_-]+$/.test(val) && (val.includes('-') || val.includes('_'))) {
    return val.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  return val;
};

function resolveIcon(name?: string, fieldName?: string) {
  // 1. icon configured explicitly on the field
  if (name) {
    const fromName =
      ICON_MAP[name.toLowerCase()] ??
      ICON_MAP[name.replace(/[_\s]/g, '-').toLowerCase()];
    if (fromName) return fromName;
  }
  // 2. fallback: match by field_name
  if (fieldName) {
    const key = fieldName.toLowerCase().replace(/[_-]/g, '_');
    const iconKey = FIELD_NAME_ICON_MAP[key] ?? FIELD_NAME_ICON_MAP[fieldName.toLowerCase()];
    if (iconKey) return ICON_MAP[iconKey] ?? null;
  }
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Field icon + label row */
function FieldLabel({ field }: { field: FormFieldV2 }) {
  const Icon = resolveIcon(field.icon, field.field_name);
  return (
    <dt className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0 text-brand-500" />}
      {field.field_label}
    </dt>
  );
}

/** Section header icon */
function SectionIcon({ name, className = 'w-4 h-4' }: { name?: string; className?: string }) {
  const Icon = resolveIcon(name);
  if (!Icon) return null;
  return <Icon className={className} />;
}

/** Textarea with expand/collapse — needs useState so must be a component */
function TextareaDisplay({ field, value }: { field: FormFieldV2; value: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = value.length > TEXTAREA_MAX;
  const displayText = needsTruncation && !expanded ? value.slice(0, TEXTAREA_MAX) + '…' : value;
  return (
    <>
      <FieldLabel field={field} />
      <dd className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
        {displayText}
        {needsTruncation && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="ml-2 text-xs font-medium text-brand-600 hover:text-brand-700 focus:outline-none"
          >
            {expanded ? 'Ver menos' : 'Ver más'}
          </button>
        )}
      </dd>
    </>
  );
}

// ─── Value resolvers ──────────────────────────────────────────────────────────

function resolveFieldValue(field: FormFieldV2, value: unknown, optionLabels: OptionLabels): string {
  if (value === null || value === undefined || value === '') return '';
  if (field.field_type === 'checkbox') return value ? 'Sí' : 'No';
  const strValue = String(value);
  if (field.options?.length) {
    const opt = field.options.find(o => o.value === strValue);
    return opt?.label ?? strValue;
  }
  if (field.option_list_id && optionLabels[field.option_list_id]) {
    return optionLabels[field.option_list_id][strValue] ?? humanizeSlug(strValue);
  }
  if (field.field_type === 'number' && (field.metadata as Record<string, unknown>)?.suffix) {
    return `${strValue} ${(field.metadata as Record<string, unknown>).suffix}`;
  }
  return humanizeSlug(strValue);
}

function resolveRangeValue(field: FormFieldV2, rawValue: unknown): string | null {
  const suffix = ((field.metadata as Record<string, unknown>)?.suffix as string) ?? '';
  const sfx = suffix ? ` ${suffix}` : '';
  if (rawValue === null || rawValue === undefined || rawValue === '') return null;

  if (typeof rawValue === 'object' && !Array.isArray(rawValue)) {
    const { min, max } = rawValue as Record<string, unknown>;
    if (min != null && max != null) return `${min} – ${max}${sfx}`;
    if (min != null) return `desde ${min}${sfx}`;
    if (max != null) return `hasta ${max}${sfx}`;
    return null;
  }

  if (typeof rawValue === 'string' && rawValue.includes('-')) {
    const parts = rawValue.split('-').map(s => s.trim());
    if (parts[0] && parts[1]) return `${parts[0]} – ${parts[1]}${sfx}`;
  }

  return `${String(rawValue)}${sfx}`;
}

// ─── Field renderer ───────────────────────────────────────────────────────────

function renderField(field: FormFieldV2, optionLabels: OptionLabels, attrs: Record<string, unknown>) {
  const rawValue = attrs[field.field_name];
  if (rawValue === null || rawValue === undefined || rawValue === '') return null;

  const widthCls = getFieldWidthClass(field.field_width);

  // checkbox_group / features / tags → pill badges
  if (
    field.field_type === 'checkbox_group' ||
    field.field_type === 'features' ||
    field.field_type === 'tags'
  ) {
    const vals: string[] = Array.isArray(rawValue)
      ? rawValue as string[]
      : typeof rawValue === 'string'
      ? rawValue.split(',').map(v => v.trim()).filter(Boolean)
      : [];
    if (vals.length === 0) return null;
    return (
      <div key={field.field_name} className={widthCls}>
        <FieldLabel field={field} />
        <dd className="flex flex-wrap gap-1.5 mt-1">
          {vals.map(v => {
            const label = resolveFieldValue(field, v, optionLabels) || humanizeSlug(v);
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1 text-xs bg-brand-50 text-brand-700 rounded-full px-2.5 py-1 font-medium"
              >
                <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                {label}
              </span>
            );
          })}
        </dd>
      </div>
    );
  }

  // checkbox boolean — show only when true
  if (field.field_type === 'checkbox') {
    const isTrue =
      rawValue === true || rawValue === 'true' || rawValue === 'Sí' || rawValue === 'si';
    if (!isTrue) return null;
    return (
      <div key={field.field_name} className={widthCls}>
        <dd className="flex items-center gap-2 py-1">
          <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700">{field.field_label}</span>
        </dd>
      </div>
    );
  }

  // textarea — truncatable
  if (field.field_type === 'textarea') {
    const strVal = String(rawValue);
    if (!strVal) return null;
    return (
      <div key={field.field_name} className={widthCls}>
        <TextareaDisplay field={field} value={strVal} />
      </div>
    );
  }

  // range — formatted min–max
  if (field.field_type === 'range') {
    const formatted = resolveRangeValue(field, rawValue);
    if (!formatted) return null;
    return (
      <div key={field.field_name} className={widthCls}>
        <FieldLabel field={field} />
        <dd className="text-sm font-medium text-gray-900">{formatted}</dd>
      </div>
    );
  }

  // default: text, number, select, autocomplete, radio
  const displayValue = resolveFieldValue(field, rawValue, optionLabels);
  if (!displayValue) return null;

  return (
    <div key={field.field_name} className={widthCls}>
      <FieldLabel field={field} />
      <dd className="text-sm font-medium text-gray-900">{displayValue}</dd>
    </div>
  );
}

// ─── Section fields grid ──────────────────────────────────────────────────────

/**
 * 6-col virtual grid for non-checkboxes.
 * Checkboxes separated into own 3-col grid below (mirrors wizard).
 */
function SectionFieldsGrid({
  fields,
  optionLabels,
  attrs,
}: {
  fields: FormFieldV2[];
  optionLabels: OptionLabels;
  attrs: Record<string, unknown>;
}) {
  const checkboxes = fields.filter(f => f.field_type === 'checkbox');
  const nonCheckboxes = fields.filter(f => f.field_type !== 'checkbox');

  return (
    <>
      {nonCheckboxes.length > 0 && (
        <dl className="grid grid-cols-1 md:grid-cols-6 gap-x-6 gap-y-4">
          {nonCheckboxes.map(f => renderField(f, optionLabels, attrs))}
        </dl>
      )}
      {checkboxes.length > 0 && (
        <dl className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3${nonCheckboxes.length > 0 ? ' mt-3' : ''}`}>
          {checkboxes.map(f => renderField(f, optionLabels, attrs))}
        </dl>
      )}
    </>
  );
}

// ─── hasValue helper ──────────────────────────────────────────────────────────

function hasValue(val: unknown): boolean {
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'object' && val !== null) return true;
  return val !== null && val !== undefined && val !== '';
}

// ─── Main component ───────────────────────────────────────────────────────────

export const AdFormSections: React.FC<AdFormSectionsProps> = ({ form, ad, optionLabels }) => {
  const attrs = ad.attributes as Record<string, unknown> | undefined;
  if (!attrs || Object.keys(attrs).length === 0) return null;

  // Fallback: no form template — show raw attributes with icons
  if (!form) {
    const entries = Object.entries(attrs).filter(
      ([key, val]) => !INTERNAL_ATTRS.has(key) && val !== null && val !== ''
    );
    if (entries.length === 0) return null;

    return (
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Características</h2>
        <dl className="grid grid-cols-1 md:grid-cols-6 gap-x-6 gap-y-4">
          {entries.map(([key, val]) => {
            const Icon = resolveIcon(undefined, key);
            return (
              <div key={key} className="md:col-span-3">
                <dt className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  {Icon && <Icon className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />}
                  {humanizeKey(key)}
                </dt>
                <dd className="text-sm font-medium text-gray-900">
                  {Array.isArray(val)
                    ? (val as string[]).map(humanizeSlug).join(', ')
                    : humanizeSlug(String(val))
                  }
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    );
  }

  // Sectioned blocks
  const sectionedBlocks = form.sections
    .map(section => ({
      section,
      fields: form.fields
        .filter(f => f.section_id === section.id)
        .filter(f => !INTERNAL_ATTRS.has(f.field_name))
        .filter(f => hasValue(attrs[f.field_name]))
        .sort((a, b) => a.display_order - b.display_order),
    }))
    .filter(b => b.fields.length > 0);

  const unsectioned = form.fields
    .filter(f => !f.section_id)
    .filter(f => !INTERNAL_ATTRS.has(f.field_name))
    .filter(f => hasValue(attrs[f.field_name]))
    .sort((a, b) => a.display_order - b.display_order);

  if (sectionedBlocks.length === 0 && unsectioned.length === 0) return null;

  return (
    <>
      {sectionedBlocks.map(({ section, fields }) => (
        <div key={section.id} className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
            <SectionIcon name={section.icon} className="w-4 h-4 text-brand-600" />
            {section.label}
          </h2>
          <SectionFieldsGrid fields={fields} optionLabels={optionLabels} attrs={attrs} />
        </div>
      ))}
      {unsectioned.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Otros datos</h2>
          <SectionFieldsGrid fields={unsectioned} optionLabels={optionLabels} attrs={attrs} />
        </div>
      )}
    </>
  );
};
