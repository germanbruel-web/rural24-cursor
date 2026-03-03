import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';

type MPStatus = 'success' | 'failure' | 'pending';

const STATUS_CONFIG: Record<MPStatus, {
  icon:        React.ReactNode;
  title:       string;
  message:     string;
  buttonLabel: string;
  iconBg:      string;
  border:      string;
}> = {
  success: {
    icon:        <CheckCircle2 className="w-16 h-16 text-green-500" />,
    title:       '¡Pago aprobado!',
    message:     'Tu aviso será destacado en los próximos minutos mientras procesamos la activación.',
    buttonLabel: 'Ver mis avisos',
    iconBg:      'bg-green-50',
    border:      'border-green-200',
  },
  failure: {
    icon:        <XCircle className="w-16 h-16 text-red-500" />,
    title:       'El pago no se procesó',
    message:     'Hubo un problema con el pago. Podés intentarlo nuevamente desde el modal de Destacar aviso.',
    buttonLabel: 'Volver a mis avisos',
    iconBg:      'bg-red-50',
    border:      'border-red-200',
  },
  pending: {
    icon:        <Clock className="w-16 h-16 text-amber-500" />,
    title:       'Pago en proceso',
    message:     'MercadoPago está verificando tu pago. Te notificaremos cuando se confirme y tu aviso sea activado.',
    buttonLabel: 'Ver mis avisos',
    iconBg:      'bg-amber-50',
    border:      'border-amber-200',
  },
};

export default function PaymentResultPage() {
  const [status, setStatus] = useState<MPStatus | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('mp_result') as MPStatus | null;
    if (!stored || !STATUS_CONFIG[stored]) {
      // Sin datos de pago → volver al inicio
      window.location.hash = '#/';
      return;
    }
    setStatus(stored);
    sessionStorage.removeItem('mp_result');
  }, []);

  if (!status) return null;

  const cfg = STATUS_CONFIG[status];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-md bg-white rounded-2xl shadow-lg border ${cfg.border} overflow-hidden`}>

        {/* Icono + mensaje */}
        <div className={`${cfg.iconBg} px-6 py-10 flex flex-col items-center text-center gap-4`}>
          {cfg.icon}
          <h1 className="text-2xl font-bold text-gray-900">{cfg.title}</h1>
          <p className="text-sm text-gray-600 leading-relaxed max-w-xs">{cfg.message}</p>
        </div>

        {/* CTA */}
        <div className="px-6 py-5">
          <button
            onClick={() => { window.location.hash = '#/my-ads'; }}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            {cfg.buttonLabel}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
