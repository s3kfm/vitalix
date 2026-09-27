import { betterAuth } from 'better-auth';
import { pool } from '@/src/db';

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  user: { modelName: 'auth_users' },
  session: { modelName: 'better_auth_sessions', expiresIn: 60 * 60 * 24 * 7 },
  account: { modelName: 'auth_accounts' },
  verification: { modelName: 'auth_verifications' },
  advanced: { database: { generateId: 'uuid' } },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  rateLimit: {
    enabled: true,
    storage: 'database',
    modelName: 'auth_rate_limits',
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/sign-up/email': { window: 60, max: 5 },
    },
  },
});
