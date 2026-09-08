import { config } from 'dotenv';
config({ path: '.env.local', quiet: true }); config({ quiet: true });
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { Pool } from 'pg';
import { MeasurementService, seedMeasurementDefinitions } from '../../src/server/measurements/service';
import { measurementHandler } from '../../src/server/measurements/http';

// Tests create and drop an isolated schema, never truncate application tables.
test('recording API: real PostgreSQL transactions and patient isolation', { timeout: 240000 }, async t => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL required');
  // Transaction poolers reject startup search_path; use the same provider's direct endpoint.
  const connection = new URL(process.env.DATABASE_URL!);
  connection.hostname = connection.hostname.replace('-pooler.', '.');
  const connectionString = connection.toString();
  const schema = `api_test_${randomUUID().replaceAll('-', '')}`;
  const admin = new Pool({ connectionString, max: 1 });
  const pool = new Pool({ connectionString, max: 4, options: `-c search_path=${schema}` });
  try {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const folder of (await readdir('drizzle')).sort()) {
        const file = `drizzle/${folder}/migration.sql`;
        if (existsSync(file)) await client.query(await readFile(file, 'utf8'));
      }
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
    await seedMeasurementDefinitions(pool);
    const service = new MeasurementService(pool);
    const alice = measurementHandler(service, async () => 'test-alice');
    const bob = measurementHandler(service, async () => 'test-bob');
    const anonymous = measurementHandler(service, async () => null);
    const request = (handler: typeof alice, path: string, method = 'GET', input?: unknown, key?: string) => handler(new Request(`https://vitalix.test/api/${path}`, { method, headers: { ...(input !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(key ? { 'Idempotency-Key': key } : {}) }, ...(input !== undefined ? { body: JSON.stringify(input) } : {}) }));
    const quantity = (value: number, code: string) => ({ type: 'quantity', value: { value, code, system: 'http://unitsofmeasure.org' } });
    const item = { key: 'bp', draft: { definition: 'blood-pressure', observedAt: '2026-09-08T08:00:00Z', readings: [{ componentKey: 'systolic', result: quantity(120, 'mm[Hg]') }, { componentKey: 'diastolic', result: quantity(80, 'mm[Hg]') }] } };
    const input = { captureMethod: 'manual_form', items: [item, { key: 'weight', draft: { definition: 'weight', observedAt: '2026-09-08T08:00:00Z', readings: [{ componentKey: 'value', result: quantity(160, '[lb_av]') }] } }] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sub: Record<string, any>; // JSON HTTP contract assertions below intentionally inspect runtime data.
    await t.test('auth, origin and JSON boundaries', async () => {
      assert.equal((await request(anonymous, 'measurements')).status, 401);
      assert.equal((await alice(new Request('https://vitalix.test/api/measurement-submissions', { method: 'POST', headers: { Origin: 'https://attacker.test' } }))).status, 403);
      assert.equal((await alice(new Request('https://vitalix.test/api/measurement-submissions', { method: 'POST', headers: { 'Idempotency-Key': 'bad', 'Content-Type': 'application/json' }, body: '{' }))).status, 400);
      const definitions = await (await request(alice, 'measurement-definitions')).json(); assert.equal(definitions.data.length, 8);
      assert.equal((await request(alice, 'measurements', 'POST', {})).status, 405);
      assert.equal((await request(alice, 'measurements?limit=0')).status, 400);
    });
    await t.test('concurrent retries return one submission; changed payload conflicts', async () => {
      const replies = await Promise.all([request(alice, 'measurement-submissions', 'POST', input, 'manual-1'), request(alice, 'measurement-submissions', 'POST', input, 'manual-1')]);
      assert.deepEqual(replies.map(r => r.status).sort(), [200, 201]);
      const [a, b] = await Promise.all(replies.map(r => r.json())); assert.equal(a.id, b.id); sub = a;
      assert.equal(a.status, 'ready'); assert.equal(a.items.length, 2);
      assert.equal((await request(alice, 'measurement-submissions', 'POST', { ...input, items: [item] }, 'manual-1')).status, 409);
      assert.equal((await request(bob, `measurement-submissions/${a.id}`)).status, 404);
    });
    let measurementId: string;
    await t.test('atomic confirmation and retries preserve components and evidence', async () => {
      const payload = { version: sub.version, itemIds: sub.items.map((i: {id: string}) => i.id) };
      const replies = await Promise.all([request(alice, `measurement-submissions/${sub.id}/confirmations`, 'POST', payload), request(alice, `measurement-submissions/${sub.id}/confirmations`, 'POST', payload)]);
      for (const r of replies) assert.equal(r.status, 200);
      sub = await replies[0]!.json(); assert.equal(sub.status, 'confirmed');
      measurementId = sub.items.find((i: {clientItemKey: string}) => i.clientItemKey === 'bp').measurementId;
      const m = await (await request(alice, `measurements/${measurementId}`)).json(); assert.equal(m.results.length, 2);
      const listing = await (await request(alice, 'measurements?definition=blood-pressure&limit=1')).json();
      assert.equal(listing.data.length, 1); assert.equal(listing.data[0].results.length, 2);
      const fhirResponse = await request(alice, `measurements/${measurementId}/fhir`); assert.equal(fhirResponse.status, 200); assert.match(fhirResponse.headers.get('content-type')!, /application\/fhir\+json/);
      const fhir = await fhirResponse.json(); assert.equal(fhir.resourceType, 'Observation'); assert.equal(fhir.component.length, 2);
      const history = await (await request(alice, `measurements/${measurementId}/revisions`)).json(); assert.equal(history.data.length, 1); assert.equal(history.data[0].sourceIds.length, 2);
      const source = await (await request(alice, `measurement-sources/${history.data[0].sourceIds[0]}`)).json(); assert.equal(source.kind, 'manual_form');
      assert.equal((await request(bob, `measurements/${measurementId}`)).status, 404);
      assert.equal((await request(bob, `measurement-sources/${source.id}`)).status, 404);
      const count = await pool.query('SELECT count(*)::int AS n FROM measurements'); assert.equal(count.rows[0].n, 2);
    });
    await t.test('partial readings remain drafts and missing values are never invented', async () => {
      const partial = { ...item, draft: { ...item.draft, readings: item.draft.readings.slice(0, 1) } };
      const response = await request(alice, 'measurement-submissions', 'POST', { captureMethod: 'manual_form', items: [partial] }, 'partial-1'); assert.equal(response.status, 201);
      let draft = await response.json(); assert.equal(draft.status, 'needs_clarification');
      assert.equal((await request(alice, `measurement-submissions/${draft.id}/confirmations`, 'POST', { version: 0, itemIds: [draft.items[0].id] })).status, 422);
      const amended = { ...item, draft: { ...item.draft, readings: [item.draft.readings[0], { componentKey: 'diastolic', result: { type: 'absent', value: { text: 'Not measured' } } }] } };
      const patch = await request(alice, `measurement-submissions/${draft.id}`, 'PATCH', { version: 0, items: [amended] }); assert.equal(patch.status, 200); draft = await patch.json();
      assert.equal(draft.status, 'ready'); assert.equal(draft.version, 1);
      assert.equal((await request(alice, `measurement-submissions/${draft.id}`, 'PATCH', { version: 0, items: [amended] })).status, 409);
      const confirmed = await request(alice, `measurement-submissions/${draft.id}/confirmations`, 'POST', { version: 1, itemIds: [draft.items[0].id] }); assert.equal(confirmed.status, 200);
      const saved = await confirmed.json(); const fhir = await (await request(alice, `measurements/${saved.items[0].measurementId}/fhir`)).json();
      assert.equal(fhir.component[1].valueQuantity, undefined); assert.equal(fhir.component[1].dataAbsentReason.text, 'Not measured');
    });
    await t.test('batch failure rolls back already-created readings, revisions and confirmation', async () => {
      const bad = { key: 'unknown', draft: { definition: 'unknown', readings: [] } };
      const draft = await (await request(alice, 'measurement-submissions', 'POST', { captureMethod: 'manual_form', items: [item, bad] }, 'atomic-1')).json();
      const count = async () => (await pool.query('SELECT (SELECT count(*) FROM measurements)::int AS measurements,(SELECT count(*) FROM measurement_sources)::int AS sources')).rows[0];
      const before = await count();
      const response = await request(alice, `measurement-submissions/${draft.id}/confirmations`, 'POST', { version: 0, itemIds: draft.items.map((i: {id: string}) => i.id) }); assert.equal(response.status, 422); assert.deepEqual(await count(), before);
    });
    await t.test('AI evidence is server-recorded; client cannot impersonate assistant', async () => {
      const conversation = await (await request(alice, 'measurement-conversations', 'POST', {})).json();
      assert.equal((await request(alice, 'measurement-sources', 'POST', { conversationId: conversation.id, content: 'Invented AI text', role: 'assistant' })).status, 400);
      const source = await (await request(alice, 'measurement-sources', 'POST', { conversationId: conversation.id, content: 'My blood pressure is 120/80' })).json();
      const patient = await service.patient('test-alice');
      const run = await service.recordAiRun(patient, { provider: 'test', model: 'test-model', templateVersion: '1', parserVersion: '1', sourceIds: [source.id], requestPayload: { message: source.content }, responseText: 'Please confirm this reading.', structuredOutput: { items: [item] }, startedAt: new Date(), completedAt: new Date() });
      const response = await request(alice, 'measurement-submissions', 'POST', { captureMethod: 'ai_conversation', aiRunId: run.id }, 'ai-1'); assert.equal(response.status, 201);
      const draft = await response.json();
      const confirmed = await request(alice, `measurement-submissions/${draft.id}/confirmations`, 'POST', { version: 0, itemIds: [draft.items[0].id] }); assert.equal(confirmed.status, 200);
      assert.equal((await request(bob, 'measurement-submissions', 'POST', { captureMethod: 'ai_conversation', aiRunId: run.id }, 'stolen-ai')).status, 404);
      await assert.rejects(pool.query('UPDATE measurement_sources SET content=$1 WHERE id=$2', ['overwrite', source.id]), { code: '55000' });
    });
  } finally {
    await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
  }
});
