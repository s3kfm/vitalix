import { config } from 'dotenv';
config({ path: '.env.local', quiet: true });
config({ quiet: true });

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const { db, pool } = await import('../src/db');
  const { migrate } = await import('drizzle-orm/node-postgres/migrator');
  const { seedMeasurementDefinitions } = await import('../src/db/seed');
  try {
    const result = await migrate(db, { migrationsFolder: './drizzle' });
    if (result) throw new Error('Migration initialization requires inspection');
    await seedMeasurementDefinitions(pool);
    console.log('Migrations applied and measurement definitions seeded.');
  } finally { await pool.end(); }
}
main().catch(() => { console.error('Migration failed. Inspect database state before retrying.'); process.exitCode = 1; });
