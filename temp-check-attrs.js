import { createClient } from '@supabase/supabase-js';
const s = createClient(
  'https://dntmavvqrskowmfxlpah.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudG1hdnZxcnNrb3dtZnhscGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwOTU2NTIsImV4cCI6MjA1ODY3MTY1Mn0.wQ_Nsk8eHgLLSE_dBNmHGH8F0XmYCKA9-pv-aPhMxb8'
);

async function main() {
  // 1. Buscar categoría Ganadería
  const catRes = await s
    .from('categories')
    .select('id,name,display_name');
  
  console.log('Categories Result:', catRes);
  const cats = catRes.data;
  
  const cat = cats?.find(c => c.name?.toLowerCase().includes('ganad') || c.display_name?.toLowerCase().includes('ganad'));
  console.log('Categoría Ganadería:', cat);
  
  if (!cat) return;

  // 2. Buscar subcategorías
  const { data: subs } = await s
    .from('subcategories')
    .select('id,name,display_name')
    .eq('category_id', cat.id);
  
  console.log('\nSubcategorías:', subs);

  // 3. Buscar un ad de ganadería destacado
  const { data: ads } = await s
    .from('ads')
    .select('id,title,attributes,dynamic_fields,subcategory_id')
    .eq('category_id', cat.id)
    .eq('featured', true)
    .limit(3);
  
  console.log('\nAds destacados de Ganadería:', JSON.stringify(ads, null, 2));

  // 4. Ver atributos dinámicos para una subcategoría
  if (subs && subs[0]) {
    const { data: attrs } = await s
      .from('dynamic_attributes')
      .select('id,field_name,field_label')
      .eq('subcategory_id', subs[0].id);
    
    console.log(`\nAtributos para ${subs[0].name}:`, attrs);
  }
}

main().catch(console.error);
