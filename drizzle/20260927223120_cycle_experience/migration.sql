ALTER TABLE "cycle_observations" ADD COLUMN "period_started" boolean;--> statement-breakpoint
ALTER TABLE "patient_cycle_profiles" ADD COLUMN "preferences" jsonb;