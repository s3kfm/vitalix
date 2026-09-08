# Measurement Architecture

## Layer Overview

```
app/api/measurement-*/route.ts    ← Next.js App Router file-based routes (thin, ~10 lines each)
         │
         ▼
src/server/measurements/http.ts   ← Per-endpoint handler functions (auth, parse, call service, respond)
         │
         ▼
src/server/measurements/service.ts ← MeasurementService: business logic, SQL, transactions
         │
         ▼
src/db/                           ← Drizzle ORM schema + Pool connection
```

## Route Map

| Method | Route | Handler |
|--------|-------|---------|
| GET | `/api/measurement-definitions` | `handleDefinitions` — public catalog |
| POST | `/api/measurement-conversations` | `handleCreateConversation` |
| POST | `/api/measurement-sources` | `handleCreateSource` — record user message |
| GET | `/api/measurement-sources/[id]` | `handleGetSource` |
| POST | `/api/measurement-submissions` | `handleCreateSubmission` — idempotent draft batch |
| GET | `/api/measurement-submissions/[id]` | `handleGetSubmission` |
| PATCH | `/api/measurement-submissions/[id]` | `handlePatchSubmission` — edit drafts |
| POST | `/api/measurement-submissions/[id]/confirmations` | `handleConfirmSubmission` — commit to measurements |
| GET | `/api/measurements` | `handleListMeasurements` — paginated, filterable |
| GET | `/api/measurements/[id]` | `handleGetMeasurement` |
| GET | `/api/measurements/[id]/revisions` | `handleGetRevisions` — audit trail |
| GET | `/api/measurements/[id]/fhir` | `handleGetFhir` — R4 Observation export |

All routes (except definitions) require Clerk authentication via `auth()`.

## File Map

```
src/
├── db/
│   ├── index.ts                  Pool singleton + Drizzle instance
│   ├── schema.ts                 Re-exports all table definitions
│   ├── measurements.ts           Core tables: patients, definitions, measurements, values, pins
│   ├── measurementProvenance.ts  Provenance: conversations, sources, AI runs, submissions,
│   │                               items, revisions, revision-sources
│   └── seed.ts                   seedMeasurementDefinitions() — 8 built-in definitions
│
├── lib/measurements/
│   ├── catalog.ts                MeasurementDefinition + ComponentDefinition types, 8 choices
│   ├── observation.ts            toObservation() — FHIR R4 Observation export
│   │                               normalize() — unit conversion (lb→kg, °F→°C)
│   └── result.ts                 12 discriminated result types ({type, value}),
│                                   validateResult(), resultToFhir()
│
├── server/measurements/
│   ├── http.ts                   Per-endpoint handlers + backward-compat catch-all
│   ├── service.ts                MeasurementService — business logic, SQL, transactions
│   └── input.ts                  Helpers: str(), uuid(), obj(), list(), version(),
│                                   parseItems(), assess(), ApiError
│
tests/api/
└── measurements.test.ts          Integration test — isolated schema, CRUD, idempotency, AI

scripts/
## Domain Model

### Result Types

Every reading is a discriminated union: `{ type, value }`. The 12 FHIR R4 value types:

`quantity`, `coded`, `string`, `boolean`, `integer`, `range`, `ratio`, `sampledData`, `time`, `dateTime`, `period`, `absent`

A PostgreSQL CHECK constraint validates the shape at DB level. No dozens of nullable columns.

### Measurement Definitions

8 built-in definitions seeded from `catalog.ts`:

| Slug | Category | Components | LOINC |
|------|----------|------------|-------|
| blood-pressure | vital-signs | systolic, diastolic | 85354-9 |
| weight | vital-signs | value | 29463-7 |
| temperature | vital-signs | value | 8310-5 |
| resting-heart-rate | vital-signs | value | 8867-4 |
| oxygen-saturation | vital-signs | value | 2708-6 |
| blood-glucose | laboratory | value | — |
| waist-circumference | exam | value | — |
| peak-flow | exam | value | — |

Each definition specifies `allowedResultTypes`, `allowedUnits`, and optional `canonicalUnit` for normalization. Single-component definitions export as flat Observations; multi-component (blood pressure) export with `Observation.component`.

### Provenance

Every measurement is traceable through:
- **Sources** — immutable evidence (messages, form payloads, report metadata)
- **Submissions** — batches of draft readings with idempotency keys
- **Revisions** — numbered, snapshotted audit trail
- **AI runs** — completed model calls with sanitized request/response (server-only)

## Key Design Decisions

- **EL7-compatible data model**, not HIPAA-compliant security. Discriminated result types, component-based definitions, and Observation export are FHIR R4-inspired. Append-only DB triggers exist in migrations but aren't a security boundary.
- **No field whitelisting** — routes pass what the client sends. Validation focuses on result shapes and definition compatibility.
- **Plain JSON responses** — `Response.json(data)` for success, `Response.json({ error: message }, { status })` for errors. No envelope.
- **Idempotency** on submission creation via `Idempotency-Key` header with SHA-256 request hashing.
- **Unit normalization** on confirm — quantities normalized to canonical units for queries; originals preserved.

## Running

```
npm run db:migrate          # Apply migrations + seed definitions
npm run test:measurements   # Unit tests for observation/result
npm run test:api            # Full integration test (needs DATABASE_URL)
npx tsc --noEmit            # Type check
```
└── migrate.ts                    Runs migrations + seeds definitions
```