import type { CodeableConcept, Observation, Period, Quantity, Range, Ratio, SampledData } from 'fhir/r4';

/** Exactly one FHIR R4 Observation.value[x], or an explicit absence reason. */
export type MeasurementResult =
  | { type: 'quantity'; value: Quantity }
  | { type: 'coded'; value: CodeableConcept }
  | { type: 'string'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'integer'; value: number }
  | { type: 'range'; value: Range }
  | { type: 'ratio'; value: Ratio }
  | { type: 'sampledData'; value: SampledData }
  | { type: 'time'; value: string }
  | { type: 'dateTime'; value: string }
  | { type: 'period'; value: Period }
  | { type: 'absent'; value: CodeableConcept };
export type ResultType = MeasurementResult['type'];
export const resultTypes = ['quantity', 'coded', 'string', 'boolean', 'integer', 'range', 'ratio', 'sampledData', 'time', 'dateTime', 'period', 'absent'] as const;
export type ResultFields = Pick<Observation, 'valueQuantity' | 'valueCodeableConcept' | 'valueString' | 'valueBoolean' | 'valueInteger' | 'valueRange' | 'valueRatio' | 'valueSampledData' | 'valueTime' | 'valueDateTime' | 'valuePeriod' | 'dataAbsentReason'>;

function fail(message: string): never { throw new Error(message); }
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Expected an object');
  return value as Record<string, unknown>;
}
function string(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) fail('Expected nonempty text');
}
function number(value: unknown): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail('Expected a finite number');
}
function quantity(value: unknown, simple = false) {
  const q = object(value);
  if (q.value !== undefined) number(q.value);
  for (const key of ['unit', 'system', 'code']) if (q[key] !== undefined) string(q[key]);
  if (q.code !== undefined && q.system === undefined) fail('A coded unit requires its system');
  if (q.comparator !== undefined && (simple || !['<', '<=', '>=', '>'].includes(String(q.comparator)))) fail('Invalid quantity comparator');
  if (!Object.keys(q).length) fail('Empty quantity');
}
function concept(value: unknown) {
  const c = object(value);
  if (c.text !== undefined) string(c.text);
  if (c.coding !== undefined) {
    if (!Array.isArray(c.coding) || !c.coding.length) fail('Expected codings');
    c.coding.forEach(item => {
      const coding = object(item);
      if (!Object.keys(coding).length) fail('Empty coding');
      for (const key of ['system', 'version', 'code', 'display']) if (coding[key] !== undefined) string(coding[key]);
      if (coding.userSelected !== undefined && typeof coding.userSelected !== 'boolean') fail('Invalid userSelected');
    });
  }
  if (c.text === undefined && c.coding === undefined && c.extension === undefined) fail('Expected a concept');
}

/** FHIR permits year, year-month, full date, or a timestamp with timezone. */
export function validateDateTime(value: unknown): asserts value is string {
  string(value);
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2})(?:T([01]\d|2[0-3]):([0-5]\d):([0-5]\d|60)(?:\.\d+)?(Z|[+-](?:0\d|1[0-3]):[0-5]\d|[+-]14:00))?)?)?$/.exec(value);
  if (!m || Number(m[1]) === 0) fail('Invalid FHIR dateTime');
  const year = Number(m[1]); const month = Number(m[2]); const day = Number(m[3]);
  if (m[2] && (month < 1 || month > 12)) fail('Invalid month');
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (m[3] && (day < 1 || day > days[month - 1]!)) fail('Invalid day');
}
function range(value: unknown) {
  const r = object(value);
  if (r.low === undefined && r.high === undefined) fail('Range needs a bound');
  if (r.low !== undefined) quantity(r.low, true);
  if (r.high !== undefined) quantity(r.high, true);
  if (r.low !== undefined && r.high !== undefined) {
    const low = object(r.low); const high = object(r.high);
    if (low.code !== high.code || low.system !== high.system || (!low.code && low.unit !== high.unit)) fail('Range bounds must use the same units');
    if (typeof low.value === 'number' && typeof high.value === 'number' && low.value > high.value) fail('Range bounds reversed');
  }
}
function period(value: unknown) {
  const p = object(value);
  if (p.start === undefined && p.end === undefined) fail('Period needs a boundary');
  if (p.start !== undefined) validateDateTime(p.start);
  if (p.end !== undefined) validateDateTime(p.end);
  // Compare only equal precision boundaries; partial dates are retained as supplied.
  if (typeof p.start === 'string' && typeof p.end === 'string') {
    if (p.start.length === p.end.length && !p.start.includes('T') && p.start > p.end) fail('Period boundaries reversed');
    if (p.start.includes('T') && p.end.includes('T') && Date.parse(p.start) > Date.parse(p.end)) fail('Period boundaries reversed');
  }
}
function sampled(value: unknown) {
  const s = object(value);
  quantity(s.origin, true);
  number(s.period);
  if (s.period <= 0) fail('Sample period must be positive');
  number(s.dimensions);
  if (!Number.isInteger(s.dimensions) || s.dimensions < 1 || s.dimensions > 2147483647) fail('Invalid sample dimensions');
  for (const key of ['factor', 'lowerLimit', 'upperLimit']) if (s[key] !== undefined) number(s[key]);
  if (typeof s.lowerLimit === 'number' && typeof s.upperLimit === 'number' && s.lowerLimit > s.upperLimit) fail('Sample limits reversed');
  if (s.data !== undefined) {
    string(s.data);
    const samples = s.data.split(' ');
    if (samples.length % s.dimensions !== 0 || samples.some(v => !/^(?:E|L|U|[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)$/.test(v))) fail('Invalid sample data');
  }
}

/** Application-level checks. Official FHIR/profile validation remains a separate boundary. */
export function validateResult(input: unknown): asserts input is MeasurementResult {
  const r = object(input);
  if (Object.keys(r).some(k => k !== 'type' && k !== 'value') || r.value === undefined || r.value === null) fail('Expected exactly a result type and value');
  switch (r.type) {
    case 'quantity': quantity(r.value); break;
    case 'coded': case 'absent': concept(r.value); break;
    case 'string': string(r.value); break;
    case 'boolean': if (typeof r.value !== 'boolean') fail('Expected boolean'); break;
    case 'integer': number(r.value); if (!Number.isInteger(r.value) || r.value < -2147483648 || r.value > 2147483647) fail('Integer outside FHIR range'); break;
    case 'range': range(r.value); break;
    case 'ratio': {
      const ratio = object(r.value);
      if (ratio.numerator === undefined && ratio.denominator === undefined) fail('Empty ratio');
      if (ratio.numerator !== undefined) quantity(ratio.numerator);
      if (ratio.denominator !== undefined) { quantity(ratio.denominator); if (object(ratio.denominator).value === 0) fail('Zero ratio denominator'); }
      break;
    }
    case 'sampledData': sampled(r.value); break;
    case 'time': string(r.value); if (!/^(?:[01]\d|2[0-3]):[0-5]\d:(?:[0-5]\d|60)(?:\.\d+)?$/.test(r.value)) fail('Invalid FHIR time'); break;
    case 'dateTime': validateDateTime(r.value); break;
    case 'period': period(r.value); break;
    default: fail('Unsupported FHIR R4 Observation result type');
  }
}

export function resultToFhir(result: MeasurementResult): ResultFields {
  validateResult(result);
  // Clone to prevent mutation of stored results through an exported object.
  const r = structuredClone(result);
  switch (r.type) {
    case 'quantity': return { valueQuantity: r.value };
    case 'coded': return { valueCodeableConcept: r.value };
    case 'string': return { valueString: r.value };
    case 'boolean': return { valueBoolean: r.value };
    case 'integer': return { valueInteger: r.value };
    case 'range': return { valueRange: r.value };
    case 'ratio': return { valueRatio: r.value };
    case 'sampledData': return { valueSampledData: r.value };
    case 'time': return { valueTime: r.value };
    case 'dateTime': return { valueDateTime: r.value };
    case 'period': return { valuePeriod: r.value };
    case 'absent': return { dataAbsentReason: r.value };
  }
}
