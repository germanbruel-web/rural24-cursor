# 📦 Instalación del Design System

## Librerías Requeridas

Para que el componente Button y el Design System funcionen correctamente, ejecutá los siguientes comandos:

### 1️⃣ Dependencias Principales

```bash
# CVA (Class Variance Authority) - Gestión de variantes
npm install class-variance-authority

# Utilitarios para combinar clases de Tailwind
npm install clsx tailwind-merge

# Iconos (ya instalado en tu proyecto)
npm install lucide-react
```

### 2️⃣ Dependencias de Desarrollo (Storybook)

```bash
# Tipos de Storybook para React
npm install -D @storybook/react @storybook/addon-essentials @storybook/addon-interactions @storybook/addon-links @storybook/blocks @storybook/test

# Tipos de TypeScript (ya deberías tenerlos)
npm install -D @types/react @types/react-dom
```

---

## 🚀 Comando de Instalación Completo

Ejecutá este comando en la carpeta `frontend/`:

```bash
npm install class-variance-authority clsx tailwind-merge
```

---

## ✅ Verificación

Verificá que las dependencias se instalaron correctamente:

```bash
npm list class-variance-authority clsx tailwind-merge lucide-react
```

Deberías ver:

```
├── class-variance-authority@x.x.x
├── clsx@x.x.x
├── tailwind-merge@x.x.x
└── lucide-react@x.x.x
```

---

## 📋 Resumen de Dependencias

| Librería | Versión Recomendada | Propósito |
|----------|---------------------|-----------|
| `class-variance-authority` | `^0.7.0` | Gestión de variantes de componentes con tipos |
| `clsx` | `^2.1.0` | Construcción condicional de clases CSS |
| `tailwind-merge` | `^2.2.0` | Merge inteligente de clases Tailwind (evita conflictos) |
| `lucide-react` | `^0.553.0` | Biblioteca de iconos (ya instalada) |

---

## 🎯 Próximos Pasos

1. **Instalá las dependencias** con el comando anterior
2. **Iniciá Storybook**: `npm run storybook`
3. **Explorá el componente Button** en: `http://localhost:6006`
4. **Importá el Button** en tus componentes:

```tsx
import { Button } from '@/components/atoms';

function MyComponent() {
  return (
    <Button variant="primary" size="md">
      Click me
    </Button>
  );
}
```

---

## 🔧 Configuración Opcional

### Path Aliases en TypeScript

Si querés usar `@/components/atoms` en lugar de rutas relativas, asegurate de tener en `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Path Aliases en Vite

Y en `vite.config.ts`:

```typescript
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'class-variance-authority'"
**Solución**: Instalá la dependencia: `npm install class-variance-authority`

### Error: "Cannot find module '@/design-system/utils'"
**Solución**: Verificá que el archivo `src/design-system/utils.ts` exista y que tengas configurados los path aliases.

### Error en Storybook: "Module not found"
**Solución**: Reiniciá el servidor de Storybook: `npm run storybook`

---

## 📞 Soporte

Si tenés problemas con la instalación, verificá:
- ✅ Node.js >= 18
- ✅ npm >= 9
- ✅ Todas las dependencias instaladas
- ✅ Servidor de desarrollo reiniciado

---

**Última actualización**: Enero 2026
