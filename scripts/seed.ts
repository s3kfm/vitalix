import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required to seed the database.');
  const { pool } = await import('../src/db');
  try {
    const { seedDefinitions } = await import('../src/db/seed');
    await seedDefinitions();
    console.log('Measurement definitions seeded.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
