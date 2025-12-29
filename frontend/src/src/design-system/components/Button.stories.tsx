// ====================================================================
// BUTTON STORIES - Visual testing & documentation
// ====================================================================

import type { Meta, StoryObj } from '@storybook/react';
import { Plus, Download, Trash2 } from 'lucide-react';
import { Button } from './Button';

const meta = {
  title: 'Design System/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    fullWidth: {
      control: 'boolean',
    },
    loading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// ====================================================================
// STORIES
// ====================================================================

export const Primary: Story = {
  args: {
    children: 'Crear Aviso',
    variant: 'primary',
    size: 'md',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Ver Detalles',
    variant: 'secondary',
    size: 'md',
  },
};

export const Outline: Story = {
  args: {
    children: 'Cancelar',
    variant: 'outline',
    size: 'md',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Editar',
    variant: 'ghost',
    size: 'md',
  },
};

export const Danger: Story = {
  args: {
    children: 'Eliminar',
    variant: 'danger',
    size: 'md',
  },
};

export const WithLeftIcon: Story = {
  args: {
    children: 'Crear Nuevo',
    variant: 'primary',
    leftIcon: <Plus className="w-5 h-5" />,
  },
};

export const WithRightIcon: Story = {
  args: {
    children: 'Descargar',
    variant: 'secondary',
    rightIcon: <Download className="w-5 h-5" />,
  },
};

export const Loading: Story = {
  args: {
    children: 'Guardando...',
    variant: 'primary',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'No Disponible',
    variant: 'primary',
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    children: 'Publicar Aviso',
    variant: 'primary',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

export const SmallSize: Story = {
  args: {
    children: 'Ver más',
    variant: 'outline',
    size: 'sm',
  },
};

export const LargeSize: Story = {
  args: {
    children: 'Publicar',
    variant: 'primary',
    size: 'lg',
    leftIcon: <Plus className="w-6 h-6" />,
  },
};

// ====================================================================
// SHOWCASE - Todas las variantes
// ====================================================================

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </div>
      
      <div className="flex gap-3 flex-wrap items-center">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
      
      <div className="flex gap-3 flex-wrap">
        <Button leftIcon={<Plus className="w-5 h-5" />}>Con Icono</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
      </div>
    </div>
  ),
};

// ====================================================================
// MOBILE TEST - Para Chromatic
// ====================================================================

export const MobileView: Story = {
  args: {
    children: 'Acción Mobile',
    variant: 'primary',
    fullWidth: true,
    size: 'lg',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
};
