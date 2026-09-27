CREATE TABLE "cycle_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patient_id" uuid NOT NULL,
	"cycle_id" uuid,
	"observed_at" timestamp with time zone NOT NULL,
	"bleeding_level" text,
	"cervical_mucus" text,
	"lh_result" text,
	"basal_temperature_celsius" double precision,
	"symptoms" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cycle_observations_bleeding" CHECK ("bleeding_level" IN ('none', 'spotting', 'light', 'medium', 'heavy')),
	CONSTRAINT "cycle_observations_mucus" CHECK ("cervical_mucus" IN ('dry', 'sticky', 'creamy', 'watery', 'egg_white')),
	CONSTRAINT "cycle_observations_lh" CHECK ("lh_result" IN ('negative', 'positive', 'peak')),
	CONSTRAINT "cycle_observations_temperature" CHECK ("basal_temperature_celsius" BETWEEN 30 AND 45),
	CONSTRAINT "cycle_observations_symptoms_array" CHECK (jsonb_typeof("symptoms") = 'array')
);
--> statement-breakpoint
CREATE TABLE "cycle_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patient_id" uuid NOT NULL,
	"cycle_id" uuid,
	"calculated_at" timestamp with time zone NOT NULL,
	"cycle_day" integer,
	"phase" text NOT NULL,
	"phase_confidence" double precision NOT NULL,
	"ovulation_status" text NOT NULL,
	"ovulation_confidence" double precision NOT NULL,
	"predicted_ovulation_at" timestamp with time zone,
	"predicted_next_period_at" timestamp with time zone,
	"fertile_window_start" timestamp with time zone,
	"fertile_window_end" timestamp with time zone,
	"reasoning" jsonb NOT NULL,
	CONSTRAINT "cycle_states_confidence" CHECK ("phase_confidence" BETWEEN 0 AND 1 AND "ovulation_confidence" BETWEEN 0 AND 1),
	CONSTRAINT "cycle_states_day" CHECK ("cycle_day" > 0),
	CONSTRAINT "cycle_states_phase" CHECK ("phase" IN ('menstrual', 'follicular', 'fertile', 'ovulation_likely', 'luteal', 'unknown')),
	CONSTRAINT "cycle_states_ovulation" CHECK ("ovulation_status" IN ('not_detected', 'predicted', 'likely', 'confirmed', 'unknown'))
);
--> statement-breakpoint
CREATE TABLE "menstrual_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patient_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"predicted_end_at" timestamp with time zone,
	"predicted_ovulation_at" timestamp with time zone,
	"predicted_next_period_at" timestamp with time zone,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cycles_id_patient_unique" UNIQUE("id","patient_id"),
	CONSTRAINT "cycles_status_boundary" CHECK (("status" = 'active' AND "ended_at" IS NULL) OR ("status" = 'complete' AND "ended_at" > "started_at"))
);
--> statement-breakpoint
CREATE TABLE "patient_cycle_profiles" (
	"patient_id" uuid PRIMARY KEY,
	"typical_cycle_length_days" integer DEFAULT 28 NOT NULL,
	"typical_period_length_days" integer DEFAULT 5 NOT NULL,
	"cycle_length_min_days" integer DEFAULT 21 NOT NULL,
	"cycle_length_max_days" integer DEFAULT 35 NOT NULL,
	"irregular_cycles" boolean DEFAULT false NOT NULL,
	"last_calculated_at" timestamp with time zone,
	CONSTRAINT "cycle_profile_lengths" CHECK ("typical_period_length_days" > 0 AND "cycle_length_min_days" > 0 AND "typical_cycle_length_days" >= "cycle_length_min_days" AND "typical_cycle_length_days" <= "cycle_length_max_days")
);
--> statement-breakpoint
CREATE INDEX "cycle_observations_patient_time_idx" ON "cycle_observations" ("patient_id","observed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cycle_states_patient_unique" ON "cycle_states" ("patient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cycles_patient_start_unique" ON "menstrual_cycles" ("patient_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cycles_one_active_patient" ON "menstrual_cycles" ("patient_id") WHERE "status" = 'active';--> statement-breakpoint
ALTER TABLE "cycle_observations" ADD CONSTRAINT "cycle_observations_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "cycle_observations" ADD CONSTRAINT "cycle_observations_A4nCLNx9tl5J_fkey" FOREIGN KEY ("cycle_id","patient_id") REFERENCES "menstrual_cycles"("id","patient_id");--> statement-breakpoint
ALTER TABLE "cycle_states" ADD CONSTRAINT "cycle_states_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "cycle_states" ADD CONSTRAINT "cycle_states_L5VXKvGMky7O_fkey" FOREIGN KEY ("cycle_id","patient_id") REFERENCES "menstrual_cycles"("id","patient_id");--> statement-breakpoint
ALTER TABLE "menstrual_cycles" ADD CONSTRAINT "menstrual_cycles_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id");--> statement-breakpoint
ALTER TABLE "patient_cycle_profiles" ADD CONSTRAINT "patient_cycle_profiles_patient_id_patients_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id");