import type { CodeableConcept, Observation, ObservationReferenceRange } from 'fhir/r4';
import type { MeasurementDefinition } from './catalog';
import { resultToFhir, validateResult, type MeasurementResult } from './result';

export const conversionVersion = '1';
export interface Reading {
  componentKey: string;
  result: MeasurementResult;
  originalText?: string;
  interpretation?: CodeableConcept[];
  referenceRanges?: ObservationReferenceRange[];
}
export interface MeasurementExport {
  id: string;
  patientId: string;
  observedAt: string;
  status: 'final' | 'amended' | 'entered-in-error';
  verificationStatus: 'pending_review' | 'user_confirmed';
  sourceType: 'patient_reported' | 'report' | 'device';
  notes?: string;
  method?: string;
  bodySite?: string;
  readings: Reading[];
}

export function normalize(value: number, from: string, to: string): number {
  if (!Number.isFinite(value)) throw new Error('Measurement must be finite');
  if (from === to) return value;
  if (from === '[lb_av]' && to === 'kg') return value * 0.45359237;
  if (from === '[degF]' && to === 'Cel') return (value - 32) * 5 / 9;
  throw new Error(`Unsupported conversion: ${from} to ${to}`);
}

/** Pure server-side export mapping; callers must authorize access before loading records.
 * Exports original quantities to preserve entered precision; normalization is for queries.
 */
export function toObservation(definition: MeasurementDefinition, input: MeasurementExport): Observation {
  if (input.verificationStatus !== 'user_confirmed') throw new Error('Confirm the measurement before export');
  if (![input.id, input.patientId].every(id => /^[A-Za-z0-9.-]{1,64}$/.test(id))) throw new Error('Invalid FHIR identifier');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(input.observedAt) || !Number.isFinite(Date.parse(input.observedAt))) throw new Error('An observation timestamp with timezone is required');
  if (input.readings.length !== definition.components.length || new Set(input.readings.map(r => r.componentKey)).size !== input.readings.length) throw new Error('Expected exactly one reading for every component');
  const values = definition.components.map(component => {
    const reading = input.readings.find(r => r.componentKey === component.key);
    if (!reading) throw new Error('Missing component');
    validateResult(reading.result);
    if (!component.allowedResultTypes.includes(reading.result.type)) throw new Error('Result type is not allowed for this measurement');
    if (reading.result.type === 'quantity' && component.allowedUnits) {
      const q = reading.result.value;
      if (q.value === undefined || q.system !== 'http://unitsofmeasure.org' || !q.code || !component.allowedUnits.includes(q.code)) throw new Error('Missing value or unsupported unit');
    }
    const fields = resultToFhir(reading.result);
    return { component, fields: {
      ...fields,
      ...(reading.interpretation ? { interpretation: structuredClone(reading.interpretation) } : {}),
      ...(reading.referenceRanges ? { referenceRange: structuredClone(reading.referenceRanges) } : {}),
    } };
  });
  const result: Observation = {
    resourceType: 'Observation', id: input.id, status: input.status,
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: definition.category }] }],
    code: { text: definition.name, ...(definition.loincCode ? { coding: [{ system: 'http://loinc.org', code: definition.loincCode }] } : {}) },
    subject: { reference: `Patient/${input.patientId}` }, effectiveDateTime: input.observedAt,
  };
  if (definition.components.length === 1 && definition.components[0]?.key === 'value') {
    Object.assign(result, values[0]!.fields);
  } else {
    result.component = values.map(({ component, fields }) => ({
      code: { text: component.key, ...(component.loincCode ? { coding: [{ system: 'http://loinc.org', code: component.loincCode }] } : {}) },
      ...fields,
    }));
  }
  // Reporting a reading does not establish who performed the measurement.
  const notes = [input.sourceType === 'patient_reported' ? 'Patient-reported measurement.' : undefined, input.notes].filter((note): note is string => Boolean(note));
  if (notes.length) result.note = notes.map(text => ({ text }));
  if (input.method) result.method = { text: input.method };
  if (input.bodySite) result.bodySite = { text: input.bodySite };
  return result;
}
