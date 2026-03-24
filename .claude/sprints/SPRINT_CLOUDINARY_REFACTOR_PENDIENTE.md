# Sprint Cloudinary — Refactor de Estructura de Carpetas (PENDIENTE)

## Objetivo
Reorganizar carpetas de Cloudinary para separar assets estáticos compartidos de contenido por entorno.

## Problema actual
- `buildFolder()` prefija TODO con `rural24/dev/` o `rural24/prod/`
- Logo y placeholders están en `rural24/dev/cms/` → al clonar config DEV→PROD las URLs apuntan a DEV y se rompen
- Logo broken en PROD: `site_settings.setting_value` tiene URL de Supabase Storage DEV, no Cloudinary

## Estructura propuesta
```
rural24/
  app/                          ← Assets estáticos compartidos (SIN env prefix)
    logos/                      ← Logo del sitio (header, footer)
    icons/                      ← Iconos UI
    placeholders/               ← Placeholders por categoría (8 slugs)
  dev/
    cms/banners|hero|sections/  ← CMS admin (banners, home_sections)
    ugc/ads/{YYYY}/{MM}/        ← Imágenes de avisos
    ugc/profiles/               ← Avatares y logos de empresas
  prod/
    cms/...
    ugc/...
```

## Archivos a modificar
1. `backend/infrastructure/cloudinary.service.ts` — `buildFolder()`: nueva lógica de clasificación
2. `backend/app/api/uploads/signed-url/route.ts` — enum de folders + gate superadmin para `app/*`
3. `backend/domain/images/service.ts` — union type `UploadOptions.folder`
4. `backend/app/api/uploads/route.ts` — actualizar folders aceptados

## Pasos de implementación
1. Actualizar `buildFolder()` con nueva lógica (app vs cms vs ugc)
2. Subir logo a `rural24/app/logos/` desde admin `#/backend-settings`
3. Actualizar `site_settings` en DEV con nueva URL de Cloudinary
4. Script de migración para placeholders de categoría (~8 assets)
5. Clonar config DEV→PROD → URLs nuevas se propagan automáticamente

## Fix inmediato para logo PROD (mientras tanto)
Ejecutar en Supabase PROD:
```sql
UPDATE site_settings 
SET setting_value = 'https://lmkuecdvxtenrikjomol.supabase.co/storage/v1/object/public/cms-images/header/1771603750124-yhqp17.png?t=1771603750124'
WHERE setting_key = 'header_logo';

UPDATE site_settings 
SET setting_value = 'https://lmkuecdvxtenrikjomol.supabase.co/storage/v1/object/public/cms-images/footer/1771623487878-yvigi.png?t=1771623487878'
WHERE setting_key = 'footer_logo';
```

## Notas
- UGC existente (ads, profiles) no necesita migrarse — URLs de Cloudinary son permanentes
- Requiere acceso a cuenta Cloudinary (credenciales pendientes)
- Análisis completo en agente Plan: session 2026-03-23
