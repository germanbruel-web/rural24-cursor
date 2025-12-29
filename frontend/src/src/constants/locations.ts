/**
 * Provincias de Argentina (23 provincias + CABA)
 * Ordenadas alfabéticamente para mejor UX en dropdowns
 */
export const PROVINCES = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Ciudad Autónoma de Buenos Aires',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
] as const;

export type Province = typeof PROVINCES[number];

/**
 * Localidades principales por provincia
 * Incluye ciudades y localidades relevantes para el sector agropecuario
 */
export const LOCALITIES_BY_PROVINCE: Record<string, string[]> = {
  'Buenos Aires': [
    '9 de Julio', 'Alberti', 'Arrecifes', 'Ayacucho', 'Azul', 'Bahía Blanca', 
    'Balcarce', 'Baradero', 'Benito Juárez', 'Berisso', 'Bolívar', 'Bragado',
    'Brandsen', 'Campana', 'Cañuelas', 'Capitán Sarmiento', 'Carlos Casares',
    'Carlos Tejedor', 'Carmen de Areco', 'Castelli', 'Chacabuco', 'Chascomús',
    'Chivilcoy', 'Colón', 'Coronel Dorrego', 'Coronel Pringles', 'Coronel Suárez',
    'Daireaux', 'Dolores', 'Ensenada', 'General Alvarado', 'General Alvear',
    'General Arenales', 'General Belgrano', 'General Guido', 'General La Madrid',
    'General Las Heras', 'General Madariaga', 'General Paz', 'General Pinto',
    'General Pueyrredón', 'General Rodríguez', 'General Viamonte', 'General Villegas',
    'Guaminí', 'Hipólito Yrigoyen', 'Junín', 'La Plata', 'Laprida', 'Las Flores',
    'Leandro N. Alem', 'Lincoln', 'Lobería', 'Lobos', 'Lomas de Zamora', 'Luján',
    'Maipú', 'Mar Chiquita', 'Mar del Plata', 'Marcos Paz', 'Mercedes', 'Monte',
    'Navarro', 'Necochea', 'Olavarría', 'Pergamino', 'Pehuajó', 'Pellegrini',
    'Pilar', 'Puan', 'Punta Alta', 'Quilmes', 'Ramallo', 'Rauch', 'Rivadavia',
    'Rojas', 'Roque Pérez', 'Saavedra', 'Saladillo', 'Salliqueló', 'Salto',
    'San Andrés de Giles', 'San Antonio de Areco', 'San Cayetano', 'San Fernando',
    'San Nicolás', 'San Pedro', 'San Vicente', 'Suipacha', 'Tandil', 'Tapalqué',
    'Tigre', 'Tordillo', 'Tornquist', 'Trenque Lauquen', 'Tres Arroyos', 'Tres Lomas',
    'Veinticinco de Mayo', 'Vicente López', 'Villa Gesell', 'Villarino', 'Zárate'
  ],
  'Catamarca': [
    'Andalgalá', 'Belén', 'Catamarca', 'Tinogasta', 'Santa María'
  ],
  'Chaco': [
    'Charata', 'General San Martín', 'Presidencia Roque Sáenz Peña', 
    'Quitilipi', 'Resistencia', 'Villa Ángela'
  ],
  'Chubut': [
    'Comodoro Rivadavia', 'Esquel', 'Puerto Madryn', 'Rawson', 'Trelew', 'Sarmiento'
  ],
  'Ciudad Autónoma de Buenos Aires': [
    'CABA - Centro', 'CABA - Palermo', 'CABA - Belgrano', 'CABA - Caballito'
  ],
  'Córdoba': [
    'Alta Gracia', 'Bell Ville', 'Carlos Paz', 'Córdoba Capital', 'Cruz del Eje',
    'Dean Funes', 'Jesús María', 'Laboulaye', 'Marcos Juárez', 'Morteros',
    'Río Cuarto', 'Río Tercero', 'San Francisco', 'Villa Dolores', 'Villa María'
  ],
  'Corrientes': [
    'Bella Vista', 'Corrientes', 'Curuzú Cuatiá', 'Goya', 'Mercedes', 
    'Monte Caseros', 'Paso de los Libres', 'Santo Tomé'
  ],
  'Entre Ríos': [
    'Colón', 'Concepción del Uruguay', 'Concordia', 'Diamante', 'Federal',
    'Gualeguay', 'Gualeguaychú', 'La Paz', 'Nogoyá', 'Paraná', 
    'Victoria', 'Villaguay'
  ],
  'Formosa': [
    'Clorinda', 'Formosa', 'Laguna Blanca', 'Pirané'
  ],
  'Jujuy': [
    'Humahuaca', 'La Quiaca', 'Libertador General San Martín', 
    'Palpalá', 'Perico', 'San Pedro', 'San Salvador de Jujuy'
  ],
  'La Pampa': [
    'General Pico', 'Macachín', 'Realicó', 'Santa Rosa', 'Victorica'
  ],
  'La Rioja': [
    'Chilecito', 'La Rioja', 'Aimogasta', 'Chamical'
  ],
  'Mendoza': [
    'General Alvear', 'Godoy Cruz', 'Guaymallén', 'Luján de Cuyo', 
    'Maipú', 'Malargüe', 'Mendoza', 'Rivadavia', 'San Martín', 
    'San Rafael', 'Tunuyán', 'Tupungato'
  ],
  'Misiones': [
    'Apóstoles', 'Eldorado', 'Leandro N. Alem', 'Oberá', 'Posadas',
    'Puerto Iguazú', 'Puerto Rico', 'San Vicente'
  ],
  'Neuquén': [
    'Centenario', 'Cutral Có', 'Junín de los Andes', 'Neuquén', 
    'Plaza Huincul', 'San Martín de los Andes', 'Zapala'
  ],
  'Río Negro': [
    'Allen', 'Bariloche', 'Catriel', 'Cipolletti', 'El Bolsón', 
    'General Roca', 'Ingeniero Jacobacci', 'Viedma', 'Villa Regina'
  ],
  'Salta': [
    'Cafayate', 'Metán', 'Orán', 'Rosario de la Frontera', 'Salta', 
    'San Ramón de la Nueva Orán', 'Tartagal'
  ],
  'San Juan': [
    'Caucete', 'Pocito', 'Rawson', 'Rivadavia', 'San Juan', 
    'Santa Lucía', 'Valle Fértil'
  ],
  'San Luis': [
    'La Punta', 'Merlo', 'San Luis', 'Villa Mercedes'
  ],
  'Santa Cruz': [
    'Caleta Olivia', 'El Calafate', 'Perito Moreno', 'Pico Truncado', 
    'Puerto Deseado', 'Puerto San Julián', 'Río Gallegos', 'Río Turbio'
  ],
  'Santa Fe': [
    'Cañada de Gómez', 'Casilda', 'Esperanza', 'Firmat', 'Rafaela',
    'Reconquista', 'Rosario', 'Rufino', 'San Cristóbal', 'San Jorge',
    'San Lorenzo', 'Santa Fe', 'Venado Tuerto', 'Vera', 'Villa Constitución'
  ],
  'Santiago del Estero': [
    'Añatuya', 'Frías', 'La Banda', 'Monte Quemado', 'Quimilí', 
    'Santiago del Estero', 'Termas de Río Hondo'
  ],
  'Tierra del Fuego': [
    'Río Grande', 'Tolhuin', 'Ushuaia'
  ],
  'Tucumán': [
    'Aguilares', 'Banda del Río Salí', 'Concepción', 'Famaillá',
    'Monteros', 'San Miguel de Tucumán', 'Simoca', 'Tafí Viejo', 'Yerba Buena'
  ],
};
