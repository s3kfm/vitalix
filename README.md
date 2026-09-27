# Vitalix

Personal health records built with Next.js, PostgreSQL, and Drizzle.

[screencast-vitalix-hazel.vercel.app-2026.09.13-11_39_27.webm](https://github.com/user-attachments/assets/6dee41e8-02fe-49ca-bdf1-ad21548bf9f2)


## Local setup

Use Node.js 24 and npm.

```sh
npm ci
cp .env.example .env.local
```

Set `DATABASE_URL` to your PostgreSQL connection string. For a new, empty database, apply the migrations with `npm run db:migrate`, then run `npm run db:seed` to populate measurement definitions. Database commands load Next.js environment files. These commands modify the configured database; use a dedicated development database locally.

Set `BETTER_AUTH_SECRET` to a random secret of at least 32 characters and `BETTER_AUTH_URL` to `http://localhost:4031` locally (your deployed origin in production). Create an account at `/signup` before enrolling patients.

```sh
npm run dev
```

Open http://localhost:4031. Use the patient menu in the header and choose **Enroll patient**, enter a name, and start recording. Enrollment selects the new patient automatically. Selection lives in memory; refreshing selects the first enrolled patient. Switching patients clears open forms and the assistant conversation, and starts a separate query cache. Run `npm run check` for lint, generated route types, TypeScript, and the production build. Run `npm start` to serve the production build on port 3000.

## Vercel deployment

1. Import the repository with the Next.js framework preset and repository root as the root directory. Use Node.js 24.x, `npm ci` to install, and `npm run build` to build. Keep the default output directory.
2. Add a server-only `DATABASE_URL` in the Vercel project settings for the intended environments. Use your PostgreSQL provider's pooled connection URL and required TLS settings. Use a separate database for previews.
3. Before the first deployment, initialize the target database using `npm run db:migrate` and `npm run db:seed` from an environment configured for that database. Review schema changes before applying them to an existing database. Timestamped directories under `drizzle/` contain the migration history; loose SQL files are historical feature scripts.
4. Deploy, then check the measurements, symptoms, medications, and dose endpoints against the configured database.

The database pool is reused and attached to Vercel's function lifecycle, following [Vercel's connection pooling guidance](https://vercel.com/kb/guide/connection-pooling-with-functions). Schema changes and seeding are separate from the build; the build does not need to query the database.

## Current deployment limits

This is a demo project using Better Auth email/password authentication. Each account can access only its own patients. Records and assistant requests are scoped to `/api/patients/[patientId]/…`. `GET /api/patients` lists the signed-in account's patients; enrollment supports name, known allergies, date of birth, and module preferences. Measurement definitions remain a shared catalogue. Unknown or inaccessible patient IDs return 404.

Some overview content is static demo data, and context actions such as report uploads and measurement pinning do not persist yet.

## Database setup approach

Use `npm run db:migrate` to apply pending migrations, followed by `npm run db:seed` to populate the measurement catalogue. After editing `src/db/schema.ts` or its exports, run `npm run db:generate`, review the generated SQL, and run `npm run db:migrate`. Keep the generated migration SQL and snapshots in version control.

`npm run db:push` is available for disposable schema experiments, but it does not record migrations. Do not use it to initialize a database that will use migrations: the initial migration will try to create objects that already exist. Existing databases initialized with push need their schema verified and migration history baselined before switching to migrations.

Better Auth uses the PostgreSQL pool directly at runtime; its tables are defined in `src/db/auth.ts` and included in the migrations. Do not run a separate Better Auth migration flow. Loose historical SQL snippets under `drizzle/` are not part of the migration sequence. Resetting demo data removes existing accounts and patient records; sign up again afterward.

## Database types

`src/db/types.ts` exports Drizzle `$inferSelect` and `$inferInsert` types. `Serialized<T>` maps database dates to JSON strings while retaining nullable fields. Shared measurement API types add the joined definition, group source, and component values. UI projections in `src/types.ts` select database fields where applicable; demo-only models stay separate.

## Assistant

Set server-only `ANTHROPIC_API_KEY` to enable the Assistant chat. `ANTHROPIC_MODEL` defaults to `claude-sonnet-5`. The chat accepts text, images, PDFs, and TXT files and proposes mixed batches of health records for confirmation before saving through the existing APIs. Chat and attachments remain in memory and clear on refresh. See [assistant behavior and setup](docs/assistant.md).

## Follow-up work

See [demo follow-ups](docs/follow-ups.md) for work outside the patient selector and route-scoping change.
