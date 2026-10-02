import test from 'node:test';
import assert from 'node:assert/strict';
import { occurrences, localDay } from '../src/lib/medications/schedule.ts';
import {
  createDoseSchema,
  createMedicationSchema,
  prescriptionSchema,
} from '../src/lib/validations/medications.ts';
const id = '10000000-0000-4000-8000-000000000001';
const medicine = {
  id,
  name: 'Test',
  strength: '20mg',
  dose: '1 tablet',
  schedule: ['08:00', '13:00', '18:00', '22:00'],
  notes: '',
  active: true,
  endedReason: null,
  startDate: '2026-09-26',
  endDate: null,
  createdAt: '2026-09-26T00:00:00Z',
  updatedAt: '2026-09-26T00:00:00Z',
};
const now = new Date('2026-09-27T09:15:00');
const dose = {
  id: 'dose',
  patientId: id,
  medicineId: id,
  name: 'Test',
  dose: '1 tablet',
  status: 'Taken',
  scheduledFor: new Date('2026-09-26T08:00:00').toISOString(),
  takenAt: now.toISOString(),
  recordedAt: now.toISOString(),
  createdAt: now.toISOString(),
  scheduledTime: '08:00',
  notes: '',
};
test('daily occurrences preserve yesterday and classify current/upcoming periods', () => {
  const rows = occurrences([medicine], [], now);
  assert.equal(rows.filter((r) => r.state === 'overdue').length, 4);
  assert.equal(rows.filter((r) => r.state === 'current').length, 1);
  assert.equal(rows.filter((r) => r.state === 'upcoming').length, 3);
  assert.equal(rows[4].time, '08:00');
});
test('late taken matches scheduled occurrence, never the actual taken date; Undo restores it', () => {
  const rows = occurrences([medicine], [dose], now);
  assert.equal(rows.find((r) => r.scheduledFor === dose.scheduledFor).state, 'resolved');
  assert.equal(
    rows.find((r) => r.scheduledFor === new Date('2026-09-27T08:00:00').toISOString()).state,
    'current',
  );
  assert.equal(occurrences([medicine], [], now)[0].state, 'overdue');
});
test('skipped with no taken timestamp resolves the occurrence', () => {
  const rows = occurrences([medicine], [{ ...dose, status: 'Skipped', takenAt: null }], now);
  assert.equal(rows[0].state, 'resolved');
});
test('PRN has no occurrences; future starts and ended courses respect treatment dates', () => {
  assert.deepEqual(occurrences([{ ...medicine, schedule: [] }], [], now), []);
  assert.deepEqual(occurrences([{ ...medicine, startDate: '2026-09-28' }], [], now), []);
  assert.equal(occurrences([{ ...medicine, endDate: '2026-09-26' }], [], now).length, 4);
});
test('new medication does not manufacture earlier doses before creation', () => {
  const rows = occurrences(
    [{ ...medicine, startDate: null, createdAt: new Date('2026-09-27T09:00:00').toISOString() }],
    [],
    now,
  );
  assert.equal(rows.length, 3);
});
test('timezone local calendar generation spans DST with one occurrence per day', () => {
  const original = process.env.TZ;
  process.env.TZ = 'America/New_York';
  try {
    const rows = occurrences(
      [{ ...medicine, startDate: '2026-03-07', schedule: ['08:00'] }],
      [],
      new Date('2026-03-09T09:00:00-04:00'),
    );
    assert.deepEqual(
      rows.map((r) => r.scheduledFor),
      ['2026-03-07T13:00:00.000Z', '2026-03-08T12:00:00.000Z', '2026-03-09T12:00:00.000Z'],
    );
    assert.equal(localDay(new Date('2026-03-08T02:00:00Z')), '2026-03-07');
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});
test('dose validation enforces taken/skipped semantics and permits one-off snapshots', async () => {
  const oneOff = await createDoseSchema.validate({
    name: 'Unlisted',
    dose: '2 tablets',
    status: 'Taken',
    takenAt: '2026-01-01T12:00:00Z',
  });
  assert.equal(oneOff.medicineId, null);
  assert.equal(oneOff.scheduledFor, null);
  await assert.rejects(createDoseSchema.validate({ ...oneOff, name: '' }));
  await assert.rejects(createDoseSchema.validate({ ...oneOff, takenAt: null }));
  await assert.rejects(createDoseSchema.validate({ ...oneOff, status: 'Skipped' }));
  await assert.rejects(createDoseSchema.validate({ ...oneOff, takenAt: '2999-01-01T12:00:00Z' }));
  await assert.rejects(createDoseSchema.validate({ ...oneOff, takenAt: '2026-01-01T12:00:00' }));
  await assert.rejects(createDoseSchema.validate({ ...oneOff, scheduledFor: dose.scheduledFor }));
  assert.equal(
    (await createDoseSchema.validate({ ...oneOff, status: 'Skipped', takenAt: null })).takenAt,
    null,
  );
});
test('medications reject duplicate schedules and inverted courses; prescriptions need no attachment', async () => {
  await assert.rejects(
    createMedicationSchema.validate({ ...medicine, schedule: ['08:00', '08:00'] }),
  );
  await assert.rejects(createMedicationSchema.validate({ ...medicine, endDate: '2026-01-01' }));
  const rx = await prescriptionSchema.validate({
    prescriber: 'Dr Example',
    issuedOn: '2026-01-01',
    items: [{ name: 'Example', dose: '1 tablet' }],
  });
  assert.equal(rx.items[0].refills, 0);
  await assert.rejects(prescriptionSchema.validate({ ...rx, validUntil: '2025-01-01' }));
});

test('legacy skipped records retain their original occurrence date after migration', () => {
  const original = process.env.TZ;
  process.env.TZ = 'UTC';
  try {
    const rows = occurrences(
      [medicine],
      [
        {
          ...dose,
          status: 'Skipped',
          scheduledFor: null,
          takenAt: null,
          notes: 'Legacy skipped date/time: 2026-09-26 08:00:00+00',
        },
      ],
      new Date('2026-09-27T09:15:00Z'),
    );
    assert.equal(rows.find((r) => r.scheduledFor === '2026-09-26T08:00:00.000Z').state, 'resolved');
    assert.equal(rows.find((r) => r.scheduledFor === '2026-09-27T08:00:00.000Z').state, 'current');
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});
