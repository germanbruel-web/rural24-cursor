const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://ticghrxzdsdoaiwqxpoj.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpY2docnh6ZHNkb2Fpd3F4cG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMjc5MzIsImV4cCI6MjA1MDgwMzkzMn0.IMLcUuiyFogBhTuN67l0wWehWSu5LmMvJk-H4Omv2lg'
);

async function check() {
  const { data, error } = await sb
    .from('banners_clean')
    .select('id, title, category, placement, is_active')
    .limit(10);
  
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Banners:');
    data.forEach(b => {
      console.log(`- ${b.title} | category: "${b.category}" | placement: ${b.placement} | active: ${b.is_active}`);
    });
  }
}

check();
