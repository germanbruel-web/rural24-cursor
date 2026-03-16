# Sprint: TopNav + Footer + Contacto Page
> Fecha: 2026-03-16

## Cambios realizados

### 1. TopNav — quitar link "Contacto"
**Archivo:** `frontend/src/components/header/TopNav.tsx`
- Eliminado botón "Contacto" y su separador `·` del bloque desktop
- El link de contacto ahora vive en el Footer CMS > "Links del Sitio" (columna 4)

### 2. /contacto-rural24 — convertido a página full
**Archivos modificados:** `frontend/App.tsx`
- Eliminado el `useEffect` que interceptaba `currentPage === 'contact'` y abría el `ContactoDrawer`
- Agregado lazy import de `ContactoPage`
- Agregado bloque de render `if (currentPage === 'contact')` con `AppHeader + ContactoPage + Footer`
- La ruta `#/contacto-rural24` sigue funcionando igual vía hash routing

**Componente existente:** `frontend/src/components/pages/ContactoPage.tsx`
- No requirió cambios — ya estaba completo (Email, WhatsApp, Instagram, Horario, Ubicación)

### 3. Footer — eliminar crédito "Brüel Studio"
**Archivo:** `frontend/src/components/Footer.tsx`
- Mobile (línea ~231): eliminado `<p>Diseño: <a>Brüel Studio</a></p>`
- Desktop (línea ~376): eliminado `<p>Diseño Web: <a>Brüel Studio</a></p>`
- El div desktop quedó sin el segundo `<p>`, div ahora con solo copyright

### 4. Footer — actualizar Copyright
**Archivo:** `frontend/src/components/Footer.tsx`
- Mobile: `© 2024-2026 RURAL24.COM` → `© Copyright 2026 | RURAL24.COM.AR`
- Desktop: `© Copyright 2024 - 2026 | RURAL24.COM | Todos los derechos reservados.` → `© Copyright 2026 | RURAL24.COM.AR | Todos los derechos reservados.`

## Próximo paso sugerido
- Agregar link "Contacto" en el Footer CMS (Admin > Footer > "Links del Sitio") con URL `#/contacto-rural24`
- Esto no requiere código — se hace desde la UI de admin
