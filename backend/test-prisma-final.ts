import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = "postgresql://postgres.lmkuecdvxtenrikjomol:bJXNtn8wGxJozsXG@aws-0-us-west-2.pooler.supabase.com:5432/postgres";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testPrisma() {
  try {
    console.log('🔍 Testing Prisma queries...\n');
    
    // Test 1: Categories count
    const categoriesCount = await prisma.categories.count();
    console.log(`✅ Categories: ${categoriesCount}`);
    
    // Test 2: First 3 categories
    const categories = await prisma.categories.findMany({ take: 3 });
    console.log(`📂 First categories:`, categories.map(c => c.name).join(', '));
    
    // Test 3: Ads count
    const adsCount = await prisma.ads.count();
    console.log(`📢 Total ads: ${adsCount}`);
    
    // Test 4: Latest ad
    const latestAd = await prisma.ads.findFirst({
      orderBy: { created_at: 'desc' },
      select: { title: true, status: true, created_at: true }
    });
    console.log(`📰 Latest ad:`, latestAd?.title);
    
    console.log('\n🎉 Prisma works perfectly!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();
