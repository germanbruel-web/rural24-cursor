import { Check } from 'lucide-react';
import type { WizardBlockProps } from '../wizardTypes';
import { formStyles } from '../../../constants/styles';

const lbl = formStyles.label;

const COLOR_OPTIONS = [
  { value: '#F7FEE7', label: 'Verde suave',  border: '#d9f99d' },
  { value: '#ECFCCB', label: 'Verde claro',  border: '#bef264' },
  { value: '#FFFFFF', label: 'Blanco',        border: '#e5e7eb' },
  { value: '#E6E6E6', label: 'Gris claro',   border: '#d1d5db' },
  { value: '#333333', label: 'Gris oscuro',  border: '#6b7280' },
];

interface Props extends Pick<WizardBlockProps, 'bgColor' | 'setBgColor'> {}

export function ColorPickerBlock({ bgColor, setBgColor }: Props) {
  return (
    <div className="space-y-3">
      <label className={lbl}>
        Color de la tarjeta <span className="text-red-500">*</span>
      </label>
      <p className="text-xs text-gray-500">
        Este color se mostrará como fondo de tu aviso en el sitio.
      </p>
      <div className="flex gap-3 flex-wrap">
        {COLOR_OPTIONS.map((opt) => {
          const active = bgColor === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setBgColor(opt.value)}
              title={opt.label}
              className={`relative w-12 h-12 rounded-xl border-2 transition-all ${
                active
                  ? 'scale-110 shadow-md ring-2 ring-brand-500 ring-offset-2'
                  : 'hover:scale-105 hover:shadow-sm'
              }`}
              style={{ backgroundColor: opt.value, borderColor: opt.border }}
            >
              {active && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check
                    className="w-5 h-5 drop-shadow"
                    style={{ color: opt.value === '#333333' ? '#fff' : '#333' }}
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-400">
        Color seleccionado: <span className="font-mono">{bgColor}</span>
      </p>
    </div>
  );
}
