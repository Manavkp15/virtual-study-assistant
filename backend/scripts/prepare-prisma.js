const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
let databaseUrl = process.env.DATABASE_URL || '';

if (databaseUrl.startsWith('postgres://')) {
  databaseUrl = databaseUrl.replace('postgres://', 'postgresql://');
  process.env.DATABASE_URL = databaseUrl;
}

const isPostgres = databaseUrl.startsWith('postgresql://');
let targetProvider = isPostgres ? 'postgresql' : 'sqlite';

if (fs.existsSync(schemaPath)) {
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Replace datasource provider
  const updatedSchema = schemaContent.replace(
    /datasource\s+db\s+\{[\s\S]*?provider\s*=\s*["'](sqlite|postgresql)["'][\s\S]*?\}/,
    (match) => {
      return match.replace(/provider\s*=\s*["'](sqlite|postgresql)["']/, `provider = "${targetProvider}"`);
    }
  );

  if (schemaContent !== updatedSchema) {
    fs.writeFileSync(schemaPath, updatedSchema, 'utf8');
    console.log(`[Prisma Prepare] Successfully updated schema datasource provider to: ${targetProvider}`);
  } else {
    console.log(`[Prisma Prepare] Schema datasource provider already set to: ${targetProvider}`);
  }
}

// Generate Prisma Client
try {
  console.log('[Prisma Prepare] Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
  console.log('[Prisma Prepare] Prisma client generated successfully.');
} catch (err) {
  console.error('[Prisma Prepare] Failed to generate Prisma client:', err.message);
  process.exit(1);
}
