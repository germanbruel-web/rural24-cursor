/**
 * db-seed-demo.mjs
 * Inserta 20 avisos de demo por categoría (100 total) en DEV, PROD o ambas.
 * Los avisos quedan activos y aprobados, con imágenes placeholder.
 *
 * Uso:
 *   node scripts/db-seed-demo.mjs dev     # solo DEV
 *   node scripts/db-seed-demo.mjs prod    # solo PROD
 *   node scripts/db-seed-demo.mjs all     # DEV + PROD
 *
 * Requiere: .env.db.local con DEV_DB_URL y PROD_DB_URL
 */

import { readFileSync } from 'fs';
import { randomBytes } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const { Client } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// ─── IDs de categorías y subcategorías (DEV = PROD, catálogo compartido) ────

const CAT = {
  ganaderia:            '9b98e866-5aca-4d58-874b-dc91c30acf1f',
  inmuebles:            '65284d0d-79cd-432e-a166-102f43dba5fa',
  insumos:              '6fd68a5b-4236-48ad-b8c3-57dcdbbcb6bf',
  maquinarias:          '3773410d-505b-4cfc-874a-865cfe1370d6',
  servicios:            '92f47089-0073-4df0-bb3d-60f17152fd75',
};

const SUB = {
  // ganadería
  novillos:    'a6e7aaf8-1920-4aa8-9ae3-ccdbe9a58246',
  vacas:       'fb28c103-89b9-44f6-a9f3-f593df67161a',
  vaquillonas: 'fa50f076-7aca-4e8d-8dce-9e34834785e7',
  toros:       '736a436b-525d-4896-9362-b8a26cd2424b',
  terneros:    'a91c1c63-e7e3-4b2f-a833-2ec6fa17eda0',
  terneras:    'b0508ef8-12cd-4186-a013-00cda7125b96',
  caballos:    'e3c6d5e9-8d15-4a80-bc81-6bae304e893f',
  yeguas:      'dd008a59-d518-4e2d-b47e-ece07202a05d',
  cerdos:      'b43beb22-c224-41b5-a78a-eceba5bf34c8',
  ovejas:      '36c93517-a6cb-44ca-aa5b-4bd296a456c0',
  corderos:    '870afadd-b223-4062-bf4c-944941c23d50',
  cabras:      'b1522dc8-87b8-423b-a174-cd3c7a65d577',
  // inmuebles
  campos:      '99195194-ebfe-44df-85c8-26d0903e8bce',
  estancias:   'c8db27e1-a9f1-437f-bfbd-fc17df85d243',
  chacras:     '9a0c289b-4a88-48fd-b6a3-56be9cf8a7a5',
  quintas:     'd205abd0-ec47-4da6-ad3c-c1e7a67ddbf0',
  lotes:       'c9d14324-5f1d-4527-9288-9a8c2bdbfb8f',
  cabanas:     'b4d88643-9113-4d5f-97e9-2b988c717f75',
  // insumos
  hacienda:    '84b6062e-24ed-46af-845b-8915bb63d228',
  proteccion:  'e0185830-28d5-4e64-af51-7ad37a2570cc',
  alambrados:  '90f007d4-f7ce-4ce2-8821-1ff0505ba736',
  herramientas:'7c16bf02-9e15-4d42-ab90-42a0b9f9057e',
  aguaenergia: '88c96ea7-76ea-44e5-96e5-219ebaa233e5',
  // maquinarias
  tractores:   '129c86f5-8806-4d19-8b8c-6b680f0bd93e',
  sembradoras: 'ddbecbc3-a1dd-4fc9-a48e-488d162de35b',
  cosechadoras:'100371df-1481-49a3-b8f2-77aecf002913',
  pulverizadoras:'a472b690-51b3-4e82-86a6-681c9bdca451',
  arados:      'd9fa1e2f-7c6f-425d-818b-6475695a9e20',
  rastras:     '0720e6a8-246c-412c-ad97-626fef0a18ee',
  tolvas:      'e4a2e40f-bfe4-4758-86fc-211a828289e1',
  fertilizadoras:'d917e833-5cd1-4d1c-851a-5bb7ca2f77f0',
  camiones:    '1c52212a-c85d-45ca-9a15-c5e3f79385da',
  // servicios
  veterinarias:'7d81579b-096b-4fd2-b033-d3e6dc7266cb',
  siembra_svc: 'f25b396e-62c6-4c45-bdea-ba58ea9b07ba',
  cosecha_svc: 'ee426093-c487-4171-8396-7dd9e8c399d2',
  pulvSvc:     'b87e7aac-c9bc-4cbb-9e85-dc84a170d3a4',
  fertilSvc:   'fe5d4987-1d54-451a-b6e2-73c3ab1cd3a2',
  agronomas:   'f9b9f4bd-79cd-47b9-a65c-848610093876',
  adminCampos: '71ea0bec-d665-4db5-a8d6-bd1aa14eee65',
  consignatarias:'9efbacab-9f61-4064-80f5-c254ccf3b326',
  granos:      'ddbeb6da-a353-4170-9fb2-50f730ceb96a',
  distribuidores:'9d1a71ae-e463-4f23-a062-4461c2e3ba05',
  cooperativas:'398c9f6a-c781-446d-bd61-1b148729fbc9',
};

// ─── Provincias y ciudades ────────────────────────────────────────────────────

const LOCATIONS = [
  { province: 'Buenos Aires',      city: 'La Plata' },
  { province: 'Buenos Aires',      city: 'Mar del Plata' },
  { province: 'Buenos Aires',      city: 'Junín' },
  { province: 'Buenos Aires',      city: 'Pergamino' },
  { province: 'Buenos Aires',      city: 'Olavarría' },
  { province: 'Córdoba',           city: 'Córdoba' },
  { province: 'Córdoba',           city: 'Río Cuarto' },
  { province: 'Córdoba',           city: 'Villa María' },
  { province: 'Santa Fe',          city: 'Rosario' },
  { province: 'Santa Fe',          city: 'Venado Tuerto' },
  { province: 'Santa Fe',          city: 'Rafaela' },
  { province: 'Entre Ríos',        city: 'Paraná' },
  { province: 'Entre Ríos',        city: 'Gualeguaychú' },
  { province: 'La Pampa',          city: 'Santa Rosa' },
  { province: 'La Pampa',          city: 'General Pico' },
  { province: 'Corrientes',        city: 'Corrientes' },
  { province: 'Corrientes',        city: 'Goya' },
  { province: 'Chaco',             city: 'Resistencia' },
  { province: 'Salta',             city: 'Salta' },
  { province: 'San Luis',          city: 'Villa Mercedes' },
  { province: 'Mendoza',           city: 'San Rafael' },
  { province: 'Neuquén',           city: 'Zapala' },
  { province: 'Río Negro',         city: 'General Roca' },
  { province: 'Santiago del Estero', city: 'La Banda' },
];

const PHONES = [
  '+54 9 11 4523-7891', '+54 9 11 2347-6512', '+54 9 351 456-7823',
  '+54 9 341 234-5678', '+54 9 0342 45-6789', '+54 9 0343 67-8901',
  '+54 9 02954 12345',  '+54 9 0385 12-3456', '+54 9 0387 45-6789',
  '+54 9 02657 34567',
];

// ─── Seed data: 20 avisos por categoría ──────────────────────────────────────

const SEED = [

  // ── GANADERÍA (20) ──────────────────────────────────────────────────────────
  { cat: 'ganaderia', sub: 'novillos', title: 'Novillos Hereford para invernada, 50 cab',
    desc: 'Novillos de pedigree Hereford, 350 kg promedio, listos para engorde. Sanidad completa al día. Entrega en campo o en destino a convenir. Excelente conformación carnicera.', price: 950000, loc: 0, phone: 0, cond: 'used' },

  { cat: 'ganaderia', sub: 'novillos', title: 'Novillos Aberdeen Angus, 380 kg, 30 cab',
    desc: 'Novillos Angus de alta calidad, 380 kg peso promedio. Raza pura, aptos para exportación. Vacunados y desparasitados. Campo en Córdoba con acceso directo.', price: 1050000, loc: 6, phone: 1, cond: 'used' },

  { cat: 'ganaderia', sub: 'novillos', title: 'Novillos cruzas británicas 80 cab',
    desc: 'Lote de 80 novillos cruzas Hereford x Angus. Peso promedio 400 kg. Muy buena homogeneidad. Campo sobre ruta pavimentada en Santa Fe. Ideal para corrales de engorde.', price: 1100000, loc: 9, phone: 2 },

  { cat: 'ganaderia', sub: 'novillos', title: 'Novillos mestizos 120 cab, 320 kg',
    desc: 'Gran lote de 120 novillos mestizos, 320 kg promedio. Criados a pasto natural, sin antibióticos. Precio negociable por cantidad. Entrega en Entre Ríos.', price: 880000, loc: 12, phone: 3, neg: true },

  { cat: 'ganaderia', sub: 'vacas', title: 'Vacas de invernada gordas, 40 cab',
    desc: 'Vacas gordas Angus-Hereford, 450 kg, listas para faena o terminación rápida. Excelente estado corporal. Sanidad al día. Campo en Buenos Aires con báscula.', price: 800000, loc: 1, phone: 4 },

  { cat: 'ganaderia', sub: 'vacas', title: 'Vacas Aberdeen Angus preñadas 480 kg',
    desc: 'Vacas Angus preñadas de 2° y 3° parto, 480 kg promedio. Todas tacadas positivo. Ideal para reposición de rodeo criador. Campo en La Pampa con muy buena aguada.', price: 1200000, loc: 14, phone: 5 },

  { cat: 'ganaderia', sub: 'vacas', title: 'Vacas Hereford de cría, 60 cab',
    desc: 'Vacas Hereford de cría con buena capacidad lechera, 420 kg. Aptas para producción de terneros de calidad. Entregadas preñadas o a servicio según preferencia.', price: 950000, loc: 7, phone: 6 },

  { cat: 'ganaderia', sub: 'vaquillonas', title: 'Vaquillonas Angus preñadas, 35 cab',
    desc: 'Vaquillonas Aberdeen Angus de primera parición, 330 kg, preñadas todas. Ideal para armar rodeo de cría. Certificadas libre de brucelosis. Campo en Santa Fe.', price: 1350000, loc: 10, phone: 7 },

  { cat: 'ganaderia', sub: 'vaquillonas', title: 'Vaquillonas Hereford primer servicio, 20 cab',
    desc: 'Vaquillonas Hereford 350 kg, recién salidas de primer servicio con buen índice de preñez. Certificadas. Entrega con toda la documentación. Campo en Buenos Aires.', price: 1250000, loc: 2, phone: 8 },

  { cat: 'ganaderia', sub: 'vaquillonas', title: 'Vaquillonas de primer parto, 45 cab',
    desc: 'Vaquillonas cruzas Hereford x Angus, 320 kg, primer parto al pie. Muy buena producción de leche. Campo en Entre Ríos con pasturas implantadas de alta calidad.', price: 1100000, loc: 11, phone: 9, neg: true },

  { cat: 'ganaderia', sub: 'toros', title: 'Toro reproductor Angus PO certificado',
    desc: 'Toro Aberdeen Angus Puro de Origen, 750 kg, 4 años. Índices EPD sobresalientes. Alto valor genético. Apto para inseminación artificial. Libre de brucelosis y TB.', price: 4500000, loc: 6, phone: 0 },

  { cat: 'ganaderia', sub: 'toros', title: 'Toro Hereford Polled, excelente DEP',
    desc: 'Toro Hereford Polled PO, 820 kg, 5 años. Marcadores genéticos excelentes. Demostrada fertilidad con más de 60% de preñez en rodeos de 80+ vacas. Campo en BsAs.', price: 5200000, loc: 3, phone: 1 },

  { cat: 'ganaderia', sub: 'terneros', title: 'Terneros de destete Hereford, 200 kg, 100 cab',
    desc: 'Gran lote de 100 terneros Hereford recién destetados, 200 kg. Vacunados aftosa, Mancha/Gangrena, Clostridiales. Listos para engorde en corral o en campo.', price: 450000, loc: 9, phone: 2 },

  { cat: 'ganaderia', sub: 'terneras', title: 'Terneras de destete Angus 180 kg, 80 cab',
    desc: 'Terneras Aberdeen Angus puras, 180 kg, destete reciente. Excelente genética para reposición. Vacunadas y desparasitadas. Campo en Corrientes con forraje natural.', price: 400000, loc: 16, phone: 3 },

  { cat: 'ganaderia', sub: 'caballos', title: 'Caballos de campo mansos, 4-7 años, 8 cab',
    desc: 'Ocho caballos criollos de campo, 4 a 7 años, mansos, acostumbrados al trabajo con hacienda. Herraje reciente. Muy buenos para rodeo y tareas rurales. BsAs.', price: 800000, loc: 4, phone: 4 },

  { cat: 'ganaderia', sub: 'yeguas', title: 'Yeguas de trabajo maneras, 6 cab',
    desc: 'Seis yeguas criollas de trabajo, 5-8 años, maneras y de fácil manejo. Aptas para tareas de campo y arreos. En excelente estado. La Pampa, campo sobre ruta.', price: 600000, loc: 14, phone: 5, neg: true },

  { cat: 'ganaderia', sub: 'cerdos', title: 'Cerdos para engorde, 80 kg, 50 cab',
    desc: 'Lote de 50 cerdos para engorde, cruzas Yorkshire-Duroc, 80 kg promedio. Listos para terminación en 45 días. Sanidad completa. Granja tecnificada en Santa Fe.', price: 180000, loc: 8, phone: 6 },

  { cat: 'ganaderia', sub: 'ovejas', title: 'Ovejas Merino esquiladas, 200 cab',
    desc: '200 ovejas Merino, 65 kg, recién esquiladas, con lana de alta calidad en próxima campaña. Apta para reproducción y producción de lana. Neuquén, campo abierto.', price: 120000, loc: 21, phone: 7 },

  { cat: 'ganaderia', sub: 'corderos', title: 'Corderos Pampint 35 kg, 150 cab',
    desc: '150 corderos machos Pampint, 35 kg, listos para faena o venta directa. Muy buena conformación carnicera. Entrega rápida. Campo en Buenos Aires sobre ruta 5.', price: 95000, loc: 0, phone: 8 },

  { cat: 'ganaderia', sub: 'cabras', title: 'Cabras criollas lecheras, 30 cab',
    desc: '30 cabras criollas de doble propósito (carne y leche), 45 kg promedio, en buenas condiciones. Sanitariamente controladas. San Luis, campo con forraje natural.', price: 85000, loc: 19, phone: 9 },

  // ── INMUEBLES RURALES (20) ───────────────────────────────────────────────────
  { cat: 'inmuebles', sub: 'campos', title: 'Campo agrícola-ganadero 450 has, Entre Ríos',
    desc: 'Excelente campo en zona agrícola de Entre Ríos. 450 has con suelos de clase I y II. 70% en producción agrícola (soja, maíz), 30% pradera permanente. Acceso asfaltado, mejoras completas, casa de campo habitable. Precio en USD.', price: 1440000000, loc: 11, phone: 0 },

  { cat: 'inmuebles', sub: 'estancias', title: 'Estancia ganadera 1200 has, Corrientes',
    desc: 'Gran estancia en zona centro de Corrientes, 1200 has totales. Casco histórico con casa principal, galpones y corrales. Aguada natural con arroyos y bañados. Capacidad para 600 vientres. Escriturada y libre de deudas.', price: 3000000000, loc: 15, phone: 1, neg: true },

  { cat: 'inmuebles', sub: 'campos', title: 'Establecimiento mixto 300 has, Buenos Aires',
    desc: 'Campo en la zona núcleo de Buenos Aires. 300 has, suelos profundos, aptos para agricultura y ganadería. Infraestructura completa: silo bolsa, galpón de maquinaria, casa de administración.', price: 1200000000, loc: 3, phone: 2 },

  { cat: 'inmuebles', sub: 'chacras', title: 'Chacra con mejoras y aguada 80 has, Santa Fe',
    desc: 'Chacra de 80 has sobre ruta pavimentada al norte de Santa Fe. Casa de campo con 3 dormitorios, galpón de 20x30 m, pozo semisurgente, molino, tanque australiano. Apta para producción mixta.', price: 480000000, loc: 8, phone: 3 },

  { cat: 'inmuebles', sub: 'campos', title: 'Campo La Pampa con aguada 180 has',
    desc: '180 has en La Pampa con suelos de buena capacidad productiva. Aguada garantizada, molino en funcionamiento. Pasturas naturales y cultivadas. Ideal para ganadería. A 15 km de asfalto.', price: 540000000, loc: 13, phone: 4 },

  { cat: 'inmuebles', sub: 'estancias', title: 'Estancia turística 600 has, Salta',
    desc: 'Estancia de alta gama para agro-turismo en Salta, 600 has. Casa principal restaurada, piscina, caballerizas, guarda fauna propia. Actividad ganadera activa como complemento. Ingresos por alquiler turístico.', price: 2400000000, loc: 18, phone: 5 },

  { cat: 'inmuebles', sub: 'quintas', title: 'Quinta frutal en Mendoza, 25 has',
    desc: 'Quinta frutícola de 25 has en Valle de Uco, Mendoza. Viñedos + manzanos + perales. Sistema de riego por goteo. Certificada para exportación. Casa del cuidador y depósito.', price: 360000000, loc: 20, phone: 6 },

  { cat: 'inmuebles', sub: 'lotes', title: 'Lote rural escriturado 50 has, San Luis',
    desc: 'Lote rural de 50 has en zona ganadera de San Luis. Escriturado, libre de deudas. Acceso por camino vecinal mantenido. Con aguada natural, apto para ganadería extensiva.', price: 150000000, loc: 19, phone: 7 },

  { cat: 'inmuebles', sub: 'campos', title: 'Campo sojero alta producción 500 has, Córdoba',
    desc: '500 has en zona núcleo de Córdoba. Suelos clase I predominante, rendimientos históricos de soja de 40-45 qq/ha. Infraestructura completa, silo 500 TN, casa de campo. Excelente inversión.', price: 2500000000, loc: 7, phone: 8 },

  { cat: 'inmuebles', sub: 'estancias', title: 'Estancia con feedlot 900 has, Buenos Aires',
    desc: 'Estancia con sistema de engorde intensivo en Buenos Aires. 900 has ganaderas + feedlot para 2000 cabezas con todas las habilitaciones. Planta de suplementación, báscula, corrales de hormigón.', price: 4500000000, loc: 1, phone: 9, neg: true },

  { cat: 'inmuebles', sub: 'chacras', title: 'Chacra con riego, 60 has, San Juan',
    desc: 'Chacra de 60 has en San Juan con derecho de agua garantizado. Apta para horticultura, frutales o vid. Galpón de empaque, casa de 4 ambientes, caminos internos. A 20 km de la ciudad.', price: 280000000, loc: 22, phone: 0 },

  { cat: 'inmuebles', sub: 'campos', title: 'Campo mixto en Chaco, 220 has',
    desc: '220 has en zona chaqueña, con monte nativo y pastizal. Apta para ganadería extensiva y producción forestal. Acceso vehicular todo el año. Agua de represa y pozo.', price: 660000000, loc: 17, phone: 1 },

  { cat: 'inmuebles', sub: 'lotes', title: 'Lotes rurales con acceso asfaltado, Córdoba',
    desc: 'Lotes rurales de 15 has con frente a ruta asfaltada en Córdoba. Ideal para campo de recreo o producción intensiva. Servicios de luz y agua disponibles. Escrituración inmediata.', price: 120000000, loc: 6, phone: 2 },

  { cat: 'inmuebles', sub: 'estancias', title: 'Estancia colonial El Recreo, 1500 has, Entre Ríos',
    desc: 'Imponente estancia de 1500 has con casco histórico del siglo XIX restaurado. Ganadería en actividad, producción propia de soja en parte del campo. Sobre río con embarcadero.', price: 5250000000, loc: 12, phone: 3 },

  { cat: 'inmuebles', sub: 'quintas', title: 'Quinta de recreo 10 has, Río Negro',
    desc: 'Quinta residencial de 10 has en Alto Valle de Río Negro. Casa principal con quincho, jardín, frutales implantados (manzanas, peras). A 8 km de Gral. Roca, acceso pavimentado.', price: 180000000, loc: 22, phone: 4 },

  { cat: 'inmuebles', sub: 'cabanas', title: 'Cabaña equina equipada, 40 has, Buenos Aires',
    desc: 'Establecimiento de cría y training equino. 40 has con pista oval de entrenamiento, 20 boxes, paddocks individuales, veterinaria equipada. Muy buen acceso. Zona de Luján.', price: 600000000, loc: 4, phone: 5 },

  { cat: 'inmuebles', sub: 'campos', title: 'Campo apícola con colmenas incluidas, Mendoza',
    desc: 'Emprendimiento apícola llave en mano. 50 has de campo, 200 colmenas activas, sala de extracción habilitada SENASA. Producción certificada para exportación. Negocio en marcha.', price: 200000000, loc: 20, phone: 6, neg: true },

  { cat: 'inmuebles', sub: 'chacras', title: 'Chacra orgánica certificada, 35 has, Santa Fe',
    desc: '35 has con certificación orgánica SENASA vigente. Producción de hortalizas, aromáticas y frutales orgánicos. Casa habitación, galpón, sistema de riego por goteo solar.', price: 280000000, loc: 10, phone: 7 },

  { cat: 'inmuebles', sub: 'campos', title: 'Establecimiento avícola habilitado, 15 has, BsAs',
    desc: 'Granja avícola de 15 has en Buenos Aires, habilitada SENASA para pollos parrilleros. 3 galpones de 2000 m² c/u, sistema de calefacción y ventilación automatizado. Negocio en marcha.', price: 450000000, loc: 0, phone: 8 },

  { cat: 'inmuebles', sub: 'chacras', title: 'Chacra con casa y galpón, 90 has, Corrientes',
    desc: '90 has sobre ruta en Corrientes. Casa principal con 4 dormitorios, galpón 15x30 m, corrales, manga y brete. Pasturas implantadas, aguada con molino y tanque. Libre de deudas.', price: 360000000, loc: 16, phone: 9 },

  // ── INSUMOS AGROPECUARIOS (20) ───────────────────────────────────────────────
  { cat: 'insumos', sub: 'proteccion', title: 'Herbicida Glifosato 480 SL, 20L x 20 bidones',
    desc: 'Herbicida Glifosato 480 SL de alta calidad. Bidones de 20 litros. Stock de 20 unidades disponibles. Envío a todo el país. Ideal para barbecho y cultivos RR. Certificado SENASA.', price: 42000, loc: 8, phone: 0 },

  { cat: 'insumos', sub: 'proteccion', title: 'Semillas soja DM 6.8i RR, bolsa 50 kg',
    desc: 'Semillas de soja Don Mario DM 6.8i RR, excelente performance en zona núcleo. Bolsa de 50 kg. Tratamiento con Cruiser + Rizobacter incluido. Disponible en Rosario.', price: 85000, loc: 8, phone: 1 },

  { cat: 'insumos', sub: 'hacienda', title: 'Fertilizante Urea granulada, bolsón 1000 kg',
    desc: 'Urea granulada 46% N, bolsones de 1000 kg. Gran stock disponible en Santa Fe. Entrega en campo con grúa. Precio negociable por volumen. Certificada IRAM.', price: 380000, loc: 9, phone: 2, neg: true },

  { cat: 'insumos', sub: 'alambrados', title: 'Alambre galvanizado 200m, pack x 10 rollos',
    desc: 'Rollo de alambre galvanizado calibre 17/15, 200 metros. Pack de 10 rollos con descuento. Ideal para alambrado perimetral y divisiones internas. Entrega en BsAs.', price: 95000, loc: 4, phone: 3 },

  { cat: 'insumos', sub: 'proteccion', title: 'Fungicida Amistar Xtra 1L x 12 unidades',
    desc: 'Fungicida Amistar Xtra (azoxistrobina + ciproconazol) 1 litro, caja x 12 unidades. Excelente para soja y maíz. Muy buena relación costo-beneficio. Venta por caja.', price: 190000, loc: 6, phone: 4 },

  { cat: 'insumos', sub: 'hacienda', title: 'Suplemento proteico hacienda, pellet 1000 kg',
    desc: 'Suplemento proteico-energético en pellet para bovinos. Bolsón de 1000 kg. 16% proteína bruta, sales minerales incluidas. Ideal para destete precoz y engorde.', price: 320000, loc: 7, phone: 5 },

  { cat: 'insumos', sub: 'proteccion', title: 'Insecticida Cipermetrina 25%, pack x 6 unidades',
    desc: 'Insecticida Cipermetrina 25% EC, envase 5 litros, pack de 6 unidades. Amplio espectro de acción sobre insectos masticadores y chupadores. Envío inmediato.', price: 72000, loc: 9, phone: 6 },

  { cat: 'insumos', sub: 'proteccion', title: 'Semillas maíz DK 7210 Bt, bolsa 80.000 sem',
    desc: 'Semilla de maíz Dekalb DK 7210 VT Pro2, 80.000 semillas por bolsa. Excelente aptitud para zona maicera. Con fungicida + insecticida en tratamiento. Stock disponible.', price: 135000, loc: 7, phone: 7 },

  { cat: 'insumos', sub: 'aguaenergia', title: 'Electrificador solar 5J para potreros',
    desc: 'Energizador solar de 5 Joules para cercas eléctricas. Panel solar 20W incluido, batería 12V 20Ah. Capacidad para 120 km de cerca. Ideal para zonas sin red eléctrica.', price: 185000, loc: 13, phone: 8 },

  { cat: 'insumos', sub: 'aguaenergia', title: 'Bomba centrífuga 3HP con motor eléctrico',
    desc: 'Bomba centrífuga marca Pedrollo 3HP 220/380V. Caudal 18.000 L/h. Ideal para riego, aguada de hacienda y uso doméstico. Nueva en caja, garantía 12 meses.', price: 220000, loc: 6, phone: 9 },

  { cat: 'insumos', sub: 'alambrados', title: 'Alambre liso galvanizado 500m x hebra, pack x 8',
    desc: 'Alambre liso galvanizado calibre 17, bobinas de 500 metros. Pack de 8 bobinas a precio mayorista. Resistencia a la tracción superior. Entrega en la zona pampeana.', price: 340000, loc: 3, phone: 0 },

  { cat: 'insumos', sub: 'hacienda', title: 'Vitaminas y minerales Nutritec hacienda, 25 kg',
    desc: 'Núcleo vitamínico-mineral Nutritec para bovinos de cría. Bolsa 25 kg. Incluye vitaminas A, D3, E + minerales quelatados. Sin hormonas. Envío a todo el país.', price: 58000, loc: 8, phone: 1 },

  { cat: 'insumos', sub: 'proteccion', title: 'Herbicida Dicamba 600 SL, bidón 20L',
    desc: 'Herbicida Dicamba 600 g/L, bidón de 20 litros. Excelente para control de malezas de hoja ancha en soja DT y maíz. Stock disponible para entrega inmediata en Santa Fe.', price: 95000, loc: 10, phone: 2 },

  { cat: 'insumos', sub: 'proteccion', title: 'Semilla pastura Festuca Advance, bolsa 25 kg',
    desc: 'Semilla de Festuca Advance mejorada, bolsa de 25 kg. Excelente adaptación a suelos pesados y encharcados. Alta producción invernal. Inoculada y pelleteada.', price: 42000, loc: 11, phone: 3 },

  { cat: 'insumos', sub: 'aguaenergia', title: 'Tanque australiano 2000L polietileno reforzado',
    desc: 'Tanque australiano de polietileno de alta densidad, 2000 litros. Con flotador y salida de 1½". Garantía 5 años contra UV. Entrega en todo el país con flete sin cargo en compras +3 unidades.', price: 78000, loc: 6, phone: 4 },

  { cat: 'insumos', sub: 'hacienda', title: 'Comedero autoalimentador porcino 150 kg',
    desc: 'Comedero autoalimentador para cerdos en engorde. Capacidad 150 kg. Fabricado en acero galvanizado. Tolva de dosificación regulable. Entrega en Santa Fe y Entre Ríos.', price: 65000, loc: 9, phone: 5 },

  { cat: 'insumos', sub: 'herramientas', title: 'Mochila fumigadora 20L motor Honda GX35',
    desc: 'Mochila fumigadora 20 litros con motor Honda GX35. Lanza tipo pistola con extensión 1.5m. Ideal para fumigación en viñedos, frutales y parcelas pequeñas. Nueva, garantía.', price: 185000, loc: 20, phone: 6 },

  { cat: 'insumos', sub: 'hacienda', title: 'Rollos de silaje de sorgo, 500 kg c/u',
    desc: 'Silaje de sorgo granífero de excelente calidad, rollos de 500 kg envueltos en 6 capas. Cosechado en punto óptimo de humedad. Disponible en BsAs, zona Olavarría.', price: 38000, loc: 4, phone: 7 },

  { cat: 'insumos', sub: 'hacienda', title: 'Aretes numerados SENASA, caja 100 unidades',
    desc: 'Aretes de identificación individual SENASA dobles, 100 unidades por caja. Números secuenciales, inalterables, aprobados para trazabilidad. Disponible en todo el país.', price: 35000, loc: 8, phone: 8 },

  { cat: 'insumos', sub: 'alambrados', title: 'Hilo cerca eléctrica 1000m alta resistencia',
    desc: 'Hilo conductor para cerca eléctrica, 1000 metros, resistencia 300 ohm/km. Apto para pastoreo rotativo y encierre de hacienda mayor y menor. Entrega inmediata.', price: 28000, loc: 13, phone: 9 },

  // ── MAQUINARIAS AGRÍCOLAS (20) ───────────────────────────────────────────────
  { cat: 'maquinarias', sub: 'tractores', title: 'Tractor John Deere 6145R 2022, 145HP',
    desc: 'Tractor John Deere 6145R, año 2022, 145 HP, 1200 horas originales. Transmisión Powerquad, cabina con aire acondicionado y monitor GreenStar. Un solo dueño, servicio oficial. Impecable estado.', price: 85000000, loc: 7, phone: 0, year: 2022, cond: 'used' },

  { cat: 'maquinarias', sub: 'tractores', title: 'Tractor New Holland T6.180 2021, 180HP',
    desc: 'New Holland T6.180 electro-command, 180 CV, año 2021, 980 hs. Equipado con enganche delantero y doble tracción. Sistema electrónico completo. En excelente estado. Disponible en Santa Fe.', price: 95000000, loc: 9, phone: 1, year: 2021, cond: 'used' },

  { cat: 'maquinarias', sub: 'tractores', title: 'Tractor Pauny EVO 500 2020, 215HP',
    desc: 'Tractor Pauny EVO 500, 215 HP, año 2020, 1800 hs. Nacional, muy buena asistencia técnica. Doble tracción, turbo, cabina climatizada. Muy buen estado de trabajo.', price: 78000000, loc: 7, phone: 2, year: 2020, cond: 'used' },

  { cat: 'maquinarias', sub: 'tractores', title: 'Tractor Case Farmall 115C 2023, 115HP',
    desc: 'Case Farmall 115C, 115 HP, año 2023, 350 horas. Como nuevo. Ideal para trabajos medianos: siembra, pulverización, transporte de cosecha. Garantía de fábrica vigente.', price: 65000000, loc: 6, phone: 3, year: 2023, cond: 'used' },

  { cat: 'maquinarias', sub: 'tractores', title: 'Tractor Deutz-Fahr 5120G 2019, 120HP',
    desc: 'Deutz-Fahr 5120G, 120 HP, año 2019, 2400 hs. Motor refrigerado a aire, muy económico en combustible. Doble tracción, cuatro cilindros. En perfecto estado de funcionamiento.', price: 52000000, loc: 11, phone: 4, year: 2019, cond: 'used' },

  { cat: 'maquinarias', sub: 'sembradoras', title: 'Sembradora Agrometal MX 7250, 9 surcos',
    desc: 'Sembradora Agrometal MX 7250, 9 surcos a 52 cm para grano grueso. Monitor de siembra, tolva fertilizadora. Muy buen estado. Apta para soja, maíz y girasol. Campo en BsAs.', price: 38000000, loc: 3, phone: 5, cond: 'used' },

  { cat: 'maquinarias', sub: 'sembradoras', title: 'Sembradora Giorgi Super Star 5020, 2021',
    desc: 'Sembradora Giorgi Super Star 5020, 20 surcos a 17.5 cm para grano fino. Año 2021, muy poco uso. Monitor de siembra Precision. Ideal para trigo y cebada. Santa Fe.', price: 42000000, loc: 10, phone: 6, year: 2021, cond: 'used' },

  { cat: 'maquinarias', sub: 'sembradoras', title: 'Sembradora Yomel Hydra 6030, 2020',
    desc: 'Sembradora de grano grueso Yomel Hydra 6030, 30 líneas, año 2020. Distribución hidráulica, monitor de siembra. Muy buenas condiciones. Zona Marcos Juárez, Córdoba.', price: 35000000, loc: 7, phone: 7, year: 2020, cond: 'used' },

  { cat: 'maquinarias', sub: 'cosechadoras', title: 'Cosechadora John Deere S760 2020, 350HP',
    desc: 'Cosechadora JD S760, año 2020, 350 HP, 1200 hs threshing. Monitor de rendimiento, piloto automático. Plataforma draper 30 pies incluida. Excelente estado general.', price: 180000000, loc: 9, phone: 8, year: 2020, cond: 'used' },

  { cat: 'maquinarias', sub: 'cosechadoras', title: 'Cosechadora Case IH 8250 2019, 370HP',
    desc: 'Case IH Axial-Flow 8250, 370 HP, año 2019, 1500 hs. Rotor axial de alta performance. AFS Pro 700 monitor completo. Cab muy buena. Plataforma 35 pies. En Córdoba.', price: 165000000, loc: 6, phone: 9, year: 2019, cond: 'used' },

  { cat: 'maquinarias', sub: 'cosechadoras', title: 'Cosechadora Don Roque AX 4800, 2021',
    desc: 'Don Roque AX 4800, 2021, 650 hs de cosecha. Nacional, excelente asistencia técnica en todo el país. Monitor de rendimiento, plataforma girasol incluida. Córdoba.', price: 120000000, loc: 7, phone: 0, year: 2021, cond: 'used' },

  { cat: 'maquinarias', sub: 'pulverizadoras', title: 'Pulverizadora Metalfor 4200 EXP 2021',
    desc: 'Pulverizadora autopropulsada Metalfor 4200 EXP, año 2021, 4200 litros, botalón 36 metros. GPS y corte sección automático. 1400 hs. En perfectas condiciones. Santa Fe.', price: 65000000, loc: 10, phone: 1, year: 2021, cond: 'used' },

  { cat: 'maquinarias', sub: 'pulverizadoras', title: 'Pulverizadora Jacto Condor 2000L autopropulsada',
    desc: 'Jacto Condor 3030 autopropulsada, 3000 litros, botalón 30 m. Monitoreo electrónico, bomba centrífuga. Año 2020, 900 hs. Excelente para tratamientos de precisión.', price: 95000000, loc: 7, phone: 2, year: 2020, cond: 'used' },

  { cat: 'maquinarias', sub: 'arados', title: 'Arado de discos reversible 6 cuerpos',
    desc: 'Arado de discos reversible marca Agromec, 6 cuerpos. Discos de 26 pulgadas. Marco reforzado, rejas intercambiables. Muy buen estado, trabajó poco. Entrega en La Pampa.', price: 18000000, loc: 14, phone: 3, cond: 'used' },

  { cat: 'maquinarias', sub: 'rastras', title: 'Rastra de discos pesada 36 platos Baldan',
    desc: 'Rastra de discos Baldan 36 platos de 28 pulgadas. Cuerpos en tándem, arco de regulación hidráulica. Trabajo ancho 5.40 m. Poco uso, en excelente estado. BsAs.', price: 15000000, loc: 2, phone: 4, cond: 'used' },

  { cat: 'maquinarias', sub: 'tolvas', title: 'Tolva autodescargable 30 TN acero pintado',
    desc: 'Tolva autodescargable marca Neoform 30 toneladas. Sinfín 10 pulgadas con motor hidráulico. Rodado 18.4 x 26. Excelente estado, poco uso. Disponible en Córdoba.', price: 28000000, loc: 7, phone: 5, cond: 'used' },

  { cat: 'maquinarias', sub: 'fertilizadoras', title: 'Fertilizadora centrífuga Yomel 2500, 2020',
    desc: 'Fertilizadora centrífuga Yomel 2500, año 2020, tolva 2500 kg. Dosificación electrónica de caudal variable. Apta para urea, fosfato y mezclas. Excelente estado. Córdoba.', price: 22000000, loc: 7, phone: 6, year: 2020, cond: 'used' },

  { cat: 'maquinarias', sub: 'camiones', title: 'Camión Scania R450 volcador agrícola 2019',
    desc: 'Scania R450 año 2019, carrocería volcadora agrícola de 18 m³. Caja automática Opticruise. 480.000 km reales. Servicio oficial. Motor sin reparación. En perfecto estado.', price: 75000000, loc: 9, phone: 7, year: 2019, cond: 'used' },

  { cat: 'maquinarias', sub: 'camiones', title: 'Toyota Hilux 4x4 DC 2022, muy pocos km',
    desc: 'Toyota Hilux 2.8 TDi 4x4 Doble Cabina SRX, año 2022, 35.000 km reales. Impecable, con service oficial al día. Ideal para campo y traslados rurales. BsAs.', price: 38000000, loc: 0, phone: 8, year: 2022, cond: 'used' },

  { cat: 'maquinarias', sub: 'tolvas', title: 'Mixer vertical 20m3 electrónico ganadero',
    desc: 'Mixer vertical de 20 m³ marca Papalardo, cuchillas verticales con pesaje electrónico. Ideal para feedlot o tambo con 200+ cabezas. Año 2021. Entrega en BsAs o Santa Fe.', price: 32000000, loc: 3, phone: 9, year: 2021, cond: 'used' },

  // ── SERVICIOS RURALES (20) ───────────────────────────────────────────────────
  { cat: 'servicios', sub: 'veterinarias', title: 'Servicio veterinario a campo, bovinos y equinos',
    desc: 'Veterinario con 15 años de experiencia en producción bovina y equina. Servicio de sanidad preventiva, cirugías a campo, diagnóstico de preñez, tactos y asesoramiento reproductivo. Zona BsAs y Santa Fe.', price: null, loc: 0, phone: 0, type: 'service' },

  { cat: 'servicios', sub: 'veterinarias', title: 'Veterinaria móvil, atención de emergencias 24hs',
    desc: 'Atención de urgencias veterinarias las 24 horas para hacienda vacuna, equina y porcina. Equipamiento completo en camioneta. Cobertura en toda la provincia de Córdoba.', price: null, loc: 6, phone: 1, type: 'service' },

  { cat: 'servicios', sub: 'veterinarias', title: 'Vacunación y sanidad integral de rodeos',
    desc: 'Programa sanitario completo para rodeos: vacunación aftosa, brucelosis, Mancha/Gangrena, desparasitación y control de parásitos externos. Precio por cabeza. Zona pampeana.', price: 8500, loc: 9, phone: 2, type: 'service' },

  { cat: 'servicios', sub: 'siembra_svc', title: 'Siembra directa a servicio, zona pampeana',
    desc: 'Contratista de siembra directa con equipo propio Agrometal 11 surcos. Soja, maíz, girasol y trigo. Precio por hectárea, incluye semilla o sin semilla. Zona centro-norte BsAs.', price: 35000, loc: 2, phone: 3, type: 'service' },

  { cat: 'servicios', sub: 'siembra_svc', title: 'Contratismo de siembra, máquina Yomel 9 surcos',
    desc: 'Servicio de siembra de grano grueso con sembradora Yomel 9 surcos. Monitoreo de siembra incluido. Disponibilidad para campaña 2026/27. Precios competitivos. Santa Fe y Córdoba.', price: 32000, loc: 10, phone: 4, type: 'service' },

  { cat: 'servicios', sub: 'cosecha_svc', title: 'Cosecha fina y gruesa, equipo completo',
    desc: 'Servicio de cosecha con JD S760 + plataformas para trigo, soja y maíz. Transporte y carretones propios. Disponible para campaña 2026. Reservas abiertas. Zona norte BsAs.', price: 25000, loc: 3, phone: 5, type: 'service' },

  { cat: 'servicios', sub: 'cosecha_svc', title: 'Contratismo de cosecha, equipo JD S760',
    desc: 'Cosecha de soja, maíz, girasol y sorgo. Precio por tonelada o por hectárea. Equipo moderno, rendimientos superiores al promedio. Cobertura en La Pampa y sur de Córdoba.', price: 22000, loc: 13, phone: 6, type: 'service' },

  { cat: 'servicios', sub: 'cosecha_svc', title: 'Cosecha de girasol con plataforma especial',
    desc: 'Servicio especializado en cosecha de girasol. Plataforma específica con deflectores. Mínimas pérdidas garantizadas. Zona norte de BsAs y Chaco. Temporada 2026.', price: 28000, loc: 17, phone: 7, type: 'service' },

  { cat: 'servicios', sub: 'pulvSvc', title: 'Pulverización terrestre 4200L, zona pampeana',
    desc: 'Servicio de pulverización terrestre con Metalfor 4200 EXP, botalón 36 m, GPS y corte automático por sección. Precio por hectárea aplicada. Mínimo 100 ha. Toda la zona pampeana.', price: 18000, loc: 8, phone: 8, type: 'service' },

  { cat: 'servicios', sub: 'pulvSvc', title: 'Fumigación aérea, todas las provincias',
    desc: 'Empresa aérea con 10 aviones agrícolas para fumigación y fertilización. Rapidez en aplicación ante ventanas climáticas. Precio por litro aplicado. Operamos en todo el país.', price: 22000, loc: 18, phone: 9, type: 'service' },

  { cat: 'servicios', sub: 'pulvSvc', title: 'Pulverización UAV con drones, 50 has/día',
    desc: 'Servicio de pulverización con drones DJI T40. Ideal para lotes irregulares, zonas de difícil acceso y aplicaciones de precisión. GPS y mapas de prescripción. Todo el país.', price: 28000, loc: 7, phone: 0, type: 'service' },

  { cat: 'servicios', sub: 'fertilSvc', title: 'Fertilización a granel con dosificación variable',
    desc: 'Servicio de fertilización terrestre con aplicación a tasa variable. Fertilizadora centrifuga 24 m de ancho. Urea, fosfato y mezclas. Cobertura en Santa Fe y Entre Ríos.', price: 15000, loc: 10, phone: 1, type: 'service' },

  { cat: 'servicios', sub: 'fertilSvc', title: 'Fertilización fosfórica y nitrogenada, zona pampeana',
    desc: 'Aplicación de fertilizantes sólidos y líquidos. Equipo propio con GPS y monitor de dosis. Análisis de suelo incluido. Trabajo sobre prescripción o tasa fija. BsAs y Córdoba.', price: 16000, loc: 4, phone: 2, type: 'service' },

  { cat: 'servicios', sub: 'agronomas', title: 'Agrónomo de campo, asesoramiento técnico',
    desc: 'Ingeniero Agrónomo con especialización en producción de granos. Servicio de manejo de cultivos, análisis de suelo, diagnóstico de enfermedades y plagas. Visitas semanales. Zona Córdoba.', price: null, loc: 6, phone: 3, type: 'service' },

  { cat: 'servicios', sub: 'agronomas', title: 'Asesoramiento agronómico integral, campaña 2026/27',
    desc: 'Paquete integral de asesoramiento para la campaña 2026/27: planificación de siembra, seguimiento sanitario, gestión de nutrición y cierre de campaña con análisis de resultados.', price: null, loc: 9, phone: 4, type: 'service' },

  { cat: 'servicios', sub: 'adminCampos', title: 'Administración de campos y establecimientos',
    desc: 'Empresa de administración rural con 20 años de experiencia. Gestión operativa completa: personal, insumos, labores, comercialización y rendición mensual. Referencias disponibles.', price: null, loc: 0, phone: 5, type: 'service' },

  { cat: 'servicios', sub: 'consignatarias', title: 'Consignataria de hacienda, remates y directas',
    desc: 'Consignataria con 30 años en el mercado ganadero. Remates en tablada propia, ventas directas y operaciones de canjes. Cobertura en todo el Litoral y zona pampeana.', price: null, loc: 11, phone: 6, type: 'service' },

  { cat: 'servicios', sub: 'consignatarias', title: 'Venta de hacienda en invernada, directas',
    desc: 'Operamos compra-venta de hacienda en invernada, en pie y faena. Contacto directo comprador-vendedor. Asesoramiento en precio de mercado. Toda la República Argentina.', price: null, loc: 15, phone: 7, type: 'service' },

  { cat: 'servicios', sub: 'granos', title: 'Comercialización de granos, FAS Rosario',
    desc: 'Empresa exportadora y acopiadora. Compramos soja, maíz, trigo y girasol a precio FAS Rosario con liquidación inmediata. Sin descuento por calidad dentro de estándar SENASA.', price: null, loc: 8, phone: 8, type: 'service' },

  { cat: 'servicios', sub: 'distribuidores', title: 'Distribución insumos agrícolas, zona pampeana',
    desc: 'Distribuidor oficial de agroquímicos, semillas y fertilizantes. Entrega en campo, financiación hasta la cosecha. Stock garantizado para campaña 2026. Córdoba, Santa Fe y BsAs.', price: null, loc: 7, phone: 9, type: 'service' },

  { cat: 'servicios', sub: 'cooperativas', title: 'Cooperativa agropecuaria, servicios integrales',
    desc: 'Cooperativa de más de 500 socios. Ofrecemos: acopio, insumos, maquinaria, crédito agropecuario y comercialización de granos y hacienda. Nuevos socios bienvenidos. Entre Ríos.', price: null, loc: 12, phone: 0, type: 'service' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const vars = {};
    for (const line of content.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      vars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    }
    return vars;
  } catch { return {}; }
}

function shortId() {
  return randomBytes(4).toString('hex'); // 8 hex chars
}

function toSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

function imgs(seed1, seed2) {
  return JSON.stringify([
    { url: `https://picsum.photos/seed/${seed1}/800/600` },
    { url: `https://picsum.photos/seed/${seed2}/800/600` },
  ]);
}

async function seed(client, label) {
  // Obtener el primer superadmin como autor de los avisos
  const userRow = await client.query(
    `SELECT id FROM public.users WHERE role = 'superadmin' LIMIT 1`
  );
  const userId = userRow.rows[0]?.id ?? null;

  // Verificar qué subcategorías existen en ESTE ambiente
  const subRows = await client.query(`SELECT id FROM public.subcategories`);
  const existingSubs = new Set(subRows.rows.map(r => r.id));

  console.log(`\n${label} — insertando ${SEED.length} avisos...`);
  console.log(`   Autor: ${userId ?? '(anónimo)'}\n`);

  let ok = 0;
  const now = new Date();
  const expires = new Date(now);
  expires.setMonth(expires.getMonth() + 6);

  for (let i = 0; i < SEED.length; i++) {
    const s = SEED[i];
    const loc = LOCATIONS[s.loc % LOCATIONS.length];
    const phone = PHONES[s.phone % PHONES.length];
    const sid = shortId();
    const slug = `${toSlug(s.title)}-${sid}`;
    const catId = CAT[s.cat];
    const rawSubId = SUB[s.sub] ?? null;
    const subId = rawSubId && existingSubs.has(rawSubId) ? rawSubId : null;
    const adType = s.type ?? 'product';
    const imgSeed1 = (i * 3 + 1);
    const imgSeed2 = (i * 3 + 2);

    try {
      await client.query(`
        INSERT INTO public.ads (
          user_id, category_id, subcategory_id,
          title, description, price, currency,
          province, city, location,
          status, approval_status,
          published_at, expires_at,
          images, contact_phone,
          slug, short_id,
          ad_type, condition, year,
          price_negotiable, featured, views
        ) VALUES (
          $1,$2,$3,
          $4,$5,$6,'ARS',
          $7,$8,$9,
          'active','approved',
          $10,$11,
          $12::jsonb,$13,
          $14,$15,
          $16,$17,$18,
          $19,false,0
        )
      `, [
        userId, catId, subId,
        s.title, s.desc, s.price ?? null, // null = price not set (servicios)
        loc.province, loc.city, `${loc.city}, ${loc.province}`,
        now, expires,
        imgs(imgSeed1, imgSeed2), phone,
        slug, sid,
        adType, s.cond ?? null, s.year ?? null,
        s.neg ?? false,
      ]);
      ok++;
      process.stdout.write(`   [${ok}/${SEED.length}] ✅ ${s.title.slice(0, 55)}\n`);
    } catch (err) {
      process.stdout.write(`   [${i+1}/${SEED.length}] ❌ ${s.title.slice(0, 50)} → ${err.message}\n`);
    }
  }

  console.log(`\n   ${label} — ${ok}/${SEED.length} avisos insertados.\n`);
  return ok;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const [,, target] = process.argv;
if (!target || !['dev', 'prod', 'all'].includes(target)) {
  console.error('❌ Uso: node scripts/db-seed-demo.mjs [dev|prod|all]');
  process.exit(1);
}

const envVars = loadEnvFile(path.join(root, '.env.db.local'));

const targets = [];
if (target === 'dev' || target === 'all') targets.push({ url: envVars.DEV_DB_URL,  label: '🟡 DEV' });
if (target === 'prod' || target === 'all') targets.push({ url: envVars.PROD_DB_URL, label: '🔴 PROD' });

for (const { url, label } of targets) {
  if (!url) { console.error(`❌ Falta URL para ${label}`); process.exit(1); }
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await c.connect();
    await seed(c, label);
  } catch (err) {
    console.error(`❌ Error en ${label}:`, err.message);
    process.exit(1);
  } finally {
    await c.end().catch(() => {});
  }
}

console.log('✅ Seed completado.\n');
