ALTER TABLE "measurement_submissions" ADD COLUMN "requestHash" text;--> statement-breakpoint
UPDATE "measurement_submissions" SET "requestHash" = 'legacy:' || id::text;--> statement-breakpoint
ALTER TABLE "measurement_submissions" ALTER COLUMN "requestHash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "measurement_submissions" ADD COLUMN "version" integer DEFAULT 0 NOT NULL;