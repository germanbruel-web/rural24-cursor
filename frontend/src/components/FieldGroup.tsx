// ====================================================================
// FieldGroup - Agrupa campos por sección (Mobile First + Colapsable)
// ====================================================================

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DynamicField } from './DynamicField';
import type { DynamicAttribute } from '../services/catalogService';

interface FieldGroupProps {
  title: string;
  fields: DynamicAttribute[];
  values: Record<string, any>;
  errors: Record<string, string>;
  onChange: (slug: string, value: any) => void;
  defaultExpanded?: boolean;
}

const groupTitles: Record<string, { emoji: string; title: string }> = {
  general: { emoji: '📋', title: 'Información General' },
  specifications: { emoji: '⚙️', title: 'Especificaciones Técnicas' },
  condition: { emoji: '🔧', title: 'Estado y Uso' },
  features: { emoji: '✨', title: 'Características Adicionales' },
};

export function FieldGroup({
  title,
  fields,
  values,
  errors,
  onChange,
  defaultExpanded = true,
}: FieldGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const groupInfo = groupTitles[title] || { emoji: '📦', title };
  const requiredCount = fields.filter((f) => f.isRequired).length;
  const completedCount = fields.filter((f) => f.isRequired && values[f.slug]).length;

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm">
      {/* Header (clickable en mobile) */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-5 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200 hover:bg-gray-50 transition-colors sm:cursor-default"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{groupInfo.emoji}</span>
          <div className="text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              {groupInfo.title}
            </h3>
          </div>
        </div>
        <div className="sm:hidden">
          {isExpanded ? (
            <ChevronUp className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          )}
        </div>
      </button>

      {/* Fields */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {fields.map((field) => (
            <DynamicField
              key={field.id || field.name || field.slug}
              attribute={field}
              value={values[field.slug]}
              onChange={(value) => onChange(field.slug, value)}
              error={errors[field.slug]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
