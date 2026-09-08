import type { CodeableConcept } from 'fhir/r4';
import { sql } from 'drizzle-orm';
import { check, index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { patients } from './measurements';

// Patient-reported episodes, ready for FHIR Observation mapping; not diagnoses.
export const symptoms = pgTable('symptoms', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  code: jsonb('code').$type<CodeableConcept>().notNull(),
  onsetAt: timestamp('onset_at', { withTimezone: true }).notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  severity: integer('severity'), // Patient-reported 1–10 score, not Condition.severity.
  bodySite: jsonb('body_site').$type<CodeableConcept>(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [
  index('symptoms_patient_onset_idx').on(t.patientId, t.onsetAt),
  check('symptoms_severity_range', sql`${t.severity} BETWEEN 1 AND 10`),
  check('symptoms_resolution_order', sql`${t.resolvedAt} IS NULL OR ${t.resolvedAt} >= ${t.onsetAt}`),
]);

type Symptom = typeof symptoms.$inferSelect;
export type SymptomRecord = Omit<Symptom, 'onsetAt' | 'resolvedAt' | 'createdAt' | 'updatedAt'> & {
  onsetAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
