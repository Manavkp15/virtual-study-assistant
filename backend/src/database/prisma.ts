import { PrismaClient } from '@prisma/client';

let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl && databaseUrl.startsWith('postgres://')) {
  databaseUrl = databaseUrl.replace('postgres://', 'postgresql://');
  process.env.DATABASE_URL = databaseUrl;
}

export const prisma = new PrismaClient({
  datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined
});
