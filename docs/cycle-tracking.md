# Cycle tracking backend

Routes live under `/api/patients/:patientId/cycles` and use the existing session-backed `getPatient` ownership check. An inaccessible patient/observation returns 404. Request validation errors return 400. Clients cannot assign patient IDs, cycle associations, predictions, or inferred state.

| Method | Path                | Result                                                           |
| ------ | ------------------- | ---------------------------------------------------------------- |
| GET    | `/observations`     | Observations ordered by observed time and ID                     |
| POST   | `/observations`     | Create an observation (201)                                      |
| GET    | `/observations/:id` | One observation                                                  |
| PATCH  | `/observations/:id` | Partial update; null clears a signal                             |
| DELETE | `/observations/:id` | Delete and reconcile (204)                                       |
| GET    | `/state`            | Recalculate and persist the current state, with caching disabled |

Example POST body:

```json
{
  "observedAt": "2026-09-01T08:00:00+01:00",
  "bleedingLevel": "medium",
  "symptoms": ["cramps"],
  "notes": "First day"
}
```

`observedAt` is required, must contain a timezone, and cannot be in the future. Every signal is independently optional/nullable; even a timestamp-only entry is accepted. Symptoms use JSONB string arrays, following the existing array storage convention. PATCH rejects empty bodies and unknown fields.

## Persistence and dates

The four tables are `patient_cycle_profiles`, `menstrual_cycles`, `cycle_observations`, and `cycle_states`. Timestamps use PostgreSQL `timestamp with time zone`. Patient records currently have no timezone, so v1 uses **UTC calendar days**, including UTC midnight cycle boundaries and predictions. Original observation instants remain intact. `endedAt` is exclusive: it equals the next cycle's start, and is never filled from a prediction.

The database enforces at most one active cycle per patient, valid confidence ranges, and matching patient ownership on cycle references. Observation mutation, boundary reconciliation, profile learning, and current-state persistence share a transaction. A patient row lock serializes mutations and refreshes. Reads of current state refresh confidence without modifying observations or cycle history.

Before a cycle start is known, `cycleId` and `cycleDay` on the current state are null. This intentionally supports unassociated observations without fabricating a cycle. State is a replaceable snapshot, not an audit history or source of truth.

## Deterministic first version

`src/lib/cycles/inference.ts` contains pure functions accepting an explicit clock. `service.ts` owns persistence. The algorithm version and contributing evidence weights are stored in `reasoning`.

- Light, medium, or heavy bleeding begins a cycle when no prior meaningful bleeding exists, or when at least ten UTC days have elapsed since the last logged meaningful bleeding. Spotting does not begin cycles. This is a segmentation heuristic, not proof that unlogged days were bleed-free.
- Editing, backdating, or deleting observations replays boundaries, reassigns observations, and recomputes learned history. Unchanged starts retain cycle IDs. Historical cycles in v1 are established by logging historical bleeding observations; direct cycle-table imports are not supported by reconciliation.
- The latest twelve complete intervals supply the median cycle length and observed range. Fewer than three intervals retain extra uncertainty. Defaults are 28 days, a 21–35 day range, and a five-day period. Period length is learned only from consecutive bleeding days followed by an explicit none/spotting entry. Learned profiles are recalculated from source records so deleting history also removes its influence.
- Variable history widens the fertile window and lowers calendar confidence. There is no PCOS-specific phase machine or diagnosis inference.
- Calendar predictions use a nominal fourteen-day luteal interval. A passed predicted ovulation date decreases confidence exponentially and leaves phase unknown without supporting observations. Predictions never close cycles or confirm ovulation.
- Positive/peak LH and watery/egg-white mucus contribute for up to two UTC days; later negative/nonfertile entries supersede them. Recent meaningful bleeding takes precedence.
- BBT evidence requires six consecutive baseline days followed by three consecutive readings at least 0.2°C above all baseline readings. Only the latest reading per UTC day counts. The evidence expires after sixteen days from the rise. This supports `likely` ovulation and a luteal inference; v1 **never emits `confirmed`**, even with combined signals.

Thresholds are deliberately simple and replaceable. The schema reserves `confirmed` for a future algorithm with an explicit confirmation policy. These predictions are not a validated contraceptive or diagnostic model.

## Migrations and checks

The generated `cycle_tracking` migration and snapshot belong to the existing Drizzle migration chain. Apply with `npm run db:migrate` in the intended environment.

Run `npm run test:cycles` for inference and validation tests. Persistence tests are opt-in: set `CYCLE_TEST_DATABASE_URL` to an **empty, disposable PostgreSQL database**. They refuse a database that already contains public tables, apply the entire migration chain, and leave their test data there. They cover concurrent logging, boundary corrections, deletes, patient isolation, constraints, and transaction rollback.
