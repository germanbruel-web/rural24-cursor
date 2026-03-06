/**
 * db-seed-demo.mjs
 * Inserta 20 avisos de demo por categoría (100 total) en DEV, PROD o ambas.
 * Los avisos quedan activos y aprobados, con imágenes temáticas por subcategoría.
 *
 * Uso:
 *   node scripts/db-seed-demo.mjs dev     # solo DEV
 *   node scripts/db-seed-demo.mjs prod    # solo PROD
 *   node scripts/db-seed-demo.mjs all     # DEV + PROD
 *
 * Requiere: .env.db.local con DEV_DB_URL y PROD_DB_URL
 *
 * Atributos: respetan los campos de attribute_template_fields / dynamic_attributes
 * Imágenes:  Unsplash temáticas por categoría (agregar Cloudinary propias si disponibles)
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
  ganaderia:   '9b98e866-5aca-4d58-874b-dc91c30acf1f',
  inmuebles:   '65284d0d-79cd-432e-a166-102f43dba5fa',
  insumos:     '6fd68a5b-4236-48ad-b8c3-57dcdbbcb6bf',
  maquinarias: '3773410d-505b-4cfc-874a-865cfe1370d6',
  servicios:   '92f47089-0073-4df0-bb3d-60f17152fd75',
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

// ─── Imágenes temáticas por subcategoría (2 por aviso) ───────────────────────
// Unsplash: URLs estables con parámetros de crop. Reemplazar con Cloudinary propias si disponibles.

const IMGS = {
  // Bovinos
  novillos:    [
    'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1548445929-4f60a497f851?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1611609163422-fd831b5e7dfa?w=800&h=600&fit=crop',
  ],
  vacas:       [
    'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1561037001-e39e2c6e81ac?w=800&h=600&fit=crop',
  ],
  vaquillonas: [
    'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=600&fit=crop',
  ],
  toros:       [
    'https://images.unsplash.com/photo-1561037001-e39e2c6e81ac?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=800&h=600&fit=crop',
  ],
  terneros:    [
    'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&h=600&fit=crop',
  ],
  terneras:    [
    'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=600&fit=crop',
  ],
  caballos:    [
    'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&h=600&fit=crop',
  ],
  yeguas:      [
    'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&h=600&fit=crop',
  ],
  cerdos:      [
    'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1543085335-9e36e05b2c20?w=800&h=600&fit=crop',
  ],
  ovejas:      [
    'https://images.unsplash.com/photo-1548445929-4f60a497f851?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1585837576279-6b4b2f9be6f5?w=800&h=600&fit=crop',
  ],
  corderos:    [
    'https://images.unsplash.com/photo-1548445929-4f60a497f851?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1585837576279-6b4b2f9be6f5?w=800&h=600&fit=crop',
  ],
  cabras:      [
    'https://images.unsplash.com/photo-1524024973431-2ad916746881?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1548445929-4f60a497f851?w=800&h=600&fit=crop',
  ],
  // Inmuebles
  campos:      [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop',
  ],
  estancias:   [
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=600&fit=crop',
  ],
  chacras:     [
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
  ],
  quintas:     [
    'https://images.unsplash.com/photo-1592419044706-39796d40f98c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop',
  ],
  lotes:       [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=600&fit=crop',
  ],
  cabanas:     [
    'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&h=600&fit=crop',
  ],
  // Insumos
  hacienda:    [
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop',
  ],
  proteccion:  [
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=600&fit=crop',
  ],
  alambrados:  [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop',
  ],
  herramientas:[
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop',
  ],
  aguaenergia: [
    'https://images.unsplash.com/photo-1610358461369-2cfd12c66e5f?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop',
  ],
  // Maquinarias
  tractores:   [
    'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1574323347407-f5e1c0cf4b1e?w=800&h=600&fit=crop',
  ],
  sembradoras: [
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&h=600&fit=crop',
  ],
  cosechadoras:[
    'https://images.unsplash.com/photo-1574323347407-f5e1c0cf4b1e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?w=800&h=600&fit=crop',
  ],
  pulverizadoras:[
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&h=600&fit=crop',
  ],
  arados:      [
    'https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&h=600&fit=crop',
  ],
  rastras:     [
    'https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=600&fit=crop',
  ],
  tolvas:      [
    'https://images.unsplash.com/photo-1574323347407-f5e1c0cf4b1e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?w=800&h=600&fit=crop',
  ],
  fertilizadoras:[
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&h=600&fit=crop',
  ],
  camiones:    [
    'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800&h=600&fit=crop',
  ],
  // Servicios
  veterinarias:[
    'https://images.unsplash.com/photo-1548767797-d8c844163c4a?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1559000357-f6b52ddfbe37?w=800&h=600&fit=crop',
  ],
  siembra_svc: [
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop',
  ],
  cosecha_svc: [
    'https://images.unsplash.com/photo-1574323347407-f5e1c0cf4b1e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=600&fit=crop',
  ],
  pulvSvc:     [
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&h=600&fit=crop',
  ],
  fertilSvc:   [
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=600&fit=crop',
  ],
  agronomas:   [
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop',
  ],
  adminCampos: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop',
  ],
  consignatarias:[
    'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&h=600&fit=crop',
  ],
  granos:      [
    'https://images.unsplash.com/photo-1574323347407-f5e1c0cf4b1e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop',
  ],
  distribuidores:[
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=600&fit=crop',
  ],
  cooperativas:[
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&h=600&fit=crop',
  ],
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

// ─── Atributos por subcategoría ───────────────────────────────────────────────
// Respetan los campos de attribute_template_fields / dynamic_attributes del catálogo.

function attBovino({ tipo, raza, cantidad, peso, edad, estadoSanitario, plansanitario, origen }) {
  return {
    tipobovino:    tipo,
    razabovinos:   raza,
    cantidad:      cantidad,
    peso:          peso,
    edad:          edad,
    estadosanitario: estadoSanitario,
    plansanitario: plansanitario,
    origenanimal:  origen,
    documentacion: true,
  };
}

function attTractor({ marca, modelo, anio, potenciaHp, traccion, transmision, cabina }) {
  return {
    marca,
    modelo,
    anio,
    condicion:      'Usado',
    potencia_hp:    potenciaHp,
    traccion,
    tipo_transmision: transmision,
    caracteristicas: cabina ? ['Cabina', 'Aire acondicionado'] : ['Asiento operador'],
  };
}

function attCosechadora({ marca, modelo, anio, hp, horas, cultivo, tipoTrilla }) {
  return {
    marca,
    modelo,
    aniofabricacion: anio,
    condicion:       'Usado',
    'potencia-motor': hp,
    horastrabajo:    horas,
    tipousocultivo:  cultivo,
    tipotrilla:      tipoTrilla,
    caracteristicas_adicionales: ['GPS', 'Monitor de rendimiento'],
  };
}

function attSembradora({ marca, surcos, espaciado, cultivo }) {
  return {
    marca,
    condicion: 'Usado',
    surcos,
    espaciado_cm: espaciado,
    cultivo_principal: cultivo,
  };
}

function attCampo({ tipo, hectareas, aguada }) {
  return {
    tipo_de_campo: tipo,
    hectareas,
    aguada,
  };
}

// ─── Seed data: 20 avisos por categoría ──────────────────────────────────────

const SEED = [

  // ── GANADERÍA (20) ──────────────────────────────────────────────────────────
  { cat: 'ganaderia', sub: 'novillos',
    title: 'Novillos Hereford para invernada, 50 cab',
    desc: 'Novillos de pedigree Hereford, 350 kg promedio, listos para engorde. Sanidad completa al día. Entrega en campo o en destino a convenir. Excelente conformación carnicera.',
    price: 950000, loc: 0, phone: 0, cond: 'used',
    attrs: attBovino({ tipo: 'Novillo', raza: 'Hereford', cantidad: 50, peso: 350, edad: '2 años', estadoSanitario: 'al día', plansanitario: ['Aftosa', 'Clostridiales', 'Antiparasitario'], origen: 'Campo propio' }) },

  { cat: 'ganaderia', sub: 'novillos',
    title: 'Novillos Aberdeen Angus, 380 kg, 30 cab',
    desc: 'Novillos Angus de alta calidad, 380 kg peso promedio. Raza pura, aptos para exportación. Vacunados y desparasitados. Campo en Córdoba con acceso directo.',
    price: 1050000, loc: 6, phone: 1, cond: 'used',
    attrs: attBovino({ tipo: 'Novillo', raza: 'Aberdeen Angus', cantidad: 30, peso: 380, edad: '2 años', estadoSanitario: 'al día', plansanitario: ['Aftosa', 'Brucelosis', 'Clostridiales'], origen: 'Cabaña' }) },

  { cat: 'ganaderia', sub: 'novillos',
    title: 'Novillos cruzas británicas 80 cab',
    desc: 'Lote de 80 novillos cruzas Hereford x Angus. Peso promedio 400 kg. Muy buena homogeneidad. Campo sobre ruta pavimentada en Santa Fe. Ideal para corrales de engorde.',
    price: 1100000, loc: 9, phone: 2,
    attrs: attBovino({ tipo: 'Novillo', raza: 'Cruza', cantidad: 80, peso: 400, edad: '3 años', estadoSanitario: 'al día', plansanitario: ['Aftosa', 'Antiparasitario'], origen: 'Campo propio' }) },

  { cat: 'ganaderia', sub: 'novillos',
    title: 'Novillos mestizos 120 cab, 320 kg',
    desc: 'Gran lote de 120 novillos mestizos, 320 kg promedio. Criados a pasto natural, sin antibióticos. Precio negociable por cantidad. Entrega en Entre Ríos.',
    price: 880000, loc: 12, phone: 3, neg: true,
    attrs: attBovino({ tipo: 'Novillo', raza: 'Cruza', cantidad: 120, peso: 320, edad: '2 años', estadoSanitario: 'al día', plansanitario: ['Aftosa', 'Clostridiales'], origen: 'Campo propio' }) },

  { cat: 'ganaderia', sub: 'vacas',
    title: 'Vacas de invernada gordas, 40 cab',
    desc: 'Vacas gordas Angus-Hereford, 450 kg, listas para faena o terminación rápida. Excelente estado corporal. Sanidad al día. Campo en Buenos Aires con báscula.',
    price: 800000, loc: 1, phone: 4,
    attrs: attBovino({ tipo: 'Vaca', raza: 'Cruza', cantidad: 40, peso: 450, edad: '4 años', estadoSanitario: 'al día', plansanitario: ['Aftosa', 'Clostridiales', 'Antiparasitario'], origen: 'Campo propio' }) },

  { cat: 'ganaderia', sub: 'vacas',
    title: 'Vacas Aberdeen Angus preñadas 480 kg',
    desc: 'Vacas Angus preñadas de 2° y 3° parto, 480 kg promedio. Todas tacadas positivo. Ideal para reposición de rodeo criador. Campo en La Pampa con muy buena aguada.',
    price: 1200000, loc: 14, phone: 5,
    attrs: attBovino({ tipo: 'Vaca', raza: 'Aberdeen Angus', cantidad: 25, peso: 480, edad: '3 años', estadoSanitario: 'al día', plansanitario: ['Aftosa', 'Brucelosis', 'Clostridiales'], origen: 'Campo propio' }) },

  { cat: 'ganaderia', sub: 'vacas',
    title: 'Vacas Hereford de cría, 60 cab',
    desc: 'Vacas Hereford de cría con buena capacidad lechera, 420 kg. Aptas para producción de terneros de calidad. Entregadas preñadas o a servicio según preferencia.',
    price: 950000, loc: 7, phone: 6,
    attrs: attBovino({ tipo: 'Vaca', raza: 'Hereford', cantidad: 60, peso: 420, edad: '3 años', estadoSanitario: 'al día', plansanitario: ['Aftosa', 'Brucelosis', 'Antiparasitario'], origen: 'Campo propio' }) },

  { cat: 'ganaderia', sub: 'vaquillonas',
    title: 'Vaquillonas Angus preñadas, 35 cab',
    desc: 'Vaquillonas Aberdeen Angus de primera parición, 330 kg, preñadas todas. Ideal para armar rodeo de cría. Certificadas libre de brucelosis. Campo en Santa Fe.',
    price: 1350000, loc: 10, phone: 7,
    attrs: attBovino({ tipo: 'Vaquillona', raza: 'Aberdeen Angus', cantidad: 35, peso: 330, edad: '2 años', estadoSanitario: 'al día', plansanitario: ['Aftosa', 'Brucelosis', 'Clostridiales'], origen: 'Cabaña' }) },

  { cat: 'ganaderia', sub: 'vaquillonas',
    title: 'Vaquillonas Hereford primer servicio, 20 cab',
    desc: 'Vaquillonas Hereford 350 kg, recién salidas de primer servicio con buen índice de preñez. Certificadas. Entrega con toda la documentación. Campo en Buenos Aires.',
    price: 1250000, loc: 2, phone: 8,
    attrs: attBovino({ tipo: 'Vaquillona', raza: 'Hereford', cantidad: 20, peso: 350, edad: '2 años', estadoSanitario: 'al día', plansanitario: ['Aftosa', 'Brucelosis'], origen: 'Campo propio' }) },

  { cat: 'ganaderia', sub: 'vaquillonas',
    title: 'Vaquillonas de primer parto, 45 cab',
    desc: 'Vaquillonas cruzas Hereford x Angus, 320 kg, primer parto al pie. Muy buena producción de leche. Campo en Entre Ríos con pasturas implantadas de alta calidad.',
    price: 1100000, loc: 11, phone: 9, neg: true,
    attrs: attBovino({ tipo: 'Vaquillona', raza: 'Cruza', cantidad: 45, peso: 320, edad: '2 años', estadoSanitario: 'al día', plansanitario: ['Aftosa', 'Antiparasitario'], origen: 'Campo propio' }) },

  { cat: 'ganaderia', sub: 'toros',
    title: 'Toro reproductor Angus PO certificado',
    desc: 'Toro Aberdeen Angus Puro de Origen, 750 kg, 4 años. Índices EPD sobresalientes. Alto valor genético. Apto para inseminación artificial. Libre de brucelosis y TB.',
    price: 4500000, loc: 6, phone: 0,
    attrs: attBovino({ tipo: 'Toro', raza: 'Aberdeen Angus', cantidad: 1, peso: 750, edad: '4 años', estadoSanitario: 'al día', plansanitario: ['Aftosa', 'Brucelosis', 'Carbunclo', 'Clostridiales'], origen: 'Cabaña' }) },

  { cat: 'ganaderia', sub: 'toros',
    title: 'Toro Hereford Polled, excelente DEP',
    desc: 'Toro Hereford Polled PO, 820 kg, 5 años. Marcadores genéticos excelentes. Demostrada fertilidad con más de 60% de preñez en rodeos de 80+ vacas.',
    price: 5200000, loc: 3, phone: 1,
    attrs: attBovino({ tipo: 'Toro', raza: 'Hereford', cantidad: 1, peso: 820, edad: '5 años', estadoSanitario: 'al día', plansanitario: ['Aftosa', 'Brucelosis', 'Carbunclo', 'Clostridiales'], origen: 'Cabaña' }) },

  { cat: 'ganaderia', sub: 'terneros',
    title: 'Terneros de destete Hereford, 200 kg, 100 cab',
    desc: 'Gran lote de 100 terneros Hereford recién destetados, 200 kg. Vacunados aftosa, Mancha/Gangrena, Clostridiales. Listos para engorde en corral o en campo.',
    price: 450000, loc: 9, phone: 2,
    attrs: attBovino({ tipo: 'Ternero', raza: 'Hereford', cantidad: 100, peso: 200, edad: '1 año', estadoSanitario: 'al día', plansanitario: ['Aftosa', 'Clostridiales', 'Antiparasitario'], origen: 'Campo propio' }) },

  { cat: 'ganaderia', sub: 'terneras',
    title: 'Terneras de destete Angus 180 kg, 80 cab',
    desc: 'Terneras Aberdeen Angus puras, 180 kg, destete reciente. Excelente genética para reposición. Vacunadas y desparasitadas. Campo en Corrientes con forraje natural.',
    price: 400000, loc: 16, phone: 3,
    attrs: attBovino({ tipo: 'Ternera', raza: 'Aberdeen Angus', cantidad: 80, peso: 180, edad: '1 año', estadoSanitario: 'al día', plansanitario: ['Aftosa', 'Antiparasitario'], origen: 'Campo propio' }) },

  { cat: 'ganaderia', sub: 'caballos',
    title: 'Caballos de campo mansos, 4-7 años, 8 cab',
    desc: 'Ocho caballos criollos de campo, 4 a 7 años, mansos, acostumbrados al trabajo con hacienda. Herraje reciente. Muy buenos para rodeo y tareas rurales.',
    price: 800000, loc: 4, phone: 4,
    attrs: { raza: 'Criollo', cantidad: 8, edad_rango: '4-7 años', condicion: 'Manso', uso: 'Trabajo de campo' } },

  { cat: 'ganaderia', sub: 'yeguas',
    title: 'Yeguas de trabajo maneras, 6 cab',
    desc: 'Seis yeguas criollas de trabajo, 5-8 años, maneras y de fácil manejo. Aptas para tareas de campo y arreos. En excelente estado. La Pampa, campo sobre ruta.',
    price: 600000, loc: 14, phone: 5, neg: true,
    attrs: { raza: 'Criolla', cantidad: 6, edad_rango: '5-8 años', condicion: 'Manera', uso: 'Trabajo de campo' } },

  { cat: 'ganaderia', sub: 'cerdos',
    title: 'Cerdos para engorde, 80 kg, 50 cab',
    desc: 'Lote de 50 cerdos para engorde, cruzas Yorkshire-Duroc, 80 kg promedio. Listos para terminación en 45 días. Sanidad completa. Granja tecnificada en Santa Fe.',
    price: 180000, loc: 8, phone: 6,
    attrs: { raza: 'Yorkshire-Duroc', cantidad: 50, peso_kg: 80, estado_sanitario: 'al día', origen: 'Granja tecnificada' } },

  { cat: 'ganaderia', sub: 'ovejas',
    title: 'Ovejas Merino esquiladas, 200 cab',
    desc: '200 ovejas Merino, 65 kg, recién esquiladas, con lana de alta calidad en próxima campaña. Apta para reproducción y producción de lana. Neuquén, campo abierto.',
    price: 120000, loc: 21, phone: 7,
    attrs: { raza: 'Merino', cantidad: 200, peso_kg: 65, estado_sanitario: 'al día', uso: 'Reproducción y lana' } },

  { cat: 'ganaderia', sub: 'corderos',
    title: 'Corderos Pampint 35 kg, 150 cab',
    desc: '150 corderos machos Pampint, 35 kg, listos para faena o venta directa. Muy buena conformación carnicera. Entrega rápida. Campo en Buenos Aires sobre ruta 5.',
    price: 95000, loc: 0, phone: 8,
    attrs: { raza: 'Pampint', cantidad: 150, peso_kg: 35, estado_sanitario: 'al día', uso: 'Faena' } },

  { cat: 'ganaderia', sub: 'cabras',
    title: 'Cabras criollas lecheras, 30 cab',
    desc: '30 cabras criollas de doble propósito (carne y leche), 45 kg promedio, en buenas condiciones. Sanitariamente controladas. San Luis, campo con forraje natural.',
    price: 85000, loc: 19, phone: 9,
    attrs: { raza: 'Criolla', cantidad: 30, peso_kg: 45, estado_sanitario: 'al día', uso: 'Doble propósito' } },

  // ── INMUEBLES RURALES (20) ───────────────────────────────────────────────────
  { cat: 'inmuebles', sub: 'campos',
    title: 'Campo agrícola-ganadero 450 has, Entre Ríos',
    desc: 'Excelente campo en zona agrícola de Entre Ríos. 450 has con suelos de clase I y II. 70% en producción agrícola (soja, maíz), 30% pradera permanente. Acceso asfaltado, mejoras completas.',
    price: 1440000000, loc: 11, phone: 0,
    attrs: attCampo({ tipo: 'Mixto', hectareas: 450, aguada: 'Pozo + molino' }) },

  { cat: 'inmuebles', sub: 'estancias',
    title: 'Estancia ganadera 1200 has, Corrientes',
    desc: 'Gran estancia en zona centro de Corrientes, 1200 has totales. Casco histórico con casa principal, galpones y corrales. Aguada natural con arroyos y bañados. Capacidad para 600 vientres.',
    price: 3000000000, loc: 15, phone: 1, neg: true,
    attrs: attCampo({ tipo: 'Ganadero', hectareas: 1200, aguada: 'Arroyo + bañados naturales' }) },

  { cat: 'inmuebles', sub: 'campos',
    title: 'Establecimiento mixto 300 has, Buenos Aires',
    desc: 'Campo en la zona núcleo de Buenos Aires. 300 has, suelos profundos, aptos para agricultura y ganadería. Infraestructura completa: silo bolsa, galpón de maquinaria, casa de administración.',
    price: 1200000000, loc: 3, phone: 2,
    attrs: attCampo({ tipo: 'Mixto', hectareas: 300, aguada: 'Tanque australiano + molino' }) },

  { cat: 'inmuebles', sub: 'chacras',
    title: 'Chacra con mejoras y aguada 80 has, Santa Fe',
    desc: 'Chacra de 80 has sobre ruta pavimentada al norte de Santa Fe. Casa de campo con 3 dormitorios, galpón de 20x30 m, pozo semisurgente, molino, tanque australiano.',
    price: 480000000, loc: 8, phone: 3,
    attrs: attCampo({ tipo: 'Mixto', hectareas: 80, aguada: 'Pozo semisurgente + molino' }) },

  { cat: 'inmuebles', sub: 'campos',
    title: 'Campo La Pampa con aguada 180 has',
    desc: '180 has en La Pampa con suelos de buena capacidad productiva. Aguada garantizada, molino en funcionamiento. Pasturas naturales y cultivadas. Ideal para ganadería. A 15 km de asfalto.',
    price: 540000000, loc: 13, phone: 4,
    attrs: attCampo({ tipo: 'Ganadero', hectareas: 180, aguada: 'Molino + tanque' }) },

  { cat: 'inmuebles', sub: 'estancias',
    title: 'Estancia turística 600 has, Salta',
    desc: 'Estancia de alta gama para agro-turismo en Salta, 600 has. Casa principal restaurada, piscina, caballerizas, guarda fauna propia. Actividad ganadera activa como complemento.',
    price: 2400000000, loc: 18, phone: 5,
    attrs: attCampo({ tipo: 'Recreativo / Turismo rural', hectareas: 600, aguada: 'Río + pozo' }) },

  { cat: 'inmuebles', sub: 'quintas',
    title: 'Quinta frutal en Mendoza, 25 has',
    desc: 'Quinta frutícola de 25 has en Valle de Uco, Mendoza. Viñedos + manzanos + perales. Sistema de riego por goteo. Certificada para exportación. Casa del cuidador y depósito.',
    price: 360000000, loc: 20, phone: 6,
    attrs: attCampo({ tipo: 'Agrícola', hectareas: 25, aguada: 'Riego por goteo + derecho de agua' }) },

  { cat: 'inmuebles', sub: 'lotes',
    title: 'Lote rural escriturado 50 has, San Luis',
    desc: 'Lote rural de 50 has en zona ganadera de San Luis. Escriturado, libre de deudas. Acceso por camino vecinal mantenido. Con aguada natural, apto para ganadería extensiva.',
    price: 150000000, loc: 19, phone: 7,
    attrs: attCampo({ tipo: 'Ganadero', hectareas: 50, aguada: 'Natural' }) },

  { cat: 'inmuebles', sub: 'campos',
    title: 'Campo sojero alta producción 500 has, Córdoba',
    desc: '500 has en zona núcleo de Córdoba. Suelos clase I predominante, rendimientos históricos de soja de 40-45 qq/ha. Infraestructura completa, silo 500 TN, casa de campo.',
    price: 2500000000, loc: 7, phone: 8,
    attrs: attCampo({ tipo: 'Agrícola', hectareas: 500, aguada: 'Pozo + cisterna' }) },

  { cat: 'inmuebles', sub: 'estancias',
    title: 'Estancia con feedlot 900 has, Buenos Aires',
    desc: 'Estancia con sistema de engorde intensivo en Buenos Aires. 900 has ganaderas + feedlot para 2000 cabezas con todas las habilitaciones. Planta de suplementación, báscula, corrales de hormigón.',
    price: 4500000000, loc: 1, phone: 9, neg: true,
    attrs: attCampo({ tipo: 'Ganadero', hectareas: 900, aguada: 'Pozo + molino + tanque' }) },

  { cat: 'inmuebles', sub: 'chacras',
    title: 'Chacra con riego, 60 has, San Juan',
    desc: 'Chacra de 60 has en San Juan con derecho de agua garantizado. Apta para horticultura, frutales o vid. Galpón de empaque, casa de 4 ambientes, caminos internos.',
    price: 280000000, loc: 22, phone: 0,
    attrs: attCampo({ tipo: 'Agrícola', hectareas: 60, aguada: 'Derecho de agua garantizado' }) },

  { cat: 'inmuebles', sub: 'campos',
    title: 'Campo mixto en Chaco, 220 has',
    desc: '220 has en zona chaqueña, con monte nativo y pastizal. Apta para ganadería extensiva y producción forestal. Acceso vehicular todo el año. Agua de represa y pozo.',
    price: 660000000, loc: 17, phone: 1,
    attrs: attCampo({ tipo: 'Mixto', hectareas: 220, aguada: 'Represa + pozo' }) },

  { cat: 'inmuebles', sub: 'lotes',
    title: 'Lotes rurales con acceso asfaltado, Córdoba',
    desc: 'Lotes rurales de 15 has con frente a ruta asfaltada en Córdoba. Ideal para campo de recreo o producción intensiva. Servicios de luz y agua disponibles.',
    price: 120000000, loc: 6, phone: 2,
    attrs: attCampo({ tipo: 'Agrícola', hectareas: 15, aguada: 'Agua de red disponible' }) },

  { cat: 'inmuebles', sub: 'estancias',
    title: 'Estancia colonial El Recreo, 1500 has, Entre Ríos',
    desc: 'Imponente estancia de 1500 has con casco histórico del siglo XIX restaurado. Ganadería en actividad, producción propia de soja en parte del campo. Sobre río con embarcadero.',
    price: 5250000000, loc: 12, phone: 3,
    attrs: attCampo({ tipo: 'Mixto', hectareas: 1500, aguada: 'Río + pozo' }) },

  { cat: 'inmuebles', sub: 'quintas',
    title: 'Quinta de recreo 10 has, Río Negro',
    desc: 'Quinta residencial de 10 has en Alto Valle de Río Negro. Casa principal con quincho, jardín, frutales implantados (manzanas, peras). A 8 km de Gral. Roca, acceso pavimentado.',
    price: 180000000, loc: 22, phone: 4,
    attrs: attCampo({ tipo: 'Recreativo / Turismo rural', hectareas: 10, aguada: 'Riego por goteo' }) },

  { cat: 'inmuebles', sub: 'cabanas',
    title: 'Cabaña equina equipada, 40 has, Buenos Aires',
    desc: 'Establecimiento de cría y training equino. 40 has con pista oval de entrenamiento, 20 boxes, paddocks individuales, veterinaria equipada. Muy buen acceso. Zona de Luján.',
    price: 600000000, loc: 4, phone: 5,
    attrs: attCampo({ tipo: 'Ganadero', hectareas: 40, aguada: 'Pozo + molino' }) },

  { cat: 'inmuebles', sub: 'campos',
    title: 'Campo apícola con colmenas incluidas, Mendoza',
    desc: 'Emprendimiento apícola llave en mano. 50 has de campo, 200 colmenas activas, sala de extracción habilitada SENASA. Producción certificada para exportación.',
    price: 200000000, loc: 20, phone: 6, neg: true,
    attrs: attCampo({ tipo: 'Mixto', hectareas: 50, aguada: 'Natural' }) },

  { cat: 'inmuebles', sub: 'chacras',
    title: 'Chacra orgánica certificada, 35 has, Santa Fe',
    desc: '35 has con certificación orgánica SENASA vigente. Producción de hortalizas, aromáticas y frutales orgánicos. Casa habitación, galpón, sistema de riego por goteo solar.',
    price: 280000000, loc: 10, phone: 7,
    attrs: attCampo({ tipo: 'Agrícola', hectareas: 35, aguada: 'Riego por goteo solar' }) },

  { cat: 'inmuebles', sub: 'campos',
    title: 'Establecimiento avícola habilitado, 15 has, BsAs',
    desc: 'Granja avícola de 15 has en Buenos Aires, habilitada SENASA para pollos parrilleros. 3 galpones de 2000 m² c/u, sistema de calefacción y ventilación automatizado.',
    price: 450000000, loc: 0, phone: 8,
    attrs: attCampo({ tipo: 'Agrícola', hectareas: 15, aguada: 'Red + cisterna' }) },

  { cat: 'inmuebles', sub: 'chacras',
    title: 'Chacra con casa y galpón, 90 has, Corrientes',
    desc: '90 has sobre ruta en Corrientes. Casa principal con 4 dormitorios, galpón 15x30 m, corrales, manga y brete. Pasturas implantadas, aguada con molino y tanque.',
    price: 360000000, loc: 16, phone: 9,
    attrs: attCampo({ tipo: 'Ganadero', hectareas: 90, aguada: 'Molino + tanque australiano' }) },

  // ── INSUMOS AGROPECUARIOS (20) ───────────────────────────────────────────────
  { cat: 'insumos', sub: 'proteccion',
    title: 'Herbicida Glifosato 480 SL, 20L x 20 bidones',
    desc: 'Herbicida Glifosato 480 SL de alta calidad. Bidones de 20 litros. Stock de 20 unidades disponibles. Envío a todo el país. Ideal para barbecho y cultivos RR. Certificado SENASA.',
    price: 42000, loc: 8, phone: 0,
    attrs: { tipo_producto: 'Herbicida', principio_activo: 'Glifosato 480 SL', volumen: '20L', unidades: 20, certificacion: 'SENASA' } },

  { cat: 'insumos', sub: 'proteccion',
    title: 'Semillas soja DM 6.8i RR, bolsa 50 kg',
    desc: 'Semillas de soja Don Mario DM 6.8i RR, excelente performance en zona núcleo. Bolsa de 50 kg. Tratamiento con Cruiser + Rizobacter incluido. Disponible en Rosario.',
    price: 85000, loc: 8, phone: 1,
    attrs: { tipo_producto: 'Semilla', cultivo: 'Soja', variedad: 'DM 6.8i RR', peso_bolsa_kg: 50, tratamiento: 'Cruiser + Rizobacter' } },

  { cat: 'insumos', sub: 'hacienda',
    title: 'Fertilizante Urea granulada, bolsón 1000 kg',
    desc: 'Urea granulada 46% N, bolsones de 1000 kg. Gran stock disponible en Santa Fe. Entrega en campo con grúa. Precio negociable por volumen.',
    price: 380000, loc: 9, phone: 2, neg: true,
    attrs: { tipo_producto: 'Fertilizante', principio_activo: 'Urea 46% N', formato: 'Bolsón 1000 kg', certificacion: 'IRAM' } },

  { cat: 'insumos', sub: 'alambrados',
    title: 'Alambre galvanizado 200m, pack x 10 rollos',
    desc: 'Rollo de alambre galvanizado calibre 17/15, 200 metros. Pack de 10 rollos con descuento. Ideal para alambrado perimetral y divisiones internas. Entrega en BsAs.',
    price: 95000, loc: 4, phone: 3,
    attrs: { tipo_producto: 'Alambre', calibre: '17/15', longitud_m: 200, cantidad_rollos: 10, material: 'Galvanizado' } },

  { cat: 'insumos', sub: 'proteccion',
    title: 'Fungicida Amistar Xtra 1L x 12 unidades',
    desc: 'Fungicida Amistar Xtra (azoxistrobina + ciproconazol) 1 litro, caja x 12 unidades. Excelente para soja y maíz.',
    price: 190000, loc: 6, phone: 4,
    attrs: { tipo_producto: 'Fungicida', principio_activo: 'Azoxistrobina + Ciproconazol', volumen: '1L', unidades_caja: 12 } },

  { cat: 'insumos', sub: 'hacienda',
    title: 'Suplemento proteico hacienda, pellet 1000 kg',
    desc: 'Suplemento proteico-energético en pellet para bovinos. Bolsón de 1000 kg. 16% proteína bruta, sales minerales incluidas. Ideal para destete precoz y engorde.',
    price: 320000, loc: 7, phone: 5,
    attrs: { tipo_producto: 'Suplemento', especie: 'Bovino', formato: 'Pellet 1000 kg', proteina_pct: 16 } },

  { cat: 'insumos', sub: 'proteccion',
    title: 'Insecticida Cipermetrina 25%, pack x 6 unidades',
    desc: 'Insecticida Cipermetrina 25% EC, envase 5 litros, pack de 6 unidades. Amplio espectro de acción sobre insectos masticadores y chupadores.',
    price: 72000, loc: 9, phone: 6,
    attrs: { tipo_producto: 'Insecticida', principio_activo: 'Cipermetrina 25%', volumen: '5L', unidades: 6 } },

  { cat: 'insumos', sub: 'proteccion',
    title: 'Semillas maíz DK 7210 Bt, bolsa 80.000 sem',
    desc: 'Semilla de maíz Dekalb DK 7210 VT Pro2, 80.000 semillas por bolsa. Excelente aptitud para zona maicera. Con fungicida + insecticida en tratamiento.',
    price: 135000, loc: 7, phone: 7,
    attrs: { tipo_producto: 'Semilla', cultivo: 'Maíz', variedad: 'DK 7210 VT Pro2', semillas_bolsa: 80000, tratamiento: 'Fungicida + Insecticida' } },

  { cat: 'insumos', sub: 'aguaenergia',
    title: 'Electrificador solar 5J para potreros',
    desc: 'Energizador solar de 5 Joules para cercas eléctricas. Panel solar 20W incluido, batería 12V 20Ah. Capacidad para 120 km de cerca.',
    price: 185000, loc: 13, phone: 8,
    attrs: { tipo_producto: 'Electrificador', energia: 'Solar', joules: 5, capacidad_km: 120, bateria: '12V 20Ah' } },

  { cat: 'insumos', sub: 'aguaenergia',
    title: 'Bomba centrífuga 3HP con motor eléctrico',
    desc: 'Bomba centrífuga marca Pedrollo 3HP 220/380V. Caudal 18.000 L/h. Ideal para riego, aguada de hacienda y uso doméstico. Nueva en caja, garantía 12 meses.',
    price: 220000, loc: 6, phone: 9,
    attrs: { tipo_producto: 'Bomba', marca: 'Pedrollo', potencia_hp: 3, caudal_lh: 18000, tension: '220/380V', garantia_meses: 12 } },

  { cat: 'insumos', sub: 'alambrados',
    title: 'Alambre liso galvanizado 500m x hebra, pack x 8',
    desc: 'Alambre liso galvanizado calibre 17, bobinas de 500 metros. Pack de 8 bobinas a precio mayorista. Resistencia a la tracción superior.',
    price: 340000, loc: 3, phone: 0,
    attrs: { tipo_producto: 'Alambre', calibre: '17', longitud_m: 500, cantidad_bobinas: 8, material: 'Galvanizado' } },

  { cat: 'insumos', sub: 'hacienda',
    title: 'Vitaminas y minerales Nutritec hacienda, 25 kg',
    desc: 'Núcleo vitamínico-mineral Nutritec para bovinos de cría. Bolsa 25 kg. Incluye vitaminas A, D3, E + minerales quelatados. Sin hormonas.',
    price: 58000, loc: 8, phone: 1,
    attrs: { tipo_producto: 'Vitaminas y minerales', especie: 'Bovino', presentacion: 'Bolsa 25 kg', vitaminas: 'A, D3, E', minerales: 'Quelatados' } },

  { cat: 'insumos', sub: 'proteccion',
    title: 'Herbicida Dicamba 600 SL, bidón 20L',
    desc: 'Herbicida Dicamba 600 g/L, bidón de 20 litros. Excelente para control de malezas de hoja ancha en soja DT y maíz.',
    price: 95000, loc: 10, phone: 2,
    attrs: { tipo_producto: 'Herbicida', principio_activo: 'Dicamba 600 g/L', volumen: '20L' } },

  { cat: 'insumos', sub: 'proteccion',
    title: 'Semilla pastura Festuca Advance, bolsa 25 kg',
    desc: 'Semilla de Festuca Advance mejorada, bolsa de 25 kg. Excelente adaptación a suelos pesados y encharcados. Alta producción invernal. Inoculada y pelleteada.',
    price: 42000, loc: 11, phone: 3,
    attrs: { tipo_producto: 'Semilla', cultivo: 'Pastura', variedad: 'Festuca Advance', peso_bolsa_kg: 25, tratamiento: 'Inoculada y pelleteada' } },

  { cat: 'insumos', sub: 'aguaenergia',
    title: 'Tanque australiano 2000L polietileno reforzado',
    desc: 'Tanque australiano de polietileno de alta densidad, 2000 litros. Con flotador y salida de 1½". Garantía 5 años contra UV.',
    price: 78000, loc: 6, phone: 4,
    attrs: { tipo_producto: 'Tanque', capacidad_l: 2000, material: 'Polietileno HD', garantia_anios: 5 } },

  { cat: 'insumos', sub: 'hacienda',
    title: 'Comedero autoalimentador porcino 150 kg',
    desc: 'Comedero autoalimentador para cerdos en engorde. Capacidad 150 kg. Fabricado en acero galvanizado. Tolva de dosificación regulable.',
    price: 65000, loc: 9, phone: 5,
    attrs: { tipo_producto: 'Comedero', especie: 'Porcino', capacidad_kg: 150, material: 'Acero galvanizado' } },

  { cat: 'insumos', sub: 'herramientas',
    title: 'Mochila fumigadora 20L motor Honda GX35',
    desc: 'Mochila fumigadora 20 litros con motor Honda GX35. Lanza tipo pistola con extensión 1.5m. Ideal para fumigación en viñedos, frutales y parcelas pequeñas.',
    price: 185000, loc: 20, phone: 6,
    attrs: { tipo_producto: 'Fumigadora', motor: 'Honda GX35', capacidad_l: 20, tipo: 'Mochila' } },

  { cat: 'insumos', sub: 'hacienda',
    title: 'Rollos de silaje de sorgo, 500 kg c/u',
    desc: 'Silaje de sorgo granífero de excelente calidad, rollos de 500 kg envueltos en 6 capas. Cosechado en punto óptimo de humedad.',
    price: 38000, loc: 4, phone: 7,
    attrs: { tipo_producto: 'Forraje', cultivo: 'Sorgo granífero', formato: 'Rollo 500 kg', capas_film: 6 } },

  { cat: 'insumos', sub: 'hacienda',
    title: 'Aretes numerados SENASA, caja 100 unidades',
    desc: 'Aretes de identificación individual SENASA dobles, 100 unidades por caja. Números secuenciales, inalterables, aprobados para trazabilidad.',
    price: 35000, loc: 8, phone: 8,
    attrs: { tipo_producto: 'Identificación', tipo: 'Arete doble SENASA', cantidad: 100 } },

  { cat: 'insumos', sub: 'alambrados',
    title: 'Hilo cerca eléctrica 1000m alta resistencia',
    desc: 'Hilo conductor para cerca eléctrica, 1000 metros, resistencia 300 ohm/km. Apto para pastoreo rotativo y encierre de hacienda mayor y menor.',
    price: 28000, loc: 13, phone: 9,
    attrs: { tipo_producto: 'Hilo eléctrico', longitud_m: 1000, resistencia_ohm_km: 300 } },

  // ── MAQUINARIAS AGRÍCOLAS (20) ───────────────────────────────────────────────
  { cat: 'maquinarias', sub: 'tractores',
    title: 'Tractor John Deere 6145R 2022, 145HP',
    desc: 'Tractor John Deere 6145R, año 2022, 145 HP, 1200 horas originales. Transmisión Powerquad, cabina con aire acondicionado y monitor GreenStar. Un solo dueño, servicio oficial.',
    price: 85000000, loc: 7, phone: 0, year: 2022, cond: 'used',
    attrs: attTractor({ marca: 'John Deere', modelo: '6145R', anio: 2022, potenciaHp: 145, traccion: '4x4', transmision: 'Semi-powershift', cabina: true }) },

  { cat: 'maquinarias', sub: 'tractores',
    title: 'Tractor New Holland T6.180 2021, 180HP',
    desc: 'New Holland T6.180 electro-command, 180 CV, año 2021, 980 hs. Equipado con enganche delantero y doble tracción. Sistema electrónico completo. En excelente estado.',
    price: 95000000, loc: 9, phone: 1, year: 2021, cond: 'used',
    attrs: attTractor({ marca: 'New Holland', modelo: 'T6.180', anio: 2021, potenciaHp: 180, traccion: '4x4', transmision: 'Powershift', cabina: true }) },

  { cat: 'maquinarias', sub: 'tractores',
    title: 'Tractor Pauny EVO 500 2020, 215HP',
    desc: 'Tractor Pauny EVO 500, 215 HP, año 2020, 1800 hs. Nacional, muy buena asistencia técnica. Doble tracción, turbo, cabina climatizada.',
    price: 78000000, loc: 7, phone: 2, year: 2020, cond: 'used',
    attrs: attTractor({ marca: 'Pauny', modelo: 'EVO 500', anio: 2020, potenciaHp: 215, traccion: '4x4', transmision: 'Mecánica sincronizada', cabina: true }) },

  { cat: 'maquinarias', sub: 'tractores',
    title: 'Tractor Case Farmall 115C 2023, 115HP',
    desc: 'Case Farmall 115C, 115 HP, año 2023, 350 horas. Como nuevo. Ideal para trabajos medianos: siembra, pulverización, transporte de cosecha. Garantía de fábrica vigente.',
    price: 65000000, loc: 6, phone: 3, year: 2023, cond: 'used',
    attrs: attTractor({ marca: 'Case IH', modelo: 'Farmall 115C', anio: 2023, potenciaHp: 115, traccion: '4x2 asistida (DT)', transmision: 'Mecánica sincronizada', cabina: true }) },

  { cat: 'maquinarias', sub: 'tractores',
    title: 'Tractor Deutz-Fahr 5120G 2019, 120HP',
    desc: 'Deutz-Fahr 5120G, 120 HP, año 2019, 2400 hs. Motor refrigerado a aire, muy económico en combustible. Doble tracción, cuatro cilindros.',
    price: 52000000, loc: 11, phone: 4, year: 2019, cond: 'used',
    attrs: attTractor({ marca: 'Deutz-Fahr', modelo: '5120G', anio: 2019, potenciaHp: 120, traccion: '4x4', transmision: 'Mecánica', cabina: false }) },

  { cat: 'maquinarias', sub: 'sembradoras',
    title: 'Sembradora Agrometal MX 7250, 9 surcos',
    desc: 'Sembradora Agrometal MX 7250, 9 surcos a 52 cm para grano grueso. Monitor de siembra, tolva fertilizadora. Muy buen estado. Apta para soja, maíz y girasol.',
    price: 38000000, loc: 3, phone: 5, cond: 'used',
    attrs: attSembradora({ marca: 'Agrometal', surcos: 9, espaciado: 52, cultivo: 'Grano grueso (soja, maíz, girasol)' }) },

  { cat: 'maquinarias', sub: 'sembradoras',
    title: 'Sembradora Giorgi Super Star 5020, 2021',
    desc: 'Sembradora Giorgi Super Star 5020, 20 surcos a 17.5 cm para grano fino. Año 2021, muy poco uso. Monitor de siembra Precision. Ideal para trigo y cebada.',
    price: 42000000, loc: 10, phone: 6, year: 2021, cond: 'used',
    attrs: attSembradora({ marca: 'Giorgi', surcos: 20, espaciado: 17.5, cultivo: 'Grano fino (trigo, cebada)' }) },

  { cat: 'maquinarias', sub: 'sembradoras',
    title: 'Sembradora Yomel Hydra 6030, 2020',
    desc: 'Sembradora de grano grueso Yomel Hydra 6030, 30 líneas, año 2020. Distribución hidráulica, monitor de siembra. Zona Marcos Juárez, Córdoba.',
    price: 35000000, loc: 7, phone: 7, year: 2020, cond: 'used',
    attrs: attSembradora({ marca: 'Yomel', surcos: 30, espaciado: 52, cultivo: 'Grano grueso' }) },

  { cat: 'maquinarias', sub: 'cosechadoras',
    title: 'Cosechadora John Deere S760 2020, 350HP',
    desc: 'Cosechadora JD S760, año 2020, 350 HP, 1200 hs threshing. Monitor de rendimiento, piloto automático. Plataforma draper 30 pies incluida.',
    price: 180000000, loc: 9, phone: 8, year: 2020, cond: 'used',
    attrs: attCosechadora({ marca: 'John Deere', modelo: 'S760', anio: 2020, hp: 'Mayor a 201 HP', horas: 1200, cultivo: ['Soja', 'Maíz', 'Trigo'], tipoTrilla: 'Axial' }) },

  { cat: 'maquinarias', sub: 'cosechadoras',
    title: 'Cosechadora Case IH 8250 2019, 370HP',
    desc: 'Case IH Axial-Flow 8250, 370 HP, año 2019, 1500 hs. Rotor axial de alta performance. AFS Pro 700 monitor completo. Plataforma 35 pies.',
    price: 165000000, loc: 6, phone: 9, year: 2019, cond: 'used',
    attrs: attCosechadora({ marca: 'Case IH', modelo: 'Axial-Flow 8250', anio: 2019, hp: 'Mayor a 201 HP', horas: 1500, cultivo: ['Soja', 'Maíz', 'Girasol'], tipoTrilla: 'Axial' }) },

  { cat: 'maquinarias', sub: 'cosechadoras',
    title: 'Cosechadora Don Roque AX 4800, 2021',
    desc: 'Don Roque AX 4800, 2021, 650 hs de cosecha. Nacional, excelente asistencia técnica en todo el país. Monitor de rendimiento, plataforma girasol incluida.',
    price: 120000000, loc: 7, phone: 0, year: 2021, cond: 'used',
    attrs: attCosechadora({ marca: 'Don Roque', modelo: 'AX 4800', anio: 2021, hp: 'Mayor a 201 HP', horas: 650, cultivo: ['Soja', 'Maíz', 'Girasol', 'Sorgo'], tipoTrilla: 'Convencional' }) },

  { cat: 'maquinarias', sub: 'pulverizadoras',
    title: 'Pulverizadora Metalfor 4200 EXP 2021',
    desc: 'Pulverizadora autopropulsada Metalfor 4200 EXP, año 2021, 4200 litros, botalón 36 metros. GPS y corte sección automático. 1400 hs. Santa Fe.',
    price: 65000000, loc: 10, phone: 1, year: 2021, cond: 'used',
    attrs: { marca: 'Metalfor', modelo: '4200 EXP', anio: 2021, condicion: 'Usado', capacidad_l: 4200, ancho_botalon_m: 36, horas: 1400, tipo: 'Autopropulsada', gps: true, corte_seccion: true } },

  { cat: 'maquinarias', sub: 'pulverizadoras',
    title: 'Pulverizadora Jacto Condor 2000L autopropulsada',
    desc: 'Jacto Condor 3030 autopropulsada, 3000 litros, botalón 30 m. Monitoreo electrónico, bomba centrífuga. Año 2020, 900 hs.',
    price: 95000000, loc: 7, phone: 2, year: 2020, cond: 'used',
    attrs: { marca: 'Jacto', modelo: 'Condor 3030', anio: 2020, condicion: 'Usado', capacidad_l: 3000, ancho_botalon_m: 30, horas: 900, tipo: 'Autopropulsada' } },

  { cat: 'maquinarias', sub: 'arados',
    title: 'Arado de discos reversible 6 cuerpos',
    desc: 'Arado de discos reversible marca Agromec, 6 cuerpos. Discos de 26 pulgadas. Marco reforzado, rejas intercambiables. Muy buen estado, trabajó poco.',
    price: 18000000, loc: 14, phone: 3, cond: 'used',
    attrs: { marca: 'Agromec', tipo: 'Discos reversible', cuerpos: 6, diametro_discos_pulg: 26, condicion: 'Usado' } },

  { cat: 'maquinarias', sub: 'rastras',
    title: 'Rastra de discos pesada 36 platos Baldan',
    desc: 'Rastra de discos Baldan 36 platos de 28 pulgadas. Cuerpos en tándem, arco de regulación hidráulica. Trabajo ancho 5.40 m. Poco uso, en excelente estado.',
    price: 15000000, loc: 2, phone: 4, cond: 'used',
    attrs: { marca: 'Baldan', tipo: 'Discos pesada tándem', platos: 36, diametro_pulg: 28, ancho_trabajo_m: 5.4, condicion: 'Usado' } },

  { cat: 'maquinarias', sub: 'tolvas',
    title: 'Tolva autodescargable 30 TN acero pintado',
    desc: 'Tolva autodescargable marca Neoform 30 toneladas. Sinfín 10 pulgadas con motor hidráulico. Rodado 18.4 x 26. Excelente estado, poco uso.',
    price: 28000000, loc: 7, phone: 5, cond: 'used',
    attrs: { marca: 'Neoform', capacidad_tn: 30, sinfin_pulg: 10, tipo_descarga: 'Autodescargable hidráulica', condicion: 'Usado' } },

  { cat: 'maquinarias', sub: 'fertilizadoras',
    title: 'Fertilizadora centrífuga Yomel 2500, 2020',
    desc: 'Fertilizadora centrífuga Yomel 2500, año 2020, tolva 2500 kg. Dosificación electrónica de caudal variable. Apta para urea, fosfato y mezclas.',
    price: 22000000, loc: 7, phone: 6, year: 2020, cond: 'used',
    attrs: { marca: 'Yomel', modelo: '2500', anio: 2020, capacidad_kg: 2500, tipo: 'Centrífuga', dosificacion: 'Electrónica variable', condicion: 'Usado' } },

  { cat: 'maquinarias', sub: 'camiones',
    title: 'Camión Scania R450 volcador agrícola 2019',
    desc: 'Scania R450 año 2019, carrocería volcadora agrícola de 18 m³. Caja automática Opticruise. 480.000 km reales. Motor sin reparación. En perfecto estado.',
    price: 75000000, loc: 9, phone: 7, year: 2019, cond: 'used',
    attrs: { marca: 'Scania', modelo: 'R450', anio: 2019, condicion: 'Usado', carroceria: 'Volcador agrícola', capacidad_m3: 18, km: 480000, transmision: 'Automática Opticruise' } },

  { cat: 'maquinarias', sub: 'camiones',
    title: 'Toyota Hilux 4x4 DC 2022, muy pocos km',
    desc: 'Toyota Hilux 2.8 TDi 4x4 Doble Cabina SRX, año 2022, 35.000 km reales. Impecable, con service oficial al día. Ideal para campo y traslados rurales.',
    price: 38000000, loc: 0, phone: 8, year: 2022, cond: 'used',
    attrs: { marca: 'Toyota', modelo: 'Hilux SRX 4x4 DC', anio: 2022, condicion: 'Usado', km: 35000, traccion: '4x4', combustible: 'Diesel' } },

  { cat: 'maquinarias', sub: 'tolvas',
    title: 'Mixer vertical 20m3 electrónico ganadero',
    desc: 'Mixer vertical de 20 m³ marca Papalardo, cuchillas verticales con pesaje electrónico. Ideal para feedlot o tambo con 200+ cabezas. Año 2021.',
    price: 32000000, loc: 3, phone: 9, year: 2021, cond: 'used',
    attrs: { marca: 'Papalardo', tipo: 'Mixer vertical', capacidad_m3: 20, pesaje: 'Electrónico', anio: 2021, condicion: 'Usado' } },

  // ── SERVICIOS RURALES (20) ───────────────────────────────────────────────────
  { cat: 'servicios', sub: 'veterinarias',
    title: 'Servicio veterinario a campo, bovinos y equinos',
    desc: 'Veterinario con 15 años de experiencia en producción bovina y equina. Servicio de sanidad preventiva, cirugías a campo, diagnóstico de preñez, tactos y asesoramiento reproductivo. Zona BsAs y Santa Fe.',
    price: null, loc: 0, phone: 0, type: 'service',
    attrs: { especialidad: 'Bovinos y equinos', modalidad: 'A campo', cobertura: 'Buenos Aires y Santa Fe', años_experiencia: 15 } },

  { cat: 'servicios', sub: 'veterinarias',
    title: 'Veterinaria móvil, atención de emergencias 24hs',
    desc: 'Atención de urgencias veterinarias las 24 horas para hacienda vacuna, equina y porcina. Equipamiento completo en camioneta. Cobertura en toda la provincia de Córdoba.',
    price: null, loc: 6, phone: 1, type: 'service',
    attrs: { especialidad: 'Hacienda mayor y porcina', modalidad: 'Móvil 24hs', cobertura: 'Córdoba' } },

  { cat: 'servicios', sub: 'veterinarias',
    title: 'Vacunación y sanidad integral de rodeos',
    desc: 'Programa sanitario completo para rodeos: vacunación aftosa, brucelosis, Mancha/Gangrena, desparasitación y control de parásitos externos. Precio por cabeza. Zona pampeana.',
    price: 8500, loc: 9, phone: 2, type: 'service',
    attrs: { tipo_servicio: 'Sanidad rodeo', precio_modalidad: 'Por cabeza', incluye: ['Aftosa', 'Brucelosis', 'Mancha/Gangrena', 'Antiparasitario'] } },

  { cat: 'servicios', sub: 'siembra_svc',
    title: 'Siembra directa a servicio, zona pampeana',
    desc: 'Contratista de siembra directa con equipo propio Agrometal 11 surcos. Soja, maíz, girasol y trigo. Precio por hectárea, incluye semilla o sin semilla. Zona centro-norte BsAs.',
    price: 35000, loc: 2, phone: 3, type: 'service',
    attrs: { tipo_servicio: 'Siembra directa', equipo: 'Agrometal 11 surcos', cultivos: ['Soja', 'Maíz', 'Girasol', 'Trigo'], precio_modalidad: 'Por hectárea' } },

  { cat: 'servicios', sub: 'siembra_svc',
    title: 'Contratismo de siembra, máquina Yomel 9 surcos',
    desc: 'Servicio de siembra de grano grueso con sembradora Yomel 9 surcos. Monitoreo de siembra incluido. Disponibilidad para campaña 2026/27. Precios competitivos. Santa Fe y Córdoba.',
    price: 32000, loc: 10, phone: 4, type: 'service',
    attrs: { tipo_servicio: 'Siembra directa', equipo: 'Yomel 9 surcos', cultivos: ['Soja', 'Maíz'], precio_modalidad: 'Por hectárea' } },

  { cat: 'servicios', sub: 'cosecha_svc',
    title: 'Cosecha fina y gruesa, equipo completo',
    desc: 'Servicio de cosecha con JD S760 + plataformas para trigo, soja y maíz. Transporte y carretones propios. Disponible para campaña 2026. Reservas abiertas. Zona norte BsAs.',
    price: 25000, loc: 3, phone: 5, type: 'service',
    attrs: { tipo_servicio: 'Cosecha', equipo: 'JD S760', cultivos: ['Trigo', 'Soja', 'Maíz'], precio_modalidad: 'Por hectárea', incluye_transporte: true } },

  { cat: 'servicios', sub: 'cosecha_svc',
    title: 'Contratismo de cosecha, equipo JD S760',
    desc: 'Cosecha de soja, maíz, girasol y sorgo. Precio por tonelada o por hectárea. Equipo moderno, rendimientos superiores al promedio. Cobertura en La Pampa y sur de Córdoba.',
    price: 22000, loc: 13, phone: 6, type: 'service',
    attrs: { tipo_servicio: 'Cosecha', equipo: 'JD S760', cultivos: ['Soja', 'Maíz', 'Girasol', 'Sorgo'], precio_modalidad: 'Por ha o por tonelada' } },

  { cat: 'servicios', sub: 'cosecha_svc',
    title: 'Cosecha de girasol con plataforma especial',
    desc: 'Servicio especializado en cosecha de girasol. Plataforma específica con deflectores. Mínimas pérdidas garantizadas. Zona norte de BsAs y Chaco. Temporada 2026.',
    price: 28000, loc: 17, phone: 7, type: 'service',
    attrs: { tipo_servicio: 'Cosecha', cultivos: ['Girasol'], precio_modalidad: 'Por hectárea', plataforma_especial: true } },

  { cat: 'servicios', sub: 'pulvSvc',
    title: 'Pulverización terrestre 4200L, zona pampeana',
    desc: 'Servicio de pulverización terrestre con Metalfor 4200 EXP, botalón 36 m, GPS y corte automático por sección. Precio por hectárea aplicada. Mínimo 100 ha.',
    price: 18000, loc: 8, phone: 8, type: 'service',
    attrs: { tipo_servicio: 'Pulverización terrestre', equipo: 'Metalfor 4200 EXP', ancho_botalon_m: 36, precio_modalidad: 'Por hectárea', minimo_ha: 100 } },

  { cat: 'servicios', sub: 'pulvSvc',
    title: 'Fumigación aérea, todas las provincias',
    desc: 'Empresa aérea con 10 aviones agrícolas para fumigación y fertilización. Rapidez en aplicación ante ventanas climáticas. Precio por litro aplicado. Operamos en todo el país.',
    price: 22000, loc: 18, phone: 9, type: 'service',
    attrs: { tipo_servicio: 'Fumigación aérea', flota: '10 aviones agrícolas', precio_modalidad: 'Por litro aplicado', cobertura: 'Nacional' } },

  { cat: 'servicios', sub: 'pulvSvc',
    title: 'Pulverización UAV con drones, 50 has/día',
    desc: 'Servicio de pulverización con drones DJI T40. Ideal para lotes irregulares, zonas de difícil acceso y aplicaciones de precisión. GPS y mapas de prescripción. Todo el país.',
    price: 28000, loc: 7, phone: 0, type: 'service',
    attrs: { tipo_servicio: 'Pulverización drone', equipo: 'DJI T40', capacidad_ha_dia: 50, precio_modalidad: 'Por hectárea', gps: true } },

  { cat: 'servicios', sub: 'fertilSvc',
    title: 'Fertilización a granel con dosificación variable',
    desc: 'Servicio de fertilización terrestre con aplicación a tasa variable. Fertilizadora centrífuga 24 m de ancho. Urea, fosfato y mezclas. Cobertura en Santa Fe y Entre Ríos.',
    price: 15000, loc: 10, phone: 1, type: 'service',
    attrs: { tipo_servicio: 'Fertilización', tipo_aplicacion: 'Tasa variable', ancho_m: 24, fertilizantes: ['Urea', 'Fosfato', 'Mezclas'] } },

  { cat: 'servicios', sub: 'fertilSvc',
    title: 'Fertilización fosfórica y nitrogenada, zona pampeana',
    desc: 'Aplicación de fertilizantes sólidos y líquidos. Equipo propio con GPS y monitor de dosis. Análisis de suelo incluido. Trabajo sobre prescripción o tasa fija.',
    price: 16000, loc: 4, phone: 2, type: 'service',
    attrs: { tipo_servicio: 'Fertilización', tipos: ['Sólida', 'Líquida'], incluye_analisis_suelo: true, precio_modalidad: 'Por hectárea' } },

  { cat: 'servicios', sub: 'agronomas',
    title: 'Agrónomo de campo, asesoramiento técnico',
    desc: 'Ingeniero Agrónomo con especialización en producción de granos. Servicio de manejo de cultivos, análisis de suelo, diagnóstico de enfermedades y plagas. Visitas semanales. Zona Córdoba.',
    price: null, loc: 6, phone: 3, type: 'service',
    attrs: { especialidad: 'Producción de granos', modalidad: 'Visitas semanales', cobertura: 'Córdoba' } },

  { cat: 'servicios', sub: 'agronomas',
    title: 'Asesoramiento agronómico integral, campaña 2026/27',
    desc: 'Paquete integral de asesoramiento para la campaña 2026/27: planificación de siembra, seguimiento sanitario, gestión de nutrición y cierre de campaña con análisis de resultados.',
    price: null, loc: 9, phone: 4, type: 'service',
    attrs: { tipo_servicio: 'Asesoramiento campaña', campaña: '2026/27', incluye: ['Planificación', 'Seguimiento sanitario', 'Nutrición', 'Cierre de campaña'] } },

  { cat: 'servicios', sub: 'adminCampos',
    title: 'Administración de campos y establecimientos',
    desc: 'Empresa de administración rural con 20 años de experiencia. Gestión operativa completa: personal, insumos, labores, comercialización y rendición mensual. Referencias disponibles.',
    price: null, loc: 0, phone: 5, type: 'service',
    attrs: { tipo_servicio: 'Administración rural', años_experiencia: 20, incluye: ['Gestión personal', 'Insumos', 'Labores', 'Comercialización'] } },

  { cat: 'servicios', sub: 'consignatarias',
    title: 'Consignataria de hacienda, remates y directas',
    desc: 'Consignataria con 30 años en el mercado ganadero. Remates en tablada propia, ventas directas y operaciones de canjes. Cobertura en todo el Litoral y zona pampeana.',
    price: null, loc: 11, phone: 6, type: 'service',
    attrs: { tipo_servicio: 'Consignataria', años_experiencia: 30, modalidades: ['Remates', 'Ventas directas', 'Canjes'], cobertura: 'Litoral y pampeana' } },

  { cat: 'servicios', sub: 'consignatarias',
    title: 'Venta de hacienda en invernada, directas',
    desc: 'Operamos compra-venta de hacienda en invernada, en pie y faena. Contacto directo comprador-vendedor. Asesoramiento en precio de mercado. Toda la República Argentina.',
    price: null, loc: 15, phone: 7, type: 'service',
    attrs: { tipo_servicio: 'Venta hacienda', modalidades: ['En pie', 'Faena', 'Directas'], cobertura: 'Nacional' } },

  { cat: 'servicios', sub: 'granos',
    title: 'Comercialización de granos, FAS Rosario',
    desc: 'Empresa exportadora y acopiadora. Compramos soja, maíz, trigo y girasol a precio FAS Rosario con liquidación inmediata. Sin descuento por calidad dentro de estándar SENASA.',
    price: null, loc: 8, phone: 8, type: 'service',
    attrs: { tipo_servicio: 'Comercialización granos', granos: ['Soja', 'Maíz', 'Trigo', 'Girasol'], precio_referencia: 'FAS Rosario', liquidacion: 'Inmediata' } },

  { cat: 'servicios', sub: 'distribuidores',
    title: 'Distribución insumos agrícolas, zona pampeana',
    desc: 'Distribuidor oficial de agroquímicos, semillas y fertilizantes. Entrega en campo, financiación hasta la cosecha. Stock garantizado para campaña 2026. Córdoba, Santa Fe y BsAs.',
    price: null, loc: 7, phone: 9, type: 'service',
    attrs: { tipo_servicio: 'Distribución insumos', productos: ['Agroquímicos', 'Semillas', 'Fertilizantes'], financiacion: 'Hasta la cosecha', cobertura: 'Córdoba, Santa Fe, Buenos Aires' } },

  { cat: 'servicios', sub: 'cooperativas',
    title: 'Cooperativa agropecuaria, servicios integrales',
    desc: 'Cooperativa de más de 500 socios. Ofrecemos: acopio, insumos, maquinaria, crédito agropecuario y comercialización de granos y hacienda. Nuevos socios bienvenidos. Entre Ríos.',
    price: null, loc: 12, phone: 0, type: 'service',
    attrs: { tipo_servicio: 'Cooperativa', socios: 500, servicios: ['Acopio', 'Insumos', 'Maquinaria', 'Crédito', 'Comercialización'] } },
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
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

function getImages(sub, idx) {
  const pool = IMGS[sub] ?? IMGS['campos'];
  const i1   = pool[idx % pool.length];
  const i2   = pool[(idx + 1) % pool.length];
  return JSON.stringify([{ url: i1 }, { url: i2 }]);
}

async function seed(client, label) {
  const userRow = await client.query(
    `SELECT id FROM public.users WHERE role = 'superadmin' LIMIT 1`
  );
  const userId = userRow.rows[0]?.id ?? null;

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
    const loc    = LOCATIONS[s.loc % LOCATIONS.length];
    const phone  = PHONES[s.phone % PHONES.length];
    const sid    = shortId();
    const slug   = `${toSlug(s.title)}-${sid}`;
    const catId  = CAT[s.cat];
    const rawSub = SUB[s.sub] ?? null;
    const subId  = rawSub && existingSubs.has(rawSub) ? rawSub : null;
    const adType = s.type ?? 'product';
    const attrs  = s.attrs ?? {};

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
          price_negotiable, featured, views,
          attributes
        ) VALUES (
          $1,$2,$3,
          $4,$5,$6,'ARS',
          $7,$8,$9,
          'active','approved',
          $10,$11,
          $12::jsonb,$13,
          $14,$15,
          $16,$17,$18,
          $19,false,0,
          $20::jsonb
        )
      `, [
        userId, catId, subId,
        s.title, s.desc, s.price ?? null,
        loc.province, loc.city, `${loc.city}, ${loc.province}`,
        now, expires,
        getImages(s.sub, i), phone,
        slug, sid,
        adType, s.cond ?? null, s.year ?? null,
        s.neg ?? false,
        JSON.stringify(attrs),
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
if (target === 'dev'  || target === 'all') targets.push({ url: envVars.DEV_DB_URL,  label: '🟡 DEV' });
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
