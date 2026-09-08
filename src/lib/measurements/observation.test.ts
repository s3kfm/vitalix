import assert from 'node:assert/strict';
import { test } from 'node:test';
import { measurementCatalog } from './catalog';
import { normalize, toObservation, type MeasurementExport } from './observation';
const base: MeasurementExport = { id: 'reading-1', patientId: 'patient-1', observedAt: '2026-09-07T08:00:00Z', status: 'final', verificationStatus: 'user_confirmed', sourceType: 'patient_reported', readings: [ { componentKey: 'systolic', result: { type: 'quantity', value: { value: 120, code: 'mm[Hg]', system: 'http://unitsofmeasure.org' } } }, { componentKey: 'diastolic', result: { type: 'quantity', value: { value: 80, code: 'mm[Hg]', system: 'http://unitsofmeasure.org' } } } ] };
const bp = measurementCatalog[0]!;
test('blood pressure exports as one observation with two coded components', () => {
  const result = toObservation(bp, base);
  assert.equal(result.valueQuantity, undefined);
  assert.equal(result.code.coding?.[0]?.code, '85354-9');
  assert.deepEqual(result.component?.map(c => [c.code.coding?.[0]?.code, c.valueQuantity?.value]), [['8480-6', 120], ['8462-4', 80]]);
});
test('incomplete, duplicate, incompatible, and unconfirmed readings are rejected', () => {
  for (const readings of [base.readings.slice(0, 1), [base.readings[0]!, base.readings[0]!], base.readings.map(r => ({ ...r, result: { type: 'quantity' as const, value: { value: 120, code: 'kg', system: 'http://unitsofmeasure.org' } } }))]) {
    assert.throws(() => toObservation(bp, { ...base, readings }));
  }
  assert.throws(() => toObservation(bp, { ...base, verificationStatus: 'pending_review' }));
});
test('unit conversion handles temperature offsets and rejects unknown conversions', () => {
  assert.equal(normalize(32, '[degF]', 'Cel'), 0);
  assert.equal(normalize(212, '[degF]', 'Cel'), 100);
  assert.equal(normalize(160, '[lb_av]', 'kg'), 72.57477920000001);
  assert.throws(() => normalize(1, 'mg/dL', 'mmol/L'));
  assert.throws(() => normalize(NaN, 'kg', 'kg'));
});
test('simple observations preserve the original unit', () => {
  const result = toObservation(measurementCatalog[1]!, { ...base, readings: [{ componentKey: 'value', result: { type: 'quantity', value: { value: 160, code: '[lb_av]', system: 'http://unitsofmeasure.org' } } }] });
  assert.equal(result.valueQuantity?.value, 160);
  assert.equal(result.valueQuantity?.code, '[lb_av]');
  assert.equal(result.component, undefined);
});
