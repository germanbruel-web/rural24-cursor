import { useState, useEffect } from 'react';
import type { WizardBlockProps } from '../wizardTypes';
import type { WizardBlockConfig } from '../../../services/v2/wizardConfigService';
import { getOptionListItemsByName } from '../../../services/v2/optionListsService';

const inp = 'w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-400';
const lbl = 'block text-sm font-semibold text-gray-700 mb-2';
const hlp = 'mt-1.5 text-sm text-gray-500';

function cleanPrice(v: string) { return v.replace(/[^\d]/g, ''); }
function formatDisplay(v: string) {
  if (!v) return '';
  const n = parseInt(v);
  return isNaN(n) ? '' : n.toLocaleString('es-AR');
}
function formatCurrency(amount: string, curr: string) {
  if (!amount) return '';
  const n = parseInt(amount);
  if (isNaN(n)) return '';
  const formatted = n.toLocaleString('es-AR');
  if (curr === 'ARS') return `ARS ${formatted}`;
  if (curr === 'USD') return `USD ${formatted}`;
  return `${curr} ${formatted}`;
}

interface CurrencyOption { value: string; label: string; }

const STATIC_LABELS: Record<string, string> = {
  ARS: 'ARS $',
  USD: 'USD u$s',
  EUR: 'EUR €',
};

function toOption(code: string): CurrencyOption {
  return { value: code, label: STATIC_LABELS[code] ?? code };
}

interface Props extends Pick<WizardBlockProps,
  'price' | 'setPrice' | 'currency' | 'setCurrency' |
  'priceUnit' | 'setPriceUnit' | 'priceUnitOptions'
> {
  config?: WizardBlockConfig;
}

export function PriceBlock({
  price, setPrice,
  currency, setCurrency,
  priceUnit, setPriceUnit,
  priceUnitOptions,
  config,
}: Props) {
  const showCurrency = config?.show_currency !== false;
  const showUnit     = config?.show_unit !== false;
  const hasUnits     = showUnit && priceUnitOptions.length > 0;

  // Monedas: opción lista dinámica > fallback estático > default ARS+USD
  const [currencies, setCurrencies] = useState<CurrencyOption[]>(
    (config?.currencies ?? ['ARS', 'USD']).map(toOption)
  );

  useEffect(() => {
    if (!config?.currencies_list) {
      setCurrencies((config?.currencies ?? ['ARS', 'USD']).map(toOption));
      return;
    }
    getOptionListItemsByName(config.currencies_list)
      .then((items) => {
        if (items.length > 0) {
          setCurrencies(items.map((i) => ({ value: i.value, label: i.label })));
        }
      })
      .catch(() => {/* mantiene fallback */});
  }, [config?.currencies_list, config?.currencies?.join(',')]);

  // Inicializar moneda si el valor actual no está en la lista
  useEffect(() => {
    if (currencies.length > 0 && !currencies.find((c) => c.value === currency)) {
      setCurrency(currencies[0].value as 'ARS' | 'USD');
    }
  }, [currencies]);

  return (
    <div className="space-y-3">
      <label className={lbl}>
        Precio <span className="text-red-500">*</span>
      </label>

      {/* Moneda inline + monto en la misma fila */}
      <div className="flex flex-wrap items-stretch gap-2">

        {/* Toggles de moneda */}
        {showCurrency && currencies.length > 0 && (
          <div className="flex items-stretch gap-1 bg-gray-100 rounded-md p-1">
            {currencies.map((c) => {
              const active = currency === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCurrency(c.value as 'ARS' | 'USD')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded text-sm font-semibold transition-all ${
                    active
                      ? 'bg-white shadow text-brand-700 ring-1 ring-brand-300'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    active ? 'border-brand-600' : 'border-gray-400'
                  }`}>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-brand-600 block" />}
                  </span>
                  {c.value}
                </button>
              );
            })}
          </div>
        )}

        {/* Input monto */}
        <div className="flex-1 min-w-[140px]">
          <input
            type="text"
            value={formatDisplay(price)}
            onChange={(e) => setPrice(cleanPrice(e.target.value))}
            placeholder="ej: 50.000"
            className={inp}
          />
        </div>

        {/* Unidad (si aplica) */}
        {hasUnits && (
          <div className="w-36">
            <select
              value={priceUnit}
              onChange={(e) => setPriceUnit(e.target.value)}
              className={inp}
            >
              <option value="">Unidad...</option>
              {priceUnitOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Preview */}
      {price && (
        <div className="px-3 py-2 bg-brand-50 border border-brand-200 rounded-lg">
          <span className="text-sm text-gray-700">
            Se publicará como:{' '}
            <strong className="text-brand-700 text-base">
              {formatCurrency(price, currency)}
              {priceUnit && priceUnitOptions.find(o => o.value === priceUnit)
                ? ` / ${priceUnitOptions.find(o => o.value === priceUnit)!.label}`
                : ''}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
