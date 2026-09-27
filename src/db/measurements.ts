import type { CodeableConcept, ObservationReferenceRange } from 'fhir/r4';
import type { ComponentDefinition } from '../lib/measurements/catalog';
import type { MeasurementResult } from '../lib/measurements/result';
import { users } from './auth';
import { defaultPatientModules, type PatientModule } from '../lib/patients';
import { sql } from 'drizzle-orm';
import { check, date, index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

export const measurementStatus = pgEnum('measurement_status', ['final', 'amended', 'entered-in-error']);
export const groupSource = pgEnum('group_source', ['manual', 'ai']);

// ---------------------------------------------------------------------------
// Patients belong to the account that enrolled them.
// ---------------------------------------------------------------------------
export const patients = pgTable('patients', {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerUserId: uuid("owner_user_id").references(() => users.id),
  name: text("name").notNull(),
  knownAllergies: text("known_allergies").default('').notNull(),
  dateOfBirth: date("date_of_birth"),
  enabledModules: jsonb("enabled_modules").$type<PatientModule[]>().default(defaultPatientModules).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Immutable measurement type catalogue (e.g. "blood-pressure", "weight").
// ---------------------------------------------------------------------------
export const measurementDefinitions = pgTable('measurement_definitions', {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  loincCode: text("loinc_code"),
  category: text("category").notNull(),
  description: text("description"),
  components: jsonb("components").$type<ComponentDefinition[]>().notNull(),
});

// ---------------------------------------------------------------------------
// A MeasurementGroup bundles 1+ observations submitted together.
// Every measurement belongs to exactly one group.
// ---------------------------------------------------------------------------
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export const measurementGroups = pgTable('measurement_groups', {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  source: groupSource("source").default('manual').notNull(),
  status: measurementStatus("status").default('final').notNull(),
  observedAt: timestamp("observed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  notes: text("notes"),
  // AI-related fields
  sourceMessageId: text("source_message_id"),
  messages: jsonb("messages").$type<ChatMessage[]>(),
  observationCount: integer("observation_count").default(0).notNull(),
}, t => [
  index('measurement_groups_patient_time_idx').on(t.patientId, t.createdAt),
]);

// ---------------------------------------------------------------------------
// A single observation (FHIR-aligned).
// source / capture metadata lives on the group, not here.
// ---------------------------------------------------------------------------
export const measurements = pgTable('measurements', {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  groupId: uuid("group_id").references(() => measurementGroups.id, { onDelete: 'cascade' }).notNull(),
  definitionId: uuid("definition_id").references(() => measurementDefinitions.id).notNull(),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  status: measurementStatus("status").default('final').notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  method: text("method"),
  bodySite: text("body_site"),
  notes: text("notes"),
}, t => [
  unique('measurement_patient_unique').on(t.id, t.patientId),
  index('measurements_patient_time_idx').on(t.patientId, t.observedAt),
  index('measurements_group_idx').on(t.groupId),
]);

// ---------------------------------------------------------------------------
// Component values inside a measurement (e.g. systolic / diastolic).
// Discriminated result supports every FHIR R4 Observation.value[x].
// ---------------------------------------------------------------------------
export const measurementValues = pgTable('measurement_values', {
  id: uuid("id").defaultRandom().primaryKey(),
  measurementId: uuid("measurement_id").references(() => measurements.id, { onDelete: 'cascade' }).notNull(),
  componentKey: text("component_key").notNull(),
  loincCode: text("loinc_code"),
  result: jsonb("result").$type<MeasurementResult>().notNull(),
  originalText: text("original_text"),
  interpretation: jsonb("interpretation").$type<CodeableConcept[]>(),
  referenceRanges: jsonb("reference_ranges").$type<ObservationReferenceRange[]>(),
  normalizedValue: numeric("normalized_value"),
  normalizedUnit: text("normalized_unit"),
  conversionVersion: text("conversion_version"),
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