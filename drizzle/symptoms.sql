-- Additive setup for existing databases. New databases can use npm run db:push.
CREATE TABLE IF NOT EXISTS symptoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  code jsonb NOT NULL,
  onset_at timestamptz NOT NULL,
  resolved_at timestamptz,
  severity integer,
  body_site jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT symptoms_severity_range CHECK (severity BETWEEN 1 AND 10),
  CONSTRAINT symptoms_resolution_order CHECK (resolved_at IS NULL OR resolved_at >= onset_at)
);
CREATE INDEX IF NOT EXISTS symptoms_patient_onset_idx ON symptoms(patient_id, onset_at);
