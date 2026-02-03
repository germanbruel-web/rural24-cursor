# Documento del Proyecto Rural24

## 1) ¿Qué hace el proyecto?
Rural24 es una plataforma de clasificados agropecuarios que permite:
- Publicar avisos con **formularios dinámicos** por categoría/subcategoría.
- Buscar avisos con filtros, categorías, subcategorías y atributos.
- Gestionar banners y avisos destacados desde un **panel admin**.
- Subir y optimizar imágenes con validación previa.

El objetivo es reemplazar el MVP anterior (Agrobuscador) con una versión escalable y preparada para monetización.

---

## 2) UX/UI (Experiencia y Diseño)
**Principios UX observados en el proyecto:**
- **Flujo guiado de publicación:** pasos claros (categoría → atributos → ubicación → fotos → info → revisión).
- **Atributos dinámicos:** el formulario se adapta a cada subcategoría para evitar campos irrelevantes.
- **Mensajes claros y accionables:** errores explicativos (p. ej. conexión, validaciones, imágenes).
- **Componentes consistentes:** Design System propio (tipografías, colores, spacing, estados).
- **Accesibilidad básica:** labels, estados de error, focus visibles.

**UI clave:**
- **Cards de avisos** con información esencial y badges.
- **Filtros compactos** en resultados (links apilados ultra-compactos).
- **Toggle/checkbox** para booleanos y opciones simples.

---

## 3) Arquitectura
### 3.1 Frontend
- **React + Vite** (SPA)
- **Tailwind CSS** para estilos
- **Design System** con componentes reutilizables
- **Rutas por hash** (en parte del proyecto)
- **Servicios de API** centralizados + adapters

### 3.2 Backend
- **Next.js API (App Router)** para endpoints REST
- **Supabase (PostgreSQL)** como base de datos
- **RLS** para seguridad y control de acceso
- **Cloudinary** para gestión y optimización de imágenes

### 3.3 Integraciones
- **Pagos**: preparación para Mercado Pago (migraciones y servicios v2 presentes)
- **Banners y destacados**: endpoints y colas de prioridad
- **Feature flags** para migración gradual y fallback

---

## 4) Estrategia comercial (modelo de negocio)
**Modelo central:** marketplace de clasificados agropecuarios.

**Líneas de monetización previstas/implementadas en el repo:**
1. **Planes premium** (particular/empresa) para mayor visibilidad y acceso a funciones.
2. **Avisos destacados** (featured ads) con prioridad en listados.
3. **Banners publicitarios** por categoría o sección.
4. **Pagos online** (integración prevista con Mercado Pago).

**Estrategia de crecimiento:**
- Migración del MVP existente con mejoras técnicas.
- Mejoras UX para aumentar conversión de publicación.
- Escalabilidad en backend + seguridad (RLS + validaciones).

---

## 5) Estado actual (resumen)
- ✅ Formularios dinámicos funcionando con soporte boolean/checkbox.
- ✅ Endpoints de configuración y búsqueda operativos.
- ✅ Flujo de publicación estable.
- ⏳ Pendientes inmediatos: completar atributos dinámicos para “Inmuebles Rurales”.
- ⏳ Refactor futuro: unificar 3 componentes de campos dinámicos.

---

## 6) Siguientes pasos recomendados
1. **Completar atributos dinámicos** para subcategorías de Inmuebles Rurales.
2. **Unificar render de campos dinámicos** (reducir duplicidad de componentes).
3. **Verificar flujos de pagos** y features premium.
4. **Consolidar documentación técnica actual** (README vs implementación real).

---

Documento generado para uso interno (Enero 2026).