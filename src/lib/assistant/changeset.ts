import { z } from 'zod';

const timestamp = z.iso.datetime({ offset: true });
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const notes = z.string().max(5000).optional();
const quantity = z.object({ value: z.number(), unit: z.string().min(1), comparator: z.enum(['<', '<=', '>=', '>']).optional() });
const coding = z.object({ code: z.string(), system: z.string().optional(), display: z.string().optional() });
export const resultSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('quantity'), value: quantity }),
  z.object({ type: z.literal('string'), value: z.string() }),
  z.object({ type: z.literal('integer'), value: z.number().int() }),
  z.object({ type: z.literal('boolean'), value: z.boolean() }),
  z.object({ type: z.literal('coded'), value: coding }),
  z.object({ type: z.literal('absent'), value: coding }),
  z.object({ type: z.literal('range'), value: z.object({ low: quantity, high: quantity }) }),
  z.object({ type: z.literal('ratio'), value: z.object({ numerator: quantity, denominator: quantity }) }),
  z.object({ type: z.literal('period'), value: z.object({ start: timestamp, end: timestamp }) }),
  z.object({ type: z.literal('time'), value: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/) }),
  z.object({ type: z.literal('dateTime'), value: timestamp }),
]);
const key = z.string().min(1).max(100).describe('Unique key within this changeset, e.g. medication-1.');
export const recordSchema = z.discriminatedUnion('kind', [
  z.object({ key, kind: z.literal('symptom'), data: z.object({
    name: z.string().min(1).max(200), onsetAt: timestamp, resolvedAt: timestamp.optional(),
    severity: z.number().int().min(1).max(10).optional(), location: z.string().max(200).optional(), notes,
  }) }),
  z.object({ key, kind: z.literal('resolveSymptom'), data: z.object({
    symptomId: z.string().uuid().describe('Existing symptom UUID from lookup.'),
    symptomName: z.string().min(1).max(200).describe('Human-readable name for review.'),
  }) }),
  z.object({ key, kind: z.literal('medication'), data: z.object({
    name: z.string().min(1).max(200), strength: z.string().max(200), dose: z.string().min(1).max(200),
    schedule: z.array(time).max(24).describe('Daily local times, or [] for explicitly as-needed medication. Ask if unknown.'), notes,
  }) }),
  z.object({ key, kind: z.literal('dose'), data: z.object({
    medicationName: z.string().min(1).max(200).describe('Medication name from the lookup or the new medication in this batch.'),
    medicineId: z.string().min(1).describe('Existing medication UUID from lookup, or the key of a new medication in this changeset.'),
    dose: z.string().min(1).max(200), status: z.enum(['Taken', 'Skipped']), takenAt: timestamp.nullable().describe('Actual taken time; null for Skipped.'),
    scheduledTime: time.optional(), scheduledFor: timestamp.optional().describe('Exact scheduled occurrence including timezone; required for a scheduled medication. Never infer it from actual taken time.'), notes,
  }) }),
  z.object({ key, kind: z.literal('measurement'), data: z.object({
    definitionSlug: z.string().min(1), observedAt: timestamp, notes,
    values: z.array(z.object({ componentKey: z.string().min(1), result: resultSchema })).min(1).max(30),
  }) }),
]);
export const changesetSchema = z.object({
  summary: z.string().min(1).max(500),
  records: z.array(recordSchema).min(1).max(40),
}).superRefine(({ records }, ctx) => {
  const keys = new Set<string>();
  for (const [index, record] of records.entries()) {
    if (keys.has(record.key)) ctx.addIssue({ code: 'custom', path: ['records', index, 'key'], message: 'Record keys must be unique.' });
    keys.add(record.key);
    if (record.kind === 'dose' && !z.uuid().safeParse(record.data.medicineId).success &&
      !records.some(candidate => candidate.kind === 'medication' && candidate.key === record.data.medicineId)) {
      ctx.addIssue({ code: 'custom', path: ['records', index, 'data', 'medicineId'], message: 'Dose must reference an existing medication or one in this changeset.' });
    }
  }
});
export type ProposedRecord = z.infer<typeof recordSchema>;
export type Changeset = z.infer<typeof changesetSchema>;
export interface SaveResult { key: string; kind: ProposedRecord['kind']; status: 'saved' | 'failed' | 'uncertain'; id?: string; error?: string }
export interface ConfirmationResult { status: 'saved' | 'partial' | 'cancelled'; records: SaveResult[] }

export async function resolveSymptom(url: string, request: typeof fetch = fetch): Promise<{ ok: boolean; error?: string }> {
  const response = await request(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    return { ok: false, error: (body as { error?: string }).error || 'Could not resolve symptom.' };
  }
  return { ok: true };
}

export function recordTitle(record: ProposedRecord): string {
  if (record.kind === 'symptom' || record.kind === 'medication') return record.data.name;
  if (record.kind === 'resolveSymptom') return record.data.symptomName;
  if (record.kind === 'dose') return `${record.data.status} · ${record.data.dose}`;
  return record.data.definitionSlug.replaceAll('-', ' ');
}

function describeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value);
  if ('value' in value && 'unit' in value) return `${'comparator' in value ? value.comparator + ' ' : ''}${value.value} ${value.unit}`;
  if ('code' in value) return String('display' in value && value.display || value.code);
  return Object.entries(value).map(([key, item]) => `${key}: ${describeValue(item)}`).join(' · ');
}
export function recordDetails(record: ProposedRecord, records: ProposedRecord[]): Array<[string, string]> {
  const date = (value: string) => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  const fields: Array<[string, string]> = [];
  if (record.kind === 'symptom') {
    fields.push(['Started', date(record.data.onsetAt)]);
    if (record.data.resolvedAt) fields.push(['Ended', date(record.data.resolvedAt)]);
    if (record.data.severity) fields.push(['Severity', `${record.data.severity}/10`]);
    if (record.data.location) fields.push(['Location', record.data.location]);
  } else if (record.kind === 'medication') {
    if (record.data.strength) fields.push(['Strength', record.data.strength]);
    fields.push(['Dose', record.data.dose], ['Schedule', record.data.schedule.length ? record.data.schedule.join(', ') : 'As needed']);
  } else if (record.kind === 'dose') {
    const medication = records.find(item => item.key === record.data.medicineId && item.kind === 'medication');
    fields.push(['Medication', medication ? recordTitle(medication) : record.data.medicationName], ['When', record.data.takenAt ? date(record.data.takenAt) : 'Not taken']);
    if (record.data.scheduledFor) fields.push(['Scheduled for', date(record.data.scheduledFor)]);
    if (record.data.scheduledTime) fields.push(['Scheduled', record.data.scheduledTime]);
  } else if (record.kind === 'resolveSymptom') {
    fields.push(['Action', 'Mark as resolved']);
  } else {
    fields.push(['Measured', date(record.data.observedAt)]);
    for (const value of record.data.values) fields.push([value.componentKey, describeValue(value.result.value)]);
  }
  if ('notes' in record.data && record.data.notes) fields.push(['Notes', record.data.notes]);
  return fields;
}
