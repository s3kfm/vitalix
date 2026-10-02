/** Run against a disposable database after db:push:
 * PATIENT_TEST_DATABASE_URL=postgresql://... npx tsx scripts/test-patients.ts
 * Creates synthetic records; never defaults to the app's configured database.
 */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';

async function main() {
  assert.ok(
    process.env.PATIENT_TEST_DATABASE_URL,
    'Provide a disposable PATIENT_TEST_DATABASE_URL.',
  );
  process.env.DATABASE_URL = process.env.PATIENT_TEST_DATABASE_URL;
  const patients = await import('../app/api/patients/route');
  const symptoms = await import('../app/api/patients/[patientId]/symptoms/route');
  const symptom = await import('../app/api/patients/[patientId]/symptoms/[id]/route');
  const medications = await import('../app/api/patients/[patientId]/medications/route');
  const medication = await import('../app/api/patients/[patientId]/medications/[id]/route');
  const doses = await import('../app/api/patients/[patientId]/doses/route');
  const measurements = await import('../app/api/patients/[patientId]/measurements/route');
  const group = await import('../app/api/patients/[patientId]/measurements/group/route');
  const measurement = await import('../app/api/patients/[patientId]/measurements/[id]/route');
  const latest = await import('../app/api/patients/[patientId]/measurements/latest/route');
  const timeline = await import('../app/api/patients/[patientId]/timeline/route');
  const { pool } = await import('../src/db');
  const request = (method = 'GET', body?: unknown) =>
    new NextRequest('http://localhost/api/test', {
      method,
      ...(body === undefined
        ? {}
        : { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }),
    });
  const scope = (patientId: string, id = '') => ({ params: Promise.resolve({ patientId, id }) });
  try {
    assert.equal((await patients.POST(request('POST', { name: '   ' }))).status, 400);
    const enrolled = await Promise.all(
      ['Patient A', 'Patient B'].map((name) => patients.POST(request('POST', { name }))),
    );
    assert.ok(enrolled.every((response) => response.status === 201));
    const [a, b] = await Promise.all(enrolled.map((response) => response.json()));
    assert.notEqual(a.id, b.id);
    const count = (await (await patients.GET()).json()).length;
    for (const patientId of ['invalid', randomUUID()]) {
      for (const route of [symptoms, medications, doses, measurements, timeline]) {
        assert.equal((await route.GET(request(), scope(patientId))).status, 404);
      }
    }
    assert.equal(
      (await (await patients.GET()).json()).length,
      count,
      'Reads must not enroll patients.',
    );
    const created = await symptoms.POST(
      request('POST', {
        name: 'Demo headache',
        onsetAt: new Date(Date.now() - 60_000).toISOString(),
      }),
      scope(a.id),
    );
    assert.equal(created.status, 201);
    const symptomRecord = await created.json();
    assert.equal(
      (await symptom.PATCH(request('PATCH'), scope(b.id, symptomRecord.id))).status,
      404,
    );
    assert.equal(
      (await symptom.PATCH(request('PATCH'), scope(a.id, symptomRecord.id))).status,
      200,
    );
    const createdMedicine = await medications.POST(
      request('POST', { name: 'Demo medication', dose: '1 tablet', schedule: [] }),
      scope(a.id),
    );
    assert.equal(createdMedicine.status, 201);
    const medicineRecord = await createdMedicine.json();
    assert.equal(
      (await medication.PATCH(request('PATCH', { active: false }), scope(b.id, medicineRecord.id)))
        .status,
      404,
    );
    const dose = {
      medicineId: medicineRecord.id,
      dose: '1 tablet',
      status: 'Taken',
      takenAt: new Date().toISOString(),
    };
    assert.equal((await doses.POST(request('POST', dose), scope(b.id))).status, 404);
    assert.equal((await doses.POST(request('POST', dose), scope(a.id))).status, 201);
    const createdGroup = await group.POST(
      request('POST', {
        observations: [
          {
            definitionSlug: 'weight',
            observedAt: new Date().toISOString(),
            values: [
              {
                componentKey: 'value',
                result: { type: 'quantity', value: { value: 70, unit: 'kg' } },
              },
            ],
          },
        ],
      }),
      scope(a.id),
    );
    assert.equal(createdGroup.status, 201);
    const measurementRecord = (await createdGroup.json()).measurements[0];
    assert.equal((await measurement.GET(request(), scope(b.id, measurementRecord.id))).status, 404);
    assert.equal(
      (
        await measurement.PUT(
          request('PUT', { notes: 'Other patient' }),
          scope(b.id, measurementRecord.id),
        )
      ).status,
      404,
    );
    assert.equal(
      (await measurement.DELETE(request('DELETE'), scope(b.id, measurementRecord.id))).status,
      404,
    );
    assert.equal((await measurement.GET(request(), scope(a.id, measurementRecord.id))).status, 200);
    assert.equal(await (await latest.GET(request(), scope(b.id))).json(), null);
    for (const route of [symptoms, medications, doses, measurements, timeline]) {
      assert.deepEqual(await (await route.GET(request(), scope(b.id))).json(), []);
      assert.ok((await (await route.GET(request(), scope(a.id))).json()).length > 0);
    }
    console.log(
      'Passed: enrollment validation, concurrent enrollment, missing patients, read-only lookup, and cross-patient record isolation.',
    );
  } finally {
    await pool.end();
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
