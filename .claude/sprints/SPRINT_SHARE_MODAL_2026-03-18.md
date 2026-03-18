# ShareModal — Decisión de Arquitectura
> Fecha: 2026-03-18 | Autor: Claude Code (Arquitecto)

## Diagnóstico

El share anterior era un `<button>` inline en `ProductCard` que llamaba `navigator.share()` o `navigator.clipboard.writeText()` en silencio. Cero feedback al usuario, sin redes sociales, sin accesibilidad.

**Problemas concretos:**
- `catch {}` vacío: errores silenciosos, el usuario no sabe si copió o no
- Sin botones de redes (WhatsApp, X, Facebook)
- Sin feedback visual post-acción
- Sin accesibilidad (role, aria, foco, Escape)
- Sin animación de entrada

## Decisión: sin nuevas dependencias

El stack ya provee todo:
| Necesidad | Solución existente |
|---|---|
| Feedback copy | `notify.success()` de `react-hot-toast` v2.6 |
| Animación entrada | `animate-slide-in-up` + `animate-scale-in` (Tailwind config) |
| Ícono share | `Share2, Copy, Check, X, MessageCircle` de lucide-react |
| Tokens de color | `brand-*`, z-index `modal: 50` |
| SVGs redes | Inline (WhatsApp, X, Facebook) — sin librerías de iconos de terceros |

## Arquitectura del componente

```
frontend/src/components/molecules/ShareModal/
  └── ShareModal.tsx   ← componente principal
```

**Reutilización:** Se puede montar desde ProductCard, AdDetail, o cualquier lugar que tenga `title` + `url`.

## UX / Flujos

### Desktop
- `animate-scale-in` desde el centro
- Click fuera del card → cierra
- Escape → cierra

### Mobile
- `animate-slide-in-up` desde abajo (bottom sheet)
- Handle drag visual (barra decorativa)
- Safe area iOS (`h-safe-bottom`)
- Botón "Más opciones" → `navigator.share()` nativo (solo si disponible)

### Estados del botón Copiar
1. Default: borde gris, ícono Copy
2. Éxito: `bg-brand-600`, ícono Check, `scale-95`, toast success
3. Reset a default luego de 2500ms

### Accesibilidad
- `role="dialog" aria-modal="true" aria-label="Compartir: {title}"`
- Focus va al botón cerrar al abrir
- Focus vuelve al elemento original al cerrar
- `document.addEventListener('keydown', Escape)`
- `document.body.style.overflow = 'hidden'` mientras está abierto
- `aria-label` en cada botón de red social

## Redes soportadas

| Red | URL template |
|---|---|
| WhatsApp | `https://wa.me/?text={title}\n{url}` |
| X (Twitter) | `https://twitter.com/intent/tweet?text={title}&url={url}` |
| Facebook | `https://www.facebook.com/sharer/sharer.php?u={url}` |
| Native share | `navigator.share()` — visible solo si browser lo soporta |
| Copy link | `navigator.clipboard.writeText(url)` + toast |

## Integración actual

- `ProductCard.tsx`: botón Share2 en footer abre `ShareModal`
- Pendiente: integrar en `AdDetail.tsx` (sidebar o mobile sticky bar)

## Edge cases considerados

- `navigator.share()` disponible pero usuario cancela → catch silencioso (comportamiento correcto)
- `navigator.clipboard` bloqueado (HTTP sin HTTPS) → `notify.error()`
- Título muy largo → `truncate` en header del modal
- URL muy larga → `truncate` en el input de copy

## Pendiente

- [ ] Integrar en AdDetail sidebar (reemplazar el "Compartir" si se agrega)
- [ ] Tracking de clicks por red social (futuro — `incrementBannerClick` como referencia)
- [ ] Test en iOS Safari para `navigator.share` + safe area
