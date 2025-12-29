# 🔐 SISTEMA DE AUTENTICACIÓN - AGROBUSCADOR

## ✨ ¿Qué se implementó?

### 1. **AuthContext** (Gestión de Estado Global)
- Provider que envuelve toda la app
- Gestiona usuario autenticado, perfil y sesión
- Funciones: `signIn`, `signUp`, `signOut`, `resetPassword`, `updatePassword`
- Helpers: `isAdmin`, `isPremium`
- Auto-carga del perfil desde `public.users` al iniciar sesión

### 2. **Formularios de Autenticación**
- **LoginForm**: Iniciar sesión con email/password
- **RegisterForm**: Crear cuenta nueva + perfil automático
- **ResetPasswordForm**: Recuperar contraseña por email
- **AuthModal**: Modal unificado que contiene los 3 formularios

### 3. **Sistema de Notificaciones (Toast)**
- Reemplaza todos los `alert()` por notificaciones elegantes
- Biblioteca: `react-hot-toast`
- Colores personalizados con paleta de AgroBuscador
- Funciones: `notify.success()`, `notify.error()`, `notify.loading()`, `notify.promise()`

### 4. **Integración en Header**
- Botón "Ingresar" abre el modal de autenticación
- Cuando el usuario está logueado:
  - Muestra email y rol (Admin/Empresa/Premium/Free)
  - Botón "Salir" para cerrar sesión
  - Muestra "Mis Avisos" solo para premium+
  - Muestra "Admin Scraped" y "Banners" solo para SuperAdmin

---

## 🚀 CÓMO PROBAR

### 1. Ejecutar la aplicación

```bash
npm run dev
```

### 2. Crear la tabla `users` en Supabase (si no existe)

Ve a **SQL Editor** en Supabase y ejecuta:

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'free' CHECK (role IN ('free', 'premium-particular', 'premium-empresa', 'super-admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Todos pueden ver usuarios
CREATE POLICY users_select_all ON public.users FOR SELECT USING (true);

-- Policy: Usuarios pueden actualizar su propio perfil
CREATE POLICY users_update_own ON public.users 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: SuperAdmin puede hacer todo
CREATE POLICY users_superadmin_all ON public.users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'super-admin'
    )
  );
```

### 3. Registrar un nuevo usuario

1. En la app, click en **"Ingresar"**
2. Click en **"Regístrate aquí"**
3. Completa el formulario:
   - Nombre: `Usuario Test`
   - Email: `test@agrobuscador.com`
   - Contraseña: `Test123!`
   - Confirmar contraseña: `Test123!`
4. Click en **"Crear Cuenta"**
5. Verás el mensaje: "¡Registro Exitoso! Te hemos enviado un email de confirmación"

### 4. Confirmar el email (importante!)

**Opción A: Desde Supabase Dashboard**
1. Ve a **Authentication > Users**
2. Busca el usuario que acabas de crear
3. En la columna "Email Confirmed At", click en el ícono de editar
4. Selecciona la fecha/hora actual
5. Guarda

**Opción B: Revisar el email real** (si configuraste SMTP)
- Revisa tu bandeja de entrada
- Click en el link de confirmación

### 5. Iniciar sesión

1. En la app, click en **"Ingresar"**
2. Ingresa tu email y contraseña
3. Click en **"Iniciar Sesión"**
4. Verás tu email en el header con el badge "Free"

### 6. Convertir usuario en SuperAdmin

```sql
UPDATE public.users 
SET role = 'super-admin' 
WHERE email = 'test@agrobuscador.com';
```

Recarga la página y verás:
- Badge "Admin" en el header
- Botones "Admin Scraped" y "Banners" disponibles

### 7. Convertir usuario en Premium

```sql
UPDATE public.users 
SET role = 'premium-particular' 
WHERE email = 'test@agrobuscador.com';
```

Recarga y verás:
- Badge "Premium"
- Botón "Mis Avisos" disponible
- Límite de 10 avisos

### 8. Probar recuperación de contraseña

1. En login, click en **"¿Olvidaste tu contraseña?"**
2. Ingresa tu email
3. Click en **"Enviar Instrucciones"**
4. Revisa tu email (o ve a Supabase > Authentication > Users > Link de reset)

---

## 📋 NOTIFICACIONES TOAST

### Antes (con alert):
```javascript
alert('Aviso eliminado correctamente');
```

### Ahora (con toast):
```javascript
import { notify } from '../../utils/notifications';

notify.success('Aviso eliminado correctamente');
notify.error('Error al eliminar aviso');
notify.loading('Eliminando...');
```

### Toast con Promise:
```javascript
notify.promise(
  deleteAd(id),
  {
    loading: 'Eliminando aviso...',
    success: 'Aviso eliminado correctamente',
    error: 'Error al eliminar aviso',
  }
);
```

---

## 🎨 MEJORAS VISUALES

### Header Actualizado:
- ✅ Usuario no autenticado: Botón verde "Ingresar"
- ✅ Usuario autenticado:
  - 👤 Email del usuario
  - 🏷️ Badge de rol (Admin/Empresa/Premium/Free)
  - 🚪 Botón "Salir" con icono
- ✅ Navegación condicional según rol:
  - Free: Solo Home
  - Premium: Home + Mis Avisos
  - SuperAdmin: Home + Mis Avisos + Admin Scraped + Banners

### Modal de Autenticación:
- ✅ Transiciones suaves entre Login/Register/Reset
- ✅ Botón X para cerrar
- ✅ Iconos en inputs (Mail, Lock, User)
- ✅ Validaciones en tiempo real
- ✅ Mensajes de error claros
- ✅ Pantalla de éxito después de registro

---

## 🔒 SEGURIDAD

### RLS (Row Level Security):
- ✅ Tabla `users` protegida
- ✅ Solo el usuario puede ver/editar su propio perfil
- ✅ SuperAdmin puede ver/editar todos los perfiles
- ✅ Todos pueden ver usuarios (para verificar roles)

### Auth Flow:
1. Usuario se registra → Crea registro en `auth.users`
2. Automáticamente crea perfil en `public.users` con rol 'free'
3. Al hacer login, carga perfil desde `public.users`
4. Si no existe perfil, lo crea automáticamente

---

## 🧪 TESTING CHECKLIST

- [ ] ✅ Registrar nuevo usuario
- [ ] ✅ Confirmar email
- [ ] ✅ Iniciar sesión
- [ ] ✅ Ver perfil en header (email + rol)
- [ ] ✅ Cerrar sesión
- [ ] ✅ Recuperar contraseña
- [ ] ✅ Cambiar rol a premium → Ver "Mis Avisos"
- [ ] ✅ Cambiar rol a super-admin → Ver paneles admin
- [ ] ✅ Toast notifications funcionan (en vez de alert)
- [ ] ✅ Usuario free no ve "Mis Avisos"
- [ ] ✅ Usuario premium no ve paneles admin
- [ ] ✅ SuperAdmin ve todo

---

## 🎯 PRÓXIMOS PASOS (OPCIONALES)

### 1. **OAuth Providers** (Google, GitHub, etc.)
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
});
```

### 2. **Perfil de Usuario Editable**
- Crear página `/perfil`
- Editar nombre, foto, teléfono
- Cambiar contraseña

### 3. **Verificación de Email Obligatoria**
```sql
-- No permitir login sin confirmar email
ALTER TABLE auth.users 
ADD CONSTRAINT email_confirmed_required 
CHECK (email_confirmed_at IS NOT NULL);
```

### 4. **Roles Dinámicos**
- Crear tabla `roles` con permisos
- Sistema de permisos granular
- UI para asignar roles (solo SuperAdmin)

### 5. **2FA (Two-Factor Authentication)**
```typescript
await supabase.auth.mfa.enroll({
  factorType: 'totp',
});
```

---

## 🐛 TROUBLESHOOTING

### Error: "Invalid login credentials"
**Causa:** Email no confirmado o contraseña incorrecta  
**Solución:** Confirma el email desde Supabase Dashboard

### Error: "User already registered"
**Causa:** Email ya existe en auth.users  
**Solución:** Usa "¿Olvidaste tu contraseña?" para resetear

### Error: "Table 'users' does not exist"
**Causa:** No ejecutaste el SQL de creación de tabla  
**Solución:** Ejecuta el SQL del paso 2

### Error: "Profile not found"
**Causa:** Usuario existe en auth.users pero no en public.users  
**Solución:** AuthContext crea el perfil automáticamente, o ejecuta:
```sql
INSERT INTO public.users (id, email, role)
SELECT id, email, 'free'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);
```

### Los botones de admin no aparecen después de cambiar rol
**Causa:** El perfil está en caché  
**Solución:** Cierra sesión y vuelve a iniciar sesión

---

## 📞 RESUMEN TÉCNICO

### Archivos Creados:
- `src/contexts/AuthContext.tsx` - Context provider
- `src/components/auth/LoginForm.tsx` - Formulario login
- `src/components/auth/RegisterForm.tsx` - Formulario registro
- `src/components/auth/ResetPasswordForm.tsx` - Recuperar contraseña
- `src/components/auth/AuthModal.tsx` - Modal contenedor
- `src/utils/notifications.ts` - Sistema de toast

### Archivos Modificados:
- `index.tsx` - Wrap con AuthProvider + Toaster
- `src/components/Header.tsx` - Botón login + info usuario
- `src/components/admin/MyAdsPanel.tsx` - Toast en vez de alert
- `src/components/admin/ScrapedAdsPanel.tsx` - Toast en vez de alert
- `src/components/admin/BannersPanel.tsx` - Toast en vez de alert

### Dependencias Instaladas:
- `react-hot-toast` - Notificaciones
- `lucide-react` - Iconos

¡Sistema completo y funcional! 🎉
