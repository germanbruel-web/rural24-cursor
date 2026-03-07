import React from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Minus,
  TrendingUp,
} from 'lucide-react';

interface HowItWorksSectionProps {
  onRegisterClick?: () => void;
}

// ─── DATOS MOCK ───────────────────────────────────────────────────────────────

const CLIMATE_ALERTS = [
  { type: 'Heladas tardías', zone: 'Pampa Húmeda', level: 'Moderado' },
  { type: 'Granizo', zone: 'Córdoba Norte', level: 'Alto' },
  { type: 'Viento fuerte', zone: 'Buenos Aires', level: 'Bajo' },
];

const MARKET_PRICES = [
  { name: 'Soja',    price: '287.000', unit: '$/tn', change: +2.3 },
  { name: 'Maíz',   price: '158.000', unit: '$/tn', change: -0.8 },
  { name: 'Trigo',  price: '212.000', unit: '$/tn', change: +1.1 },
  { name: 'Novillo',price: '3.850',   unit: '$/kg',  change: +0.5 },
];

const CALENDAR_TASKS = [
  { month: 'Mar', task: 'Siembra de maíz tardío' },
  { month: 'Abr', task: 'Fertilización de trigo' },
  { month: 'Abr', task: 'Control de malezas' },
  { month: 'May', task: 'Cosecha de soja' },
];

const GUIDES = [
  { title: 'Cómo regular una sembradora',          tag: 'Maquinaria' },
  { title: 'Recomendaciones de pulverización',      tag: 'Fitosanitarios' },
  { title: 'Manejo eficiente de fertilizantes',     tag: 'Nutrición' },
  { title: 'Preparación del suelo: guía completa',  tag: 'Suelos' },
];

// ─── CARD BASE ────────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden shadow-2xl">
      {children}
    </div>
  );
}

function CardHeader({ icon, title, meta }: { icon: React.ReactNode; title: string; meta?: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-zinc-800">
      <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center flex-shrink-0">
        <span className="text-brand-400">{icon}</span>
      </div>
      <span className="text-sm font-bold text-white flex-1">{title}</span>
      {meta && <span className="text-[10px] text-zinc-500 flex-shrink-0">{meta}</span>}
    </div>
  );
}

function CardButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <div className="px-4 pb-4">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors"
      >
        {label}
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
      </button>
    </div>
  );
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = () => {
  return (
    <section className="relative z-10 -mt-6 pb-10 px-4">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* ── A) Alertas climáticas ── */}
          <Card>
            <CardHeader
              icon={<AlertTriangle className="w-4 h-4" />}
              title="Alertas climáticas"
            />
            <div className="flex-1 px-4 py-3 space-y-2">
              {CLIMATE_ALERTS.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{alert.type}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{alert.zone}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-brand-400 flex-shrink-0 ml-2">
                    {alert.level}
                  </span>
                </div>
              ))}
            </div>
            <CardButton label="Ver más alertas" />
          </Card>

          {/* ── B) Precios del mercado ── */}
          <Card>
            <CardHeader
              icon={<TrendingUp className="w-4 h-4" />}
              title="Precios del mercado"
              meta="MATBA · hoy"
            />
            <div className="flex-1 px-4 py-3 space-y-1">
              {MARKET_PRICES.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
                >
                  <span className="text-sm font-semibold text-zinc-300">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white tabular-nums">${item.price}</span>
                    <span className="text-[10px] text-zinc-500">{item.unit}</span>
                    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums ${
                      item.change > 0 ? 'text-brand-400' : item.change < 0 ? 'text-red-400' : 'text-zinc-500'
                    }`}>
                      {item.change > 0
                        ? <ArrowUp className="w-3 h-3" />
                        : item.change < 0
                        ? <ArrowDown className="w-3 h-3" />
                        : <Minus className="w-3 h-3" />}
                      {Math.abs(item.change)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <CardButton label="Ver mercados" />
          </Card>

          {/* ── C) Calendario agrícola ── */}
          <Card>
            <CardHeader
              icon={<CalendarDays className="w-4 h-4" />}
              title="Calendario agrícola"
              meta="Próximas tareas"
            />
            <div className="flex-1 px-4 py-3 space-y-2.5">
              {CALENDAR_TASKS.map((task, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[10px] font-black px-2 py-1 rounded-md bg-brand-600/20 text-brand-400 flex-shrink-0 min-w-[36px] text-center">
                    {task.month}
                  </span>
                  <span className="text-xs text-zinc-300 leading-snug">{task.task}</span>
                </div>
              ))}
            </div>
            <CardButton label="Ver calendario completo" />
          </Card>

          {/* ── D) Guías prácticas ── */}
          <Card>
            <CardHeader
              icon={<BookOpen className="w-4 h-4" />}
              title="Guías prácticas"
            />
            <div className="flex-1 px-4 py-3 space-y-1">
              {GUIDES.map((guide, i) => (
                <button
                  key={i}
                  className="w-full text-left flex items-start gap-2.5 py-2.5 border-b border-zinc-800 last:border-0 group"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-brand-600 group-hover:text-brand-400 flex-shrink-0 mt-0.5 transition-colors" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 group-hover:text-white leading-snug transition-colors">
                      {guide.title}
                    </p>
                    <span className="text-[10px] text-brand-500 font-medium">{guide.tag}</span>
                  </div>
                </button>
              ))}
            </div>
            <CardButton label="Ver todas las guías" />
          </Card>

        </div>
      </div>
    </section>
  );
};
