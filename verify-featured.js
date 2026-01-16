/**
 * Script para verificar consistencia de avisos destacados
 * Verifica: featured=true, status=active, no expirados
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lmkuecdvxtenrikjomol.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxta3VlY2R2eHRlbnJpa2pvbW9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTI4NTYsImV4cCI6MjA3ODYyODg1Nn0.j9A2jCOFsoFckDOMGFb8xE4eM5IkHqcN-CCBs4VOENE'
);

async function verifyFeatured() {
  console.log('='.repeat(80));
  console.log('VERIFICACIÓN DE AVISOS DESTACADOS');
  console.log('Fecha actual:', new Date().toISOString());
  console.log('='.repeat(80));
  
  // 1. Obtener TODOS los avisos marcados como destacados en DB
  const { data: allFeatured, error } = await supabase
    .from('ads')
    .select('id, title, status, featured, featured_until, category_id')
    .eq('featured', true);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`\n📊 Total avisos con featured=true: ${allFeatured.length}\n`);

  // 2. Clasificar avisos
  const now = new Date();
  const validForHomepage = [];
  const problems = [];

  for (const ad of allFeatured) {
    const issues = [];
    
    // Check status
    if (ad.status !== 'active') {
      issues.push(`status=${ad.status}`);
    }
    
    // Check expiry
    if (ad.featured_until) {
      const expiryDate = new Date(ad.featured_until);
      if (expiryDate < now) {
        issues.push(`EXPIRADO (${ad.featured_until})`);
      }
    }

    if (issues.length > 0) {
      problems.push({ ...ad, issues });
    } else {
      validForHomepage.push(ad);
    }
  }

  // 3. Mostrar válidos
  console.log(`\n✅ AVISOS VÁLIDOS PARA HOMEPAGE: ${validForHomepage.length}`);
  console.log('-'.repeat(80));
  for (const ad of validForHomepage) {
    console.log(`  ✅ ${ad.title?.substring(0, 50)} | until: ${ad.featured_until || 'sin fecha'}`);
  }

  // 4. Mostrar problemas
  if (problems.length > 0) {
    console.log(`\n⚠️  AVISOS CON PROBLEMAS (NO aparecen en homepage): ${problems.length}`);
    console.log('-'.repeat(80));
    for (const ad of problems) {
      console.log(`  ❌ ${ad.title?.substring(0, 50)}`);
      console.log(`     Problemas: ${ad.issues.join(', ')}`);
    }
  }

  // 5. Verificar por categoría
  console.log('\n📂 DISTRIBUCIÓN POR CATEGORÍA:');
  console.log('-'.repeat(80));
  
  const { data: categories } = await supabase
    .from('categories')
    .select('id, display_name');
  
  const catMap = new Map(categories?.map(c => [c.id, c.display_name]) || []);
  
  const byCategory = {};
  for (const ad of validForHomepage) {
    const catName = catMap.get(ad.category_id) || 'Sin categoría';
    byCategory[catName] = (byCategory[catName] || 0) + 1;
  }
  
  for (const [cat, count] of Object.entries(byCategory)) {
    console.log(`  ${cat}: ${count} avisos destacados`);
  }

  // 6. Comparar con query de Homepage
  console.log('\n🏠 SIMULANDO QUERY DE HOMEPAGE (featured=true + status=active):');
  console.log('-'.repeat(80));
  
  const { data: homepageQuery } = await supabase
    .from('ads')
    .select('id, title, category_id')
    .eq('featured', true)
    .eq('status', 'active');

  console.log(`  Query devuelve: ${homepageQuery?.length || 0} avisos`);
  
  // La homepage NO filtra por featured_until automáticamente
  // Eso es un problema potencial
  const expiredButShowing = homepageQuery?.filter(ad => {
    const fullAd = allFeatured.find(a => a.id === ad.id);
    return fullAd?.featured_until && new Date(fullAd.featured_until) < now;
  });

  if (expiredButShowing?.length > 0) {
    console.log(`\n🚨 PROBLEMA: ${expiredButShowing.length} avisos EXPIRADOS aparecen en homepage`);
    for (const ad of expiredButShowing) {
      const fullAd = allFeatured.find(a => a.id === ad.id);
      console.log(`   - ${ad.title?.substring(0, 40)} (expiró: ${fullAd?.featured_until})`);
    }
  } else {
    console.log(`  ✅ No hay avisos expirados mostrándose`);
  }

  console.log('\n' + '='.repeat(80));
}

verifyFeatured().catch(console.error);
