# Measurement foundation

The Drizzle schema in src/db/measurements.ts separates patient identity, measurement definitions, measurement events, typed result components, and pins. Source and capture method distinguish manual patient reports, AI conversations, extracted reports, and device imports. Report/message identifiers are currently opaque references; their tables and foreign keys will be added with those features.

The catalog in src/lib/measurements/catalog.ts defines eight measurement choices. Generic glucose, waist circumference, and peak flow deliberately have no LOINC mapping until method/specimen/site information establishes an exact match. Definitions must be treated as immutable after use (create a new slug for a changed definition).

The pure toObservation mapper exports confirmed records as R4 Observations, retaining original result types and coded quantities. Blood pressure uses two components. Patient-reported does not imply patient-performed. normalize supports pounds to kilograms and Fahrenheit to Celsius, plus identity conversions; it rejects unsupported conversions. JavaScript numeric arithmetic is used for these initial conversions; this is not an arbitrary-precision laboratory conversion engine.

Recording routes now implement authenticated submissions, draft review, transactional confirmation, immutable evidence/revisions, read access and Observation export. See measurement-api.md. The migration command seeds the catalog. UI wiring, report storage, actual AI provider calls, full FHIR Provenance export and report Bundles remain future integration work. AI review status is separate from clinical result status.

The generated migration is an INITIAL migration and includes the pre-existing users definition. It was applied to the user-authorized temporary application database with the subsequent migrations. An existing database must be inspected/baselined before applying it; do not run this initial migration blindly against a database that already has users.

Checks:

- node --import tsx src/lib/measurements/observation.test.ts
- node --import tsx src/lib/measurements/result.test.ts
- npx tsc --noEmit --incremental false
- npx eslint src/db/measurements.ts src/lib/measurements

These checks exercise component integrity, review gating, unit compatibility, conversion and original-value export. They do not replace validation against the official FHIR R4 profiles or a receiving system's implementation guide. No claim of certified interoperability is made.

## Result types

`measurement_values.result` now stores a discriminated `{ type, value }` JSONB payload. PostgreSQL remains the relational store for ownership, events and relationships. Structured FHIR datatypes live within that payload, avoiding dozens of mutually exclusive nullable columns. The check constraint enforces one supported discriminator with the matching outer JSON type; nested semantic validation belongs to `validateResult` before every future persistence write and runs again on export. TypeScript types alone are not validation.

Supported R4 Observation value choices: Quantity (including comparator), CodeableConcept, string, boolean, integer, Range, Ratio, SampledData, time, dateTime and Period. Explicit absence is a separate result variant exported as `dataAbsentReason`, never alongside a value. These choices work at both Observation and component levels. Definitions have `allowedResultTypes`; built-in vital signs accept only quantities or absence. Unit normalization is optional and only quantities may have normalization fields. Comparators remain part of the original quantity; normalized numbers must never be interpreted without that qualifier.

Interpretation, reference ranges and original source text are stored separately. Partial dates are supported for dateTime RESULTS; event `observedAt` still requires a precise timestamp. There is no claim to support every Observation field or every HL7 standard. Definition versioning and relational component definitions remain future work.

The second migration backfills old quantities and accepted definition types before removing numeric-only columns. It preserves the original unit label and adds UCUM codes only for recognized units. These migrations have now been applied to the temporary application database and exercised by isolated-schema API tests.

Tests cover all 11 value choices plus absence, top-level and component export, false/zero preservation, comparators, partial dates, malformed values, definition restrictions and separate interpretations/ranges. Validation covers application-level structural and semantic checks; full nested FHIR extension validation, terminology lookup and receiving-profile validation still require an official validator. Raw `originalText` should be retained for source precision: JavaScript numbers do not preserve arbitrary decimal precision or trailing zeros. No automatic conversion is attempted for ranges, ratios or sampled data.

References:
- https://hl7.org/fhir/R4/observation.html
- https://hl7.org/fhir/R4/datatypes.html

## Sources, batches and revision history

`src/db/measurementProvenance.ts` adds:

- `measurement_conversations` and immutable `measurement_sources`: exact user/assistant messages, original manual-form payloads, report/device metadata and attachment storage keys. Source records identify their actor and occurrence/recording times. No hidden model reasoning is collected.
- `measurement_ai_runs` and `measurement_ai_run_sources`: completed run metadata, sanitized request, visible response, structured extraction, errors and all input-source links. The visible assistant message can also be referenced through responseSourceId. The write service must ensure that reference identifies the actual assistant response.
- `measurement_submissions`, source links and items: a batch of proposed readings, per-item draft/issues/status, idempotency keys, and the accepted measurement ID. Drafts can change; original source evidence cannot.
- `measurement_revisions` and source links: numbered full snapshots of the parent, definition and results, actor/action/reason, and optional submission-item/AI-run references. One source can support many revisions across many measurements; each revision can cite multiple sources.

Grouping is explicit: a submission has multiple items, each confirmed item maps to one measurement, and `measurement_values.measurementId` groups all result components under that measurement. The unique `(measurementId, componentKey)` constraint prevents duplicate systolic/diastolic slots. Sharing a source or submission does not combine independent readings into one Observation.

Composite foreign keys enforce patient consistency throughout the provenance graph. Database triggers reject UPDATE, DELETE and TRUNCATE on evidence, completed AI runs, committed revisions and their evidence links. An authorized retention/deletion workflow would need separate privileged handling. Normal application roles must not own these tables or have trigger/DDL privileges. This is append-only operational protection, not cryptographic tamper evidence.

The latest migration was applied with its predecessors to an isolated temporary PostgreSQL 18 instance. `tests/db/measurement-provenance.sql` verified multi-measurement source sharing, component grouping/uniqueness, cross-patient rejection, immutable evidence/revisions, idempotency uniqueness and confirmation consistency. The application database was not changed during that initial provenance test; the later routes task applied the migrations with user authorization.

Remaining write-service responsibilities: authorize actors; validate payloads, definition/component membership and snapshots; create measurement+results+revision+links atomically; serialize revision numbering; maintain updatedAt; check that revision submissionItemId refers to the same measurement; preserve source order in the exact AI request payload; compare idempotent request bodies; record corrections as new revisions. Schema alone does not automatically capture writes. Legacy sourceMessageId/sourceReportId fields remain external hints for compatibility; canonical evidence relationships use revision sources. Definition/component normalization and explicit catalog versioning remain separate work.

The recording service now implements transactional confirmation, source capture, ownership checks, version checking and idempotent requests. Historical notes above distinguish schema-only work from the subsequent route implementation. Current usage and integration limits are documented in measurement-api.md.
