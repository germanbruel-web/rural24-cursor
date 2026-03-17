-- Eliminar setting genérico default_ad_image (reemplazado por default_ad_image_{slug} por categoría)
DELETE FROM public.site_settings WHERE setting_key = 'default_ad_image';
