import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const globalDb = globalThis as unknown as { vitalixPool?: Pool };
export const pool = globalDb.vitalixPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 10000 });
if (process.env.NODE_ENV !== 'production') globalDb.vitalixPool = pool;
export const db = drizzle({ client: pool });
