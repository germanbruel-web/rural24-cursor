# 📢 RURAL24 - Kit Comercial de Publicidad Digital
## Guía UX y Especificaciones Técnicas para Empresas

---

## 📌 RESUMEN EJECUTIVO

Rural24 es el marketplace líder del sector agropecuario argentino. Ofrecemos espacios publicitarios premium con alta visibilidad, segmentación por categoría y métricas de rendimiento en tiempo real.

### Métricas del Sistema de Banners
- ✅ **Impresiones rastreadas** automáticamente
- ✅ **Clicks registrados** con analytics
- ✅ **Segmentación por categoría** (5 verticales + global)
- ✅ **Programación temporal** (fecha inicio/expiración)
- ✅ **Responsive** (desktop + mobile optimizado)

---

## 🎯 ESPACIOS PUBLICITARIOS DISPONIBLES

### 1️⃣ BANNER HERO VIP (Premium)
| Especificación | Valor |
|----------------|-------|
| **Ubicación** | Homepage - Zona superior principal |
| **Tamaño Desktop** | **1200 x 200 px** |
| **Tamaño Mobile** | **480 x 100 px** |
| **Cantidad** | 1 banner por categoría |
| **Comportamiento** | Fijo en desktop, carousel auto-rotativo en mobile |
| **Formatos** | JPG, PNG, WebP |

#### 📍 Posición en Pantalla
```
┌─────────────────────────────────────────────────────────────┐
│  TopNav                                                     │
├─────────────────────────────────────────────────────────────┤
│  Header (Logo + Buscador + Weather)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│        ╔═══════════════════════════════════════════╗        │
│        ║        🌟 BANNER HERO VIP 🌟              ║        │
│        ║           1200 x 200 px                   ║        │
│        ║      (Máxima visibilidad)                 ║        │
│        ╚═══════════════════════════════════════════╝        │
│                                                             │
│  [Categorías]   [Cards de Productos...]                     │
└─────────────────────────────────────────────────────────────┘
```

#### ✨ Características Premium
- Badge con nombre del cliente visible
- Hover-responsive (cambia según categoría seleccionada)
- Carga optimizada con lazy loading
- Auto-rotación en mobile cada 5 segundos

---

### 2️⃣ BANNER CARRUSEL CATEGORÍAS
| Especificación | Valor |
|----------------|-------|
| **Ubicación** | Homepage - Debajo del Hero, por categoría |
| **Tamaño** | **650 x 100 px** |
| **Cantidad** | Hasta 4 banners por categoría |
| **Comportamiento** | Carousel horizontal navegable |
| **Formatos** | JPG, PNG, WebP |

#### 📍 Posición en Pantalla
```
┌─────────────────────────────────────────────────────────────┐
│  [Hero VIP]                                                 │
├─────────────────────────────────────────────────────────────┤
│  📂 MAQUINARIAS AGRÍCOLAS                                   │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Banner 1       │  │  Banner 2       │  ← →              │
│  │  650x100        │  │  650x100        │                   │
│  └─────────────────┘  └─────────────────┘                   │
├─────────────────────────────────────────────────────────────┤
│  📂 GANADERÍA                                               │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Banner 1       │  │  Banner 2       │  ← →              │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

---

### 3️⃣ BANNER INTERCALADO EN RESULTADOS
| Especificación | Valor |
|----------------|-------|
| **Ubicación** | Página de Resultados - Entre productos |
| **Tamaño** | **650 x 100 px** (ancho completo del grid) |
| **Frecuencia** | Cada **8 productos** |
| **Comportamiento** | Selección aleatoria del pool de banners |
| **Formatos** | JPG, PNG, WebP |

#### 📍 Posición en Pantalla
```
┌─────────────────────────────────────────────────────────────┐
│  [Filtros]  │  Resultados: "tractores" (124 encontrados)    │
│             │                                               │
│  Precio     │  [Card 1] [Card 2] [Card 3] [Card 4]          │
│  Ubicación  │  [Card 5] [Card 6] [Card 7] [Card 8]          │
│  Marca      │  ╔═══════════════════════════════════════╗    │
│             │  ║  📢 BANNER INTERCALADO 650x100       ║    │
│  [BANNER    │  ╚═══════════════════════════════════════╝    │
│   LATERAL]  │  [Card 9] [Card 10] [Card 11] [Card 12]       │
│  280x250    │  [Card 13] [Card 14] [Card 15] [Card 16]      │
│             │  ╔═══════════════════════════════════════╗    │
│             │  ║  📢 BANNER INTERCALADO 650x100       ║    │
│             │  ╚═══════════════════════════════════════╝    │
└─────────────────────────────────────────────────────────────┘
```

#### ✨ Características
- Ocupa **todo el ancho** del grid de productos (col-span-full)
- **No interrumpe** el flujo de navegación
- Selección **aleatoria** para rotación equitativa
- Tracking de impresiones por posición

---

### 4️⃣ BANNER DEBAJO DEL FILTRO (Lateral)
| Especificación | Valor |
|----------------|-------|
| **Ubicación** | Página de Resultados - Columna izquierda, bajo filtros |
| **Tamaño** | **280 x 250 px** (formato MPU/cuadrado) |
| **Cantidad** | 1 banner por vista |
| **Comportamiento** | **Sticky** (permanece visible al hacer scroll) |
| **Formatos** | JPG, PNG, WebP |

#### 📍 Posición en Pantalla
```
┌─────────────────────────────────────────────────────────────┐
│  RESULTADOS: Maquinarias Agrícolas                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  │  [Cards de productos...]              │
│  │  FILTROS     │  │                                       │
│  │  ─────────── │  │  [Card] [Card] [Card] [Card]          │
│  │  Precio      │  │                                       │
│  │  Ubicación   │  │  [Card] [Card] [Card] [Card]          │
│  │  Marca       │  │                                       │
│  ├──────────────┤  │                                       │
│  │              │  │  [Card] [Card] [Card] [Card]          │
│  │  ╔════════╗  │  │                                       │
│  │  ║BANNER ║  │◄─── STICKY: permanece visible             │
│  │  ║280x250║  │  │      mientras se hace scroll           │
│  │  ║       ║  │  │                                       │
│  │  ╚════════╝  │  │                                       │
│  │ Publicidad   │  │                                       │
│  └──────────────┘  │                                       │
└─────────────────────────────────────────────────────────────┘
```

#### ✨ Características Premium
- **Posición sticky**: siempre visible mientras el usuario navega
- Alta **tasa de viewability** (>90%)
- Label "Publicidad" discreto para transparencia
- Placeholder atractivo cuando no hay banner (genera leads)

---

## 🏷️ SEGMENTACIÓN POR CATEGORÍAS

Los banners pueden segmentarse para aparecer solo en categorías específicas:

| Categoría | Descripción | Audiencia Target |
|-----------|-------------|------------------|
| **🌾 MAQUINARIAS AGRÍCOLAS** | Tractores, cosechadoras, implementos | Productores, contratistas |
| **🐄 GANADERÍA** | Animales, genética, equipamiento | Ganaderos, cabañas |
| **📦 INSUMOS AGROPECUARIOS** | Semillas, agroquímicos, fertilizantes | Productores, distribuidores |
| **🏠 INMUEBLES RURALES** | Campos, lotes, establecimientos | Inversores, productores |
| **🔧 SERVICIOS RURALES** | Contratistas, profesionales, asesoría | Productores, empresas |
| **🌐 TODAS (ALL)** | Aparece en todas las categorías | Máximo alcance |

### 🎯 Ejemplo de Segmentación
- Banner de **John Deere** → Solo en "Maquinarias Agrícolas"
- Banner de **Banco Galicia Agro** → En "Todas" las categorías
- Banner de **Semillas Don Mario** → Solo en "Insumos Agropecuarios"

---

## 📊 MÉTRICAS Y REPORTING

### Datos Capturados Automáticamente
| Métrica | Descripción |
|---------|-------------|
| **Impresiones** | Cada vez que el banner se carga en pantalla |
| **Clicks** | Cuando el usuario hace clic en el banner |
| **CTR** | Click-Through Rate (clicks / impresiones × 100) |
| **Período activo** | Días entre `starts_at` y `expires_at` |

### Funciones de Tracking
```typescript
// El sistema registra automáticamente:
incrementBannerImpression(id)  // Al cargar el banner
incrementBannerClick(id)       // Al hacer clic
```

---

## 📐 ESPECIFICACIONES TÉCNICAS DE IMÁGENES

### Formatos Recomendados
| Formato | Uso Recomendado | Compresión |
|---------|-----------------|------------|
| **WebP** | Óptimo para web | 80-85% calidad |
| **JPG** | Fotografías | 85% calidad |
| **PNG** | Logos, texto, transparencia | Sin pérdida |

### Dimensiones por Placement

| Placement | Desktop | Mobile | Aspect Ratio |
|-----------|---------|--------|--------------|
| Hero VIP | 1200×200 | 480×100 | 6:1 |
| Carrusel | 650×100 | 650×100 | 6.5:1 |
| Intercalado | 650×100 | 650×100 | 6.5:1 |
| Below Filter | 280×250 | N/A | 1.12:1 |

### Peso Máximo Recomendado
- **Hero VIP Desktop**: 150 KB
- **Hero VIP Mobile**: 80 KB
- **Resto de banners**: 100 KB

---

## 🔄 FLUJO DE CARGA DE BANNERS

```
┌─────────────────────────────────────────────────────────────┐
│  1. Usuario entra a la página                               │
│     ↓                                                       │
│  2. Sistema verifica CACHÉ (60 segundos TTL)                │
│     ├── HIT → Usa banners cacheados (instantáneo)           │
│     └── MISS → Consulta Supabase                            │
│         ↓                                                   │
│  3. Filtra banners por:                                     │
│     • placement (hero_vip, results_intercalated, etc.)      │
│     • category (normalizado: "maquinarias-agricolas" =      │
│                 "MAQUINARIAS AGRÍCOLAS")                    │
│     • is_active = true                                      │
│     • starts_at <= now <= expires_at                        │
│         ↓                                                   │
│  4. Selección según tipo:                                   │
│     • Hero VIP: primero del array                           │
│     • Intercalado: aleatorio del pool                       │
│     • Below Filter: primero disponible                      │
│         ↓                                                   │
│  5. Registra IMPRESIÓN automáticamente                      │
│         ↓                                                   │
│  6. Usuario hace CLICK → Registra click + abre link_url     │
└─────────────────────────────────────────────────────────────┘
```

---

## 💰 MODELO DE PRECIOS SUGERIDO

| Tipo de Banner | Alcance | Precio Sugerido (mensual) |
|----------------|---------|---------------------------|
| **Hero VIP - Global** | Todas las categorías | $$$$ Premium |
| **Hero VIP - Categoría** | 1 categoría específica | $$$ |
| **Carrusel Categorías** | 1 categoría (4 slots) | $$ |
| **Intercalado Resultados** | Por categoría | $$ |
| **Below Filter (Lateral)** | Por categoría | $ |

### Paquetes Recomendados
1. **Pack Básico**: 1 banner intercalado + 1 below filter
2. **Pack Profesional**: Hero VIP categoría + 2 carrusel
3. **Pack Premium**: Hero VIP global + todos los espacios

---

## 🛠️ PANEL DE ADMINISTRACIÓN

Los banners se gestionan desde el **Panel Admin** en `/admin/banners`:

### Campos Disponibles
| Campo | Descripción | Requerido |
|-------|-------------|-----------|
| `placement` | Tipo de banner | ✅ |
| `category` | Categoría target | ✅ |
| `client_name` | Nombre del anunciante | ✅ |
| `link_url` | URL de destino | Opcional |
| `desktop_image_url` | Imagen desktop | Según placement |
| `mobile_image_url` | Imagen mobile | Solo Hero VIP |
| `starts_at` | Fecha de inicio | Opcional |
| `expires_at` | Fecha de expiración | Opcional |
| `is_active` | Activo/Pausado | ✅ |

---

## 📱 RESPONSIVE DESIGN

### Comportamiento por Dispositivo

| Placement | Mobile (<768px) | Tablet | Desktop |
|-----------|-----------------|--------|---------|
| Hero VIP | 480×100, carousel | 1200×200 | 1200×200 |
| Carrusel | 1 banner visible | 2 visibles | 2+ visibles |
| Intercalado | Full width | Full width | Full width |
| Below Filter | **Oculto** | Visible | Visible sticky |

---

## ✅ CHECKLIST PARA ANUNCIANTES

### Antes de Enviar Creativos
- [ ] Imagen en dimensiones correctas (ver tabla)
- [ ] Peso optimizado (<150KB desktop, <80KB mobile)
- [ ] URL de destino válida (https://)
- [ ] Versión mobile si es Hero VIP
- [ ] Nombre de cliente para el badge
- [ ] Fechas de campaña definidas

### Formatos de Archivo
- [ ] WebP preferido (mejor compresión)
- [ ] JPG para fotografías
- [ ] PNG solo si requiere transparencia

---

## 📞 CONTACTO COMERCIAL

**Email**: info@rural24.com.ar  
**Asunto**: Consulta Publicidad Rural24

---

*Documento generado: Febrero 2026*  
*Versión del Sistema de Banners: Clean V2*
