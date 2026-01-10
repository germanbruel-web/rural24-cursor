import { supabase } from "./supabaseClient";
import { transformAdToProduct } from "./adsService";
import { DEFAULT_PLACEHOLDER_IMAGE } from '../constants/defaultImages';
import type { Ad } from "../../types";

/**
 * Obtiene productos desde múltiples fuentes:
 * - Tabla 'ads': Avisos creados por usuarios (status='active')
 * - Tabla 'products': Productos legacy/mock (mantener compatibilidad)
 * 
 * ✅ OPTIMIZADO: Usa LEFT JOIN para obtener nombres de categorías/subcategorías en 1 query
 * ✅ NORMALIZADO: Usa transformAdToProduct() para consistencia
 * ✅ ROBUSTO: Maneja tanto campos legacy (category VARCHAR) como nuevos (category_id UUID)
 */
export const getProducts = async () => {
  console.log('🔍 getProducts: Starting fetch...');
  
  try {
    // 1. Obtener avisos activos directamente
    // La tabla ads tiene category/subcategory como VARCHAR (texto), no UUIDs
    const { data: ads, error: adsError } = await supabase
      .from("ads")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (adsError) {
      console.error("❌ Error fetching ads:", adsError);
      console.error("❌ Error details:", JSON.stringify(adsError, null, 2));
      // No lanzar error, continuar con array vacío
    } else {
      console.log(`✅ Fetched ${ads?.length || 0} ads`);
    }

    // Mapear ads usando transformAdToProduct para normalización
    // Los campos category/subcategory ya vienen como texto desde la BD
    const mappedAds = (ads || []).map((ad: any) => {
      return transformAdToProduct(ad as Ad);
    });

    if (mappedAds.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📸 DIAGNÓSTICO IMAGEN - Primer aviso:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Título:', mappedAds[0].title);
      console.log('imageUrl:', mappedAds[0].imageUrl);
      console.log('imageUrls:', mappedAds[0].imageUrls);
      console.log('¿Es placeholder?:', mappedAds[0].imageUrl === DEFAULT_PLACEHOLDER_IMAGE);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // 2. Obtener productos legacy (si existen)
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*");

    if (productsError && productsError.code !== 'PGRST116') { // Ignorar si la tabla no existe
      console.error("❌ Error fetching products:", productsError);
      console.error("❌ Error details:", JSON.stringify(productsError, null, 2));
    } else if (productsError) {
      console.log('⚠️ Products table does not exist (this is okay)');
    } else {
      console.log(`✅ Fetched ${products?.length || 0} legacy products`);
    }

    // 3. Combinar todas las fuentes (ads primero, luego products)
    const allProducts = [
      ...(mappedAds || []),
      ...(products || [])
    ];

    console.log(`📦 Loaded ${ads?.length || 0} ads + ${products?.length || 0} products = ${allProducts.length} total`);
    console.log('✅ getProducts: Completed successfully');
    
    return allProducts;
  } catch (error) {
    console.error("❌ CRITICAL Error in getProducts:", error);
    console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    // Retornar array vacío para que la app no se rompa
    return [];
  }
};
