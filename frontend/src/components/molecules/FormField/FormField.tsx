/**
 * FormField Molecule Component
 * Combina Label + Input con validación integrada
 * Patrón reutilizable para formularios consistentes
 */

import React from 'react';
import { Input, type InputProps } from '../../atoms/Input/Input';
import { Label, type LabelProps } from '../../atoms/Label/Label';

export interface FormFieldProps extends Omit<InputProps, 'id'> {
  /** ID único del input (generado automáticamente si no se provee) */
  id?: string;
  /** Label del campo */
  label?: string;
  /** Props adicionales para el Label */
  labelProps?: Omit<LabelProps, 'htmlFor' | 'children'>;
  /** Descripción opcional debajo del label */
  description?: string;
  /** Campo requerido (muestra asterisco) */
  required?: boolean;
  /** Nombre del campo para formularios */
  name?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      id: providedId,
      label,
      labelProps,
      description,
      required,
      name,
      className,
      wrapperClassName,
      ...inputProps
    },
    ref
  ) => {
    // Generar ID único si no se provee
    const fieldId = providedId || `field-${name || Math.random().toString(36).substr(2, 9)}`;

    // Si no hay label, retornar solo el input
    if (!label) {
      return (
        <Input
          ref={ref}
          id={fieldId}
          name={name}
          className={className}
          wrapperClassName={wrapperClassName}
          {...inputProps}
        />
      );
    }

    return (
      <div className={wrapperClassName}>
        <Label
          htmlFor={fieldId}
          required={required}
          description={description}
          disabled={inputProps.disabled}
          {...labelProps}
        >
          {label}
        </Label>
        <Input
          ref={ref}
          id={fieldId}
          name={name}
          className={className}
          {...inputProps}
        />
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;
