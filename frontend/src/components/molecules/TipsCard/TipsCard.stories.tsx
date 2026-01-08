import type { Meta, StoryObj } from '@storybook/react';
import { TipsCard } from './TipsCard';
import { Camera, Smartphone, Sun, Image as ImageIcon, Layers, Move, Hash } from 'lucide-react';

const meta = {
  title: 'Molecules/TipsCard',
  component: TipsCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Tarjeta para mostrar tips con bullets e iconos. Ideal para instrucciones paso a paso o recomendaciones.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'blue', 'green', 'yellow'],
      description: 'Color de la tarjeta',
    },
    icon: {
      control: false,
      description: 'Icono principal (default: Lightbulb)',
    },
    title: {
      control: 'text',
      description: 'Título de la tarjeta',
    },
  },
} satisfies Meta<typeof TipsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// ====================================================================
// STORY - PHOTO TIPS (Actual use case)
// ====================================================================
export const PhotoTips: Story = {
  args: {
    icon: Camera,
    title: 'Tips para mejores fotos',
    variant: 'blue',
    children: (
      <>
        <TipsCard.Item icon={Smartphone} strong>
          GIRA TU CELULAR HORIZONTALMENTE (modo paisaje)
        </TipsCard.Item>
        <TipsCard.Item icon={Sun}>
          Usá buena luz natural (evita fotos oscuras)
        </TipsCard.Item>
        <TipsCard.Item icon={ImageIcon}>
          Mostrá el producto completo y detalles importantes
        </TipsCard.Item>
        <TipsCard.Item icon={Layers}>
          La primera foto será la portada de tu aviso
        </TipsCard.Item>
        <TipsCard.Item icon={Move}>
          Podés arrastrar para reordenar las fotos
        </TipsCard.Item>
        <TipsCard.Item icon={Hash}>
          Máximo 8 fotos por aviso
        </TipsCard.Item>
      </>
    ),
  },
};

// ====================================================================
// STORY - SIMPLE TIPS
// ====================================================================
export const SimpleTips: Story = {
  args: {
    title: 'Consejos generales',
    variant: 'default',
    children: (
      <>
        <TipsCard.Item>Completá todos los campos requeridos</TipsCard.Item>
        <TipsCard.Item>Revisá la información antes de publicar</TipsCard.Item>
        <TipsCard.Item>Las fotos ayudan a vender más rápido</TipsCard.Item>
      </>
    ),
  },
};

// ====================================================================
// STORY - GREEN VARIANT
// ====================================================================
export const GreenTips: Story = {
  args: {
    title: 'Recomendaciones de seguridad',
    variant: 'green',
    children: (
      <>
        <TipsCard.Item strong>Verifica la identidad del comprador</TipsCard.Item>
        <TipsCard.Item>Usa métodos de pago seguros</TipsCard.Item>
        <TipsCard.Item>No compartas información personal sensible</TipsCard.Item>
      </>
    ),
  },
};

// ====================================================================
// STORY - YELLOW VARIANT
// ====================================================================
export const YellowTips: Story = {
  args: {
    title: 'Importante antes de publicar',
    variant: 'yellow',
    children: (
      <>
        <TipsCard.Item>No incluyas teléfonos en el título</TipsCard.Item>
        <TipsCard.Item>No incluyas emails en la descripción</TipsCard.Item>
        <TipsCard.Item>Evita sitios web o URLs</TipsCard.Item>
      </>
    ),
  },
};

// ====================================================================
// STORY - PLAYGROUND
// ====================================================================
export const Playground: Story = {
  args: {
    title: 'Título personalizable',
    variant: 'blue',
    children: (
      <>
        <TipsCard.Item>Item 1</TipsCard.Item>
        <TipsCard.Item strong>Item 2 en bold</TipsCard.Item>
        <TipsCard.Item>Item 3</TipsCard.Item>
      </>
    ),
  },
};
