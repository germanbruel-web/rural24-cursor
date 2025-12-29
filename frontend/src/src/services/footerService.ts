/**
 * =====================================================
 * FOOTER SERVICE - Gestión del Footer Dinámico
 * =====================================================
 * Servicio para manejar configuración del footer
 */

import { supabase } from './supabaseClient';
import { getSetting, updateSetting } from './siteSettingsService';
import { getCategories } from './categoriesService';
import type {
  FooterConfig,
  ContactItem,
  FooterLinkItem,
  SocialLinkItem,
  ContactType,
  ColumnNumber,
  Category
} from '../types/footer';
import { DEFAULT_FOOTER_CONFIG, FALLBACK_CATEGORIES } from '../utils/footerDefaults';
import { validateFooterConfig } from '../utils/footerValidations';

// ============ FUNCIONES BASE ============

/**
 * Obtener configuración del footer desde BD
 */
export async function getFooterConfig(): Promise<FooterConfig> {
  try {
    const settingValue = await getSetting('footer_config');
    
    if (!settingValue) {
      console.warn('⚠️ Footer config no existe en BD, usando defaults');
      return DEFAULT_FOOTER_CONFIG;
    }
    
    const config = JSON.parse(settingValue) as FooterConfig;
    
    // Validar configuración
    const validation = validateFooterConfig(config);
    if (!validation.isValid) {
      console.error('❌ Footer config inválido:', validation.errors);
      console.warn('⚠️ Usando defaults por errores de validación');
      return DEFAULT_FOOTER_CONFIG;
    }
    
    console.log('✅ Footer config cargado desde BD');
    return config;
    
  } catch (error) {
    console.error('❌ Error obteniendo footer config:', error);
    console.warn('⚠️ Usando defaults por error de parsing');
    return DEFAULT_FOOTER_CONFIG;
  }
}

/**
 * Actualizar configuración completa del footer
 * (Solo SuperAdmin)
 */
export async function updateFooterConfig(config: FooterConfig): Promise<boolean> {
  try {
    // Validar antes de guardar
    const validation = validateFooterConfig(config);
    if (!validation.isValid) {
      console.error('❌ Validación falló:', validation.errors);
      return false;
    }
    
    const result = await updateSetting({
      setting_key: 'footer_config',
      setting_value: JSON.stringify(config)
    });
    
    if (result) {
      console.log('✅ Footer config actualizado');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error actualizando footer config:', error);
    return false;
  }
}

// ============ COLUMNA 1: CONTACTO ============

/**
 * Actualizar columna 1 (contacto)
 */
export async function updateColumn1(
  logoKey: string,
  slogan: string,
  addresses: ContactItem[],
  phones: ContactItem[],
  emails: ContactItem[]
): Promise<boolean> {
  try {
    const currentConfig = await getFooterConfig();
    
    currentConfig.column1 = {
      type: 'contact',
      logoKey,
      slogan,
      addresses,
      phones,
      emails
    };
    
    return await updateFooterConfig(currentConfig);
  } catch (error) {
    console.error('❌ Error actualizando columna 1:', error);
    return false;
  }
}

/**
 * Agregar item de contacto (dirección, teléfono o email)
 */
export async function addContactItem(
  column: ContactType,
  text: string,
  icon: string = 'Circle'
): Promise<string | null> {
  try {
    const currentConfig = await getFooterConfig();
    const items = currentConfig.column1[column];
    
    // Calcular siguiente order
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order)) : 0;
    
    const newItem: ContactItem = {
      id: `${column}-${Date.now()}`,
      icon,
      text,
      order: maxOrder + 1
    };
    
    items.push(newItem);
    
    const success = await updateFooterConfig(currentConfig);
    return success ? newItem.id : null;
    
  } catch (error) {
    console.error(`❌ Error agregando ${column}:`, error);
    return null;
  }
}

/**
 * Eliminar item de contacto
 */
export async function removeContactItem(
  column: ContactType,
  itemId: string
): Promise<boolean> {
  try {
    const currentConfig = await getFooterConfig();
    const items = currentConfig.column1[column];
    
    // No permitir eliminar el último item
    if (items.length === 1) {
      console.warn(`⚠️ No se puede eliminar el último ${column}`);
      return false;
    }
    
    currentConfig.column1[column] = items.filter(item => item.id !== itemId);
    
    return await updateFooterConfig(currentConfig);
    
  } catch (error) {
    console.error(`❌ Error eliminando ${column}:`, error);
    return false;
  }
}

/**
 * Reordenar items de contacto
 */
export async function reorderContactItems(
  column: ContactType,
  itemIds: string[]
): Promise<boolean> {
  try {
    const currentConfig = await getFooterConfig();
    const items = currentConfig.column1[column];
    
    // Crear mapa de items por ID
    const itemsMap = new Map(items.map(item => [item.id, item]));
    
    // Reordenar según nuevo array de IDs
    const reorderedItems = itemIds.map((id, index) => {
      const item = itemsMap.get(id);
      if (!item) throw new Error(`Item ${id} no encontrado`);
      return { ...item, order: index + 1 };
    });
    
    currentConfig.column1[column] = reorderedItems;
    
    return await updateFooterConfig(currentConfig);
    
  } catch (error) {
    console.error(`❌ Error reordenando ${column}:`, error);
    return false;
  }
}

/**
 * Actualizar item de contacto específico
 */
export async function updateContactItem(
  column: ContactType,
  itemId: string,
  updates: Partial<Omit<ContactItem, 'id'>>
): Promise<boolean> {
  try {
    const currentConfig = await getFooterConfig();
    const items = currentConfig.column1[column];
    
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      console.error(`❌ Item ${itemId} no encontrado`);
      return false;
    }
    
    items[itemIndex] = { ...items[itemIndex], ...updates };
    
    return await updateFooterConfig(currentConfig);
    
  } catch (error) {
    console.error(`❌ Error actualizando ${column}:`, error);
    return false;
  }
}

// ============ COLUMNA 2: LINKS PERSONALIZADOS ============

/**
 * Actualizar columna 2 (links)
 */
export async function updateColumn2(title: string, items: FooterLinkItem[]): Promise<boolean> {
  try {
    const currentConfig = await getFooterConfig();
    
    currentConfig.column2 = {
      type: 'links',
      title,
      items
    };
    
    return await updateFooterConfig(currentConfig);
  } catch (error) {
    console.error('❌ Error actualizando columna 2:', error);
    return false;
  }
}

/**
 * Agregar link (columna 2 o 4)
 */
export async function addLink(
  columnNumber: ColumnNumber,
  label: string,
  url: string,
  openNewTab: boolean = false
): Promise<string | null> {
  try {
    const currentConfig = await getFooterConfig();
    const column = columnNumber === 2 ? currentConfig.column2 : currentConfig.column4;
    const items = columnNumber === 2 ? column.items : column.links;
    
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order)) : 0;
    
    const newLink: FooterLinkItem = {
      id: `link-${columnNumber}-${Date.now()}`,
      label,
      url,
      order: maxOrder + 1,
      openNewTab
    };
    
    items.push(newLink);
    
    const success = await updateFooterConfig(currentConfig);
    return success ? newLink.id : null;
    
  } catch (error) {
    console.error(`❌ Error agregando link a columna ${columnNumber}:`, error);
    return null;
  }
}

/**
 * Eliminar link
 */
export async function removeLink(columnNumber: ColumnNumber, linkId: string): Promise<boolean> {
  try {
    const currentConfig = await getFooterConfig();
    const column = columnNumber === 2 ? currentConfig.column2 : currentConfig.column4;
    const items = columnNumber === 2 ? column.items : column.links;
    
    // No permitir eliminar el último link
    if (items.length === 1) {
      console.warn(`⚠️ No se puede eliminar el último link de columna ${columnNumber}`);
      return false;
    }
    
    const filtered = items.filter(item => item.id !== linkId);
    
    if (columnNumber === 2) {
      currentConfig.column2.items = filtered;
    } else {
      currentConfig.column4.links = filtered;
    }
    
    return await updateFooterConfig(currentConfig);
    
  } catch (error) {
    console.error(`❌ Error eliminando link de columna ${columnNumber}:`, error);
    return false;
  }
}

/**
 * Reordenar links
 */
export async function reorderLinks(columnNumber: ColumnNumber, linkIds: string[]): Promise<boolean> {
  try {
    const currentConfig = await getFooterConfig();
    const column = columnNumber === 2 ? currentConfig.column2 : currentConfig.column4;
    const items = columnNumber === 2 ? column.items : column.links;
    
    const itemsMap = new Map(items.map(item => [item.id, item]));
    
    const reorderedItems = linkIds.map((id, index) => {
      const item = itemsMap.get(id);
      if (!item) throw new Error(`Link ${id} no encontrado`);
      return { ...item, order: index + 1 };
    });
    
    if (columnNumber === 2) {
      currentConfig.column2.items = reorderedItems;
    } else {
      currentConfig.column4.links = reorderedItems;
    }
    
    return await updateFooterConfig(currentConfig);
    
  } catch (error) {
    console.error(`❌ Error reordenando links de columna ${columnNumber}:`, error);
    return false;
  }
}

/**
 * Actualizar link específico
 */
export async function updateLink(
  columnNumber: ColumnNumber,
  linkId: string,
  updates: Partial<Omit<FooterLinkItem, 'id'>>
): Promise<boolean> {
  try {
    const currentConfig = await getFooterConfig();
    const column = columnNumber === 2 ? currentConfig.column2 : currentConfig.column4;
    const items = columnNumber === 2 ? column.items : column.links;
    
    const itemIndex = items.findIndex(item => item.id === linkId);
    if (itemIndex === -1) {
      console.error(`❌ Link ${linkId} no encontrado`);
      return false;
    }
    
    items[itemIndex] = { ...items[itemIndex], ...updates };
    
    return await updateFooterConfig(currentConfig);
    
  } catch (error) {
    console.error(`❌ Error actualizando link:`, error);
    return false;
  }
}

// ============ COLUMNA 3: CATEGORÍAS ============

/**
 * Actualizar columna 3 (categorías)
 */
export async function updateColumn3(
  title: string,
  source: 'dynamic' | 'manual',
  limit: number,
  manualItems?: FooterLinkItem[]
): Promise<boolean> {
  try {
    const currentConfig = await getFooterConfig();
    
    currentConfig.column3 = {
      type: 'categories',
      title,
      source,
      limit,
      manualItems: source === 'manual' ? manualItems : undefined
    };
    
    return await updateFooterConfig(currentConfig);
  } catch (error) {
    console.error('❌ Error actualizando columna 3:', error);
    return false;
  }
}

/**
 * Obtener categorías dinámicas (para renderizado en frontend)
 */
export async function getDynamicCategories(limit: number): Promise<Category[]> {
  try {
    const categories = await getCategories();
    
    if (!categories || categories.length === 0) {
      console.warn('⚠️ No hay categorías en BD, usando fallback');
      return FALLBACK_CATEGORIES.slice(0, limit);
    }
    
    // Mapear a formato Footer Category
    const footerCategories: Category[] = categories
      .filter((cat: any) => cat.is_active)
      .slice(0, limit)
      .map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
        display_name: cat.display_name || cat.name
      }));
    
    return footerCategories;
    
  } catch (error) {
    console.error('❌ Error obteniendo categorías dinámicas:', error);
    return FALLBACK_CATEGORIES.slice(0, limit);
  }
}

// ============ COLUMNA 4: REDES SOCIALES ============

/**
 * Actualizar columna 4 (mixed: links + socials)
 */
export async function updateColumn4(
  title: string,
  links: FooterLinkItem[],
  socials: SocialLinkItem[]
): Promise<boolean> {
  try {
    const currentConfig = await getFooterConfig();
    
    currentConfig.column4 = {
      type: 'mixed',
      title,
      links,
      socials
    };
    
    return await updateFooterConfig(currentConfig);
  } catch (error) {
    console.error('❌ Error actualizando columna 4:', error);
    return false;
  }
}

/**
 * Agregar red social
 */
export async function addSocial(
  platform: SocialLinkItem['platform'],
  url: string
): Promise<string | null> {
  try {
    const currentConfig = await getFooterConfig();
    const socials = currentConfig.column4.socials;
    
    // Verificar que no exista ya esa plataforma
    if (socials.some(s => s.platform === platform)) {
      console.warn(`⚠️ Ya existe ${platform} en las redes sociales`);
      return null;
    }
    
    const maxOrder = socials.length > 0 ? Math.max(...socials.map(s => s.order)) : 0;
    
    const newSocial: SocialLinkItem = {
      id: `social-${Date.now()}`,
      platform,
      url,
      order: maxOrder + 1
    };
    
    socials.push(newSocial);
    
    const success = await updateFooterConfig(currentConfig);
    return success ? newSocial.id : null;
    
  } catch (error) {
    console.error('❌ Error agregando red social:', error);
    return null;
  }
}

/**
 * Eliminar red social
 */
export async function removeSocial(socialId: string): Promise<boolean> {
  try {
    const currentConfig = await getFooterConfig();
    const socials = currentConfig.column4.socials;
    
    // No permitir eliminar la última red social
    if (socials.length === 1) {
      console.warn('⚠️ No se puede eliminar la última red social');
      return false;
    }
    
    currentConfig.column4.socials = socials.filter(s => s.id !== socialId);
    
    return await updateFooterConfig(currentConfig);
    
  } catch (error) {
    console.error('❌ Error eliminando red social:', error);
    return false;
  }
}

/**
 * Reordenar redes sociales
 */
export async function reorderSocials(socialIds: string[]): Promise<boolean> {
  try {
    const currentConfig = await getFooterConfig();
    const socials = currentConfig.column4.socials;
    
    const socialsMap = new Map(socials.map(s => [s.id, s]));
    
    const reorderedSocials = socialIds.map((id, index) => {
      const social = socialsMap.get(id);
      if (!social) throw new Error(`Social ${id} no encontrado`);
      return { ...social, order: index + 1 };
    });
    
    currentConfig.column4.socials = reorderedSocials;
    
    return await updateFooterConfig(currentConfig);
    
  } catch (error) {
    console.error('❌ Error reordenando redes sociales:', error);
    return false;
  }
}

/**
 * Actualizar red social específica
 */
export async function updateSocial(
  socialId: string,
  updates: Partial<Omit<SocialLinkItem, 'id'>>
): Promise<boolean> {
  try {
    const currentConfig = await getFooterConfig();
    const socials = currentConfig.column4.socials;
    
    const socialIndex = socials.findIndex(s => s.id === socialId);
    if (socialIndex === -1) {
      console.error(`❌ Social ${socialId} no encontrado`);
      return false;
    }
    
    // Si se cambia platform, verificar que no exista ya
    if (updates.platform && updates.platform !== socials[socialIndex].platform) {
      if (socials.some(s => s.platform === updates.platform)) {
        console.warn(`⚠️ Ya existe ${updates.platform} en las redes sociales`);
        return false;
      }
    }
    
    socials[socialIndex] = { ...socials[socialIndex], ...updates };
    
    return await updateFooterConfig(currentConfig);
    
  } catch (error) {
    console.error('❌ Error actualizando red social:', error);
    return false;
  }
}

// ============ UTILITIES ============

/**
 * Resetear footer a configuración por defecto
 */
export async function resetFooterToDefault(): Promise<boolean> {
  try {
    return await updateFooterConfig(DEFAULT_FOOTER_CONFIG);
  } catch (error) {
    console.error('❌ Error reseteando footer:', error);
    return false;
  }
}

/**
 * Exportar configuración actual (para backup)
 */
export async function exportFooterConfig(): Promise<string | null> {
  try {
    const config = await getFooterConfig();
    return JSON.stringify(config, null, 2);
  } catch (error) {
    console.error('❌ Error exportando footer config:', error);
    return null;
  }
}

/**
 * Importar configuración desde JSON
 */
export async function importFooterConfig(jsonString: string): Promise<boolean> {
  try {
    const config = JSON.parse(jsonString) as FooterConfig;
    return await updateFooterConfig(config);
  } catch (error) {
    console.error('❌ Error importando footer config:', error);
    return false;
  }
}
