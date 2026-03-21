-- ================================================================
-- Fix: el seed original usó prefijo DME para contenido de Equipamiento
-- con category_id de Equipamiento. Se eliminan y se insertan correctamente.
-- Fecha: 2026-03-21
-- ⚠️ SOLO DATOS DE PRUEBA — NO EJECUTAR EN PROD
-- ================================================================

-- 1. Eliminar avisos mal clasificados (DME en Equipamiento)
DELETE FROM public.ads WHERE short_id LIKE 'DME%';

-- 2. Insertar 20 avisos de Empleos correctos
-- cat: debba088-7f5b-479f-b137-a524bb9bb701 (Empleos)

INSERT INTO public.ads (
  category_id, subcategory_id, title, description, price, currency,
  province, city, status, approval_status, images, dynamic_fields,
  published_at, expires_at, slug, short_id, ad_type, year, condition, views, price_unit
) VALUES

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Operario de tambo — Córdoba con vivienda','Se busca operario de tambo con experiencia mínima 2 años. Trabajo en turno mañana. Se provee vivienda en campo para familia. Sueldo según convenio + horas extra. Incorporación inmediata.',NULL,NULL,'Córdoba','Villa María','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','operario-tambo-cordoba-vivienda-dme01','DME00001','product',NULL,NULL,312,NULL),

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Tractorista con experiencia en siembra directa','Establecimiento agrícola en Santa Fe busca tractorista con experiencia en siembra directa y pulverización. Manejo de GPS y autoguiado. Relación de dependencia, obra social.',NULL,NULL,'Santa Fe','Cañada de Gómez','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','tractorista-siembra-directa-santa-fe-dme02','DME00002','product',NULL,NULL,287,NULL),

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Veterinario de campo — Entre Ríos','Empresa ganadera busca veterinario recibido con disponibilidad para trabajo a campo. Rodeo bovino ciclo completo. Camioneta provista. Sueldo fijo + variable por producción.',NULL,NULL,'Entre Ríos','Gualeguaychú','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','veterinario-campo-entre-rios-dme03','DME00003','product',NULL,NULL,445,NULL),

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Ingeniero Agrónomo — empresa de insumos — Buenos Aires','Empresa distribuidora de insumos agropecuarios busca Ingeniero Agrónomo para asesoramiento técnico comercial en zona norte de Buenos Aires. Auto y notebook provistos.',NULL,NULL,'Buenos Aires','Pergamino','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','ingeniero-agronomo-empresa-insumos-ba-dme04','DME00004','product',NULL,NULL,398,NULL),

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Puestero ganadero con vivienda — La Pampa','Se busca puestero para establecimiento ganadero de 800 has en La Pampa. Con experiencia en manejo de hacienda bovina. Vivienda en puesto. Posibilidad de animales propios.',NULL,NULL,'La Pampa','General Pico','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','puestero-ganadero-vivienda-la-pampa-dme05','DME00005','product',NULL,NULL,356,NULL),

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Mecánico de maquinaria agrícola — concesionaria','Concesionaria John Deere en Córdoba busca mecánico con experiencia en tractores y cosechadoras. Capacitación en planta de fábrica. Jornada completa, excelentes condiciones.',NULL,NULL,'Córdoba','Marcos Juárez','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','mecanico-maquinaria-agricola-concesionaria-dme06','DME00006','product',NULL,NULL,421,NULL),

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Operario de feed lot — Córdoba','Empresa de engorde a corral busca operarios para manejo de hacienda, distribución de alimento y limpieza de corrales. Turno rotativo. Comedor y transporte incluidos.',NULL,NULL,'Córdoba','Río Cuarto','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','operario-feed-lot-cordoba-dme07','DME00007','product',NULL,NULL,234,NULL),

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Encargado de campo con experiencia — Santa Fe','Productor agropecuario busca encargado de campo con experiencia en agricultura y ganadería. Manejo de personal, maquinaria y hacienda. Vivienda en campo para familia.',NULL,NULL,'Santa Fe','Venado Tuerto','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','encargado-campo-experiencia-santa-fe-dme08','DME00008','product',NULL,NULL,512,NULL),

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Técnico en silos y almacenamiento — Buenos Aires','Empresa de almacenamiento de granos busca técnico para mantenimiento de silos, cintas y equipos de aireación. Conocimiento eléctrico-mecánico. Zona norte Buenos Aires.',NULL,NULL,'Buenos Aires','Junín','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','tecnico-silos-almacenamiento-ba-dme09','DME00009','product',NULL,NULL,298,NULL),

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Capataz de estancia — ganadería vacuna — Corrientes','Estancia busca capataz con amplia experiencia en ganadería vacuna extensiva. Manejo de rodeo, hacienda, peones y estructura. Vivienda casco. Excelentes condiciones.',NULL,NULL,'Corrientes','Mercedes','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','capataz-estancia-ganaderia-corrientes-dme10','DME00010','product',NULL,NULL,387,NULL),

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Cosechero temporario — vendimia Mendoza','Bodega en Valle de Uco busca cosecheros para temporada de vendimia. Trabajo por temporada 45 días. Alojamiento y alimentación incluidos. Sin experiencia previa requerida.',NULL,NULL,'Mendoza','Tunuyán','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','cosechero-temporario-vendimia-mendoza-dme11','DME00011','product',NULL,NULL,634,NULL),

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Ordeñador de tambo — 2 turnos — Santa Fe','Chacra lechera busca ordeñador con experiencia. 2 turnos diarios. Trabajo de lunes a sábados. Vivienda familiar disponible. Sueldo según convenio UATRE. Incorporación inmediata.',NULL,NULL,'Santa Fe','Esperanza','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','ordenador-tambo-2-turnos-santa-fe-dme12','DME00012','product',NULL,NULL,445,NULL),

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Administrador de empresa agropecuaria — Córdoba','Grupo agropecuario busca administrador con experiencia en empresas del sector. Manejo de Excel, sistemas contables y relación con organismos oficiales. Relación de dependencia.',NULL,NULL,'Córdoba','Córdoba Capital','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','administrador-empresa-agropecuaria-cordoba-dme13','DME00013','product',NULL,NULL,321,NULL),

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Operario de tambo robotizado — Buenos Aires','Establecimiento con tambo robotizado Lely busca operario para supervisión de robots, manejo de hacienda y mantenimiento básico. Capacitación provista. Zona Tandil.',NULL,NULL,'Buenos Aires','Tandil','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','operario-tambo-robotizado-buenos-aires-dme14','DME00014','product',NULL,NULL,276,NULL),

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Chofer de camión granelero — larga distancia','Empresa de transporte agrícola busca chofer con registro C1 habilitado. Rutas de granos en zona pampeana. Camión provisto. Viáticos, seguro y ART incluidos. Experiencia mínima 3 años.',NULL,NULL,'Buenos Aires','Rosario','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','chofer-camion-granelero-larga-distancia-dme15','DME00015','product',NULL,NULL,489,NULL),

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Responsable de campo — cultivos frutales — Río Negro','Empresa frutícola busca responsable de campo para manzanas y peras. Conocimiento en poda, cosecha y riego. Zona Alto Valle de Río Negro. Vivienda disponible.',NULL,NULL,'Río Negro','General Roca','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','responsable-campo-frutales-rio-negro-dme16','DME00016','product',NULL,NULL,367,NULL),

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Técnico en agricultura de precisión — Buenos Aires','Empresa de servicios agronómicos busca técnico en agricultura de precisión. Manejo de drones, GPS RTK, software de prescripción. Vehículo propio o provisto.',NULL,NULL,'Buenos Aires','Pehuajó','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','tecnico-agricultura-precision-buenos-aires-dme17','DME00017','product',NULL,NULL,312,NULL),

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Apicultor con experiencia — Chaco','Productor apícola busca apicultor con experiencia mínima 2 años. Manejo de colmenas, extracción y sanidad. Moto y alojamiento provistos. Zona chaqueña.',NULL,NULL,'Chaco','Resistencia','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','apicultor-experiencia-chaco-dme18','DME00018','product',NULL,NULL,198,NULL),

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Supervisor de producción agroindustrial — Santiago del Estero','Empresa citrícola busca supervisor de producción para planta de empaque. Experiencia en procesos productivos agroindustriales. Relación de dependencia, beneficios completos.',NULL,NULL,'Santiago del Estero','Santiago del Estero Capital','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','supervisor-produccion-agroindustrial-sde-dme19','DME00019','product',NULL,NULL,267,NULL),

('debba088-7f5b-479f-b137-a524bb9bb701',NULL,'Peón rural general — con documentación en regla','Establecimiento mixto en La Pampa busca peón rural general. Tareas de alambrado, mantenimiento, manejo de hacienda y labores generales. Vivienda en campo. UATRE.',NULL,NULL,'La Pampa','Realicó','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711538201-xoejxl.webp","path":"1773711538201-xoejxl"}]','{}',NOW(),NOW()+INTERVAL'90 days','peon-rural-general-documentacion-la-pampa-dme20','DME00020','product',NULL,NULL,234,NULL);

-- Asignar al superadmin
UPDATE public.ads
SET user_id = 'fadd0359-ae43-4cad-9612-cbd639583196'
WHERE short_id LIKE 'DME%';
