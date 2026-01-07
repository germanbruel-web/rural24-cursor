import type { Meta, StoryObj } from '@storybook/react';
import { FormField } from './FormField';
import { Mail, Lock, User, Phone, Calendar, DollarSign } from 'lucide-react';
import { useState } from 'react';

const meta: Meta<typeof FormField> = {
  title: 'Molecules/FormField',
  component: FormField,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Molécula que combina Label + Input para formularios consistentes. Maneja validación y estados automáticamente.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FormField>;

// ==================== BÁSICOS ====================

export const Default: Story = {
  args: {
    label: 'Email',
    placeholder: 'tu@email.com',
    type: 'email',
  },
};

export const Required: Story = {
  args: {
    label: 'Nombre completo',
    placeholder: 'Juan Pérez',
    required: true,
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Contraseña',
    description: 'Mínimo 8 caracteres, incluir mayúsculas y números',
    type: 'password',
    placeholder: '••••••••',
    required: true,
  },
};

// ==================== CON ICONOS ====================

export const WithIcons: Story = {
  render: () => (
    <div className="w-80 space-y-6">
      <FormField
        label="Email"
        leftIcon={<Mail size={18} />}
        type="email"
        placeholder="tu@email.com"
        required
      />
      
      <FormField
        label="Contraseña"
        leftIcon={<Lock size={18} />}
        type="password"
        placeholder="••••••••"
        required
      />
      
      <FormField
        label="Usuario"
        leftIcon={<User size={18} />}
        placeholder="nombre_usuario"
      />
    </div>
  ),
};

// ==================== VALIDACIÓN ====================

export const WithValidation: Story = {
  render: () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    
    const validateEmail = (value: string) => {
      setEmail(value);
      if (!value) {
        setError('');
        return;
      }
      
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      setError(isValid ? '' : 'Formato de email inválido');
    };
    
    return (
      <div className="w-80">
        <FormField
          label="Email"
          leftIcon={<Mail size={18} />}
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => validateEmail(e.target.value)}
          error={error}
          required
        />
      </div>
    );
  },
};

export const WithSuccess: Story = {
  args: {
    label: 'Usuario',
    leftIcon: <User size={18} />,
    placeholder: 'nombre_usuario',
    defaultValue: 'juan_perez',
    success: 'Usuario disponible ✓',
  },
};

export const WithError: Story = {
  args: {
    label: 'Teléfono',
    leftIcon: <Phone size={18} />,
    placeholder: '+54 9 11 1234-5678',
    error: 'Formato de teléfono inválido',
    required: true,
  },
};

// ==================== FORMULARIO COMPLETO ====================

export const LoginForm: Story = {
  render: () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({ email: '', password: '' });
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const newErrors = {
        email: !formData.email ? 'Email es requerido' : '',
        password: !formData.password ? 'Contraseña es requerida' : '',
      };
      
      setErrors(newErrors);
      
      if (!newErrors.email && !newErrors.password) {
        alert('Formulario válido!');
      }
    };
    
    return (
      <div className="w-96 p-8 bg-white dark:bg-neutral-800 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Iniciar Sesión</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="Email"
            leftIcon={<Mail size={18} />}
            type="email"
            placeholder="tu@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            required
          />
          
          <FormField
            label="Contraseña"
            leftIcon={<Lock size={18} />}
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            required
          />
          
          <button
            type="submit"
            className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors"
          >
            Ingresar
          </button>
        </form>
      </div>
    );
  },
};

export const RegistrationForm: Story = {
  render: () => (
    <div className="w-full max-w-2xl p-8 bg-white dark:bg-neutral-800 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Crear Cuenta</h2>
      
      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Nombre"
            leftIcon={<User size={18} />}
            placeholder="Juan"
            required
          />
          
          <FormField
            label="Apellido"
            leftIcon={<User size={18} />}
            placeholder="Pérez"
            required
          />
        </div>
        
        <FormField
          label="Email"
          leftIcon={<Mail size={18} />}
          type="email"
          placeholder="tu@email.com"
          description="Te enviaremos un email de confirmación"
          required
        />
        
        <FormField
          label="Teléfono"
          leftIcon={<Phone size={18} />}
          type="tel"
          placeholder="+54 9 11 1234-5678"
        />
        
        <FormField
          label="Contraseña"
          leftIcon={<Lock size={18} />}
          type="password"
          placeholder="••••••••"
          description="Mínimo 8 caracteres, incluir mayúsculas y números"
          required
        />
        
        <button
          type="submit"
          className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors"
        >
          Crear Cuenta
        </button>
      </form>
    </div>
  ),
};

export const ProductForm: Story = {
  render: () => (
    <div className="w-full max-w-3xl p-8 bg-white dark:bg-neutral-800 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Publicar Aviso</h2>
      
      <form className="space-y-6">
        <FormField
          label="Título del aviso"
          placeholder="Ej: Tractor John Deere 7230R"
          description="Máximo 100 caracteres"
          required
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Precio"
            leftIcon={<DollarSign size={18} />}
            type="number"
            placeholder="185000"
            required
          />
          
          <FormField
            label="Año"
            leftIcon={<Calendar size={18} />}
            type="number"
            placeholder="2020"
            required
          />
        </div>
        
        <FormField
          label="Ubicación"
          placeholder="Ciudad, Provincia"
          required
        />
        
        <div>
          <label className="block text-base font-medium text-neutral-700 dark:text-neutral-200 mb-2">
            Descripción <span className="text-danger-500">*</span>
          </label>
          <textarea
            className="w-full h-32 px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            placeholder="Describí las características principales..."
          />
        </div>
        
        <div className="flex gap-4">
          <button
            type="button"
            className="flex-1 h-11 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-medium rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
          >
            Guardar Borrador
          </button>
          <button
            type="submit"
            className="flex-1 h-11 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors"
          >
            Publicar Aviso
          </button>
        </div>
      </form>
    </div>
  ),
};

// ==================== DARK MODE ====================

export const DarkMode: Story = {
  render: () => (
    <div className="dark">
      <div className="bg-neutral-900 p-8 rounded-xl w-96 space-y-6">
        <FormField
          label="Email"
          leftIcon={<Mail size={18} />}
          type="email"
          placeholder="tu@email.com"
          required
        />
        
        <FormField
          label="Contraseña"
          leftIcon={<Lock size={18} />}
          type="password"
          placeholder="••••••••"
          description="Mínimo 8 caracteres"
          required
        />
        
        <FormField
          label="Usuario disponible"
          leftIcon={<User size={18} />}
          defaultValue="juan_perez"
          success="Usuario disponible ✓"
        />
        
        <FormField
          label="Email inválido"
          leftIcon={<Mail size={18} />}
          defaultValue="email-invalido"
          error="Formato de email incorrecto"
        />
      </div>
    </div>
  ),
};
