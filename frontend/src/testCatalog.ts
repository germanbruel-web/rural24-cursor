// ====================================================================
// TEST: Probar catalogService localmente
// ====================================================================

import { getCatalog, getSubcategoryAttributes } from './services/catalogService';

async function testCatalog() {
  console.log('🧪 Testing Catalog Service...\n');

  try {
    // ====================================================================
    // TEST 1: Get full catalog
    // ====================================================================
    console.log('📦 Fetching full catalog...');
    const catalog = await getCatalog();
    
    console.log('✅ Catalog loaded:');
    console.log(`   - Version: ${catalog.version}`);
    console.log(`   - Categories: ${catalog.categories.length}`);
    
    catalog.categories.forEach((cat) => {
      console.log(`\n📂 ${cat.name} (${cat.slug})`);
      console.log(`   - Subcategories: ${cat.subcategories.length}`);
      
      cat.subcategories.forEach((sub) => {
        console.log(`   └─ ${sub.name} (${sub.slug})`);
        console.log(`      - Attributes: ${sub.attributes.length}`);
      });
    });

    // ====================================================================
    // TEST 2: Get specific subcategory attributes
    // ====================================================================
    console.log('\n🔍 Testing getSubcategoryAttributes...');
    const tractorAttrs = await getSubcategoryAttributes('maquinarias', 'tractores');
    
    console.log(`\n✅ Tractores attributes (${tractorAttrs.length}):`);
    tractorAttrs.forEach((attr) => {
      const required = attr.isRequired ? '⚠️' : '';
      console.log(`   ${required} ${attr.name} (${attr.slug}) - ${attr.inputType}`);
    });

    // ====================================================================
    // TEST 3: Check attribute options
    // ====================================================================
    const attrWithOptions = tractorAttrs.find((a) => a.options.length > 0);
    if (attrWithOptions) {
      console.log(`\n📋 Options for "${attrWithOptions.name}":`);
      attrWithOptions.options.forEach((opt) => {
        console.log(`   - ${opt.label} (${opt.value})`);
      });
    }

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests (uncomment to execute)
// testCatalog();

export { testCatalog };
