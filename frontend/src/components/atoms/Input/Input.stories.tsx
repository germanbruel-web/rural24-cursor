import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { Label } from '../Label/Label';
import { Mail, Lock, Search, User, Phone, Calendar, DollarSign, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente de entrada de texto flexible con múltiples variantes, estados y validación integrada.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['outlined', 'filled', 'ghost'],
      description: 'Variante visual del input',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Tamaño del input',
    },
    status: {
      control: 'select',
      options: ['default', 'error', 'success'],
      description: 'Estado visual del input',
    },
    disabled: {
      control: 'boolean',
      description: 'Deshabilitar input',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

// ==================== BÁSICOS ====================

export const Default: Story = {
  args: {
    placeholder: 'Ingresá tu texto...',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="tu@email.com" />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="name" required>
        Nombre completo
      </Label>
      <Input id="name" placeholder="Juan Pérez" />
    </div>
  ),
};

// ==================== VARIANTES ====================

export const Variants: Story = {
  render: () => (
    <div className="w-80 space-y-6">
      <div className="space-y-2">
        <Label>Outlined (default)</Label>
        <Input variant="outlined" placeholder="Outlined input" />
      </div>
      <div className="space-y-2">
        <Label>Filled</Label>
        <Input variant="filled" placeholder="Filled input" />
      </div>
      <div className="space-y-2">
        <Label>Ghost</Label>
        <Input variant="ghost" placeholder="Ghost input" />
      </div>
    </div>
  ),
};

// ==================== TAMAÑOS ====================

export const Sizes: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Input size="sm" placeholder="Small input" />
      <Input size="md" placeholder="Medium input (default)" />
      <Input size="lg" placeholder="Large input" />
    </div>
  ),
};

// ==================== CON ICONOS ====================

export const WithLeftIcon: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Input leftIcon={<Mail size={18} />} placeholder="Email" type="email" />
      <Input leftIcon={<User size={18} />} placeholder="Usuario" />
      <Input leftIcon={<Search size={18} />} placeholder="Buscar..." />
    </div>
  ),
};

export const WithRightIcon: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Input rightIcon={<Calendar size={18} />} placeholder="Fecha" type="date" />
      <Input rightIcon={<DollarSign size={18} />} placeholder="Precio" type="number" />
    </div>
  ),
};

export const WithBothIcons: Story = {
  render: () => (
    <div className="w-80">
      <Input
        leftIcon={<Search size={18} />}
        rightIcon={<Calendar size={18} />}
        placeholder="Buscar por fecha..."
      />
    </div>
  ),
};

// ==================== ESTADOS DE VALIDACIÓN ====================

export const WithError: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="email-error" required>
        Email
      </Label>
      <Input
        id="email-error"
        type="email"
        placeholder="tu@email.com"
        error="Email inválido. Por favor revisá el formato."
        defaultValue="email-invalido"
      />
    </div>
  ),
};

export const WithSuccess: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="email-success">Email</Label>
      <Input
        id="email-success"
        type="email"
        placeholder="tu@email.com"
        success="Email verificado correctamente ✓"
        defaultValue="usuario@email.com"
      />
    </div>
  ),
};

export const WithHelperText: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="password">Contraseña</Label>
      <Input
        id="password"
        type="password"
        placeholder="••••••••"
        helperText="Mínimo 8 caracteres, incluir mayúsculas y números"
      />
    </div>
  ),
};

// ==================== TIPOS DE INPUT ====================

export const InputTypes: Story = {
  render: () => (
    <div className="w-80 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="text">Texto</Label>
        <Input id="text" type="text" placeholder="Texto normal" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email-type">Email</Label>
        <Input id="email-type" type="email" leftIcon={<Mail size={18} />} placeholder="tu@email.com" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password-type">Password</Label>
        <Input id="password-type" type="password" leftIcon={<Lock size={18} />} placeholder="••••••••" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="tel">Teléfono</Label>
        <Input id="tel" type="tel" leftIcon={<Phone size={18} />} placeholder="+54 9 11 1234-5678" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="number">Número</Label>
        <Input id="number" type="number" placeholder="1234" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="date">Fecha</Label>
        <Input id="date" type="date" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="search">Búsqueda</Label>
        <Input id="search" type="search" leftIcon={<Search size={18} />} placeholder="Buscar..." />
      </div>
    </div>
  ),
};

// ==================== ESTADOS ====================

export const Disabled: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <div className="space-y-2">
        <Label disabled>Input deshabilitado</Label>
        <Input disabled placeholder="No podés escribir aquí" />
      </div>
      
      <div className="space-y-2">
        <Label disabled>Con valor</Label>
        <Input disabled defaultValue="Valor bloqueado" />
      </div>
    </div>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label>Solo lectura</Label>
      <Input readOnly defaultValue="Este campo es solo de lectura" />
    </div>
  ),
};

// ==================== CASOS DE USO REALES ====================

export const LoginForm: Story = {
  render: () => (
    <div className="w-96 space-y-6 p-6 bg-white dark:bg-neutral-800 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Iniciar Sesión</h2>
      
      <div className="space-y-2">
        <Label htmlFor="login-email" required>
          Email
        </Label>
        <Input
          id="login-email"
          type="email"
          leftIcon={<Mail size={18} />}
          placeholder="tu@email.com"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="login-password" required>
          Contraseña
        </Label>
        <Input
          id="login-password"
          type="password"
          leftIcon={<Lock size={18} />}
          placeholder="••••••••"
        />
      </div>
    </div>
  ),
};

export const SearchBar: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <Input
        size="lg"
        variant="filled"
        leftIcon={<Search size={20} />}
        placeholder="Buscar productos, categorías o vendedores..."
      />
    </div>
  ),
};

export const PasswordToggle: Story = {
  render: () => {
    const [showPassword, setShowPassword] = useState(false);
    
    return (
      <div className="w-80 space-y-2">
        <Label htmlFor="password-toggle" required>
          Contraseña
        </Label>
        <div className="relative">
          <Input
            id="password-toggle"
            type={showPassword ? 'text' : 'password'}
            leftIcon={<Lock size={18} />}
            placeholder="••••••••"
            helperText="Mínimo 8 caracteres"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
    );
  },
};

export const ValidationFlow: Story = {
  render: () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const validateEmail = (value: string) => {
      setEmail(value);
      
      if (!value) {
        setError('');
        setSuccess('');
        return;
      }
      
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      
      if (isValid) {
        setError('');
        setSuccess('Email válido ✓');
      } else {
        setSuccess('');
        setError('Por favor ingresá un email válido');
      }
    };
    
    return (
      <div className="w-80 space-y-2">
        <Label htmlFor="email-validation" required>
          Email
        </Label>
        <Input
          id="email-validation"
          type="email"
          leftIcon={<Mail size={18} />}
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => validateEmail(e.target.value)}
          error={error}
          success={success}
        />
      </div>
    );
  },
};

// ==================== DARK MODE ====================

export const DarkMode: Story = {
  render: () => (
    <div className="dark">
      <div className="bg-neutral-900 p-8 rounded-xl space-y-6">
        <div className="space-y-2">
          <Label>Input en Dark Mode</Label>
          <Input placeholder="Probá escribir..." />
        </div>
        
        <div className="space-y-2">
          <Label required>Con error</Label>
          <Input
            leftIcon={<Mail size={18} />}
            error="Este campo es requerido"
            placeholder="Email"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Con éxito</Label>
          <Input
            leftIcon={<User size={18} />}
            success="Usuario disponible"
            defaultValue="usuario123"
          />
        </div>
      </div>
    </div>
  ),
};
