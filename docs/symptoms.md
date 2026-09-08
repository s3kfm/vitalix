# Symptoms

Symptoms are patient-reported episodes, not verified diagnoses. `src/db/schema.ts`
exports the measurement and symptom tables for `npm run db:push` (DATABASE_URL
must be set). No catalogue seed is needed; symptom and body-site concepts retain
free text and can hold FHIR R4 coding objects when terminology support is added.

Routes follow measurements: GET/POST `/api/symptoms`, PATCH `/api/symptoms/[id]`
marks an episode resolved at the current time. All operations use the existing
patient identity convention (x-user-id, falling back to demo-user); this is demo
identity, not session authentication. Creation validates dates, chronology,
severity (optional integer 1–10), and text lengths. Resolution is idempotent.

The symptom page and overview timeline share `['symptoms']` through the existing
default query fetcher. Creation and resolution invalidate that key. Errors stay
local to the form, row, or query. No new provider or global handler is needed.

## Future HL7 FHIR mapping

Use Observation for a patient-reported symptom log. Map patientId to subject,
code to code, onsetAt/resolvedAt to effectivePeriod, createdAt to issued,
bodySite to bodySite, and notes to note. Preserve severity as a separately
identified numeric component with its documented 1–10 scale; do not silently
convert it to Condition.severity (a CodeableConcept). An unresolved episode is
not an Observation with preliminary status: clinical resolution and record
verification are separate concepts. An export profile/terminology mapping and
conformance validation are still required before interchange.

Persistent symptoms managed as problems may later map to Condition, with onset,
abatement and clinical status. Do not automatically turn all logs into diagnoses.
See https://hl7.org/fhir/R4/condition.html#bnr for the resource boundary.
