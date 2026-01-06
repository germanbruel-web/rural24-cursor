# Backup - 6 de Enero 2026
## Sistema de Contactos con Límites + Página de Planes

### 🎯 Trabajo Completado Hoy

#### 1. **Fix de Imágenes en Resultados de Búsqueda**
- **Archivo**: `getProducts.ts`
- **Problema**: N+1 queries haciendo consultas individuales por cada categoría
- **Solución**: Query simple `SELECT *` + transformación con `transformAdToProduct()`
- **Resultado**: Imágenes cargando correctamente, eliminadas ~50-100 queries extras

#### 2. **Optimización del Formulario de Contacto (Mobile-First)**
- **Archivo**: `AdDetailPage.tsx`
- **Cambios**:
  - Removida condición de "mensaje fuente externa"
  - Formulario compacto para usuarios autenticados
  - Banner verde manzana pastel con CheckCircleIcon (Heroicons)
  - Muestra: Nombre Apellido · Teléfono en una línea
  - Reducción del 60% en altura del formulario (mobile)
  - Solo muestra campos de input para usuarios NO autenticados

#### 3. **Sistema de Validación Dual de Límites de Contacto**
- **Archivo**: `contactService.ts`
- **Implementación**:
  - ✅ Validación de límites del EMISOR (sender)
  - ✅ Validación de límites del RECEPTOR (receiver)
  - Códigos de error específicos: `SENDER_LIMIT_REACHED` vs `RECEIVER_LIMIT_REACHED`
  - Mensajes diferenciados en UI
  - Cache limpio para ambos usuarios después del contacto
- **Arquitectura**: 
  ```
  getUserContactLimits(userId) → { canSendMore, canReceiveMore }
  sendContactMessage() → Valida sender → Valida receiver → Insert
  ```

#### 4. **Página de Planes/Pricing (Nueva)**
- **Archivo**: `PricingPage.tsx` (441 líneas, nuevo componente)
- **Características**:
  - 4 planes: Free ($0), Starter ($5), Pro ($10), Empresa ($50+)
  - Métricas destacadas:
    * Avisos activos: 1, 5, 10, Ilimitados
    * Contactos enviados/día: 5, 20, 50, Ilimitados
    * Contactos recibidos/día: 5, 20, 50, Ilimitados
    * Catálogo empresarial (solo Empresa)
    * Banners (Pro: estándar, Empresa: custom)
  - Badge "Más Popular" en plan Pro
  - FAQ con 4 preguntas comunes
  - Integración con AuthModal
  - Diseño SaaS profesional con Tailwind CSS

#### 5. **Integración de Routing y Navegación**
- **Archivos**: `App.tsx`, `Header.tsx`
- **Cambios**:
  - Agregado `'pricing'` al tipo `Page`
  - Ruta funcional: `#/pricing` y `#/planes`
  - Botón "Ver Planes" en Header (entre "¿Cómo funciona?" y "Publicar Aviso")
  - Hash mapping para navegación persistente

### 📊 Métricas del Cambio

| Archivo | Líneas | Cambios Principales |
|---------|--------|---------------------|
| getProducts.ts | 91 | Query optimization, eliminado N+1 |
| AdDetailPage.tsx | 1006 | Formulario compacto mobile-first, iconos Heroicons |
| contactService.ts | 378 | Dual validation (sender + receiver) |
| PricingPage.tsx | 441 | **NUEVO** - Página completa de planes |
| App.tsx | 662 | Routing para pricing |
| Header.tsx | 323 | Link navegación "Ver Planes" |

### 🎨 Diseño UI/UX

**Formulario de Contacto (Usuario Autenticado)**:
```
┌─────────────────────────────────────┐
│ ✓ Enviando como                     │
│ Juan Pérez · +54 11 1234-5678      │
│ juan@email.com                      │
└─────────────────────────────────────┘
│ Mensaje...                          │
└─────────────────────────────────────┘
```

**Antes**: 4 campos readonly (200px) → **Ahora**: Banner compacto (80px) = **-60% espacio**

### 🔐 Sistema de Límites

**Flujo de Validación**:
1. Usuario hace clic en "Contactar al Vendedor"
2. Si no está autenticado → AuthModal
3. Si autenticado → Valida límites del emisor
4. Si emisor OK → Valida límites del receptor
5. Si receptor OK → Envía mensaje
6. Limpia cache de ambos usuarios

**Errores Diferenciados**:
- `SENDER_LIMIT_REACHED`: "Actualiza a Premium para más contactos"
- `RECEIVER_LIMIT_REACHED`: "El vendedor alcanzó su límite. Intenta más tarde"

### 🚀 Próximos Pasos

- [ ] Integrar pasarela de pagos (Stripe/MercadoPago)
- [ ] Webhook para actualizar subscription_plans
- [ ] Generar facturas automáticas
- [ ] Analytics de conversión en pricing page
- [ ] Tests E2E del flujo completo

### 📝 Notas Técnicas

**Stack**:
- Frontend: Vite + React 19 + TypeScript
- Estilos: Tailwind CSS
- Iconos: Heroicons (outline) + Lucide React
- Base de datos: Supabase PostgreSQL
- Routing: Hash-based (#/pricing)

**Compatibilidad**: Mobile-first, responsive desde 320px

---

**Autor**: GitHub Copilot  
**Fecha**: 6 de Enero, 2026  
**Versión**: v1.0 - Contact Limits + Pricing Page
