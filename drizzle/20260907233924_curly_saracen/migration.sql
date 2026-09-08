CREATE TYPE "measurement_submission_item_status" AS ENUM('draft', 'needs_clarification', 'ready', 'confirmed', 'rejected');--> statement-breakpoint
CREATE TYPE "measurement_message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "measurement_revision_action" AS ENUM('created', 'corrected', 'confirmed', 'entered_in_error');--> statement-breakpoint
CREATE TYPE "measurement_source_kind" AS ENUM('message', 'manual_form', 'report', 'device');--> statement-breakpoint
CREATE TYPE "measurement_submission_status" AS ENUM('draft', 'needs_clarification', 'ready', 'partially_confirmed', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TABLE "measurement_ai_run_sources" (
	"patientId" uuid NOT NULL,
	"runId" uuid NOT NULL,
	"sourceId" uuid NOT NULL,
	CONSTRAINT "measurement_ai_run_source_unique" UNIQUE("runId","sourceId")
);
--> statement-breakpoint
CREATE TABLE "measurement_ai_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patientId" uuid NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"templateVersion" text NOT NULL,
	"parserVersion" text NOT NULL,
	"requestPayload" jsonb NOT NULL,
	"responseText" text,
	"structuredOutput" jsonb,
	"responseSourceId" uuid,
	"errorCode" text,
	"startedAt" timestamp with time zone NOT NULL,
	"completedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "measurement_ai_run_patient_unique" UNIQUE("id","patientId"),
	CONSTRAINT "measurement_ai_run_time_order" CHECK ("completedAt" >= "startedAt")
);
--> statement-breakpoint
CREATE TABLE "measurement_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patientId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "measurement_conversation_patient_unique" UNIQUE("id","patientId")
);
--> statement-breakpoint
CREATE TABLE "measurement_revision_sources" (
	"patientId" uuid NOT NULL,
	"revisionId" uuid NOT NULL,
	"sourceId" uuid NOT NULL,
	CONSTRAINT "measurement_revision_source_unique" UNIQUE("revisionId","sourceId")
);
--> statement-breakpoint
CREATE TABLE "measurement_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patientId" uuid NOT NULL,
	"measurementId" uuid NOT NULL,
	"revision" integer NOT NULL,
	"action" "measurement_revision_action" NOT NULL,
	"actorId" text NOT NULL,
	"reason" text,
	"snapshot" jsonb NOT NULL,
	"submissionItemId" uuid,
	"aiRunId" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "measurement_revision_patient_unique" UNIQUE("id","patientId"),
	CONSTRAINT "measurement_revision_number_unique" UNIQUE("measurementId","revision"),
	CONSTRAINT "measurement_revision_positive" CHECK ("revision" > 0),
	CONSTRAINT "measurement_revision_snapshot_shape" CHECK (COALESCE(jsonb_typeof("snapshot"->'measurement') = 'object' AND jsonb_typeof("snapshot"->'definition') = 'object' AND jsonb_typeof("snapshot"->'results') = 'array', false))
);
--> statement-breakpoint
CREATE TABLE "measurement_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patientId" uuid NOT NULL,
	"kind" "measurement_source_kind" NOT NULL,
	"actorId" text NOT NULL,
	"conversationId" uuid,
	"role" "measurement_message_role",
	"content" text,
	"payload" jsonb,
	"attachmentKeys" jsonb DEFAULT '[]' NOT NULL,
	"occurredAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "measurement_source_patient_unique" UNIQUE("id","patientId"),
	CONSTRAINT "measurement_source_message_fields" CHECK (("kind" = 'message' AND "role" IS NOT NULL AND "conversationId" IS NOT NULL AND "content" IS NOT NULL) OR ("kind" <> 'message' AND "role" IS NULL AND "conversationId" IS NULL AND "payload" IS NOT NULL)),
	CONSTRAINT "measurement_source_payload_object" CHECK ("payload" IS NULL OR jsonb_typeof("payload") = 'object'),
	CONSTRAINT "measurement_source_attachments_array" CHECK (jsonb_typeof("attachmentKeys") = 'array')
);
--> statement-breakpoint
CREATE TABLE "measurement_submission_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patientId" uuid NOT NULL,
	"submissionId" uuid NOT NULL,
	"clientItemKey" text NOT NULL,
	"status" "measurement_submission_item_status" DEFAULT 'draft'::"measurement_submission_item_status" NOT NULL,
	"draft" jsonb NOT NULL,
	"issues" jsonb DEFAULT '[]' NOT NULL,
	"aiRunId" uuid,
	"measurementId" uuid CONSTRAINT "measurement_submission_item_measurement_unique" UNIQUE,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "measurement_submission_item_patient_unique" UNIQUE("id","patientId"),
	CONSTRAINT "measurement_submission_item_key_unique" UNIQUE("submissionId","clientItemKey"),
	CONSTRAINT "measurement_item_confirmation" CHECK (("status" = 'confirmed') = ("measurementId" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "measurement_submission_sources" (
	"patientId" uuid NOT NULL,
	"submissionId" uuid NOT NULL,
	"sourceId" uuid NOT NULL,
	CONSTRAINT "measurement_submission_source_unique" UNIQUE("submissionId","sourceId")
);
--> statement-breakpoint
CREATE TABLE "measurement_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patientId" uuid NOT NULL,
	"actorId" text NOT NULL,
	"captureMethod" "measurement_capture_method" NOT NULL,
	"idempotencyKey" text NOT NULL,
	"status" "measurement_submission_status" DEFAULT 'draft'::"measurement_submission_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "measurement_submission_patient_unique" UNIQUE("id","patientId"),
	CONSTRAINT "measurement_submission_idempotency_unique" UNIQUE("patientId","idempotencyKey")
);
--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurement_patient_unique" UNIQUE("id","patientId");--> statement-breakpoint
CREATE INDEX "measurement_revision_sources_source_idx" ON "measurement_revision_sources" ("sourceId");--> statement-breakpoint
CREATE INDEX "measurement_sources_patient_time_idx" ON "measurement_sources" ("patientId","createdAt");--> statement-breakpoint
ALTER TABLE "measurement_ai_run_sources" ADD CONSTRAINT "measurement_ai_run_sources_IqjSf4mi09jK_fkey" FOREIGN KEY ("runId","patientId") REFERENCES "measurement_ai_runs"("id","patientId");--> statement-breakpoint
ALTER TABLE "measurement_ai_run_sources" ADD CONSTRAINT "measurement_ai_run_sources_EbH0P6FL8f2P_fkey" FOREIGN KEY ("sourceId","patientId") REFERENCES "measurement_sources"("id","patientId");--> statement-breakpoint
ALTER TABLE "measurement_ai_runs" ADD CONSTRAINT "measurement_ai_runs_patientId_patients_id_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "measurement_ai_runs" ADD CONSTRAINT "measurement_ai_runs_kTAeUoVMCMpM_fkey" FOREIGN KEY ("responseSourceId","patientId") REFERENCES "measurement_sources"("id","patientId");--> statement-breakpoint
ALTER TABLE "measurement_conversations" ADD CONSTRAINT "measurement_conversations_patientId_patients_id_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "measurement_revision_sources" ADD CONSTRAINT "measurement_revision_sources_qjwh44kkcorK_fkey" FOREIGN KEY ("revisionId","patientId") REFERENCES "measurement_revisions"("id","patientId");--> statement-breakpoint
ALTER TABLE "measurement_revision_sources" ADD CONSTRAINT "measurement_revision_sources_xprmNNTO76JK_fkey" FOREIGN KEY ("sourceId","patientId") REFERENCES "measurement_sources"("id","patientId");--> statement-breakpoint
ALTER TABLE "measurement_revisions" ADD CONSTRAINT "measurement_revisions_vAN7iqQXg9uh_fkey" FOREIGN KEY ("measurementId","patientId") REFERENCES "measurements"("id","patientId");--> statement-breakpoint
ALTER TABLE "measurement_revisions" ADD CONSTRAINT "measurement_revisions_U1fVO4gpXweL_fkey" FOREIGN KEY ("submissionItemId","patientId") REFERENCES "measurement_submission_items"("id","patientId");--> statement-breakpoint
ALTER TABLE "measurement_revisions" ADD CONSTRAINT "measurement_revisions_wGJlI71PgG5l_fkey" FOREIGN KEY ("aiRunId","patientId") REFERENCES "measurement_ai_runs"("id","patientId");--> statement-breakpoint
ALTER TABLE "measurement_sources" ADD CONSTRAINT "measurement_sources_patientId_patients_id_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "measurement_sources" ADD CONSTRAINT "measurement_sources_K3CIEbUhbEE2_fkey" FOREIGN KEY ("conversationId","patientId") REFERENCES "measurement_conversations"("id","patientId");--> statement-breakpoint
ALTER TABLE "measurement_submission_items" ADD CONSTRAINT "measurement_submission_items_XIiMuvDXD4Kl_fkey" FOREIGN KEY ("submissionId","patientId") REFERENCES "measurement_submissions"("id","patientId");--> statement-breakpoint
ALTER TABLE "measurement_submission_items" ADD CONSTRAINT "measurement_submission_items_R1BHLc7T4k3c_fkey" FOREIGN KEY ("aiRunId","patientId") REFERENCES "measurement_ai_runs"("id","patientId");--> statement-breakpoint
ALTER TABLE "measurement_submission_items" ADD CONSTRAINT "measurement_submission_items_iPqMRLUgnAYQ_fkey" FOREIGN KEY ("measurementId","patientId") REFERENCES "measurements"("id","patientId");--> statement-breakpoint
ALTER TABLE "measurement_submission_sources" ADD CONSTRAINT "measurement_submission_sources_MDUjLBw96Lvp_fkey" FOREIGN KEY ("submissionId","patientId") REFERENCES "measurement_submissions"("id","patientId");--> statement-breakpoint
ALTER TABLE "measurement_submission_sources" ADD CONSTRAINT "measurement_submission_sources_0UhDhp8fJXeJ_fkey" FOREIGN KEY ("sourceId","patientId") REFERENCES "measurement_sources"("id","patientId");--> statement-breakpoint
ALTER TABLE "measurement_submissions" ADD CONSTRAINT "measurement_submissions_patientId_patients_id_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id");
--> statement-breakpoint
-- Evidence and committed revisions are append-only in normal operation.
CREATE FUNCTION reject_measurement_evidence_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Measurement evidence is append-only; create a new source or revision' USING ERRCODE = '55000';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER measurement_sources_append_only BEFORE UPDATE OR DELETE OR TRUNCATE ON "measurement_sources" FOR EACH STATEMENT EXECUTE FUNCTION reject_measurement_evidence_mutation();
--> statement-breakpoint
CREATE TRIGGER measurement_ai_runs_append_only BEFORE UPDATE OR DELETE OR TRUNCATE ON "measurement_ai_runs" FOR EACH STATEMENT EXECUTE FUNCTION reject_measurement_evidence_mutation();
--> statement-breakpoint
CREATE TRIGGER measurement_ai_run_sources_append_only BEFORE UPDATE OR DELETE OR TRUNCATE ON "measurement_ai_run_sources" FOR EACH STATEMENT EXECUTE FUNCTION reject_measurement_evidence_mutation();
--> statement-breakpoint
CREATE TRIGGER measurement_revisions_append_only BEFORE UPDATE OR DELETE OR TRUNCATE ON "measurement_revisions" FOR EACH STATEMENT EXECUTE FUNCTION reject_measurement_evidence_mutation();
--> statement-breakpoint
CREATE TRIGGER measurement_revision_sources_append_only BEFORE UPDATE OR DELETE OR TRUNCATE ON "measurement_revision_sources" FOR EACH STATEMENT EXECUTE FUNCTION reject_measurement_evidence_mutation();
--> statement-breakpoint
CREATE TRIGGER measurement_submission_sources_append_only BEFORE UPDATE OR DELETE OR TRUNCATE ON "measurement_submission_sources" FOR EACH STATEMENT EXECUTE FUNCTION reject_measurement_evidence_mutation();
