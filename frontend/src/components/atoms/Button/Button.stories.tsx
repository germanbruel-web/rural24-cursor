/**
 * Storybook Stories - Button Component
 * Documentación interactiva del componente Button
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Save, Trash2, Download, Send, ArrowRight, Plus } from 'lucide-react';

/**
 * Metadatos de Storybook
 */
const meta = {
  title: 'Design System/Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Button Component

Componente de botón flexible y accesible construido con:
- **CVA (Class Variance Authority)** para gestión de variantes
- **Tailwind CSS** para estilos
- **TypeScript** para type safety
- **Accesibilidad WCAG 2.1 AA**

## Características

- ✅ 7 variantes: primary, secondary, outline, ghost, danger, success, link
- ✅ 5 tamaños: sm, md, lg, xl, icon
- ✅ Estados: normal, hover, active, disabled, loading
- ✅ Soporte para iconos izquierda/derecha
- ✅ Full width opcional
- ✅ Accesibilidad completa con ARIA

## Uso

\`\`\`tsx
import { Button } from '@/components/atoms/Button';

<Button variant="primary" size="md">
  Click me
</Button>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'link'],
      description: 'Variante visual del botón',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'icon'],
      description: 'Tamaño del botón',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'md' },
      },
    },
    loading: {
      control: 'boolean',
      description: 'Estado de carga (muestra spinner)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Deshabilita el botón',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    fullWidth: {
      control: 'boolean',
      description: 'Ancho completo (100%)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    children: {
      control: 'text',
      description: 'Contenido del botón',
    },
    onClick: {
      action: 'clicked',
      description: 'Evento click del botón',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Botón primario por defecto
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Botón Primario',
  },
};

/**
 * Botón secundario
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Botón Secundario',
  },
};

/**
 * Botón outline (borde)
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Botón Outline',
  },
};

/**
 * Botón ghost (transparente)
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Botón Ghost',
  },
};

/**
 * Botón de peligro/eliminación
 */
export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Eliminar',
    leftIcon: <Trash2 size={16} />,
  },
};

/**
 * Botón de éxito
 */
export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Guardar',
    leftIcon: <Save size={16} />,
  },
};

/**
 * Botón como link
 */
export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Ver más detalles',
  },
};

/**
 * Tamaño pequeño
 */
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Botón Pequeño',
  },
};

/**
 * Tamaño mediano (default)
 */
export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Botón Mediano',
  },
};

/**
 * Tamaño grande
 */
export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Botón Grande',
  },
};

/**
 * Tamaño extra grande
 */
export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    children: 'Botón Extra Grande',
  },
};

/**
 * Botón solo icono
 */
export const IconOnly: Story = {
  args: {
    size: 'icon',
    children: <Plus size={20} />,
    'aria-label': 'Agregar elemento',
  },
};

/**
 * Botón con estado de carga
 */
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Guardando...',
  },
};

/**
 * Botón deshabilitado
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Botón Deshabilitado',
  },
};

/**
 * Botón con ancho completo
 */
export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: 'Botón Ancho Completo',
  },
  parameters: {
    layout: 'padded',
  },
};

/**
 * Botón con icono izquierdo
 */
export const WithLeftIcon: Story = {
  args: {
    leftIcon: <Download size={16} />,
    children: 'Descargar Archivo',
  },
};

/**
 * Botón con icono derecho
 */
export const WithRightIcon: Story = {
  args: {
    rightIcon: <ArrowRight size={16} />,
    children: 'Continuar',
  },
};

/**
 * Botón con ambos iconos
 */
export const WithBothIcons: Story = {
  args: {
    leftIcon: <Send size={16} />,
    rightIcon: <ArrowRight size={16} />,
    children: 'Enviar Mensaje',
  },
};

/**
 * Ejemplo de todas las variantes juntas
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 flex-wrap">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="success">Success</Button>
        <Button variant="link">Link</Button>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * Ejemplo de todos los tamaños juntos
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
      <Button size="icon">
        <Plus size={20} />
      </Button>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * Ejemplo de estados interactivos
 */
export const InteractiveStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button>Normal</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div className="flex gap-2">
        <Button variant="danger">Normal</Button>
        <Button variant="danger" loading>Loading</Button>
        <Button variant="danger" disabled>Disabled</Button>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * Ejemplo práctico: Formulario de contacto
 */
export const FormExample: Story = {
  render: () => (
    <div className="w-96 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Contactar Vendedor</h2>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Tu nombre"
          className="w-full px-4 py-2 border rounded-lg"
        />
        <input
          type="email"
          placeholder="Tu email"
          className="w-full px-4 py-2 border rounded-lg"
        />
        <textarea
          placeholder="Mensaje"
          className="w-full px-4 py-2 border rounded-lg"
          rows={4}
        />
        <div className="flex gap-2">
          <Button variant="ghost" fullWidth>
            Cancelar
          </Button>
          <Button variant="primary" fullWidth leftIcon={<Send size={16} />}>
            Enviar Mensaje
          </Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'centered',
  },
};
