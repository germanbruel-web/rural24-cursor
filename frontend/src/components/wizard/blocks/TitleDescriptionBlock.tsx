import React from 'react';
import { AlertCircle } from 'lucide-react';
import { AutofillButton } from '../../forms/AutofillButton';
import InfoBox from '../../molecules/InfoBox/InfoBox';
import type { WizardBlockProps } from '../wizardTypes';
import type { WizardBlockConfig } from '../../../services/v2/wizardConfigService';
import { formStyles } from '../../../constants/styles';

const inp = formStyles.input;
const inpErr = formStyles.inputError;
const lbl = formStyles.label;
const hlp = formStyles.help;
const errTxt = formStyles.errorText;

interface Props extends Pick<WizardBlockProps,
  'title' | 'description' | 'titleError' | 'descriptionError' |
  'onTitleChange' | 'onDescriptionChange' | 'autoFillContext'
> {
  config?: WizardBlockConfig;
}

export function TitleDescriptionBlock({
  title, description,
  titleError, descriptionError,
  onTitleChange, onDescriptionChange,
  autoFillContext,
  config,
}: Props) {
  const titleMax = config?.title_max_chars ?? 100;
  const descMin = config?.description_min_chars ?? 20;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Información</h2>
      </div>

      {/* Autocompletar */}
      <AutofillButton
        context={autoFillContext}
        currentTitle={title}
        currentDescription={description}
        onFill={(t, d) => { onTitleChange(t); onDescriptionChange(d); }}
      />

      {/* Título */}
      <div className="space-y-1.5">
        <label className={lbl}>
          Título del aviso <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Ej: Tractor John Deere 5070E con pala frontal"
          maxLength={titleMax}
          className={titleError ? inpErr : inp}
        />
        <div className="flex items-center justify-between">
          <p className={hlp}>{title.length}/{titleMax} caracteres</p>
          {titleError && (
            <p className={errTxt}>
              <AlertCircle className="w-4 h-4" />
              Validando...
            </p>
          )}
        </div>
        {titleError ? (
          <div className="flex items-start gap-2 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-700">{titleError}</p>
          </div>
        ) : (
          <InfoBox variant="info" size="sm">
            Números y años permitidos. No incluir teléfonos, emails o sitios web.
          </InfoBox>
        )}
      </div>

      {/* Descripción */}
      <div className="space-y-1.5">
        <label className={lbl}>
          Descripción <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe tu producto con el mayor detalle posible. Incluye características, estado, año, etc."
          rows={6}
          maxLength={2000}
          className={`${descriptionError ? inpErr : inp} min-h-[120px] resize-y`}
        />
        <div className="flex items-center justify-between">
          <p className={hlp}>{description.length}/2000 caracteres</p>
          {descriptionError && (
            <p className={errTxt}>
              <AlertCircle className="w-4 h-4" />
              Validando...
            </p>
          )}
        </div>
        {descriptionError ? (
          <div className="flex items-start gap-2 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-700">{descriptionError}</p>
          </div>
        ) : (
          <InfoBox variant="info" size="sm">
            Mínimo {descMin} caracteres. No incluir teléfonos, emails o sitios web.
          </InfoBox>
        )}
      </div>
    </div>
  );
}
