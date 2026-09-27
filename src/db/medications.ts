import { sql } from 'drizzle-orm';
import type { CodeableConcept } from 'fhir/r4';
import {
  boolean,
  date,
  uniqueIndex,
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { patients } from './measurements';

export const medications = pgTable(
  'medications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id),
    code: jsonb('code').$type<CodeableConcept>().notNull(),
    name: text('name').notNull(),
    strength: text('strength').notNull().default(''),
    dose: text('dose').notNull(),
    schedule: jsonb('schedule').$type<string[]>().notNull().default([]),
    notes: text('notes').notNull().default(''),
    active: boolean('active').notNull().default(true),
    endedReason: text('ended_reason', { enum: ['Completed', 'Discontinued'] }),
    startDate: date('start_date'),
    endDate: date('end_date'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  t => [index('medications_patient_idx').on(t.patientId)],
);

export const medicationDoses = pgTable(
  'medication_doses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id),

    medicineId: uuid('medicine_id').references(() => medications.id),

    name: text('name').notNull(),
    dose: text('dose').notNull(),

    status: text('status', {
      enum: ['Taken', 'Skipped'],
    }).notNull(),

    scheduledFor: timestamp('scheduled_for', {
      withTimezone: true,
    }),

    takenAt: timestamp('taken_at', {
      withTimezone: true,
    }),

    recordedAt: timestamp('recorded_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    scheduledTime: text('scheduled_time'),

    notes: text('notes').notNull().default(''),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  t => [
    index('medication_doses_patient_time_idx').on(
      t.patientId,
      t.scheduledFor,
    ),
    index('medication_doses_medicine_idx').on(t.medicineId),
    uniqueIndex('medication_doses_occurrence_unique').on(t.patientId, t.medicineId, t.scheduledFor),
    check('medication_doses_status_time', sql`(${t.status} = 'Taken' AND ${t.takenAt} IS NOT NULL) OR (${t.status} = 'Skipped' AND ${t.takenAt} IS NULL)`),
  ],
);

export const prescriptions = pgTable('prescriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  prescriber: text('prescriber').notNull(),
  issuedOn: date('issued_on').notNull(),
  validUntil: date('valid_until'),
  reference: text('reference').notNull().default(''),
  active: boolean('active').notNull().default(true),
  items: jsonb('items').$type<{ name: string; dose: string; quantity: string; refills: number }[]>().notNull(),
  attachmentName: text('attachment_name'),
  attachmentType: text('attachment_type'),
  attachmentData: text('attachment_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [index('prescriptions_patient_idx').on(t.patientId)]);
