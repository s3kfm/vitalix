# Recording API

All routes are under `/api` and use Clerk server-verified sessions. Patient and actor identity come from the session, never the JSON body. Responses are private (`Cache-Control: no-store`). Browser writes must be same-origin. Bodies are JSON, at most 1 MB, with at most 100 items/readings per submission/item. No AI provider is invoked by these routes.

## Endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| GET | /measurement-definitions | Catalog, components, accepted result types and UCUM units |
| POST | /measurement-conversations | Create a conversation; body `{}` |
| POST | /measurement-sources | Record a user message: `{conversationId, content}` |
| GET | /measurement-sources/{id} | Read your original evidence |
| POST | /measurement-submissions | Create a manual or recorded-AI draft batch; `Idempotency-Key` required |
| GET | /measurement-submissions/{id} | Items, issues, source IDs and version |
| PATCH | /measurement-submissions/{id} | Replace selected unconfirmed drafts using their stable keys and current version |
| POST | /measurement-submissions/{id}/confirmations | Save explicitly selected ready items atomically |
| GET | /measurements | Saved readings and components; `limit` (1–100), `offset`, optional definition slug |
| GET | /measurements/{id} | One reading and its components |
| GET | /measurements/{id}/revisions | Saved revision snapshots and source IDs |
| GET | /measurements/{id}/fhir | Snapshot-based R4 Observation JSON |

## Manual entry

`POST /api/measurement-submissions`, header `Idempotency-Key: <unique request key>`:

```json
{
  "captureMethod": "manual_form",
  "items": [{
    "key": "bp-1",
    "draft": {
      "definition": "blood-pressure",
      "observedAt": "2026-09-08T08:00:00Z",
      "notes": "Seated before breakfast",
      "readings": [
        {"componentKey": "systolic", "result": {"type": "quantity", "value": {"value": 120, "code": "mm[Hg]", "system": "http://unitsofmeasure.org"}}},
        {"componentKey": "diastolic", "result": {"type": "quantity", "value": {"value": 80, "code": "mm[Hg]", "system": "http://unitsofmeasure.org"}}}
      ]
    }
  }]
}
```

The response is 201 (200 on an identical retry), includes `id`, `version`, `status`, `items` with IDs and issues, and `sourceIds`. Reusing an idempotency key with different input returns 409. Server normalization is computed at confirmation; clients cannot submit normalized values, ownership, or review status.

Confirm with `POST /api/measurement-submissions/{id}/confirmations`:

```json
{"version": 0, "itemIds": ["<item UUID from the submission>"]}
```

The service locks the submission, revalidates current definitions, and creates each selected measurement, component results, full revision snapshot and evidence links in one transaction. If any selected item is invalid, none is committed. Already-confirmed items are not duplicated on retry. Ready entries can be explicitly selected while others remain unresolved. A manual Save button can call create then confirm; the UI is not wired yet.

## Partial entries and corrections

Missing components and missing/invalid observation times produce `needs_clarification` draft issues. No missing value or clinical absence reason is invented. Explicitly unavailable components use the `absent` result with a CodeableConcept reason. Wrong result structures return 422; unsupported units/types produce a draft issue. Unknown definitions remain unresolved. Current catalog choices remain quantity/absence-only; additional clinical definitions must be curated before other supported FHIR value types can be recorded through them.

`PATCH` accepts `{version, items:[{key, draft}]}` with full replacement drafts for those keys. It does not delete other batch items. Every correction preserves its exact submitted payload as new immutable evidence. Stale versions return 409; confirmed entries cannot be edited through this route. Date-only events, structured fasting/specimen qualifiers, custom definition creation, and corrections of committed measurements are not implemented here. Use notes to preserve supplied context without inferring a specific LOINC mapping.

## AI integration boundary

1. Record the user's message through the conversation/source routes.
2. The future server AI integration calls `MeasurementService.recordAiRun(patientId, run)` with trusted provider/model/template/parser details, the exact sanitized request, visible response, source IDs and structured extraction `{items:[...]}`. It records AI evidence transactionally. This is an internal method, not a client route; no client endpoint accepts assistant roles or fabricated AI runs.
3. Create a draft with `{captureMethod:"ai_conversation", aiRunId:"..."}` or `ai_extraction` for a run with a report source. The items are loaded from that patient's stored run, not from browser claims.
4. Review, correct and confirm using the same routes as manual entry.

Report storage/source registration and actual AI calls remain future integrations. The schema can store failed runs, but the current helper handles successful structured runs only. A source can support many readings, and a saved revision can cite many sources. Full AI requests are internal evidence; public source retrieval exposes only that patient's source record, not arbitrary AI-run records.

## Setup and checks

- `npm run db:migrate`: apply checked-in migrations through Drizzle and seed eight built-in definitions without overwriting existing ones. Reads `.env.local` then `.env`.
- `npm run test:api`: integration tests create/drop an isolated schema in the configured database. The database role needs CREATE SCHEMA privileges. Neon tests use the direct hostname because transaction poolers reject startup search_path. No application tables are truncated.
- `npm run test:measurements`, `npm run lint`, `npx tsc --noEmit --incremental false`.

API tests inject identities into the same HTTP handler used by the route; real Clerk session issuance is not simulated. Production routes exclusively obtain identities from Clerk `auth()`. The test AI run is explicitly fixture data, not a real model call. Standard FHIR validation and decimal-precision limitations described in `measurements.md` still apply.
