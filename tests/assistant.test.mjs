import test from 'node:test';
import assert from 'node:assert/strict';
import { changesetSchema, recordDetails } from '../src/lib/assistant/changeset.ts';
import { saveChangeset } from '../src/lib/assistant/save.ts';
import { validateFiles } from '../src/lib/assistant/attachments.ts';
import { validateExtractedMeasurement } from '../src/lib/assistant/validate-measurement.ts';

const id = '10000000-0000-4000-8000-000000000001';
const symptom = { key: 's1', kind: 'symptom', data: { name: 'Headache', onsetAt: '2025-01-01T12:00:00Z', severity: 4 } };
const medication = { key: 'm1', kind: 'medication', data: { name: 'Vitamin D', strength: '1000 IU', dose: '1 tablet', schedule: ['08:00', '20:00'] } };
const dose = { key: 'd1', kind: 'dose', data: { medicationName: 'Vitamin D', medicineId: 'm1', dose: '1 tablet', status: 'Taken', takenAt: '2025-01-01T08:00:00Z' } };
const measurement = { key: 'v1', kind: 'measurement', data: { definitionSlug: 'weight', observedAt: '2025-01-01T12:00:00Z', values: [{ componentKey: 'value', result: { type: 'quantity', value: { value: 70, unit: 'kg' } } }] } };
const batch = records => ({ summary: 'Review your records', records });
const patientUrl = path => `/api${path}`;
const json = (body, status = 201) => Response.json(body, { status });

test('mixed batch saves through existing APIs, creates medication before dependent dose, and omits chat', async () => {
  const calls = [];
  const request = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, body });
    return json(url.includes('measurements') ? { group: { id } } : { id });
  };
  const results = await saveChangeset(batch([dose, symptom, measurement, medication]), patientUrl, [], () => {}, request);
  assert.equal(results.length, 4);
  assert.ok(results.every(result => result.status === 'saved'));
  assert.equal(calls[0].url, '/api/medications');
  assert.deepEqual(calls[0].body.schedule, ['08:00', '20:00']);
  assert.equal(calls.find(call => call.url === '/api/doses').body.medicineId, id);
  const group = calls.find(call => call.url.includes('measurements')).body;
  assert.equal(group.source, 'ai');
  assert.equal(group.messages, undefined);
  assert.equal(group.observations[0].values[0].result.value.value, 70);
});

test('validation failure does not prevent other saves and retry skips saved records', async () => {
  let attempts = 0;
  const calls = [];
  const request = async url => {
    calls.push(url);
    if (url === '/api/symptoms' && attempts++ === 0) return json({ error: 'Please correct the symptom.' }, 400);
    return json({ id });
  };
  const input = batch([symptom, medication]);
  const first = await saveChangeset(input, patientUrl, [], () => {}, request);
  assert.equal(first[0].status, 'failed');
  assert.equal(first[1].status, 'saved');
  const second = await saveChangeset(input, patientUrl, first, () => {}, request);
  assert.ok(second.every(result => result.status === 'saved'));
  assert.equal(calls.filter(url => url === '/api/medications').length, 1);
});

test('lost responses and server failures are not retried, and dependent doses do not get written', async () => {
  let calls = 0;
  const request = async () => { calls++; throw new Error('Connection lost'); };
  const input = batch([medication, dose]);
  const first = await saveChangeset(input, patientUrl, [], () => {}, request);
  assert.equal(first[0].status, 'uncertain');
  assert.equal(first[1].status, 'failed');
  await saveChangeset(input, patientUrl, first, () => {}, request);
  assert.equal(calls, 1);
  const failed = await saveChangeset(batch([symptom]), patientUrl, [], () => {}, async () => json({ error: 'Database error' }, 500));
  assert.equal(failed[0].status, 'uncertain');
});

test('invalid dates and schedules are rejected before writing; duplicate keys and dangling references are invalid', async () => {
  let calls = 0;
  const request = async () => { calls++; return json({ id }); };
  const duplicateSchedule = { ...medication, data: { ...medication.data, schedule: ['08:00', '08:00'] } };
  const futureSymptom = { ...symptom, data: { ...symptom.data, onsetAt: '2999-01-01T00:00:00Z' } };
  const result = await saveChangeset(batch([duplicateSchedule, futureSymptom]), patientUrl, [], () => {}, request);
  assert.ok(result.every(item => item.status === 'failed'));
  assert.equal(calls, 0);
  assert.equal(changesetSchema.safeParse(batch([symptom, symptom])).success, false);
  assert.equal(changesetSchema.safeParse(batch([dose])).success, false);
});

test('extraction validation rejects unknown, duplicate, missing, and mismatched components', () => {
  const components = [{ key: 'value', name: 'Weight', resultType: 'quantity', unit: 'kg' }];
  assert.equal(validateExtractedMeasurement(measurement.data, components), null);
  assert.match(validateExtractedMeasurement({ ...measurement.data, values: [] }, components), /invalid/);
  assert.match(validateExtractedMeasurement({ ...measurement.data, values: [...measurement.data.values, ...measurement.data.values] }, components), /exactly once/);
  assert.match(validateExtractedMeasurement({ ...measurement.data, values: [{ componentKey: 'wrong', result: { type: 'boolean', value: false } }] }, components), /Invalid component/);
});

test('review preserves zero, false, units, schedule and readable medication names', () => {
  const zero = { ...measurement, data: { ...measurement.data, values: [{ componentKey: 'value', result: { type: 'quantity', value: { value: 0, unit: 'mg/dL', comparator: '<' } } }] } };
  assert.ok(recordDetails(zero, [zero]).some(([, value]) => value === '< 0 mg/dL'));
  assert.ok(recordDetails(dose, [dose, medication]).some(([, value]) => value === 'Vitamin D'));
  const existingDose = { ...dose, data: { ...dose.data, medicineId: id } };
  assert.ok(recordDetails(existingDose, [existingDose]).some(([, value]) => value === 'Vitamin D'));
});

test('attachment validation accepts supported multimodal inputs and rejects empty, oversized and unsupported files', () => {
  validateFiles([new File(['image'], 'scan.png', { type: 'image/png' }), new File(['pdf'], 'report.pdf', { type: 'application/pdf' }), new File(['notes'], 'notes.txt', { type: 'text/plain' })]);
  assert.throws(() => validateFiles([new File([], 'empty.txt', { type: 'text/plain' })]), /empty/);
  assert.throws(() => validateFiles([new File(['data'], 'scan.heic', { type: 'image/heic' })]), /choose a/);
  assert.throws(() => validateFiles([new File([new Uint8Array(3 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })]), /too large/);
  assert.throws(() => validateFiles(Array.from({ length: 4 }, () => new File(['a'], 'a.txt', { type: 'text/plain' }))), /up to 3/);
});
