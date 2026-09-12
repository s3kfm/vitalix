import { changesetSchema, resolveSymptom, type Changeset, type SaveResult } from './changeset';
import { createSymptomSchema } from '../validations/symptoms';
import { createMedicationSchema, createDoseSchema } from '../validations/medications';
import { createMeasurementGroupSchema } from '../validations/measurements';

/** Client-side tool execution. Only the confirmation button calls this function. */
export async function saveChangeset(
  input: Changeset,
  patientUrl: (path: string) => string,
  previous: SaveResult[] = [],
  onProgress: (results: SaveResult[]) => void = () => {},
  request: typeof fetch = fetch,
): Promise<SaveResult[]> {
  const { records } = changesetSchema.parse(input);
  const results = new Map(previous.map(result => [result.key, result]));
  // New medications must exist before any dependent dose, irrespective of model order.
  const ordered = [...records.filter(record => record.kind === 'medication'), ...records.filter(record => record.kind !== 'medication')];
  for (const record of ordered) {
    // A lost response may have saved; never retry that automatically.
    if (['saved', 'uncertain'].includes(results.get(record.key)?.status ?? '')) continue;
    let endpoint: string;
    let payload: unknown;
    try {
      switch (record.kind) {
        case 'symptom': endpoint = '/symptoms'; payload = await createSymptomSchema.validate(record.data, { stripUnknown: true }); break;
        case 'resolveSymptom': {
          const result = await resolveSymptom(patientUrl(`/symptoms/${record.data.symptomId}`), request);
          if (!result.ok) { results.set(record.key, { key: record.key, kind: record.kind, status: 'failed', error: result.error }); onProgress([...results.values()]); }
          else results.set(record.key, { key: record.key, kind: record.kind, status: 'saved', id: record.data.symptomId });
          continue;
        }
        case 'medication': endpoint = '/medications'; payload = await createMedicationSchema.validate(record.data, { stripUnknown: true }); break;
        case 'dose': {
          const dependency = records.find(item => item.key === record.data.medicineId && item.kind === 'medication');
          const medicineId = dependency ? results.get(dependency.key)?.id : record.data.medicineId;
          if (!medicineId) throw new Error('Save the medication first, then retry this dose.');
          endpoint = '/doses';
          payload = await createDoseSchema.validate({ ...record.data, medicineId }, { stripUnknown: true });
          break;
        }
        case 'measurement':
          endpoint = '/measurements/group';
          payload = await createMeasurementGroupSchema.validate({ source: 'ai', observations: [record.data] }, { stripUnknown: true });
          break;
      }
    } catch (error) {
      results.set(record.key, { key: record.key, kind: record.kind, status: 'failed', error: error instanceof Error ? error.message : 'Check this record.' });
      onProgress([...results.values()]);
      continue;
    }
    try {
      const response = await request(patientUrl(endpoint), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) {
        // Existing endpoints can fail after writing. Only validation failures are safe to retry.
        results.set(record.key, { key: record.key, kind: record.kind, status: response.status < 500 ? 'failed' : 'uncertain', error: response.status < 500 ? body.error || 'Could not save this record.' : 'Save could not be verified. Check your records before adding again.' });
      } else {
        const id = record.kind === 'measurement' ? body.group?.id : body.id;
        if (typeof id !== 'string') throw new Error('Missing saved record ID.');
        results.set(record.key, { key: record.key, kind: record.kind, status: 'saved', id });
      }
    } catch {
      results.set(record.key, { key: record.key, kind: record.kind, status: 'uncertain', error: 'Connection interrupted. Check your records before adding again.' });
    }
    onProgress([...results.values()]);
  }
  return records.map(record => results.get(record.key)!);
}
