import type { Reading } from '../../lib/measurements/observation';
import type { MeasurementDefinition } from '../../lib/measurements/catalog';
import { toObservation } from '../../lib/measurements/observation';
import { validateDateTime, validateResult } from '../../lib/measurements/result';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message); }
}
export function obj(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError(400, 'invalid_input', 'Expected an object');
  return value as Record<string, unknown>;
}
export function keys(value: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(value).some(k => !allowed.includes(k))) throw new ApiError(400, 'invalid_input', 'Unexpected input field');
}
export function str(value: unknown, name: string, max = 10000): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new ApiError(400, 'invalid_input', `Invalid ${name}`);
  return value;
}
export function uuid(value: unknown): string {
  const id = str(value, 'identifier', 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new ApiError(400, 'invalid_input', 'Invalid identifier');
  return id;
}
export function list(value: unknown, max = 100): unknown[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > max) throw new ApiError(400, 'invalid_input', `Expected 1–${max} items`);
  return value;
}
export function version(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) throw new ApiError(400, 'invalid_input', 'Expected a nonnegative version');
  return Number(value);
}
export type Draft = { definition: string; observedAt?: string; notes?: string; method?: string; bodySite?: string; readings: Reading[] };
export type ItemInput = { key: string; draft: Draft };
export function parseItems(value: unknown): ItemInput[] {
  const items = list(value).map(entry => {
    const item = obj(entry); keys(item, ['key', 'draft']);
    const d = obj(item.draft); keys(d, ['definition', 'observedAt', 'notes', 'method', 'bodySite', 'readings']);
    const draft: Draft = { definition: str(d.definition, 'definition', 100), readings: [] };
    for (const key of ['observedAt', 'notes', 'method', 'bodySite'] as const) if (d[key] !== undefined) draft[key] = str(d[key], key);
    if (!Array.isArray(d.readings) || d.readings.length > 100) throw new ApiError(400, 'invalid_input', 'Invalid readings');
    draft.readings = d.readings.map(entry => {
      const reading = obj(entry); keys(reading, ['componentKey', 'result', 'originalText', 'interpretation', 'referenceRanges']);
      try { validateResult(reading.result); } catch { throw new ApiError(422, 'invalid_result', 'Invalid measurement result'); }
      const result: Reading = { componentKey: str(reading.componentKey, 'component', 100), result: reading.result };
      if (reading.originalText !== undefined) result.originalText = str(reading.originalText, 'original text');
      if (reading.interpretation !== undefined) {
        result.interpretation = list(reading.interpretation).map(c => {
          try { validateResult({ type: 'coded', value: c }); } catch { throw new ApiError(422, 'invalid_result', 'Invalid interpretation'); }
          return obj(c);
        });
      }
      if (reading.referenceRanges !== undefined) {
        result.referenceRanges = list(reading.referenceRanges).map(entry => {
          const r = obj(entry); keys(r, ['low', 'high', 'text', 'type', 'appliesTo', 'age']);
          try {
            if (r.low !== undefined || r.high !== undefined) validateResult({ type: 'range', value: { ...(r.low ? { low: r.low } : {}), ...(r.high ? { high: r.high } : {}) } });
            else str(r.text, 'reference range');
            if (r.text !== undefined) str(r.text, 'reference range');
            if (r.type !== undefined) validateResult({ type: 'coded', value: r.type });
            if (r.age !== undefined) validateResult({ type: 'range', value: r.age });
            if (r.appliesTo !== undefined) list(r.appliesTo).forEach(c => validateResult({ type: 'coded', value: c }));
          } catch { throw new ApiError(422, 'invalid_result', 'Invalid reference range'); }
          return r;
        });
      }
      return result;
    });
    if (new Set(draft.readings.map(r => r.componentKey)).size !== draft.readings.length) throw new ApiError(422, 'duplicate_component', 'Duplicate measurement component');
    return { key: str(item.key, 'item key', 100), draft };
  });
  if (new Set(items.map(i => i.key)).size !== items.length) throw new ApiError(422, 'duplicate_item', 'Duplicate item key');
  return items;
}
export function assess(draft: Draft, definition?: MeasurementDefinition) {
  const issues: Array<{ field: string; code: string; message: string }> = [];
  if (!definition) return [{ field: 'definition', code: 'unknown_definition', message: 'Choose a supported measurement definition' }];
  if (!draft.observedAt) issues.push({ field: 'observedAt', code: 'missing_time', message: 'When was this reading taken?' });
  else {
    try { validateDateTime(draft.observedAt); if (!draft.observedAt.includes('T')) throw new Error(); }
    catch { issues.push({ field: 'observedAt', code: 'invalid_time', message: 'Provide a valid timestamp with timezone' }); }
  }
  for (const c of definition.components) if (!draft.readings.some(r => r.componentKey === c.key)) issues.push({ field: c.key, code: 'missing_component', message: `Provide ${c.key} or explicitly record why it is unavailable` });
  if (!issues.length) {
    try { toObservation(definition, { ...draft, observedAt: draft.observedAt!, id: 'validation', patientId: 'validation', status: 'final', verificationStatus: 'user_confirmed', sourceType: 'patient_reported' }); }
    catch { issues.push({ field: 'readings', code: 'incompatible_result', message: 'Check the components, result types, and units against the definition' }); }
  }
  return issues;
}
