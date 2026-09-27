import { pgTable, text, timestamp, uuid, integer, boolean, bigint, index } from 'drizzle-orm/pg-core';

const timestamps = () => ({
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
});
export const users = pgTable('auth_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').default(false).notNull(),
  image: text('image'),
  ...timestamps(),
});
export const sessions = pgTable('better_auth_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  token: text('token').notNull().unique(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  ...timestamps(),
}, table => [index('better_auth_sessions_user_idx').on(table.userId)]);
export const accounts = pgTable('auth_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  ...timestamps(),
}, table => [index('auth_accounts_user_idx').on(table.userId)]);
export const verifications = pgTable('auth_verifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  ...timestamps(),
}, table => [index('auth_verifications_identifier_idx').on(table.identifier)]);
export const rateLimits = pgTable('auth_rate_limits', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('lastRequest', { mode: 'number' }).notNull(),
});
