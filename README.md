# Vitalix

Personal health records built with Next.js, PostgreSQL, and Drizzle.

## Local setup

Use Node.js 24 and npm.

```sh
npm ci
cp .env.example .env.local
```

Set `DATABASE_URL` to your PostgreSQL connection string. For a new, empty database, review and apply the schema with `npm run db:push`, then run `npm run db:seed` to populate measurement definitions. Database commands load Next.js environment files. These commands modify the configured database; use a dedicated development database locally.

```sh
npm run dev
```

Open http://localhost:4031. Run `npm run check` for lint, generated route types, TypeScript, and the production build. Run `npm start` to serve the production build on port 3000.

## Vercel deployment

1. Import the repository with the Next.js framework preset and repository root as the root directory. Use Node.js 24.x, `npm ci` to install, and `npm run build` to build. Keep the default output directory.
2. Add a server-only `DATABASE_URL` in the Vercel project settings for the intended environments. Use your PostgreSQL provider's pooled connection URL and required TLS settings. Use a separate database for previews.
3. Before the first deployment, initialize the target database using `npm run db:push` and `npm run db:seed` from an environment configured for that database. Review schema changes before applying them to an existing database. The SQL files under `drizzle/` are partial feature scripts, not a complete migration history.
4. Deploy, then check the measurements, symptoms, medications, and dose endpoints against the configured database.

The database pool is reused and attached to Vercel's function lifecycle, following [Vercel's connection pooling guidance](https://vercel.com/kb/guide/connection-pooling-with-functions). Schema changes and seeding are separate from the build; the build does not need to query the database.

## Current deployment limits

This is a demo workspace. API routes trust an `x-user-id` header and fall back to a shared `demo-user`; they do not authenticate users. Keep deployments restricted to trusted demo users with synthetic data. Verified authentication and patient authorization are required before public use with real records.

Some overview content is static demo data, and context actions such as report uploads and measurement pinning do not persist yet.

## Database types

`src/db/types.ts` exports Drizzle `$inferSelect` and `$inferInsert` types. `Serialized<T>` maps database dates to JSON strings while retaining nullable fields. Shared measurement API types add the joined definition, group source, and component values. UI projections in `src/types.ts` select database fields where applicable; demo-only models stay separate.
