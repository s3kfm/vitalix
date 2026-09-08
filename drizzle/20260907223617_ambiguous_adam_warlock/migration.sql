CREATE TYPE "measurement_capture_method" AS ENUM('manual_form', 'ai_extraction', 'ai_conversation', 'device_import');--> statement-breakpoint
CREATE TYPE "measurement_source" AS ENUM('patient_reported', 'report', 'device');--> statement-breakpoint
CREATE TYPE "measurement_status" AS ENUM('final', 'amended', 'entered-in-error');--> statement-breakpoint
CREATE TYPE "measurement_verification_status" AS ENUM('pending_review', 'user_confirmed');--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"age" integer NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "measurement_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"loincCode" text,
	"category" text NOT NULL,
	"description" text,
	"components" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "measurement_pins" (
	"patientId" uuid NOT NULL,
	"definitionId" uuid NOT NULL,
	CONSTRAINT "measurement_pin_unique" UNIQUE("patientId","definitionId")
);
--> statement-breakpoint
CREATE TABLE "measurement_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"measurementId" uuid NOT NULL,
	"componentKey" text NOT NULL,
	"loincCode" text,
	"originalValue" numeric NOT NULL,
	"originalUnit" text NOT NULL,
	"normalizedValue" numeric NOT NULL,
	"normalizedUnit" text NOT NULL,
	"conversionVersion" text NOT NULL,
	CONSTRAINT "measurement_component_unique" UNIQUE("measurementId","componentKey")
);
--> statement-breakpoint
CREATE TABLE "measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patientId" uuid NOT NULL,
	"definitionId" uuid NOT NULL,
	"observedAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "measurement_status" DEFAULT 'final'::"measurement_status" NOT NULL,
	"sourceType" "measurement_source" NOT NULL,
	"captureMethod" "measurement_capture_method" NOT NULL,
	"sourceReportId" text,
	"sourceMessageId" text,
	"verificationStatus" "measurement_verification_status" NOT NULL,
	"confirmedAt" timestamp with time zone,
	"method" text,
	"bodySite" text,
	"notes" text,
	CONSTRAINT "measurement_source_consistency" CHECK (("sourceType" = 'patient_reported' AND "captureMethod" IN ('manual_form', 'ai_conversation')) OR ("sourceType" = 'report' AND "captureMethod" = 'ai_extraction' AND "sourceReportId" IS NOT NULL) OR ("sourceType" = 'device' AND "captureMethod" = 'device_import')),
	CONSTRAINT "measurement_chat_source" CHECK ("captureMethod" <> 'ai_conversation' OR "sourceMessageId" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"authUserId" text NOT NULL UNIQUE,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "measurements_patient_time_idx" ON "measurements" ("patientId","observedAt");--> statement-breakpoint
ALTER TABLE "measurement_pins" ADD CONSTRAINT "measurement_pins_patientId_patients_id_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "measurement_pins" ADD CONSTRAINT "measurement_pins_definitionId_measurement_definitions_id_fkey" FOREIGN KEY ("definitionId") REFERENCES "measurement_definitions"("id");--> statement-breakpoint
ALTER TABLE "measurement_values" ADD CONSTRAINT "measurement_values_measurementId_measurements_id_fkey" FOREIGN KEY ("measurementId") REFERENCES "measurements"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_patientId_patients_id_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_definitionId_measurement_definitions_id_fkey" FOREIGN KEY ("definitionId") REFERENCES "measurement_definitions"("id");