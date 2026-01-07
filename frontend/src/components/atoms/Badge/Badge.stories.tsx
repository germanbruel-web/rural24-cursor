import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';
import { CheckCircle, AlertCircle, Clock, Star, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Indicador visual compacto para estados, categorías, notificaciones y tags.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'danger', 'neutral', 'outline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

// ==================== BÁSICOS ====================

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="neutral">Neutral</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

// ==================== CON DOTS ====================

export const WithDot: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="success" dot>Activo</Badge>
      <Badge variant="warning" dot>Pendiente</Badge>
      <Badge variant="danger" dot>Inactivo</Badge>
      <Badge variant="neutral" dot>Pausado</Badge>
    </div>
  ),
};

// ==================== CON ICONOS ====================

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="success" leftIcon={<CheckCircle size={14} />}>
        Verificado
      </Badge>
      <Badge variant="warning" leftIcon={<AlertCircle size={14} />}>
        Alerta
      </Badge>
      <Badge variant="primary" leftIcon={<Clock size={14} />}>
        Programado
      </Badge>
      <Badge variant="secondary" leftIcon={<Star size={14} />}>
        Destacado
      </Badge>
    </div>
  ),
};

export const WithRightIcon: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="primary" rightIcon={<Star size={14} />}>
        Premium
      </Badge>
      <Badge variant="success" rightIcon={<CheckCircle size={14} />}>
        Completado
      </Badge>
    </div>
  ),
};

// ==================== REMOVIBLES ====================

export const Removable: Story = {
  render: () => {
    const [badges, setBadges] = useState(['React', 'TypeScript', 'Tailwind', 'Vite']);
    
    return (
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <Badge
            key={badge}
            variant="primary"
            removable
            onRemove={() => setBadges(badges.filter(b => b !== badge))}
          >
            {badge}
          </Badge>
        ))}
      </div>
    );
  },
};

export const RemovableTags: Story = {
  render: () => {
    const [tags, setTags] = useState(['Ganadería', 'Tractores', 'Sembradoras', 'Cosechadoras']);
    
    return (
      <div className="space-y-4 p-6 bg-white dark:bg-neutral-800 rounded-xl">
        <h3 className="font-semibold text-neutral-900 dark:text-white">Categorías seleccionadas:</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              leftIcon={<Tag size={14} />}
              removable
              onRemove={() => setTags(tags.filter(t => t !== tag))}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    );
  },
};

// ==================== ESTADOS ====================

export const StatusBadges: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-3">Estados de Aviso:</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success" dot>Activo</Badge>
          <Badge variant="warning" dot>Pendiente</Badge>
          <Badge variant="danger" dot>Rechazado</Badge>
          <Badge variant="neutral" dot>Pausado</Badge>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-3">Estados de Pago:</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success" leftIcon={<CheckCircle size={14} />}>Pagado</Badge>
          <Badge variant="warning" leftIcon={<Clock size={14} />}>Pendiente</Badge>
          <Badge variant="danger" leftIcon={<AlertCircle size={14} />}>Vencido</Badge>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-3">Estados de Usuario:</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success" dot size="sm">Online</Badge>
          <Badge variant="warning" dot size="sm">Ausente</Badge>
          <Badge variant="neutral" dot size="sm">Offline</Badge>
        </div>
      </div>
    </div>
  ),
};

// ==================== CASOS DE USO REALES ====================

export const ProductCard: Story = {
  render: () => (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 max-w-md space-y-4">
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Tractor John Deere 7230R</h3>
        <Badge variant="success" leftIcon={<CheckCircle size={14} />}>
          Verificado
        </Badge>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Badge variant="primary" size="sm">Destacado</Badge>
        <Badge variant="secondary" size="sm">Tractores</Badge>
        <Badge variant="neutral" size="sm">230 HP</Badge>
        <Badge variant="outline" size="sm">2020</Badge>
      </div>
      
      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">$185.000</span>
          <Badge variant="warning" dot>Negociable</Badge>
        </div>
      </div>
    </div>
  ),
};

export const NotificationList: Story = {
  render: () => (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 max-w-md space-y-4">
      <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Notificaciones</h3>
      
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg transition-colors">
          <Badge variant="primary" size="sm" dot />
          <div className="flex-1">
            <p className="text-sm text-neutral-900 dark:text-white">Nueva consulta sobre tu aviso</p>
            <span className="text-xs text-neutral-500">Hace 5 minutos</span>
          </div>
        </div>
        
        <div className="flex items-start gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg transition-colors">
          <Badge variant="success" size="sm" dot />
          <div className="flex-1">
            <p className="text-sm text-neutral-900 dark:text-white">Tu aviso fue aprobado</p>
            <span className="text-xs text-neutral-500">Hace 2 horas</span>
          </div>
        </div>
        
        <div className="flex items-start gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg transition-colors">
          <Badge variant="warning" size="sm" dot />
          <div className="flex-1">
            <p className="text-sm text-neutral-900 dark:text-white">Tu suscripción vence pronto</p>
            <span className="text-xs text-neutral-500">Hace 1 día</span>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const FilterTags: Story = {
  render: () => {
    const [filters, setFilters] = useState([
      { id: 1, label: 'Tractores', variant: 'primary' as const },
      { id: 2, label: 'Buenos Aires', variant: 'secondary' as const },
      { id: 3, label: '$50k - $100k', variant: 'neutral' as const },
      { id: 4, label: 'Usados', variant: 'neutral' as const },
    ]);
    
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Filtros aplicados:</h3>
          <button 
            onClick={() => setFilters([])}
            className="text-sm text-danger-600 hover:text-danger-700 dark:text-danger-400"
          >
            Limpiar todo
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Badge
              key={filter.id}
              variant={filter.variant}
              removable
              onRemove={() => setFilters(filters.filter(f => f.id !== filter.id))}
            >
              {filter.label}
            </Badge>
          ))}
        </div>
      </div>
    );
  },
};

// ==================== DARK MODE ====================

export const DarkMode: Story = {
  render: () => (
    <div className="dark">
      <div className="bg-neutral-900 p-8 rounded-xl space-y-6">
        <div>
          <h4 className="text-white font-semibold mb-3">Variantes en Dark Mode:</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="neutral">Neutral</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </div>
        
        <div>
          <h4 className="text-white font-semibold mb-3">Con estados:</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success" dot>Activo</Badge>
            <Badge variant="warning" leftIcon={<Clock size={14} />}>Pendiente</Badge>
            <Badge variant="primary" leftIcon={<Star size={14} />}>Destacado</Badge>
          </div>
        </div>
      </div>
    </div>
  ),
};
