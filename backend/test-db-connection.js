const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: "postgresql://postgres.lmkuecdvxtenrikjomol:bJXNtn8wGxJozsXG@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true",
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log('🔄 Conectando...');
    await client.connect();
    console.log('✅ Conectado!');
    
    const result = await client.query('SELECT current_database(), current_user, version()');
    console.log('📊 Database:', result.rows[0].current_database);
    console.log('👤 User:', result.rows[0].current_user);
    console.log('🔧 Version:', result.rows[0].version.split(' ').slice(0, 2).join(' '));
    
    const tables = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`);
    console.log('📁 Tables:', tables.rows.map(r => r.tablename).join(', '));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testConnection();
