import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
assert.ok(process.env.MEDICATION_TEST_DATABASE_URL, 'Set a disposable MEDICATION_TEST_DATABASE_URL.');
const client = new pg.Client({ connectionString: process.env.MEDICATION_TEST_DATABASE_URL });
await client.connect();
try {
  await client.query('BEGIN');
  await client.query('CREATE SCHEMA medication_legacy_test; SET search_path TO medication_legacy_test; CREATE TABLE patients (id uuid PRIMARY KEY)');
  await client.query(await readFile(new URL('../drizzle/medications.sql', import.meta.url), 'utf8'));
  await client.query(`INSERT INTO patients VALUES ('10000000-0000-4000-8000-000000000001');
    INSERT INTO medications (id,patient_id,code,name,dose) VALUES ('10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','{}','Legacy','1 tablet');
    INSERT INTO medication_doses (patient_id,medicine_id,name,dose,status,taken_at,scheduled_time,created_at) VALUES
    ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','Legacy','1 tablet','Skipped','2026-09-26T08:00:00Z','08:00','2026-09-27T09:00:00Z'),
    ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','Legacy','1 tablet','Taken','2026-09-26T08:12:00Z','08:00','2026-09-27T09:00:00Z')`);
  await client.query(await readFile(new URL('../drizzle/20260927210437_busy_norrin_radd/migration.sql', import.meta.url), 'utf8'));
  const { rows } = await client.query('SELECT * FROM medication_doses ORDER BY status');
  assert.equal(rows.length, 2); assert.equal(rows[0].taken_at, null); assert.match(rows[0].notes, /2026-09-26 08:00:00/);
  assert.equal(rows[0].recorded_at.toISOString(), '2026-09-27T09:00:00.000Z');
  assert.equal(rows[1].taken_at.toISOString(), '2026-09-26T08:12:00.000Z');
  assert.equal(rows[1].scheduled_for, null, 'Migration must not guess a legacy patient timezone.');
  await client.query(`INSERT INTO medication_doses (patient_id,name,dose,status,taken_at) VALUES ('10000000-0000-4000-8000-000000000001','One-off','1 tablet','Taken',now())`);
  console.log('Passed legacy SQL migration: records retained, skipped semantics normalized, recorded time backfilled, one-off dose supported.');
} finally { await client.query('ROLLBACK'); await client.end(); }
