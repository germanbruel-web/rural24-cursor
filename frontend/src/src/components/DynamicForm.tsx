// ====================================================================
// DynamicForm - Formulario completo con validación y UX profesional
// Mobile First + Progreso visual + Validación en tiempo real
// ====================================================================

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { FieldGroup } from './FieldGroup';
import type { DynamicAttribute } from '../services/catalogService';

interface DynamicFormProps {
  attributes: DynamicAttribute[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void>;
  submitLabel?: string;
}

export function DynamicForm({
  attributes,
  initialValues = {},
  onSubmit,
  submitLabel = 'Publicar Aviso',
}: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Agrupar campos por fieldGroup
  const fieldGroups = attributes.reduce((acc, attr) => {
    const group = attr.fieldGroup || 'general';
    if (!acc[group]) acc[group] = [];
    acc[group].push(attr);
    return acc;
  }, {} as Record<string, DynamicAttribute[]>);

  // Ordenar grupos: general, specifications, condition, features
  const groupOrder = ['general', 'specifications', 'condition', 'features'];
  const sortedGroups = Object.keys(fieldGroups).sort((a, b) => {
    const indexA = groupOrder.indexOf(a);
    const indexB = groupOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  // Calcular progreso
  const requiredFields = attributes.filter((a) => a.isRequired);
  const completedFields = requiredFields.filter((a) => values[a.slug]);
  const progress = requiredFields.length > 0 
    ? Math.round((completedFields.length / requiredFields.length) * 100) 
    : 0;

  // ====================================================================
  // Validación individual
  // ====================================================================
  const validateField = (attr: DynamicAttribute, value: any): string | null => {
    // Campo requerido
    if (attr.isRequired && (value === null || value === undefined || value === '')) {
      return `${attr.name} es obligatorio`;
    }

    // Validaciones de rango (números)
    if (attr.dataType === 'integer' || attr.dataType === 'decimal') {
      const numValue = Number(value);
      if (attr.validations?.min !== undefined && numValue < attr.validations.min) {
        return `Mínimo: ${attr.validations.min}`;
      }
      if (attr.validations?.max !== undefined && numValue > attr.validations.max) {
        return `Máximo: ${attr.validations.max}`;
      }
    }

    // Validaciones de longitud (texto)
    if (attr.dataType === 'string' && value) {
      if (attr.validations?.minLength && value.length < attr.validations.minLength) {
        return `Mínimo ${attr.validations.minLength} caracteres`;
      }
      if (attr.validations?.maxLength && value.length > attr.validations.maxLength) {
        return `Máximo ${attr.validations.maxLength} caracteres`;
      }
    }

    return null;
  };

  // ====================================================================
  // Cambiar valor
  // ====================================================================
  const handleChange = (slug: string, value: any) => {
    setValues((prev) => ({ ...prev, [slug]: value }));
    setTouched((prev) => ({ ...prev, [slug]: true }));

    // Validar en tiempo real
    const attr = attributes.find((a) => a.slug === slug);
    if (attr) {
      const error = validateField(attr, value);
      setErrors((prev) => ({
        ...prev,
        [slug]: error || '',
      }));
    }
  };

  // ====================================================================
  // Submit
  // ====================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos los campos
    const newErrors: Record<string, string> = {};
    attributes.forEach((attr) => {
      const error = validateField(attr, values[attr.slug]);
      if (error) newErrors[attr.slug] = error;
    });

    setErrors(newErrors);

    // Si hay errores, marcar todos como touched y detener
    if (Object.keys(newErrors).length > 0) {
      const allTouched: Record<string, boolean> = {};
      attributes.forEach((a) => (allTouched[a.slug] = true));
      setTouched(allTouched);

      // Scroll al primer error (mobile friendly)
      const firstErrorField = document.querySelector('[class*="border-red-500"]');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Submit
    try {
      setIsSubmitting(true);
      await onSubmit(values);
    } catch (error) {
      console.error('Error submitting form:', error);
      // Aquí podrías mostrar un toast de error
    } finally {
      setIsSubmitting(false);
    }
  };

  // ====================================================================
  // Render
  // ====================================================================
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Barra de progreso (mobile sticky) */}
      <div className="sticky top-0 z-10 bg-white border-b-2 border-gray-200 -mx-4 px-4 py-4 sm:mx-0 sm:px-0 sm:rounded-2xl sm:border-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-900">
            Progreso del formulario
          </span>
          <span className="text-sm font-bold text-green-600">{progress}%</span>
        </div>
        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span>
            {completedFields.length} de {requiredFields.length} campos obligatorios
          </span>
        </div>
      </div>

      {/* Grupos de campos */}
      <div className="space-y-5">
        {sortedGroups.map((group, index) => (
          <FieldGroup
            key={group}
            title={group}
            fields={fieldGroups[group]}
            values={values}
            errors={errors}
            onChange={handleChange}
            defaultExpanded={index === 0} // Solo el primero expandido en mobile
          />
        ))}
      </div>

      {/* Submit button */}
      <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 -mx-4 px-4 py-4 sm:mx-0 sm:px-0 sm:border-0 sm:static">
        <button
          type="submit"
          disabled={isSubmitting || progress < 100}
          className={`
            w-full py-4 px-6 rounded-xl font-bold text-base
            transition-all duration-200
            flex items-center justify-center gap-3
            ${progress === 100 && !isSubmitting
              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-200 hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Publicando...
            </>
          ) : progress < 100 ? (
            <>
              <AlertCircle className="w-5 h-5" />
              Completa todos los campos obligatorios
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              {submitLabel}
            </>
          )}
        </button>

        {/* Nota de ayuda */}
        {progress < 100 && (
          <p className="text-center text-xs text-gray-500 mt-3">
            Los campos marcados con <span className="text-red-500 font-bold">*</span> son obligatorios
          </p>
        )}
      </div>
    </form>
  );
}
