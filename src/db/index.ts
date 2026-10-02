import { attachDatabasePool } from '@vercel/functions';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const globalForDb = globalThis as typeof globalThis & { vitalixPool?: Pool };
export const pool =
  globalForDb.vitalixPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
  });

if (!globalForDb.vitalixPool) {
  attachDatabasePool(pool);
  globalForDb.vitalixPool = pool;
}

export const db = drizzle({ client: pool });
