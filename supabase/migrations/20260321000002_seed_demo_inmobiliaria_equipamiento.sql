-- ================================================================
-- SEED: Avisos demo — Inmobiliaria Rural (20) + Equipamiento (20)
-- Fecha: 2026-03-21
-- Completa el seed original (20260317000004) que tenía 6/8 categorías
-- ⚠️ SOLO DATOS DE PRUEBA — NO EJECUTAR EN PROD
-- ================================================================

INSERT INTO public.ads (
  category_id, subcategory_id, title, description, price, currency,
  province, city, status, approval_status, images, dynamic_fields,
  published_at, expires_at, slug, short_id, ad_type, year, condition, views, price_unit
) VALUES

-- ================================================================
-- INMOBILIARIA RURAL — 20 avisos
-- cat: e7e43cf6-121a-4f57-a051-2a6572565f57
-- ================================================================

-- Campos (2c3cd6cc)
('e7e43cf6-121a-4f57-a051-2a6572565f57','2c3cd6cc-b1b1-48e2-9cb1-4cfde2600db2','Campo agrícola 350 ha — La Pampa zona núcleo','350 hectáreas en zona agrícola de alta productividad. Suelo clase 2, lote regular con acceso pavimentado. Arrendado hasta diciembre 2025, renta asegurada. Escritura al día.',1750000,'USD','La Pampa','General Pico','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','campo-agricola-350ha-la-pampa-dm101','DIR00001','product',NULL,NULL,412,NULL),

('e7e43cf6-121a-4f57-a051-2a6572565f57','2c3cd6cc-b1b1-48e2-9cb1-4cfde2600db2','Campo mixto 520 ha con agua — Córdoba','520 has. Zona mixta agrícola-ganadera. Tajamares, aguadas y corrales. Casa casco habitable. Acceso por camino vecinal consolidado. Parte arrendada. Excelente inversión.',2600000,'USD','Córdoba','Río Cuarto','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','campo-mixto-520ha-cordoba-dm102','DIR00002','product',NULL,NULL,287,NULL),

('e7e43cf6-121a-4f57-a051-2a6572565f57','2c3cd6cc-b1b1-48e2-9cb1-4cfde2600db2','Campo sojero 180 ha — Buenos Aires','180 hectáreas en plena zona núcleo bonaerense. Suelo clase 1-2, sin impedimentos. Alambrado perimetral nuevo. Tranqueras y caminos internos. A 8 km de ruta asfaltada.',1080000,'USD','Buenos Aires','Bolívar','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','campo-sojero-180ha-buenos-aires-dm103','DIR00003','product',NULL,NULL,356,NULL),

-- Estancias (03426e55)
('e7e43cf6-121a-4f57-a051-2a6572565f57','03426e55-794a-4612-be43-c4ec8ce4ee22','Estancia ganadera 1.200 ha — Entre Ríos','Estancia con 1.200 has en producción ganadera. Casco principal con 4 dormitorios, galpón, corrales, manga y básculas. Aguadas naturales y artificiales. Apta también para agricultura.',4800000,'USD','Entre Ríos','Gualeguaychú','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','estancia-ganadera-1200ha-entre-rios-dm104','DIR00004','product',NULL,NULL,531,NULL),

('e7e43cf6-121a-4f57-a051-2a6572565f57','03426e55-794a-4612-be43-c4ec8ce4ee22','Estancia ovino-caprina 800 ha — Patagonia','Establecimiento en producción lanar activa. 800 has de campo natural patagónico, 1.500 cabezas ovinas. Casa casco, galpón de esquila, bretes. Puesto auxiliar.',1200000,'USD','Neuquén','Zapala','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','estancia-ovino-caprina-800ha-patagonia-dm105','DIR00005','product',NULL,NULL,298,NULL),

-- Chacras (91599d00)
('e7e43cf6-121a-4f57-a051-2a6572565f57','91599d00-8bb2-4525-a5e4-19f7e2cca191','Chacra frutihortícola 45 ha — Mendoza','45 hectáreas con 25 has implantadas en vid y frutales. Sistema de riego por goteo, galpón frigorífico, casa habitación. En producción activa con contratos de venta.',980000,'USD','Mendoza','San Martín','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','chacra-frutihortícola-45ha-mendoza-dm106','DIR00006','product',NULL,NULL,443,NULL),

('e7e43cf6-121a-4f57-a051-2a6572565f57','91599d00-8bb2-4525-a5e4-19f7e2cca191','Chacra con tambo 60 ha — Santa Fe','60 has con tambo en actividad, 120 vacas en ordeñe. Sala 2×6 con bajada automática, silo forrajero, laguna de efluentes. Casa y dependencias. Excelente estado general.',750000,'USD','Santa Fe','Esperanza','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','chacra-tambo-60ha-santa-fe-dm107','DIR00007','product',NULL,NULL,389,NULL),

('e7e43cf6-121a-4f57-a051-2a6572565f57','91599d00-8bb2-4525-a5e4-19f7e2cca191','Chacra para vivero 12 ha — Corrientes','12 hectáreas con infraestructura completa para vivero. Invernáculos, riego por aspersión, galpón de empaque, camión cisterna. Producción citrícola establecida.',320000,'USD','Corrientes','Bella Vista','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','chacra-vivero-12ha-corrientes-dm108','DIR00008','product',NULL,NULL,267,NULL),

-- Casas de Campo (830452d3)
('e7e43cf6-121a-4f57-a051-2a6572565f57','830452d3-9380-436b-a8d1-7dcb6f35cd7a','Casa de campo con pileta — Córdoba serrana','Propiedad en Sierras de Córdoba. 5 has con casa principal 200 m², pileta, quincho y jardín. Gallinero, huerta y frutales. Acceso pavimentado. Ideal para uso familiar o turismo.',280000,'USD','Córdoba','La Cumbre','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','casa-campo-pileta-cordoba-serrana-dm109','DIR00009','product',NULL,NULL,512,NULL),

('e7e43cf6-121a-4f57-a051-2a6572565f57','830452d3-9380-436b-a8d1-7dcb6f35cd7a','Casco de estancia restaurado — Buenos Aires','Casco histórico restaurado sobre 80 has. Casa principal 6 dormitorios, escrituras al día. Dependencias del personal, galpón y corrales. A 2 hs de CABA por autopista.',650000,'USD','Buenos Aires','Chascomús','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','casco-estancia-restaurado-buenos-aires-dm110','DIR00010','product',NULL,NULL,378,NULL),

-- Lotes (754e091d)
('e7e43cf6-121a-4f57-a051-2a6572565f57','754e091d-a8ba-49d7-bd5c-b7c70427e760','Lote rural 5 ha — Acceso autopista — Santa Fe','5 hectáreas a 3 km de autopista. Ideal para depósito, logística o industria rural. Luz trifásica en el terreno, camino consolidado. Escritura lista. Sin deudas.',85000,'USD','Santa Fe','Rosario','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','lote-rural-5ha-acceso-autopista-santa-fe-dm111','DIR00011','product',NULL,NULL,445,NULL),

('e7e43cf6-121a-4f57-a051-2a6572565f57','754e091d-a8ba-49d7-bd5c-b7c70427e760','Lote en loteo rural — La Pampa','Fracción 10 has en loteo rural aprobado. Servicio de agua por red, camino interno mejorado. Ideal para vivienda rural. A 15 km de General Pico. Financiación disponible.',48000,'USD','La Pampa','General Pico','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','lote-loteo-rural-la-pampa-dm112','DIR00012','product',NULL,NULL,321,NULL),

-- Granjas (58d6481c)
('e7e43cf6-121a-4f57-a051-2a6572565f57','58d6481c-98d2-4dad-995c-e201b3429817','Granja avícola 8 ha — Entre Ríos','8 hectáreas con 2 galpones avícolas de 1.500 m² c/u, capacidad 40.000 pollos. Ventilación automática, bebederos, comederos lineales. Contrato de producción vigente.',420000,'USD','Entre Ríos','Paraná','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','granja-avicola-8ha-entre-rios-dm113','DIR00013','product',NULL,NULL,398,NULL),

('e7e43cf6-121a-4f57-a051-2a6572565f57','58d6481c-98d2-4dad-995c-e201b3429817','Granja porcina familiar 3 ha — Córdoba','3 has con instalaciones para 200 madres. Maternidades, destete y terminación. Sistema biodigestor. Casa del productor y depósito de alimento. Producción integrada.',185000,'USD','Córdoba','Marcos Juárez','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','granja-porcina-familiar-3ha-cordoba-dm114','DIR00014','product',NULL,NULL,276,NULL),

-- Viñedos y Bodegas (750c842b)
('e7e43cf6-121a-4f57-a051-2a6572565f57','750c842b-d19a-4a3d-a9e5-68148d93acae','Viñedo Malbec 25 ha con bodega — Mendoza','25 hectáreas plantadas en Malbec, Cabernet y Syrah. Bodega equipada con capacidad 200.000 litros. Marca registrada y DOP. Exportaciones activas a Europa.',3200000,'USD','Mendoza','Luján de Cuyo','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','vinedo-malbec-25ha-con-bodega-mendoza-dm115','DIR00015','product',NULL,NULL,634,NULL),

('e7e43cf6-121a-4f57-a051-2a6572565f57','750c842b-d19a-4a3d-a9e5-68148d93acae','Finca olivícola 40 ha — San Juan','40 hectáreas con olivos Arbequina y Manzanilla en plena producción. Planta extractora de aceite de oliva virgen extra, tanques de acero inoxidable. Certificación orgánica.',890000,'USD','San Juan','Caucete','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','finca-olivicola-40ha-san-juan-dm116','DIR00016','product',NULL,NULL,487,NULL),

-- Desarrollos Turísticos (4818fa49)
('e7e43cf6-121a-4f57-a051-2a6572565f57','4818fa49-2245-4fc7-9c62-bf8eb989f8bf','Complejo agroturístico 15 ha — Salta','15 has en valles calchaquíes. 6 cabañas equipadas, pileta, restaurante con capacidad 80 cubiertos. Producción propia de vinos y quesos artesanales. Habilitación turística vigente.',1100000,'USD','Salta','Cafayate','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','complejo-agroturistico-15ha-salta-dm117','DIR00017','product',NULL,NULL,543,NULL),

('e7e43cf6-121a-4f57-a051-2a6572565f57','4818fa49-2245-4fc7-9c62-bf8eb989f8bf','Lodge rural con pesca 200 ha — Corrientes','200 has con acceso a laguna natural para pesca deportiva. Lodge principal 8 habitaciones, fogones y muelle. Pesca de dorado y surubí. Ingresos turísticos comprobables.',750000,'USD','Corrientes','Mercedes','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','lodge-rural-pesca-200ha-corrientes-dm118','DIR00018','product',NULL,NULL,421,NULL),

-- Inmuebles Urbanos (76671fda)
('e7e43cf6-121a-4f57-a051-2a6572565f57','76671fda-4784-45c5-926e-1a80cb42f787','Galpón rural en pueblo — Buenos Aires','Galpón 800 m² en lote de 2.000 m² en zona rural de pueblo agropecuario. Piso de hormigón, portón doble altura, oficinas. Ideal acopio, taller o depósito. A 3 cuadras de ruta.',180000,'USD','Buenos Aires','Pehuajó','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','galpon-rural-pueblo-buenos-aires-dm119','DIR00019','product',NULL,NULL,312,NULL),

('e7e43cf6-121a-4f57-a051-2a6572565f57','76671fda-4784-45c5-926e-1a80cb42f787','Casa en pueblo rural con galpón — La Pampa','Casa familiar 120 m² + galpón 300 m² en lote de 1.500 m². 3 dormitorios, patio amplio. Ideal para productor que trabaja en zona. Servicios completos.',75000,'USD','La Pampa','Realicó','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','casa-pueblo-rural-galpon-la-pampa-dm120','DIR00020','product',NULL,NULL,289,NULL),

-- ================================================================
-- EQUIPAMIENTO — 20 avisos
-- cat: b35a1b61-8846-44e6-87a8-af3b1b4fd9ef
-- ================================================================

-- Silos (cdd9c473)
('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','cdd9c473-44ea-4338-923e-7a4c000ab5df','Silo bolsa GEA 9×60 nuevo — sin uso','Silo bolsa GEA 9×60 metros. Sin uso, en caja original. Capacidad 200 toneladas aprox. Ideal para almacenamiento transitorio. Precio contado. Entrega inmediata en depósito Córdoba.',185000,'ARS','Córdoba','Río Cuarto','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','silo-bolsa-gea-9x60-nuevo-dm121','DEQ00001','product',NULL,'nuevo',234,NULL),

('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','cdd9c473-44ea-4338-923e-7a4c000ab5df','Silo metálico Bragado 500 toneladas','Silo metálico Bragado 500 t, fondo plano, sistema de aireación incluido. Instalado y con sistema de monitoreo de temperatura. Año 2019. Excelente estado.',8500000,'ARS','Buenos Aires','Bragado','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','silo-metalico-bragado-500t-dm122','DEQ00002','product',2019,'usado',312,NULL),

-- Molinos de viento (b292d337)
('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','b292d337-a526-4aa7-95ee-4185255259af','Molino de viento Aeromotor 18 pies','Aeromotor 18 pies, estructura completa con torre de 6 metros. Funcionando correctamente. Bomba de émbolo nueva. Ideal para aguada de campo. Se desmonta y entrega.',450000,'ARS','Buenos Aires','Trenque Lauquen','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','molino-viento-aeromotor-18pies-dm123','DEQ00003','product',NULL,'usado',198,NULL),

('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','b292d337-a526-4aa7-95ee-4185255259af','Molino Estrella 8 pies — nuevo en caja','Molino Estrella 8 pies, nuevo en caja de fábrica. Sin armar. Torre no incluida. Apto para caudales medianos. Garantía de fábrica 1 año. Precio de liquidación.',280000,'ARS','Santa Fe','Venado Tuerto','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','molino-estrella-8pies-nuevo-caja-dm124','DEQ00004','product',NULL,'nuevo',276,NULL),

-- Tanques (6795d920)
('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','6795d920-5483-4b84-bb84-9ec37121d27b','Tanque australiano 40.000 litros — chapa','Tanque australiano 40.000 litros en chapa galvanizada. Armado, listo para usar. Tapa de acceso, válvula de salida y flotante incluidos. A retirar en campo Córdoba.',620000,'ARS','Córdoba','Marcos Juárez','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','tanque-australiano-40000l-chapa-dm125','DEQ00005','product',NULL,'usado',345,NULL),

-- Riego (ed301fa2)
('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','ed301fa2-3e73-4d04-9dea-233907062fa4','Equipo de riego por goteo — 10 ha','Sistema de riego por goteo para 10 has. Cabezal de filtrado, controlador de fertirriego, tuberías y goteros. Instalado 2021, excelente estado. Se incluye plano de instalación.',1800000,'ARS','Mendoza','San Martín','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','equipo-riego-goteo-10ha-dm126','DEQ00006','product',2021,'usado',421,NULL),

('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','ed301fa2-3e73-4d04-9dea-233907062fa4','Pivote central de riego 50 ha — Córdoba','Pivote central Valley 4 tramos, 50 has de cobertura. Motor eléctrico trifásico, panel de control digital. Instalado 2020, revisión completa 2024. Listo para temporada.',12500000,'ARS','Córdoba','Río Cuarto','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','pivote-central-riego-50ha-cordoba-dm127','DEQ00007','product',2020,'usado',387,NULL),

-- Secadoras (e5f73169)
('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','e5f73169-57b2-46dd-94ea-32b42f5dcf5e','Secadora de granos Bonfanti 100 t/h','Secadora Bonfanti continua 100 t/h. Quemador a gas, control automático de temperatura. Año 2018, revisión completa. Capacidad cámara 8 toneladas. Entrega en planta.',18000000,'ARS','Santa Fe','Reconquista','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','secadora-granos-bonfanti-100th-dm128','DEQ00008','product',2018,'usado',298,NULL),

-- Grupos electrógenos (e5f6f8c8)
('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','e5f6f8c8-3ee2-4fb9-8b0f-8281b31d3d99','Generador diesel 75 kVA — Perkins','Grupo electrógeno 75 kVA motor Perkins 4 cilindros. 220/380V trifásico, panel automático de transferencia. Año 2019, 1.200 horas de uso. Perfecto estado, con mantenimiento.',4800000,'ARS','Buenos Aires','Junín','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','generador-diesel-75kva-perkins-dm129','DEQ00009','product',2019,'usado',234,NULL),

-- Mangas y corrales (dfedf6ba)
('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','dfedf6ba-8335-4434-83af-c317793efd3a','Manga ganadera completa — caño estructural','Manga completa de caño estructural 80×80. 20 metros de largo, portones de acceso, trabador de cabeza, paleta lateral. Sin uso, a estrenar. Se entrega armada en campo.',980000,'ARS','Córdoba','Villa María','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','manga-ganadera-completa-cano-dm130','DEQ00010','product',NULL,'nuevo',312,NULL),

-- Bretes (ff262086)
('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','ff262086-8263-4d1a-b1ed-89a001a07f4f','Brete hidráulico Taurus — con báscula','Brete hidráulico Taurus con báscula digital incorporada 3.000 kg. Trabador de cabeza automático, paleta lateral doble. Año 2022, muy poco uso. Ideal para feed lot.',2200000,'ARS','Buenos Aires','Pehuajó','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','brete-hidraulico-taurus-con-bascula-dm131','DEQ00011','product',2022,'usado',289,NULL),

-- Compresores (951b1bda)
('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','951b1bda-d30d-4acc-bd6c-90d35acc86ce','Compresor de aire Schulz 15 HP — trifásico','Compresor Schulz 15 HP, pistón 2 etapas, calderín vertical 500 litros. Trifásico 380V. Año 2020, 800 horas. Ideal para taller rural o tambo. Con manguera y accesorios.',1650000,'ARS','Entre Ríos','Paraná','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','compresor-aire-schulz-15hp-trifasico-dm132','DEQ00012','product',2020,'usado',267,NULL),

-- Bebederos (be554bb2)
('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','be554bb2-fe7d-4908-85c8-62a2409759c5','Bebederos de hormigón 2.000 litros — x4 unidades','Lote de 4 bebederos de hormigón armado 2.000 litros c/u. Con flotante de bronce incorporado. Usados en buen estado. A retirar en campo Santa Fe. Precio por el lote.',320000,'ARS','Santa Fe','Rafaela','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','bebederos-hormigon-2000l-x4-dm133','DEQ00013','product',NULL,'usado',198,NULL),

-- Herramientas (49b5cbc0)
('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','49b5cbc0-0c0c-431c-b909-ea8c2b57bc82','Soldadora MIG Lincoln Electric 350A','Soldadora MIG/MAG Lincoln Electric IMT 350, 350 amperes. Alimentador de hilo, antorcha 4 m. 220/380V. Año 2021, muy poco uso. Incluye 2 rollos de hilo y accesorios.',1200000,'ARS','Córdoba','Río Cuarto','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','soldadora-mig-lincoln-electric-350a-dm134','DEQ00014','product',2021,'usado',354,NULL),

-- Agricultura de precisión (d15987b4)
('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','d15987b4-893e-4e76-9f30-ff5e39a5114b','Monitor de siembra John Deere 2630','Monitor de siembra John Deere 2630, pantalla táctil 10". Compatible con SeedStar, documentación de mapas, autoguiado. Año 2020. Excelente estado con licencias activas.',3800000,'ARS','Buenos Aires','Bolívar','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','monitor-siembra-john-deere-2630-dm135','DEQ00015','product',2020,'usado',445,NULL),

-- Energía (bf048e58)
('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','bf048e58-388d-48a3-a7a9-777418ddc9ee','Panel solar 6 kW — instalación rural completa','Sistema fotovoltaico 6 kW on-grid para uso rural. 16 paneles 375W, inversor Fronius Primo 6 kW, estructura de soporte. Instalado 2022, medición bidireccional. Factura 0.',9500000,'ARS','Mendoza','Luján de Cuyo','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','panel-solar-6kw-instalacion-rural-dm136','DEQ00016','product',2022,'usado',521,NULL),

-- Elevadores de granos (19ef4dbd)
('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','19ef4dbd-dc6b-4856-9141-efe4304a60a7','Elevador de granos 60 t/h — Mainero','Elevador de cangilones Mainero 60 t/h, altura 18 metros. Motor 15 HP, chasis galvanizado. Año 2017, revisión de cangilones y correa 2023. Listo para trabajar.',2800000,'ARS','Santa Fe','Ceres','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','elevador-granos-60th-mainero-dm137','DEQ00017','product',2017,'usado',312,NULL),

-- Tranqueras (826baaa5)
('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','826baaa5-47c0-4c79-862d-3884ddc685ae','Tranquera galvanizada 4 m — tubo reforzado','Tranquera galvanizada tubo 38mm reforzado, 4 metros de ancho. Con bisagras de acero inoxidable y cerrojo. Nueva en depósito. Precio x unidad, stock disponible.',95000,'ARS','Córdoba','Marcos Juárez','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','tranquera-galvanizada-4m-tubo-reforzado-dm138','DEQ00018','product',NULL,'nuevo',287,NULL),

-- Acondicionadores de granos (4f463e6c)
('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','4f463e6c-fb4c-462c-91b5-5a4cf53bbfea','Acondicionador de granos Ombú 40 t/h','Acondicionador de granos Ombú 40 t/h con limpieza por zarandas y columna de aireación. Motor 7,5 HP. Año 2019. Poco uso, excelente estado. Con manual y repuestos.',4200000,'ARS','Buenos Aires','9 de Julio','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','acondicionador-granos-ombu-40th-dm139','DEQ00019','product',2019,'usado',234,NULL),

-- Casillas rurales (3fec2b63)
('b35a1b61-8846-44e6-87a8-af3b1b4fd9ef','3fec2b63-6997-4c0a-ba69-66ca159ce023','Casilla rural sobre ruedas 6×2,4 m','Casilla rural 6×2,4 m sobre chasis. Dormitorio, baño completo, cocineta. Panel solar + batería. Acondicionador de aire. Nueva, lista para usar en campo. Escriturada.',3500000,'ARS','La Pampa','General Pico','active','approved','[{"url":"https://res.cloudinary.com/ruralcloudinary/image/upload/v1773711157466-ks1bg7.webp","path":"1773711157466-ks1bg7"}]','{}',NOW(),NOW()+INTERVAL'90 days','casilla-rural-ruedas-6x24m-dm140','DEQ00020','product',NULL,'nuevo',412,NULL);

-- Asignar al superadmin
UPDATE public.ads
SET user_id = 'fadd0359-ae43-4cad-9612-cbd639583196'
WHERE short_id LIKE 'DMIR%'
   OR short_id LIKE 'DMEQ%';
