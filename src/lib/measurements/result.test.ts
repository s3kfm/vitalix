import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resultToFhir, validateResult, type MeasurementResult } from './result';
import { toObservation, type MeasurementExport } from './observation';
import { measurementCatalog, type MeasurementDefinition } from './catalog';

const fixtures: Array<[MeasurementResult, string]> = [
  [{ type: 'quantity', value: { value: 5, comparator: '<', unit: 'mg/L', system: 'http://unitsofmeasure.org', code: 'mg/L' } }, 'valueQuantity'],
  [{ type: 'coded', value: { coding: [{ system: 'http://snomed.info/sct', code: '260385009', display: 'Negative' }], text: 'Negative' } }, 'valueCodeableConcept'],
  [{ type: 'string', value: 'Mixed flora isolated' }, 'valueString'],
  [{ type: 'boolean', value: false }, 'valueBoolean'],
  [{ type: 'integer', value: 0 }, 'valueInteger'],
  [{ type: 'range', value: { low: { value: 2 }, high: { value: 4 } } }, 'valueRange'],
  [{ type: 'ratio', value: { numerator: { value: 1 }, denominator: { value: 128 } } }, 'valueRatio'],
  [{ type: 'sampledData', value: { origin: { value: 0 }, period: 10, dimensions: 2, factor: 0.1, lowerLimit: -10, upperLimit: 10, data: '1 2 E U' } }, 'valueSampledData'],
  [{ type: 'time', value: '08:30:00' }, 'valueTime'],
  [{ type: 'dateTime', value: '2026-09' }, 'valueDateTime'],
  [{ type: 'period', value: { start: '2026-09-01', end: '2026-09-07' } }, 'valuePeriod'],
  [{ type: 'absent', value: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/data-absent-reason', code: 'not-performed' }] } }, 'dataAbsentReason'],
];
const input: MeasurementExport = { id: 'result-1', patientId: 'patient-1', observedAt: '2026-09-07T08:00:00Z', status: 'final', sourceType: 'report', verificationStatus: 'user_confirmed', readings: [] };
for (const [result, field] of fixtures) {
  test(`${result.type} survives JSON storage and exports at both levels`, () => {
    const stored: unknown = JSON.parse(JSON.stringify(result));
    validateResult(stored);
    assert.deepEqual(resultToFhir(stored), { [field]: result.value });
    for (const key of ['value', 'component-a']) {
      const definition: MeasurementDefinition = { slug: 'test', name: 'Test', category: 'laboratory', components: [{ key, allowedResultTypes: [result.type] }] };
      const observation = toObservation(definition, { ...input, readings: [{ componentKey: key, result: stored }] });
      const exported = key === 'value' ? observation : observation.component![0]!;
      assert.deepEqual((exported as unknown as Record<string, unknown>)[field], result.value);
      assert.equal(Object.keys(exported).filter(k => k.startsWith('value') || k === 'dataAbsentReason').length, 1);
    }
  });
}

test('rejects malformed values rather than coercing or guessing', () => {
  const invalid: unknown[] = [
    { type: 'boolean', value: 'false' }, { type: 'integer', value: 1.5 }, { type: 'integer', value: 2147483648 },
    { type: 'quantity', value: { value: Infinity } }, { type: 'quantity', value: { value: 5, comparator: '~' } },
    { type: 'quantity', value: { value: 5, code: 'kg' } }, { type: 'coded', value: {} },
    { type: 'absent', value: {} }, { type: 'string', value: '' },
    { type: 'boolean', value: false, dataAbsentReason: {} }, { type: 'attachment', value: {} },
    { type: 'range', value: { low: { value: 10 }, high: { value: 2 } } },
    { type: 'range', value: { low: { value: 1, comparator: '<' } } },
    { type: 'ratio', value: { denominator: { value: 0 } } },
    { type: 'time', value: '24:00:00' }, { type: 'time', value: '08:00:00Z' },
    { type: 'dateTime', value: '2026-02-29' }, { type: 'dateTime', value: '2026-09-07T08:00:00' },
    { type: 'period', value: { start: '2026-09-08', end: '2026-09-07' } },
    { type: 'sampledData', value: { origin: { value: 0 }, period: 10, dimensions: 2, data: '1 2 3' } },
  ];
  for (const value of invalid) assert.throws(() => validateResult(value), JSON.stringify(value));
});

test('missing diastolic remains a component with an absence reason, never zero', () => {
  const result = toObservation(measurementCatalog[0]!, { ...input, readings: [
    { componentKey: 'systolic', result: { type: 'quantity', value: { value: 120, system: 'http://unitsofmeasure.org', code: 'mm[Hg]' } } },
    { componentKey: 'diastolic', result: fixtures[11]![0] },
  ] });
  assert.equal(result.component?.[1]?.valueQuantity, undefined);
  assert.ok(result.component?.[1]?.dataAbsentReason);
});

test('definitions reject inappropriate result types and keep interpretations separate', () => {
  assert.throws(() => toObservation(measurementCatalog[1]!, { ...input, readings: [{ componentKey: 'value', result: { type: 'string', value: 'High' } }] }));
  const interpretation = [{ text: 'High' }];
  const referenceRanges = [{ low: { value: 2 }, high: { value: 4 } }];
  const observation = toObservation({ slug: 'test', name: 'Test', category: 'laboratory', components: [{ key: 'value', allowedResultTypes: ['integer'] }] }, { ...input, readings: [{ componentKey: 'value', result: { type: 'integer', value: 5 }, interpretation, referenceRanges }] });
  assert.equal(observation.valueInteger, 5);
  assert.deepEqual(observation.interpretation, interpretation);
  assert.deepEqual(observation.referenceRange, referenceRanges);
});
