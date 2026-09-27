-- Apply once before using patient details and module preferences.
BEGIN;
ALTER TABLE patients
  ADD COLUMN known_allergies text NOT NULL DEFAULT '',
  ADD COLUMN date_of_birth date,
  ADD COLUMN enabled_modules jsonb NOT NULL DEFAULT '["timeline", "measurements", "symptoms", "medications"]'::jsonb;
COMMIT;
