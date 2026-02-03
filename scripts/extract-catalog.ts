/**
 * Script para extraer subcategorías y atributos de la BD
 * Ejecutar: npx tsx scripts/extract-catalog.ts
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== SUBCATEGORÍAS CON FLAGS ===\n');
  
  const subcategories = await prisma.subcategories.findMany({
    where: { is_active: true },
    select: {
      id: true,
      slug: true,
      name: true,
      display_name: true,
      has_brands: true,
      has_models: true,
      has_year: true,
      has_condition: true,
      categories: {
        select: { name: true, slug: true }
      }
    },
    orderBy: { sort_order: 'asc' }
  });
  
  // Agrupar por categoría
  const byCategory: Record<string, any[]> = {};
  subcategories.forEach((sub: any) => {
    const catName = sub.categories?.name || 'Sin categoría';
    if (!byCategory[catName]) byCategory[catName] = [];
    byCategory[catName].push({
      slug: sub.slug,
      name: sub.display_name || sub.name,
      has_brands: sub.has_brands,
      has_models: sub.has_models,
      has_year: sub.has_year,
      has_condition: sub.has_condition
    });
  });
  
  Object.entries(byCategory).forEach(([cat, subs]) => {
    console.log(`\n📁 ${cat}`);
    subs.forEach((sub: any) => {
      const flags = [];
      if (sub.has_brands) flags.push('marca');
      if (sub.has_models) flags.push('modelo');
      if (sub.has_year) flags.push('año');
      if (sub.has_condition) flags.push('condición');
      console.log(`   ├─ ${sub.slug}: ${sub.name} [${flags.join(', ') || 'sin flags'}]`);
    });
  });

  console.log('\n\n=== ATRIBUTOS POR SUBCATEGORÍA ===\n');
  
  const attrBySubcat = await prisma.subcategory_attributes.findMany({
    select: {
      subcategory_id: true,
      is_required: true,
      display_order: true,
      field_group: true,
      attributes: {
        select: {
          slug: true,
          name: true,
          input_type: true,
          is_filterable: true,
          is_featured: true
        }
      }
    },
    orderBy: { display_order: 'asc' }
  });

  // Agrupar por subcategoría
  const attrMap: Record<string, any[]> = {};
  attrBySubcat.forEach((item: any) => {
    if (!attrMap[item.subcategory_id]) attrMap[item.subcategory_id] = [];
    attrMap[item.subcategory_id].push({
      slug: item.attributes.slug,
      name: item.attributes.name,
      type: item.attributes.input_type,
      required: item.is_required,
      group: item.field_group
    });
  });

  // Obtener nombres de subcategorías
  const subNames = await prisma.subcategories.findMany({
    where: { id: { in: Object.keys(attrMap) } },
    select: { id: true, slug: true, display_name: true }
  });
  
  const subNameMap: Record<string, string> = {};
  subNames.forEach((s: any) => { subNameMap[s.id] = s.slug || s.display_name; });

  Object.entries(attrMap).forEach(([subId, attrs]) => {
    const subName = subNameMap[subId] || subId;
    console.log(`\n📋 ${subName}`);
    attrs.forEach((attr: any) => {
      const req = attr.required ? '(*)' : '';
      console.log(`   ├─ ${attr.slug}: ${attr.name} [${attr.type}] ${req}`);
    });
  });

  console.log('\n\n=== RESUMEN PARA PATTERNS ===\n');
  console.log('Subcategorías totales:', subcategories.length);
  console.log('Con atributos configurados:', Object.keys(attrMap).length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
