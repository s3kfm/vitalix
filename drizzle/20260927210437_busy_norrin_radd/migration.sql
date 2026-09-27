-- Upgrade both the legacy standalone SQL and the current Drizzle baseline.
ALTER TABLE medication_doses ALTER COLUMN medicine_id DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE medication_doses ALTER COLUMN taken_at DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE medication_doses ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;
--> statement-breakpoint
ALTER TABLE medication_doses ADD COLUMN IF NOT EXISTS recorded_at timestamptz;
--> statement-breakpoint
UPDATE medication_doses SET recorded_at = created_at WHERE recorded_at IS NULL;
--> statement-breakpoint
ALTER TABLE medication_doses ALTER COLUMN recorded_at SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE medication_doses ALTER COLUMN recorded_at SET NOT NULL;
--> statement-breakpoint
-- Legacy skipped timestamps are not actual administrations. Preserve their original
-- value in notes; no timezone is guessed for historical wall-clock schedules.
UPDATE medication_doses SET notes = concat_ws(E'\n', nullif(notes, ''), 'Legacy skipped date/time: ' || taken_at::text), taken_at = NULL
WHERE status = 'Skipped' AND taken_at IS NOT NULL;
--> statement-breakpoint
-- Retain duplicate historical reports; only one owns a scheduled occurrence.
WITH duplicates AS (
 SELECT id, row_number() OVER (PARTITION BY patient_id, medicine_id, scheduled_for ORDER BY recorded_at, id) AS n
 FROM medication_doses WHERE scheduled_for IS NOT NULL
)
UPDATE medication_doses SET scheduled_for = NULL,
 notes = concat_ws(E'\n', nullif(notes, ''), 'Legacy duplicate scheduled occurrence: ' || scheduled_for::text)
WHERE id IN (SELECT id FROM duplicates WHERE n > 1);
--> statement-breakpoint
DROP INDEX IF EXISTS medication_doses_patient_time_idx;
--> statement-breakpoint
CREATE INDEX medication_doses_patient_time_idx ON medication_doses(patient_id, scheduled_for);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS medication_doses_medicine_idx ON medication_doses(medicine_id);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patient_id" uuid NOT NULL,
	"prescriber" text NOT NULL,
	"issued_on" date NOT NULL,
	"valid_until" date,
	"reference" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"items" jsonb NOT NULL,
	"attachment_name" text,
	"attachment_type" text,
	"attachment_data" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medications" ADD COLUMN "ended_reason" text;--> statement-breakpoint
ALTER TABLE "medications" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "medications" ADD COLUMN "end_date" date;--> statement-breakpoint
CREATE UNIQUE INDEX "medication_doses_occurrence_unique" ON "medication_doses" ("patient_id","medicine_id","scheduled_for");--> statement-breakpoint
CREATE INDEX "prescriptions_patient_idx" ON "prescriptions" ("patient_id");--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "medication_doses" ADD CONSTRAINT "medication_doses_status_time" CHECK (("status" = 'Taken' AND "taken_at" IS NOT NULL) OR ("status" = 'Skipped' AND "taken_at" IS NULL));