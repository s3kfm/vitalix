import type { CodeableConcept, ObservationReferenceRange } from 'fhir/r4';
import type { ComponentDefinition } from '../lib/measurements/catalog';
import type { MeasurementResult } from '../lib/measurements/result';
import { sql } from 'drizzle-orm';
import { check, index, jsonb, numeric, pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

export const measurementStatus = pgEnum('measurement_status', ['final', 'amended', 'entered-in-error']);
export const measurementSource = pgEnum('measurement_source', ['patient_reported', 'report', 'device']);
export const captureMethod = pgEnum('measurement_capture_method', ['manual_form', 'ai_extraction', 'ai_conversation', 'device_import']);
export const verificationStatus = pgEnum('measurement_verification_status', ['pending_review', 'user_confirmed']);

// Authentication accounts and clinical patient identities are separate.
export const patients = pgTable('patients', {
  id: uuid().defaultRandom().primaryKey(),
  authUserId: text().notNull().unique(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const measurementDefinitions = pgTable('measurement_definitions', {
  id: uuid().defaultRandom().primaryKey(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  loincCode: text(),
  category: text().notNull(),
  description: text(),
  // Treat definitions as immutable once referenced by a measurement.
  components: jsonb().$type<ComponentDefinition[]>().notNull(),
});

export const measurements = pgTable('measurements', {
  id: uuid().defaultRandom().primaryKey(),
  patientId: uuid().references(() => patients.id).notNull(),
  definitionId: uuid().references(() => measurementDefinitions.id).notNull(),
  observedAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  status: measurementStatus().default('final').notNull(),
  sourceType: measurementSource().notNull(),
  captureMethod: captureMethod().notNull(),
  // Legacy external source identifiers. Canonical evidence is linked through measurement revisions.
  sourceReportId: text(),
  sourceMessageId: text(),
  verificationStatus: verificationStatus().notNull(),
  confirmedAt: timestamp({ withTimezone: true }),
  method: text(),
  bodySite: text(),
  notes: text(),
}, t => [
  unique('measurement_patient_unique').on(t.id, t.patientId),
  index('measurements_patient_time_idx').on(t.patientId, t.observedAt),
  check('measurement_source_consistency', sql`(${t.sourceType} = 'patient_reported' AND ${t.captureMethod} IN ('manual_form', 'ai_conversation')) OR (${t.sourceType} = 'report' AND ${t.captureMethod} = 'ai_extraction' AND ${t.sourceReportId} IS NOT NULL) OR (${t.sourceType} = 'device' AND ${t.captureMethod} = 'device_import')`),
  check('measurement_chat_source', sql`${t.captureMethod} <> 'ai_conversation' OR ${t.sourceMessageId} IS NOT NULL`),
]);

export const measurementValues = pgTable('measurement_values', {
  id: uuid().defaultRandom().primaryKey(),
  measurementId: uuid().references(() => measurements.id, { onDelete: 'cascade' }).notNull(),
  componentKey: text().notNull(),
  loincCode: text(),
  // Discriminated result supports every R4 Observation.value[x] without coercion.
  result: jsonb().$type<MeasurementResult>().notNull(),
  originalText: text(),
  interpretation: jsonb().$type<CodeableConcept[]>(),
  referenceRanges: jsonb().$type<ObservationReferenceRange[]>(),
  normalizedValue: numeric(),
  normalizedUnit: text(),
  conversionVersion: text(),
}, t => [
  unique('measurement_component_unique').on(t.measurementId, t.componentKey),
  check('measurement_result_shape', sql`COALESCE(
    jsonb_typeof(${t.result}) = 'object'
    AND ${t.result} ?& ARRAY['type', 'value']
    AND (${t.result} - 'type' - 'value') = '{}'::jsonb
    AND CASE ${t.result}->>'type'
      WHEN 'quantity' THEN jsonb_typeof(${t.result}->'value') = 'object'
      WHEN 'coded' THEN jsonb_typeof(${t.result}->'value') = 'object'
      WHEN 'absent' THEN jsonb_typeof(${t.result}->'value') = 'object'
      WHEN 'range' THEN jsonb_typeof(${t.result}->'value') = 'object'
      WHEN 'ratio' THEN jsonb_typeof(${t.result}->'value') = 'object'
      WHEN 'sampledData' THEN jsonb_typeof(${t.result}->'value') = 'object'
      WHEN 'period' THEN jsonb_typeof(${t.result}->'value') = 'object'
      WHEN 'string' THEN jsonb_typeof(${t.result}->'value') = 'string'
      WHEN 'time' THEN jsonb_typeof(${t.result}->'value') = 'string'
      WHEN 'dateTime' THEN jsonb_typeof(${t.result}->'value') = 'string'
      WHEN 'boolean' THEN jsonb_typeof(${t.result}->'value') = 'boolean'
      WHEN 'integer' THEN jsonb_typeof(${t.result}->'value') = 'number'
      ELSE false END, false)`),
  check('measurement_normalization_complete', sql`(${t.normalizedValue} IS NULL AND ${t.normalizedUnit} IS NULL AND ${t.conversionVersion} IS NULL) OR (${t.result}->>'type' = 'quantity' AND ${t.normalizedValue} IS NOT NULL AND ${t.normalizedUnit} IS NOT NULL AND ${t.conversionVersion} IS NOT NULL)`),
]);

export const measurementPins = pgTable('measurement_pins', {
  patientId: uuid().references(() => patients.id).notNull(),
  definitionId: uuid().references(() => measurementDefinitions.id).notNull(),
}, t => [unique('measurement_pin_unique').on(t.patientId, t.definitionId)]);
