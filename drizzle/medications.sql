CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  code jsonb NOT NULL,
  name text NOT NULL,
  strength text NOT NULL DEFAULT '',
  dose text NOT NULL,
  schedule jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS medications_patient_idx ON medications(patient_id);

CREATE TABLE IF NOT EXISTS medication_doses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  medicine_id uuid NOT NULL REFERENCES medications(id),
  name text NOT NULL,
  dose text NOT NULL,
  status text NOT NULL,
  taken_at timestamptz NOT NULL,
  scheduled_time text,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS medication_doses_patient_time_idx ON medication_doses(patient_id, taken_at);
