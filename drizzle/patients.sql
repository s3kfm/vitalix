-- Existing installations: run this once BEFORE db:push.
-- Preserves patient IDs and all linked health records.
BEGIN;
ALTER TABLE patients ADD COLUMN name text;
UPDATE patients SET name = CASE
  WHEN auth_user_id = 'demo-user' THEN 'Demo patient'
  ELSE 'Patient ' || left(id::text, 8)
END;
ALTER TABLE patients ALTER COLUMN name SET NOT NULL;
ALTER TABLE patients DROP COLUMN auth_user_id;
COMMIT;
