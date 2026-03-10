# Sprint 7B — ProfileGate + Unificación Taxonomía
> Fecha: 2026-03-09 | Estado: ✅ COMPLETO

## Objetivo
Unificar subcategorías "Servicios" y "Empresas" en un solo concepto, e implementar un gate
bloqueante en PublicarAviso que obligue al usuario a tener perfil de empresa antes de publicar
en subcategorías tipo "Servicios".

## Decisiones de producto
- **Servicios = Empresas** → misma naturaleza. Subcategoría "Empresas" eliminada del wizard.
- **Gate BLOQUEANTE** → sin empresa creada en Rural24, no se puede publicar en Servicios.
- **Vinculación OPCIONAL** → una vez pasado el gate, EmpresaSelectorWidget no es obligatorio.
- **Datos existentes** → avisos en subcategoría "Empresas" migrados a "Servicios" de la misma categoría.

## Taxonomía final

| Subcategoría | Tipo    | Gate        | ad_type      |
|---|---|---|---|
| Hacienda     | PRODUCTO | ninguno     | 'particular' |
| Insumos      | PRODUCTO | ninguno     | 'particular' |
| Maquinarias  | PRODUCTO | ninguno     | 'particular' |
| Servicios    | EMPRESA  | BLOQUEANTE  | 'company'    |
| ~~Empresas~~ | (unificada con Servicios, is_active=false) | - | - |

## Archivos

### Nuevos
- `supabase/migrations/20260309000007_sprint7b_unify_taxonomy.sql` — migración DB ✅ aplicada DEV
- `frontend/src/components/dashboard/ProfileGate.tsx` — gate bloqueante nuevo

### Modificados
- `frontend/src/components/pages/PublicarAviso.tsx`
  - `isEmpresa` → `isServicioEmpresa` (detecta slug `servicios` además de `empresas`)
  - onClick subcategoría: ahora `async`, llama `getMyCompanies()` antes de avanzar
  - Gate ternario en step 1: `showProfileGate ? <ProfileGate /> : <categorías />`
  - Estado: `showProfileGate`, `pendingSubcategoryName`
  - Reset del gate al cambiar categoría o "Cambiar"

## Migración aplicada en DEV
```
20260309000007_sprint7b_unify_taxonomy.sql
- UPDATE ads: subcategory_id Empresas → Servicios por categoría
- UPDATE subcategories SET is_active=false WHERE slug='empresas'
```
Verificado: 3× empresas is_active=false, 3× servicios is_active=true ✅

## UX Flow completo
```
PublicarAviso → Step 1: Categoría + Subcategoría

  [Hacienda / Insumos / Maquinarias]
  → selectedPageType = 'particular'
  → Avanza a Step 2 directamente

  [Servicios]
  → async check: getMyCompanies()
    → Sin empresa:
        showProfileGate = true
        ProfileGate: "Necesitás un perfil de empresa"
        [Crear mi empresa] → EmpresaForm drawer
        → empresa creada → gate off → Step 2 (empresa pre-seleccionada)
    → Con empresa:
        selectedPageType = 'empresa'
        Avanza a Step 2 (EmpresaSelectorWidget disponible, opcional)
```

## Próximo: Sprint 7C
- ProductCard badge INSUMO/SERVICIO/PARTICULAR
- price_unit visible en cards
- MisEmpresasPanel completeness bar
