import { supabase } from "./supabaseClient";

/**
 * Obtiene productos desde múltiples fuentes:
 * - Tabla 'ads': Avisos creados por usuarios (status='active')
 * - Tabla 'products': Productos legacy/mock (mantener compatibilidad)
 */
export const getProducts = async () => {
  console.log('🔍 getProducts: Starting fetch...');
  
  try {
    // 1. Obtener avisos activos de usuarios
    const { data: ads, error: adsError } = await supabase
      .from("ads")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (adsError) {
      console.error("❌ Error fetching ads:", adsError);
      console.error("❌ Error details:", JSON.stringify(adsError, null, 2));
    } else {
      console.log(`✅ Fetched ${ads?.length || 0} ads`);
    }

    // Mapear ads al formato Product consistente con categorías
    const mappedAds = await Promise.all((ads || []).map(async (ad: any) => {
      const mappedAd: any = {
        ...ad,
        imageUrl: ad.image_urls?.[0] || ad.images?.[0],
        imageUrls: ad.image_urls || ad.images,
      };

      // Obtener nombre de categoría si tiene category_id
      if (ad.category_id) {
        const { data: catData } = await supabase
          .from('categories')
          .select('display_name')
          .eq('id', ad.category_id)
          .single();
        
        if (catData) {
          mappedAd.category = catData.display_name;
        }
      }

      // Obtener nombre de subcategoría si tiene subcategory_id
      if (ad.subcategory_id) {
        const { data: subData } = await supabase
          .from('subcategories')
          .select('display_name')
          .eq('id', ad.subcategory_id)
          .single();
        
        if (subData) {
          mappedAd.subcategory = subData.display_name;
        }
      }

      return mappedAd;
    }));

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
