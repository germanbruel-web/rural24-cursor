import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.lmkuecdvxtenrikjomol:MGweB8bf59kIWWET@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
    }
  }
});

async function main() {
  console.log('🔄 Intentando conectar a Supabase...');
  
  try {
    // Test simple query
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('✅ Conexión exitosa!');
    console.log('📅 Hora del servidor:', result);
  } catch (error: any) {
    console.error('❌ Error de conexión:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
