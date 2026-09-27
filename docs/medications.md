# Medications sprint

The three views are Today, My medications, and Prescriptions. The old statistics,
table, and medication History tab are removed. Broader history remains in Timeline.

## Data and migration

Run `npm run db:migrate` with the intended `DATABASE_URL`. Migration
`drizzle/20260927210437_busy_norrin_radd/migration.sql` adds medication treatment
dates and completion/discontinuation reason, prescriptions with optional attachments,
and dose occurrence uniqueness/status constraints. It also upgrades the earlier
standalone `drizzle/medications.sql` dose columns to nullable medicine/taken time,
scheduled occurrence time, and server-recorded time. Existing Drizzle baselines
already declare the timestamp columns; the migration handles both shapes. For
installations created solely with standalone SQL, apply this migration SQL directly
instead of replaying the initial full-schema migration.

Legacy recorded times are backfilled from createdAt. Legacy skipped takenAt values
are preserved in notes before being nulled. No historical timezone is guessed.
Duplicate historical scheduled reports are retained; extra reports keep their original
scheduled timestamp in notes and no longer own the unique occurrence. Existing
legacy reports with only scheduledTime use their local taken/recorded day when
matching in Today. Migrated legacy skipped reports use their preserved legacy date.

scheduledFor is the exact intended occurrence; takenAt is the actual administration
(or null for Skipped); recordedAt is assigned by the server and preserved on edits.
PRN/one-off records have no scheduledFor. One-off records have no medicineId and
never create a permanent medication. Name, strength, and dose are historical snapshots.

## Scheduling and UI

Daily HH:mm schedules are retained. Browser-local time follows the app's existing
convention (there is no stored patient timezone). The client sends its IANA timezone
for server occurrence validation. Daily generation uses calendar dates across DST;
nonexistent spring-forward times have no occurrence, and repeated fall-back times
produce one occurrence. Morning is before noon, afternoon before 17:00, evening
before 21:00, and bedtime thereafter. The current period is actionable, even before
its exact scheduled time. Future periods are compact and have no dose actions.

Occurrences start on the explicit treatment start date, or at creation if absent,
and stop at the end/stop date. Unresolved prior occurrences remain available without
a fixed lookback cutoff. Resolved earlier-day occurrences recorded today remain visible
for correction/Undo. Today refreshes its clock every 30 seconds. No runtime UI status
is persisted. My medications separates active scheduled, PRN, and past courses and
provides direct Edit actions. Prescriptions remain independent of self-managed medications.

## APIs

All routes are under `/api/patients/[patientId]` and use existing ownership checks.

- GET/POST `/medications`; PATCH `/medications/[id]` edits medication details,
  treatment dates, schedule, and lifecycle.
- GET/POST `/doses`; scheduled POST requires medicineId, scheduledFor,
  scheduledTime, status, dose, and timeZone. Taken requires a past actual takenAt;
  Skipped requires null. Duplicate occurrences return 409.
- PATCH `/doses/[id]` corrects dose, status, takenAt and notes while retaining the
  occurrence, historical name, and recordedAt. DELETE implements Undo.
- GET/POST `/prescriptions`; POST accepts multipart `record` JSON and an optional
  `attachment`. Structured records work without a file. Accepted files are PNG,
  JPEG, and PDF, maximum 5 MB, with signature validation.
- GET `/prescriptions/[id]/attachment` serves the authenticated patient's document
  with private/no-store headers. List responses omit attachment contents.

Attachments are stored with the prescription as bounded base64 data for this sprint;
there was no existing persistent document store to reuse. Prescription items contain
name, dose/instructions, quantity, and refills. Refills are descriptive only.

## Demo and verification

`DEMO_PATIENT_ID=<existing development patient UUID> npm run db:seed:medications`
creates a synthetic routine, overdue dose, completed dose, PRN, one-off, completed
course, current/past prescriptions, and a demo PDF. Stable IDs prevent duplicate
seeding. It never deletes or overwrites existing records. The seed timezone should
match the browser; viewing during morning most closely matches the reference.

- `npm run test:medications`: schedule, DST, late logging, Undo, skipped records,
  lifecycle bounds, validation, one-off and prescription tests.
- `MEDICATION_TEST_URL=http://localhost:<disposable app port> node scripts/test-medications-api.mjs`:
  authenticated recording/correction/Undo, duplicate protection, PRN, one-off,
  lifecycle, Timeline, prescription uploads, and patient isolation. Creates synthetic
  users/patients, so use a disposable application/database only.
- `MEDICATION_TEST_DATABASE_URL=<disposable PostgreSQL URL> node scripts/test-medication-migration.mjs`:
  legacy migration assertions inside a rolled-back transaction.

## Design scope and follow-ups

Only the Today screenshot was supplied. Today follows its card hierarchy and compact
controls, with the required third tab. My medications and Prescriptions follow the
written approved requirements and existing visual language; comparison to their
frozen screenshots remains pending. Global navigation was preserved.

Deferred to the later code/schema review: a persisted patient timezone/travel policy,
schedule revision history (editing a daily schedule currently reinterprets its course
using the latest times), paginating very long unresolved courses, and moving bounded
prescription attachments to object storage if volume warrants it. No recurrence,
provider, pharmacy, insurance, notification, or analytics architecture was added.
