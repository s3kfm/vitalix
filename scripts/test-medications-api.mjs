/** Run only against the disposable app started for integration testing. */
import assert from 'node:assert/strict';
const base = process.env.MEDICATION_TEST_URL;
assert.ok(base, 'Set MEDICATION_TEST_URL to a disposable app instance.');
let cookie = '';
async function request(path, method = 'GET', body, status = 200) {
  const form = body instanceof FormData;
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      Origin: base,
      ...(!form && body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? (form ? body : JSON.stringify(body)) : undefined,
  });
  const result =
    response.status === 204
      ? null
      : response.headers.get('content-type')?.includes('json')
        ? await response.json()
        : await response.text();
  assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(result)}`);
  return { response, result };
}
const { response } = await request('/api/auth/sign-up/email', 'POST', {
  name: 'Medication test',
  email: `med-${Date.now()}@example.com`,
  password: 'Disposable-testing-493!',
});
cookie = response.headers
  .getSetCookie()
  .map((c) => c.split(';')[0])
  .join('; ');
assert.ok(cookie);
const patient = (await request('/api/patients', 'POST', { name: 'Medication test patient' }, 201))
  .result;
const other = (await request('/api/patients', 'POST', { name: 'Other patient' }, 201)).result;
const path = `/api/patients/${patient.id}`;
const medicine = (
  await request(
    path + '/medications',
    'POST',
    {
      name: 'Scheduled',
      strength: '20mg',
      dose: '1 tablet',
      schedule: ['08:00'],
      startDate: '2026-09-26',
    },
    201,
  )
).result;
const body = {
  medicineId: medicine.id,
  dose: '1 tablet',
  status: 'Taken',
  scheduledFor: '2026-09-26T08:00:00Z',
  scheduledTime: '08:00',
  takenAt: new Date().toISOString(),
  timeZone: 'UTC',
};
const taken = (await request(path + '/doses', 'POST', body, 201)).result;
assert.notEqual(taken.takenAt, taken.scheduledFor);
assert.ok(taken.recordedAt);
assert.equal(taken.name, 'Scheduled 20mg');
await request(path + '/doses', 'POST', body, 409);
await request(`/api/patients/${other.id}/doses`, 'POST', body, 404);
await request(`/api/patients/${other.id}/doses/${taken.id}`, 'DELETE', undefined, 404);
const skipped = (
  await request(path + `/doses/${taken.id}`, 'PATCH', {
    dose: '1 tablet',
    status: 'Skipped',
    takenAt: null,
    notes: 'Correction',
  })
).result;
assert.equal(skipped.takenAt, null);
assert.equal(skipped.recordedAt, taken.recordedAt);
assert.equal(skipped.scheduledFor, taken.scheduledFor);
await request(path + `/doses/${taken.id}`, 'DELETE', undefined, 204);
await request(path + '/doses', 'POST', { ...body, status: 'Skipped', takenAt: null }, 201);
await request(path + '/doses', 'POST', { ...body, status: 'Skipped' }, 400);
const prn = (
  await request(path + '/medications', 'POST', { name: 'PRN', dose: '1 tablet', schedule: [] }, 201)
).result;
const prnDose = (
  await request(
    path + '/doses',
    'POST',
    { medicineId: prn.id, dose: '1 tablet', status: 'Taken', takenAt: body.takenAt },
    201,
  )
).result;
assert.equal(prnDose.scheduledFor, null);
await request(
  path + '/doses',
  'POST',
  { name: 'Unlisted', dose: '2 tablets', status: 'Taken', takenAt: body.takenAt },
  201,
);
assert.equal((await request(path + '/medications')).result.length, 2);
await request(path + '/medications/' + prn.id, 'PATCH', {
  active: false,
  endedReason: 'Completed',
});
await request(
  path + '/doses',
  'POST',
  { medicineId: prn.id, dose: '1 tablet', status: 'Taken', takenAt: body.takenAt },
  400,
);
assert.equal((await request(path + '/timeline')).result.filter((x) => x.kind === 'dose').length, 3);
const record = {
  prescriber: 'Dr Example',
  issuedOn: '2026-09-01',
  items: [{ name: 'Example medication', dose: '1 tablet', quantity: '30', refills: 2 }],
};
let form = new FormData();
form.set('record', JSON.stringify(record));
await request(path + '/prescriptions', 'POST', form, 201);
form = new FormData();
form.set('record', JSON.stringify(record));
form.set('attachment', new Blob(['%PDF-1.4\n%%EOF'], { type: 'application/pdf' }), 'demo.pdf');
const rx = (await request(path + '/prescriptions', 'POST', form, 201)).result;
assert.equal((await request(path + '/prescriptions')).result.length, 2);
assert.equal((await request(path + '/prescriptions')).result[0].attachmentData, undefined);
await request(path + `/prescriptions/${rx.id}/attachment`);
await request(`/api/patients/${other.id}/prescriptions/${rx.id}/attachment`, 'GET', undefined, 404);
form.set('attachment', new Blob(['not a pdf'], { type: 'application/pdf' }), 'fake.pdf');
await request(path + '/prescriptions', 'POST', form, 400);
cookie = '';
await request(path + '/doses', 'GET', undefined, 401);
await request(path + `/prescriptions/${rx.id}/attachment`, 'GET', undefined, 401);
console.log(
  'Passed authenticated medication APIs: scheduled taken/skip, timestamps, duplicate protection, edit/undo, PRN, one-off, lifecycle, timeline, prescriptions, attachments and patient isolation.',
);
