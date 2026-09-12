# Medications and dose logs

Apply the schema with DATABASE_URL configured using npm run db:push, or apply
drizzle/medications.sql to an existing database with the patients table.
No medication seed is required.

GET/POST /api/patients/[patientId]/medications reads/creates the patient's medication list.
PATCH /api/patients/[patientId]/medications/[id] accepts { active: boolean } for archive/restore.
GET/POST /api/patients/[patientId]/doses reads/creates dose logs. The server obtains the medication
name from the patient's medication, validates the schedule association, and
rejects doses for archived or another patient's medication.

The medication page, today's routine, and overview timeline use the existing
default query fetcher with ['medications'] and ['doses']. Mutations invalidate
their corresponding key. Forms show local errors and prevent repeat submission
while saving. No additional provider or global error handler is used.

Schedules are daily local wall-clock times; dose timestamps are stored with
timezones. Taken and skipped entries both complete a scheduled row for the
local day selected in the form. As-needed doses can be logged repeatedly.
Multiple logs for a scheduled time are retained as patient reports, not silently
discarded. Archiving affects the app's active list and preserves dose history.

## Future HL7 FHIR mapping

These are patient reports, not prescriptions. The medication code is a FHIR R4
CodeableConcept with free text today and space for terminology coding later.
Name and strength remain as entered; do not infer structured units from text.
Usual dose can map to Dosage.text and schedule to Timing.repeat.timeOfDay.
The active flag is an app archive flag, not proof that medication was stopped.

A dose report can map to MedicationStatement with subject, medication, an
effectiveDateTime from takenAt, dateAsserted from createdAt, dosage text, and
notes. Taken/skipped requires explicit status mapping (completed/not-taken)
and review under the chosen export profile. This is mapping-ready storage,
not a validated FHIR endpoint or an administration record verified by a clinician.
See https://www.hl7.org/fhir/R4/medicationstatement.html.
