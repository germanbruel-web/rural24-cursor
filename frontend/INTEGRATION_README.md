# Frontend Integration - BFF Backend

## ✅ Integración Completada

### 📦 Nuevos Servicios API

Creados en `src/services/api/`:

- **client.ts** - Cliente HTTP base con manejo de errores
- **categories.ts** - Obtener categorías y subcategorías
- **catalog.ts** - Marcas, modelos y configuración de formularios
- **ads.ts** - CRUD completo de anuncios
- **uploads.ts** - Upload de imágenes a Cloudinary
- **index.ts** - Exportación barrel

### 🎣 React Hooks

Creados en `src/hooks/`:

- **useCategories.ts** - `useCategories()`, `useCategory(slug)`, `useSubcategory()`
- **useCatalog.ts** - Ya existía (mantener o migrar)
- **useAds.ts** - `useAds(filters)`, `useAd(id)`, `useCreateAd()`
- **useImageUpload.ts** - `useImageUpload(folder)`

### ⚙️ Configuración

**`.env.local` actualizado:**
```env
VITE_API_URL=http://localhost:3000
VITE_CLOUDINARY_CLOUD_NAME=dosjgdcxr
VITE_CLOUDINARY_UPLOAD_PRESET=rural24_unsigned
```

### 📝 Ejemplo de Uso

Ver: `src/examples/CreateAdExample.tsx`

**Flujo completo:**
1. Seleccionar categoría → subcategoría
2. Si tiene `requires_brand` → mostrar marcas
3. Si tiene `requires_model` → mostrar modelos
4. Renderizar campos dinámicos desde `formConfig`
5. Upload de imágenes → Cloudinary
6. Crear anuncio con validación backend

### 🚀 Próximos Pasos

1. **Migrar componentes existentes** a usar los nuevos servicios
2. **Eliminar llamadas directas a Supabase** del frontend
3. **Implementar listado de anuncios** con filtros
4. **Agregar autenticación** (JWT/Session)
5. **Testing** de integración

### 🔗 Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/config/categories` | Categorías jerárquicas |
| GET | `/api/catalog/brands?subcategory_id=xxx` | Marcas por subcategoría |
| GET | `/api/catalog/models?brand_id=xxx` | Modelos por marca |
| GET | `/api/catalog/form-config?subcategory_id=xxx` | Config completa formulario |
| POST | `/api/ads` | Crear anuncio |
| GET | `/api/ads?filters` | Listar anuncios |
| POST | `/api/uploads/signed-url` | Obtener firma Cloudinary |

### 📌 Ventajas del BFF

- ✅ Frontend solo habla con el backend
- ✅ Validación centralizada
- ✅ Seguridad (service_role key oculta)
- ✅ Type-safety con TypeScript
- ✅ Error handling consistente
- ✅ Fácil testing
