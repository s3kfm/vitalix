import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { patients } from './measurements';

export const bleedingLevels = ['none', 'spotting', 'light', 'medium', 'heavy'] as const;
export const mucusTypes = ['dry', 'sticky', 'creamy', 'watery', 'egg_white'] as const;
export const lhResults = ['negative', 'positive', 'peak'] as const;
export const cyclePhases = [
  'menstrual',
  'follicular',
  'fertile',
  'ovulation_likely',
  'luteal',
  'unknown',
] as const;
export const ovulationStatuses = [
  'not_detected',
  'predicted',
  'likely',
  'confirmed',
  'unknown',
] as const;
export type CycleReasoning = {
  algorithmVersion: string;
  cycleHistoryWeight?: number;
  bleedingEvidence?: number;
  lhEvidence?: number;
  mucusEvidence?: number;
  temperatureEvidence?: number;
  ovulationWindowStart?: string;
  ovulationWindowEnd?: string;
};
const time = (name: string) => timestamp(name, { withTimezone: true });

export const patientCycleProfiles = pgTable(
  'patient_cycle_profiles',
  {
    patientId: uuid('patient_id')
      .primaryKey()
      .references(() => patients.id),
    typicalCycleLengthDays: integer('typical_cycle_length_days').notNull().default(28),
    typicalPeriodLengthDays: integer('typical_period_length_days').notNull().default(5),
    cycleLengthMinDays: integer('cycle_length_min_days').notNull().default(21),
    cycleLengthMaxDays: integer('cycle_length_max_days').notNull().default(35),
    irregularCycles: boolean('irregular_cycles').notNull().default(false),
    lastCalculatedAt: time('last_calculated_at'),
    preferences: jsonb('preferences').$type<{
      typicalCycleLengthDays: number | null;
      typicalPeriodLengthDays: number | null;
      regularity: 'regular' | 'irregular' | 'unknown';
    }>(),
  },
  (t) => [
    check(
      'cycle_profile_lengths',
      sql`${t.typicalPeriodLengthDays} > 0 AND ${t.cycleLengthMinDays} > 0 AND ${t.typicalCycleLengthDays} >= ${t.cycleLengthMinDays} AND ${t.typicalCycleLengthDays} <= ${t.cycleLengthMaxDays}`,
    ),
  ],
);

export const menstrualCycles = pgTable(
  'menstrual_cycles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id),
    startedAt: time('started_at').notNull(),
    endedAt: time('ended_at'), // Exclusive boundary: the next cycle's start.
    predictedEndAt: time('predicted_end_at'),
    predictedOvulationAt: time('predicted_ovulation_at'),
    predictedNextPeriodAt: time('predicted_next_period_at'),
    status: text('status', { enum: ['active', 'complete'] }).notNull(),
    createdAt: time('created_at').notNull().defaultNow(),
    updatedAt: time('updated_at').notNull().defaultNow(),
  },
  (t) => [
    unique('cycles_id_patient_unique').on(t.id, t.patientId),
    uniqueIndex('cycles_patient_start_unique').on(t.patientId, t.startedAt),
    uniqueIndex('cycles_one_active_patient')
      .on(t.patientId)
      .where(sql`${t.status} = 'active'`),
    check(
      'cycles_status_boundary',
      sql`(${t.status} = 'active' AND ${t.endedAt} IS NULL) OR (${t.status} = 'complete' AND ${t.endedAt} > ${t.startedAt})`,
    ),
  ],
);

export const cycleObservations = pgTable(
  'cycle_observations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id),
    cycleId: uuid('cycle_id'),
    observedAt: time('observed_at').notNull(),
    bleedingLevel: text('bleeding_level', { enum: bleedingLevels }),
    periodStarted: boolean('period_started'),
    cervicalMucus: text('cervical_mucus', { enum: mucusTypes }),
    lhResult: text('lh_result', { enum: lhResults }),
    basalTemperatureCelsius: doublePrecision('basal_temperature_celsius'),
    symptoms: jsonb('symptoms').$type<string[]>(),
    notes: text('notes'),
    createdAt: time('created_at').notNull().defaultNow(),
    updatedAt: time('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('cycle_observations_patient_time_idx').on(t.patientId, t.observedAt),
    foreignKey({
      columns: [t.cycleId, t.patientId],
      foreignColumns: [menstrualCycles.id, menstrualCycles.patientId],
    }),
    check(
      'cycle_observations_bleeding',
      sql`${t.bleedingLevel} IN ('none', 'spotting', 'light', 'medium', 'heavy')`,
    ),
    check(
      'cycle_observations_mucus',
      sql`${t.cervicalMucus} IN ('dry', 'sticky', 'creamy', 'watery', 'egg_white')`,
    ),
    check('cycle_observations_lh', sql`${t.lhResult} IN ('negative', 'positive', 'peak')`),
    check('cycle_observations_temperature', sql`${t.basalTemperatureCelsius} BETWEEN 30 AND 45`),
    check('cycle_observations_symptoms_array', sql`jsonb_typeof(${t.symptoms}) = 'array'`),
  ],
);

// One replaceable current snapshot per patient. No cycle is known before a bleeding start.
export const cycleStates = pgTable(
  'cycle_states',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id),
    cycleId: uuid('cycle_id'),
    calculatedAt: time('calculated_at').notNull(),
    cycleDay: integer('cycle_day'),
    phase: text('phase', { enum: cyclePhases }).notNull(),
    phaseConfidence: doublePrecision('phase_confidence').notNull(),
    ovulationStatus: text('ovulation_status', { enum: ovulationStatuses }).notNull(),
    ovulationConfidence: doublePrecision('ovulation_confidence').notNull(),
    predictedOvulationAt: time('predicted_ovulation_at'),
    predictedNextPeriodAt: time('predicted_next_period_at'),
    fertileWindowStart: time('fertile_window_start'),
    fertileWindowEnd: time('fertile_window_end'),
    reasoning: jsonb('reasoning').$type<CycleReasoning>().notNull(),
  },
  (t) => [
    uniqueIndex('cycle_states_patient_unique').on(t.patientId),
    foreignKey({
      columns: [t.cycleId, t.patientId],
      foreignColumns: [menstrualCycles.id, menstrualCycles.patientId],
    }),
    check(
      'cycle_states_confidence',
      sql`${t.phaseConfidence} BETWEEN 0 AND 1 AND ${t.ovulationConfidence} BETWEEN 0 AND 1`,
    ),
    check('cycle_states_day', sql`${t.cycleDay} > 0`),
    check(
      'cycle_states_phase',
      sql`${t.phase} IN ('menstrual', 'follicular', 'fertile', 'ovulation_likely', 'luteal', 'unknown')`,
    ),
    check(
      'cycle_states_ovulation',
      sql`${t.ovulationStatus} IN ('not_detected', 'predicted', 'likely', 'confirmed', 'unknown')`,
    ),
  ],
);
