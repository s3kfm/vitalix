ALTER TABLE "measurement_values" ADD COLUMN "result" jsonb;--> statement-breakpoint
ALTER TABLE "measurement_values" ADD COLUMN "originalText" text;--> statement-breakpoint
ALTER TABLE "measurement_values" ADD COLUMN "interpretation" jsonb;--> statement-breakpoint
ALTER TABLE "measurement_values" ADD COLUMN "referenceRanges" jsonb;--> statement-breakpoint
-- Preserve existing quantities before removing the numeric-only columns.
UPDATE "measurement_values"
SET "result" = jsonb_build_object(
  'type', 'quantity',
  'value', jsonb_build_object('value', "originalValue", 'unit', "originalUnit") ||
    CASE WHEN "originalUnit" IN ('kg', '[lb_av]', 'Cel', '[degF]', 'mm[Hg]', '/min', '%', 'mg/dL', 'cm', 'L/min', 'mmHg', 'bpm', '°C', '°F', 'lb')
      THEN jsonb_build_object('system', 'http://unitsofmeasure.org', 'code',
        CASE "originalUnit" WHEN 'mmHg' THEN 'mm[Hg]' WHEN 'bpm' THEN '/min' WHEN '°C' THEN 'Cel' WHEN '°F' THEN '[degF]' WHEN 'lb' THEN '[lb_av]' ELSE "originalUnit" END)
      ELSE '{}'::jsonb END
), "originalText" = "originalValue"::text || ' ' || "originalUnit";
--> statement-breakpoint
ALTER TABLE "measurement_values" ALTER COLUMN "result" SET NOT NULL;
--> statement-breakpoint
-- Existing definitions were quantity-only; make their accepted types explicit.
UPDATE "measurement_definitions" d SET "components" = (
  SELECT jsonb_agg(component || jsonb_build_object('allowedResultTypes', jsonb_build_array('quantity', 'absent')) ORDER BY position)
  FROM jsonb_array_elements(d."components") WITH ORDINALITY AS items(component, position)
) WHERE jsonb_array_length(d."components") > 0;
--> statement-breakpoint
ALTER TABLE "measurement_values" DROP COLUMN "originalValue";--> statement-breakpoint
ALTER TABLE "measurement_values" DROP COLUMN "originalUnit";--> statement-breakpoint
ALTER TABLE "measurement_values" ALTER COLUMN "normalizedValue" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "measurement_values" ALTER COLUMN "normalizedUnit" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "measurement_values" ALTER COLUMN "conversionVersion" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "measurement_values" ADD CONSTRAINT "measurement_result_shape" CHECK (COALESCE(
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
      ELSE false END, false));--> statement-breakpoint
ALTER TABLE "measurement_values" ADD CONSTRAINT "measurement_normalization_complete" CHECK (("normalizedValue" IS NULL AND "normalizedUnit" IS NULL AND "conversionVersion" IS NULL) OR ("result"->>'type' = 'quantity' AND "normalizedValue" IS NOT NULL AND "normalizedUnit" IS NOT NULL AND "conversionVersion" IS NOT NULL));