CREATE TYPE "group_source" AS ENUM('manual', 'ai');--> statement-breakpoint
CREATE TYPE "measurement_status" AS ENUM('final', 'amended', 'entered-in-error');--> statement-breakpoint
CREATE TABLE "measurement_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"loinc_code" text,
	"category" text NOT NULL,
	"description" text,
	"components" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "measurement_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patient_id" uuid NOT NULL,
	"source" "group_source" DEFAULT 'manual'::"group_source" NOT NULL,
	"status" "measurement_status" DEFAULT 'final'::"measurement_status" NOT NULL,
	"observed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"source_message_id" text,
	"messages" jsonb,
	"observation_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "measurement_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"measurement_id" uuid NOT NULL,
	"component_key" text NOT NULL,
	"loinc_code" text,
	"result" jsonb NOT NULL,
	"original_text" text,
	"interpretation" jsonb,
	"reference_ranges" jsonb,
	"normalized_value" numeric,
	"normalized_unit" text,
	"conversion_version" text,
	CONSTRAINT "measurement_component_unique" UNIQUE("measurement_id","component_key"),
	CONSTRAINT "measurement_result_shape" CHECK (COALESCE(
    jsonb_typeof("result") = 'object'
    AND "result" ?& ARRAY['type', 'value']
    AND ("result" - 'type' - 'value') = '{}'::jsonb
    AND CASE "result"->>'type'
      WHEN 'quantity' THEN jsonb_typeof("result"->'value') = 'object'
      WHEN 'coded' THEN jsonb_typeof("result"->'value') = 'object'
      WHEN 'absent' THEN jsonb_typeof("result"->'value') = 'object'
      WHEN 'range' THEN jsonb_typeof("result"->'value') = 'object'
      WHEN 'ratio' THEN jsonb_typeof("result"->'value') = 'object'
      WHEN 'sampledData' THEN jsonb_typeof("result"->'value') = 'object'
      WHEN 'period' THEN jsonb_typeof("result"->'value') = 'object'
      WHEN 'string' THEN jsonb_typeof("result"->'value') = 'string'
      WHEN 'time' THEN jsonb_typeof("result"->'value') = 'string'
      WHEN 'dateTime' THEN jsonb_typeof("result"->'value') = 'string'
      WHEN 'boolean' THEN jsonb_typeof("result"->'value') = 'boolean'
      WHEN 'integer' THEN jsonb_typeof("result"->'value') = 'number'
      ELSE false END, false)),
	CONSTRAINT "measurement_normalization_complete" CHECK (("normalized_value" IS NULL AND "normalized_unit" IS NULL AND "conversion_version" IS NULL) OR ("result"->>'type' = 'quantity' AND "normalized_value" IS NOT NULL AND "normalized_unit" IS NOT NULL AND "conversion_version" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patient_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"definition_id" uuid NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "measurement_status" DEFAULT 'final'::"measurement_status" NOT NULL,
	"verified_at" timestamp with time zone,
	"method" text,
	"body_site" text,
	"notes" text,
	CONSTRAINT "measurement_patient_unique" UNIQUE("id","patient_id")
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"owner_user_id" uuid,
	"name" text NOT NULL,
	"known_allergies" text DEFAULT '' NOT NULL,
	"date_of_birth" date,
	"enabled_modules" jsonb DEFAULT '["timeline","measurements","symptoms","medications"]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "symptoms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patient_id" uuid NOT NULL,
	"code" jsonb NOT NULL,
	"onset_at" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone,
	"severity" integer,
	"body_site" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "symptoms_severity_range" CHECK ("severity" BETWEEN 1 AND 10),
	CONSTRAINT "symptoms_resolution_order" CHECK ("resolved_at" IS NULL OR "resolved_at" >= "onset_at")
);
--> statement-breakpoint
CREATE TABLE "medication_doses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patient_id" uuid NOT NULL,
	"medicine_id" uuid,
	"name" text NOT NULL,
	"dose" text NOT NULL,
	"status" text NOT NULL,
	"scheduled_for" timestamp with time zone,
	"taken_at" timestamp with time zone,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"scheduled_time" text,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patient_id" uuid NOT NULL,
	"code" jsonb NOT NULL,
	"name" text NOT NULL,
	"strength" text DEFAULT '' NOT NULL,
	"dose" text NOT NULL,
	"schedule" jsonb DEFAULT '[]' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" uuid NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"key" text NOT NULL UNIQUE,
	"count" integer NOT NULL,
	"lastRequest" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "better_auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"token" text NOT NULL UNIQUE,
	"userId" uuid NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "measurement_groups_patient_time_idx" ON "measurement_groups" ("patient_id","created_at");--> statement-breakpoint
CREATE INDEX "measurements_patient_time_idx" ON "measurements" ("patient_id","observed_at");--> statement-breakpoint
CREATE INDEX "measurements_group_idx" ON "measurements" ("group_id");--> statement-breakpoint
CREATE INDEX "symptoms_patient_onset_idx" ON "symptoms" ("patient_id","onset_at");--> statement-breakpoint
CREATE INDEX "medication_doses_patient_time_idx" ON "medication_doses" ("patient_id","scheduled_for");--> statement-breakpoint
CREATE INDEX "medication_doses_medicine_idx" ON "medication_doses" ("medicine_id");--> statement-breakpoint
CREATE INDEX "medications_patient_idx" ON "medications" ("patient_id");--> statement-breakpoint
CREATE INDEX "auth_accounts_user_idx" ON "auth_accounts" ("userId");--> statement-breakpoint
CREATE INDEX "better_auth_sessions_user_idx" ON "better_auth_sessions" ("userId");--> statement-breakpoint
CREATE INDEX "auth_verifications_identifier_idx" ON "auth_verifications" ("identifier");--> statement-breakpoint
ALTER TABLE "measurement_groups" ADD CONSTRAINT "measurement_groups_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "measurement_values" ADD CONSTRAINT "measurement_values_measurement_id_measurements_id_fkey" FOREIGN KEY ("measurement_id") REFERENCES "measurements"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_group_id_measurement_groups_id_fkey" FOREIGN KEY ("group_id") REFERENCES "measurement_groups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_definition_id_measurement_definitions_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "measurement_definitions"("id");--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_owner_user_id_auth_users_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth_users"("id");--> statement-breakpoint
ALTER TABLE "symptoms" ADD CONSTRAINT "symptoms_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "medication_doses" ADD CONSTRAINT "medication_doses_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "medication_doses" ADD CONSTRAINT "medication_doses_medicine_id_medications_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medications"("id");--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_userId_auth_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "better_auth_sessions" ADD CONSTRAINT "better_auth_sessions_userId_auth_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE;