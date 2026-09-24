const { execSync } = require('child_process');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

let databaseUrl = process.env.DATABASE_URL || '';
if (databaseUrl.startsWith('postgres://')) {
  databaseUrl = databaseUrl.replace('postgres://', 'postgresql://');
  process.env.DATABASE_URL = databaseUrl;
}

async function init() {
  console.log('[Database Init] Pushing schema to database...');
  try {
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit', env: process.env });
    console.log('[Database Init] Schema push completed.');
  } catch (err) {
    console.error('[Database Init] Error pushing schema:', err.message);
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined
  });

  try {
    const subjectCount = await prisma.subject.count();
    console.log(`[Database Init] Current subject count in database: ${subjectCount}`);
    
    if (subjectCount === 0) {
      console.log('[Database Init] Database has no subjects. Running initial bilingual seed...');
      execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit', env: process.env });
      console.log('[Database Init] Initial seed completed successfully.');
    } else {
      console.log('[Database Init] Database already contains curriculum data. Skipping seed to preserve clean user state.');
    }
  } catch (err) {
    console.warn('[Database Init] Warning during seed check:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

init();
