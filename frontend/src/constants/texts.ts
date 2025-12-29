// ====================================================================
// TEXTOS Y TRADUCCIONES - Sistema de internacionalización
// ====================================================================

export const TEXTS = {
  // Estados y mensajes generales
  loading: 'Cargando...',
  error: 'Error',
  success: 'Éxito',
  
  // Ad Detail Page
  adDetail: {
    notFound: 'Aviso no encontrado',
    backToResults: 'Volver a resultados',
    back: 'Volver',
    home: 'Inicio',
    
    // Secciones
    description: 'Descripción',
    characteristics: 'Características',
    additionalCharacteristics: 'Características adicionales',
    technicalSpecs: 'Especificaciones técnicas',
    noSpecs: 'Sin especificaciones técnicas',
    contactSellerForDetails: 'Contactá al vendedor para más detalles sobre este producto',
    
    // Precio
    price: 'Precio',
    priceValue: 'Valor',
    consultPrice: 'Consultar',
    
    // Información General
    category: 'Categoría',
    subcategory: 'Tipo',
    brand: 'Marca',
    model: 'Modelo',
    year: 'Año',
    condition: 'Condición',
    location: 'Ubicación',
    
    // Vendedor
    seller: 'Vendedor',
    sellerInfo: 'Información del vendedor',
    otherAds: 'Otros avisos del vendedor',
    noOtherAds: 'No hay otros avisos disponibles',
    externalSource: 'Este aviso proviene de una fuente externa',
    
    // Contacto
    contactSeller: 'Contactar al vendedor',
    showContact: 'Ver datos de contacto',
    hideContact: 'Ocultar contacto',
    sendMessage: 'Enviar Mensaje',
    sending: 'Enviando...',
    messageSent: 'Mensaje enviado correctamente',
    alreadyContacted: 'Ya contactaste a este vendedor',
    contactAgain: 'Contactar nuevamente',
    cancel: 'Cancelar',
    
    // Formulario de contacto
    name: 'Nombre',
    lastName: 'Apellido',
    email: 'Email',
    phone: 'Teléfono',
    message: 'Tu mensaje...',
    sendingAs: 'Enviando como:',
    
    // Auth prompts
    loginToContact: 'Iniciá sesión para contactar',
    loginTip: '💡 Tip: Creá tu cuenta para publicar tus propios avisos',
    createAccountFree: 'Crear cuenta gratis',
    
    // Valores booleanos
    yes: 'Sí',
    no: 'No',
  },
  
  // Grupos de atributos (títulos)
  attributeGroups: {
    general: 'Información General',
    motor: 'Motor',
    transmision: 'Transmisión',
    dimensiones: 'Dimensiones',
    hidraulica: 'Sistema Hidráulico',
    cabina: 'Cabina y Confort',
    neumaticos: 'Neumáticos',
    toma_fuerza: 'Toma de Fuerza',
    capacidades: 'Capacidades',
    implementos: 'Implementos',
    otros: 'Otros',
  },
  
  // Formulario de publicación
  publishForm: {
    title: '¿Qué vas a publicar?',
    category: 'Categoría',
    subcategory: 'Subcategoría',
    technicalCharacteristics: 'Características técnicas',
    location: 'Ubicación',
    province: 'Provincia',
    locality: 'Localidad',
    photos: 'Fotos',
    information: 'Información',
    review: 'Revisar',
    publish: 'Publicar',
    continue: 'Continuar',
  },
  
  // Common UI
  common: {
    loading: 'Cargando...',
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    confirm: 'Confirmar',
    close: 'Cerrar',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    more: 'Ver más',
    less: 'Ver menos',
  },
};

// Tipo para autocompletado
export type TextsKey = keyof typeof TEXTS;
export type AdDetailKey = keyof typeof TEXTS.adDetail;
export type AttributeGroupKey = keyof typeof TEXTS.attributeGroups;
