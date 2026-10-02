import test from 'node:test';
import assert from 'node:assert/strict';
import { initialDraft, serializeResult } from '../src/lib/measurements/form.ts';

const component = (resultType, unit) => ({ key: 'value', name: 'Result', resultType, unit });

test('quantity preserves zero, units, and comparator; blank is not zero', () => {
  const definition = component('quantity', 'mg/dL');
  assert.equal(initialDraft(definition).unit, 'mg/dL');
  assert.deepEqual(serializeResult(definition, { value: '0', unit: 'mg/dL', comparator: '<' }), {
    type: 'quantity',
    value: { value: 0, unit: 'mg/dL', comparator: '<' },
  });
  assert.throws(() => serializeResult(definition, { value: '', unit: 'mg/dL' }), /required/);
});

test('text, coded and false results retain their intended types', () => {
  assert.deepEqual(serializeResult(component('string'), { value: 'Negative' }), {
    type: 'string',
    value: 'Negative',
  });
  assert.deepEqual(
    serializeResult(component('coded'), { code: 'negative', display: 'Negative', system: '' }),
    { type: 'coded', value: { code: 'negative', display: 'Negative' } },
  );
  assert.deepEqual(serializeResult(component('boolean'), { value: 'false' }), {
    type: 'boolean',
    value: false,
  });
  assert.throws(() => serializeResult(component('integer'), { value: '1.5' }), /whole number/);
});

test('range ordering and ratio denominator are validated', () => {
  assert.throws(
    () =>
      serializeResult(component('range'), {
        'low.value': '4',
        'low.unit': 'kg',
        'high.value': '2',
        'high.unit': 'kg',
      }),
    /Low must not exceed high/,
  );
  assert.throws(
    () =>
      serializeResult(component('ratio'), {
        'numerator.value': '4',
        'numerator.unit': 'mg',
        'denominator.value': '0',
        'denominator.unit': 'mL',
      }),
    /must not be zero/,
  );
});

test('dates serialize to ISO and unsupported result types are blocked', () => {
  assert.deepEqual(serializeResult(component('dateTime'), { value: '2026-09-08T12:00:00Z' }), {
    type: 'dateTime',
    value: '2026-09-08T12:00:00.000Z',
  });
  assert.throws(() => serializeResult(component('sampledData'), {}), /not supported/);
});
