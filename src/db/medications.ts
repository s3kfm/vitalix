import type { CodeableConcept } from 'fhir/r4';
import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { patients } from './measurements';

export const medications = pgTable('medications', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  code: jsonb('code').$type<CodeableConcept>().notNull(),
  name: text('name').notNull(),
  strength: text('strength').notNull().default(''),
  dose: text('dose').notNull(),
  schedule: jsonb('schedule').$type<string[]>().notNull().default([]),
  notes: text('notes').notNull().default(''),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [index('medications_patient_idx').on(t.patientId)]);

export const medicationDoses = pgTable('medication_doses', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  medicineId: uuid('medicine_id').notNull().references(() => medications.id),
  name: text('name').notNull(),
  dose: text('dose').notNull(),
  status: text('status', { enum: ['Taken', 'Skipped'] }).notNull(),
  takenAt: timestamp('taken_at', { withTimezone: true }).notNull(),
  scheduledTime: text('scheduled_time'),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [index('medication_doses_patient_time_idx').on(t.patientId, t.takenAt)]);
