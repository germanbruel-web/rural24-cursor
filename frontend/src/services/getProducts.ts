import { supabase } from "./supabaseClient";
import { transformAdToProduct } from "./adsService";
import type { Ad } from "../../types";
import { logger } from "../utils/logger";

/**
 * Obtiene productos desde múltiples fuentes:
 * - Tabla 'ads': Avisos creados por usuarios (status='active')
 * - Tabla 'products': Productos legacy/mock (mantener compatibilidad)
 *
 * ✅ OPTIMIZADO: Usa LEFT JOIN para obtener nombres de categorías/subcategorías en 1 query
 * ✅ NORMALIZADO: Usa transformAdToProduct() para consistencia
 */
export const getProducts = async () => {
  try {
    const { data: ads, error: adsError } = await supabase
      .from("ads")
      .select(`
        *,
        categories:category_id(id, display_name, slug),
        subcategories:subcategory_id(id, display_name, slug)
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (adsError) {
      logger.error("[getProducts] Error fetching ads:", adsError.message);
    }

    // Mapear ads: priorizar nombre de relación JOIN, fallback a campo directo
    const mappedAds = (ads || []).map((ad: any) => {
      const enrichedAd = {
        ...ad,
        category: ad.categories?.display_name || ad.category || null,
        subcategory: ad.subcategories?.display_name || ad.subcategory || null,
      };
      return transformAdToProduct(enrichedAd as Ad);
    });

    // Productos legacy (tabla puede no existir — ignorar PGRST116)
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*");

    if (productsError && productsError.code !== 'PGRST116') {
      logger.error("[getProducts] Error fetching legacy products:", productsError.message);
    }

    logger.debug(`[getProducts] ${mappedAds.length} ads + ${products?.length ?? 0} legacy`);

    return [...mappedAds, ...(products || [])];
  } catch (error) {
    logger.error("[getProducts] Error crítico:", error);
    return [];
  }
};
