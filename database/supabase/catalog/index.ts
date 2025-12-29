// ====================================================================
// Edge Function: catalog
// Endpoint: GET /functions/v1/catalog
// ====================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // ====================================================================
    // QUERY 1: Get categories with subcategories
    // ====================================================================
    const { data: categories, error: catError } = await supabaseClient
      .from("categories")
      .select(`
        id,
        slug,
        name,
        description,
        icon,
        display_order,
        subcategories (
          id,
          slug,
          name,
          description,
          icon,
          display_order
        )
      `)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (catError) throw catError;

    // ====================================================================
    // QUERY 2: Get all attributes with their assignments
    // ====================================================================
    const { data: attributesData, error: attrError } = await supabaseClient
      .from("subcategory_attributes")
      .select(`
        subcategory_id,
        is_required,
        display_order,
        field_group,
        attributes (
          id,
          slug,
          name,
          description,
          input_type,
          data_type,
          ui_config,
          validations,
          is_filterable,
          is_featured
        )
      `)
      .order("display_order", { ascending: true });

    if (attrError) throw attrError;

    // ====================================================================
    // QUERY 3: Get attribute options for select fields
    // ====================================================================
    const { data: optionsData, error: optError } = await supabaseClient
      .from("attribute_options")
      .select("attribute_id, value, label, display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (optError) throw optError;

    // ====================================================================
    // BUILD JSON STRUCTURE
    // ====================================================================

    // Group options by attribute_id
    const optionsByAttribute = optionsData.reduce((acc, opt) => {
      if (!acc[opt.attribute_id]) acc[opt.attribute_id] = [];
      acc[opt.attribute_id].push({ value: opt.value, label: opt.label });
      return acc;
    }, {});

    // Group attributes by subcategory_id
    const attributesBySubcategory = attributesData.reduce((acc, item) => {
      if (!acc[item.subcategory_id]) acc[item.subcategory_id] = [];
      
      const attr = item.attributes;
      acc[item.subcategory_id].push({
        id: attr.id,
        slug: attr.slug,
        name: attr.name,
        description: attr.description,
        inputType: attr.input_type,
        dataType: attr.data_type,
        isRequired: item.is_required,
        displayOrder: item.display_order,
        fieldGroup: item.field_group,
        uiConfig: attr.ui_config,
        validations: attr.validations,
        isFilterable: attr.is_filterable,
        isFeatured: attr.is_featured,
        options: optionsByAttribute[attr.id] || [],
      });
      
      return acc;
    }, {});

    // Build final catalog structure
    const catalog = {
      version: "1.0",
      generatedAt: new Date().toISOString(),
      categories: categories.map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        subcategories: cat.subcategories
          .sort((a, b) => a.display_order - b.display_order)
          .map((sub) => ({
            id: sub.id,
            slug: sub.slug,
            name: sub.name,
            description: sub.description,
            icon: sub.icon,
            attributes: (attributesBySubcategory[sub.id] || [])
              .sort((a, b) => a.displayOrder - b.displayOrder),
          })),
      })),
    };

    // ====================================================================
    // RETURN RESPONSE
    // ====================================================================
    return new Response(JSON.stringify(catalog), {
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, max-age=3600, s-maxage=7200", // Cache 1h client, 2h CDN
      },
      status: 200,
    });

  } catch (error) {
    console.error("Error generating catalog:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to generate catalog",
        message: error.message,
      }),
      {
        headers: corsHeaders,
        status: 500,
      }
    );
  }
});
