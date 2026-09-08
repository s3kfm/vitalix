import { loadEnvConfig } from '@next/env';
import type { Config } from 'drizzle-kit';

loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for database commands.');

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;