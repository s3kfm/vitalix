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

Open http://localhost:4031. Use the patient menu in the header and choose **Enroll patient**, enter a name, and start recording. Enrollment selects the new patient automatically. Selection lives in memory; refreshing selects the first enrolled patient. Switching patients clears open forms and the assistant conversation, and starts a separate query cache. Run `npm run check` for lint, generated route types, TypeScript, and the production build. Run `npm start` to serve the production build on port 3000.

## Vercel deployment

1. Import the repository with the Next.js framework preset and repository root as the root directory. Use Node.js 24.x, `npm ci` to install, and `npm run build` to build. Keep the default output directory.
2. Add a server-only `DATABASE_URL` in the Vercel project settings for the intended environments. Use your PostgreSQL provider's pooled connection URL and required TLS settings. Use a separate database for previews.
3. Before the first deployment, initialize the target database using `npm run db:push` and `npm run db:seed` from an environment configured for that database. Review schema changes before applying them to an existing database. The SQL files under `drizzle/` are partial feature scripts, not a complete migration history.
4. Deploy, then check the measurements, symptoms, medications, and dose endpoints against the configured database.

The database pool is reused and attached to Vercel's function lifecycle, following [Vercel's connection pooling guidance](https://vercel.com/kb/guide/connection-pooling-with-functions). Schema changes and seeding are separate from the build; the build does not need to query the database.

## Current deployment limits

This is a shared demo workspace with no authentication. Every visitor can select or enroll any patient; use synthetic data only. Records and assistant requests are scoped to `/api/patients/[patientId]/…`. `GET /api/patients` lists patients and `POST /api/patients` accepts `{ "name": "Demo patient" }`. Measurement definitions remain a global catalogue at `/api/measurements/definitions`. Unknown patient IDs return 404 and never create patients implicitly. The old unscoped record routes have been removed.

Some overview content is static demo data, and context actions such as report uploads and measurement pinning do not persist yet.

## Updating an existing database

If your `patients` table still has `auth_user_id`, apply [drizzle/patients.sql](drizzle/patients.sql) once before running `npm run db:push`. It adds patient names and removes the old user mapping while preserving patient IDs and linked records. Fresh databases only need the regular `db:push` setup.

## Database types

`src/db/types.ts` exports Drizzle `$inferSelect` and `$inferInsert` types. `Serialized<T>` maps database dates to JSON strings while retaining nullable fields. Shared measurement API types add the joined definition, group source, and component values. UI projections in `src/types.ts` select database fields where applicable; demo-only models stay separate.

## Assistant

Set server-only `ANTHROPIC_API_KEY` to enable the Assistant chat. `ANTHROPIC_MODEL` defaults to `claude-sonnet-5`. The chat accepts text, images, PDFs, and TXT files and proposes mixed batches of health records for confirmation before saving through the existing APIs. Chat and attachments remain in memory and clear on refresh. See [assistant behavior and setup](docs/assistant.md).

## Follow-up work

See [demo follow-ups](docs/follow-ups.md) for work outside the patient selector and route-scoping change.
