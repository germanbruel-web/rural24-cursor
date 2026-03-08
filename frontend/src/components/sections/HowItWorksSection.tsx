import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Minus,
  Newspaper,
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
  { name: 'Soja',     price: '287.000', unit: '$/tn', change: +2.3 },
  { name: 'Maíz',    price: '158.000', unit: '$/tn', change: -0.8 },
  { name: 'Trigo',   price: '212.000', unit: '$/tn', change: +1.1 },
  { name: 'Novillo', price: '3.850',   unit: '$/kg',  change: +0.5 },
];

const CALENDAR_TASKS = [
  { month: 'Mar', task: 'Siembra de maíz tardío' },
  { month: 'Abr', task: 'Fertilización de trigo' },
  { month: 'Abr', task: 'Control de malezas' },
  { month: 'May', task: 'Cosecha de soja' },
];

const GUIDES = [
  { title: 'Cómo regular una sembradora',         tag: 'Maquinaria' },
  { title: 'Recomendaciones de pulverización',     tag: 'Fitosanitarios' },
  { title: 'Manejo eficiente de fertilizantes',    tag: 'Nutrición' },
  { title: 'Preparación del suelo: guía completa', tag: 'Suelos' },
];

// CMS-ready: en el futuro se conecta a tabla news_articles en Supabase
const NEWS_ITEMS = [
  {
    title: 'Soja: proyecciones de cosecha superan las 50 millones de toneladas',
    excerpt: 'Las lluvias de febrero favorecieron el llenado de grano en el norte bonaerense y el sur de Córdoba, revirtiendo el déficit hídrico de enero.',
    source: 'Bolsa de Cereales',
    sourceUrl: '#',
    date: 'Hoy',
  },
  {
    title: 'Nueva regulación para el uso de glifosato en zonas periurbanas',
    excerpt: 'El Senasa publicó resolución que establece franjas de restricción de 500 metros alrededor de zonas pobladas para aplicaciones terrestres.',
    source: 'Senasa',
    sourceUrl: '#',
    date: 'Ayer',
  },
  {
    title: 'Precio del novillo en el Mercado de Liniers subió 3% en la semana',
    excerpt: 'La demanda sostenida de la industria frigorífica y la menor oferta de hacienda impulsaron los valores al alza por tercera semana consecutiva.',
    source: 'Mercado de Liniers',
    sourceUrl: '#',
    date: 'Mar 5',
  },
];

// ─── ACCORDION CARD ───────────────────────────────────────────────────────────

interface AccordionCardProps {
  icon: React.ReactNode;
  title: string;
  meta?: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionCard({ icon, title, meta, children, isOpen, onToggle }: AccordionCardProps) {
  return (
    <div className="bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center flex-shrink-0">
          <span className="text-brand-400">{icon}</span>
        </div>
        <span className="text-sm font-bold text-white flex-1">{title}</span>
        {meta && <span className="text-xs text-zinc-500 flex-shrink-0 mr-1">{meta}</span>}
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 transition-transform duration-300 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.3s ease',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function WidgetLink({ label, href }: { label: string; href?: string }) {
  return (
    <div className="px-4 pb-4">
      <a
        href={href || '#'}
        className="inline-flex items-center gap-1 text-sm text-brand-500 hover:text-brand-400 transition-colors font-medium"
      >
        {label}
        <ChevronRight className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

// ─── NEWS CAROUSEL ────────────────────────────────────────────────────────────

function NewsCarousel() {
  const [index, setIndex] = useState(0);
  const count = NEWS_ITEMS.length;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (i: number) => setIndex((i + count) % count);

  const resetTimer = (nextFn: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(nextFn, 6000);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => setIndex(i => (i + 1) % count), 6000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [count]);

  const item = NEWS_ITEMS[index];

  return (
    <div className="px-4 py-3">
      <div className="min-h-[120px]">
        <p className="text-sm font-semibold text-white leading-snug mb-2">{item.title}</p>
        <p className="text-xs text-zinc-400 leading-relaxed mb-3 line-clamp-3">{item.excerpt}</p>
        <div className="flex items-center gap-2">
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-400 transition-colors font-medium"
            onClick={e => e.stopPropagation()}
          >
            {item.source}
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className="text-[10px] text-zinc-600 ml-auto">{item.date}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
        <div className="flex gap-1.5">
          {NEWS_ITEMS.map((_, i) => (
            <button
              key={i}
              onClick={() => { goTo(i); resetTimer(() => setIndex(j => (j + 1) % count)); }}
              className={`rounded-full transition-all duration-300 ${
                i === index ? 'bg-brand-500 w-4 h-1.5' : 'bg-zinc-700 w-1.5 h-1.5 hover:bg-zinc-500'
              }`}
              aria-label={`Noticia ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => { goTo(index - 1); resetTimer(() => setIndex(j => (j + 1) % count)); }}
            className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { goTo(index + 1); resetTimer(() => setIndex(j => (j + 1) % count)); }}
            className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 transition-colors"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = () => {
  // Desktop (≥1024px): todos abiertos por defecto. Mobile: todos cerrados.
  const [open, setOpen] = useState<Record<number, boolean>>(
    () => window.innerWidth >= 1024 ? { 0: true, 1: true, 2: true, 3: true, 4: true } : {}
  );
  const toggle = (i: number) => setOpen(p => ({ ...p, [i]: !p[i] }));

  return (
    <section className="relative z-10 -mt-[74px] pb-10 px-4">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">

          {/* ── A) Alertas climáticas ── */}
          <AccordionCard
            icon={<AlertTriangle className="w-4 h-4" />}
            title="Alertas climáticas"
            isOpen={!!open[0]}
            onToggle={() => toggle(0)}
          >
            <div className="px-4 py-3 space-y-2">
              {CLIMATE_ALERTS.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{alert.type}</p>
                      <p className="text-xs text-zinc-400 truncate">{alert.zone}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-brand-400 flex-shrink-0 ml-2">
                    {alert.level}
                  </span>
                </div>
              ))}
            </div>
            <WidgetLink label="Ver más alertas" />
          </AccordionCard>

          {/* ── B) Precios del mercado ── */}
          <AccordionCard
            icon={<TrendingUp className="w-4 h-4" />}
            title="Precios del mercado"
            meta="MATBA · hoy"
            isOpen={!!open[1]}
            onToggle={() => toggle(1)}
          >
            <div className="px-4 py-3 space-y-1">
              {MARKET_PRICES.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
                >
                  <span className="text-sm font-semibold text-zinc-300">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white tabular-nums">${item.price}</span>
                    <span className="text-xs text-zinc-500">{item.unit}</span>
                    <span className={`inline-flex items-center gap-0.5 text-xs font-bold tabular-nums ${
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
            <WidgetLink label="Ver mercados" />
          </AccordionCard>

          {/* ── C) Calendario agrícola ── */}
          <AccordionCard
            icon={<CalendarDays className="w-4 h-4" />}
            title="Calendario agrícola"
            meta="Próximas tareas"
            isOpen={!!open[2]}
            onToggle={() => toggle(2)}
          >
            <div className="px-4 py-3 space-y-2.5">
              {CALENDAR_TASKS.map((task, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-black px-2 py-1 rounded-md bg-brand-600/20 text-brand-400 flex-shrink-0 min-w-[36px] text-center">
                    {task.month}
                  </span>
                  <span className="text-sm text-zinc-300 leading-snug">{task.task}</span>
                </div>
              ))}
            </div>
            <WidgetLink label="Ver calendario completo" />
          </AccordionCard>

          {/* ── D) Guías prácticas ── */}
          <AccordionCard
            icon={<BookOpen className="w-4 h-4" />}
            title="Guías prácticas"
            isOpen={!!open[3]}
            onToggle={() => toggle(3)}
          >
            <div className="px-4 py-3 space-y-1">
              {GUIDES.map((guide, i) => (
                <button
                  key={i}
                  className="w-full text-left flex items-start gap-2.5 py-2.5 border-b border-zinc-800 last:border-0 group"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-brand-600 group-hover:text-brand-400 flex-shrink-0 mt-0.5 transition-colors" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-200 group-hover:text-white leading-snug transition-colors">
                      {guide.title}
                    </p>
                    <span className="text-xs text-brand-500 font-medium">{guide.tag}</span>
                  </div>
                </button>
              ))}
            </div>
            <WidgetLink label="Ver todas las guías" />
          </AccordionCard>

          {/* ── E) Noticias Rural 24 ── */}
          <AccordionCard
            icon={<Newspaper className="w-4 h-4" />}
            title="Noticias Rural 24"
            meta="Actualizado hoy"
            isOpen={!!open[4]}
            onToggle={() => toggle(4)}
          >
            <NewsCarousel />
          </AccordionCard>

        </div>
      </div>
    </section>
  );
};
