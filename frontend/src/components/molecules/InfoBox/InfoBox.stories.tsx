import type { Meta, StoryObj } from '@storybook/react';
import { InfoBox } from './InfoBox';
import { CheckCircle, AlertCircle, AlertTriangle, Info as InfoIcon, Camera } from 'lucide-react';

const meta = {
  title: 'Molecules/InfoBox',
  component: InfoBox,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Componente para mensajes informativos con iconos semánticos. Reemplaza emoticons por iconos Lucide escalables y consistentes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'error', 'warning', 'info'],
      description: 'Tipo de mensaje (define color e icono default)',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Tamaño del texto e icono',
    },
    icon: {
      control: false,
      description: 'Icono personalizado (opcional, usa default según variant)',
    },
    title: {
      control: 'text',
      description: 'Título opcional en bold',
    },
  },
} satisfies Meta<typeof InfoBox>;

export default meta;
type Story = StoryObj<typeof meta>;

// ====================================================================
// STORIES - VARIANTS
// ====================================================================
export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Aviso publicado',
    children: 'Tu aviso fue publicado exitosamente y ya está visible para todos los usuarios.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Error de validación',
    children: 'Debes subir al menos una imagen para continuar.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Atención',
    children: 'Las imágenes verticales no están permitidas. Gira tu celular horizontalmente.',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Información importante',
    children: 'Recuerda que no puedes incluir teléfonos, emails o sitios web en el título o descripción.',
  },
};

// ====================================================================
// STORIES - SIZES
// ====================================================================
export const Small: Story = {
  args: {
    variant: 'info',
    size: 'sm',
    children: 'Mensaje informativo pequeño para espacios reducidos.',
  },
};

export const Medium: Story = {
  args: {
    variant: 'info',
    size: 'md',
    children: 'Mensaje informativo de tamaño medio (default).',
  },
};

export const Large: Story = {
  args: {
    variant: 'info',
    size: 'lg',
    children: 'Mensaje informativo grande para destacar información importante.',
  },
};

// ====================================================================
// STORIES - CUSTOM ICON
// ====================================================================
export const CustomIcon: Story = {
  args: {
    variant: 'info',
    icon: Camera,
    title: 'Tips para fotos',
    children: 'Usa buena luz natural y muestra el producto completo.',
  },
};

// ====================================================================
// STORIES - NO TITLE
// ====================================================================
export const WithoutTitle: Story = {
  args: {
    variant: 'success',
    children: 'Mensaje sin título, ideal para notificaciones simples.',
  },
};

// ====================================================================
// STORIES - VALIDATION EXAMPLE
// ====================================================================
export const ValidationMessage: Story = {
  args: {
    variant: 'info',
    size: 'sm',
    children: (
      <>
        <strong>Permitido:</strong> Números y años.{' '}
        <strong>NO permitido:</strong> Teléfonos, emails y sitios web.
      </>
    ),
  },
};

// ====================================================================
// STORIES - PLAYGROUND
// ====================================================================
export const Playground: Story = {
  args: {
    variant: 'info',
    size: 'md',
    title: 'Título personalizable',
    children: 'Contenido del mensaje. Puedes usar JSX aquí.',
  },
};
