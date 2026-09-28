import { z } from 'zod';
import { bleedingLevels, lhResults, mucusTypes } from '../../db/cycles';

export const createCycleObservationSchema = z
  .object({
    observedAt: z.iso
      .datetime({ offset: true })
      .refine((value) => Date.parse(value) <= Date.now(), 'Observation cannot be in the future.'),
    periodStarted: z.boolean().nullable().optional(),
    bleedingLevel: z.enum(bleedingLevels).nullable().optional(),
    cervicalMucus: z.enum(mucusTypes).nullable().optional(),
    lhResult: z.enum(lhResults).nullable().optional(),
    basalTemperatureCelsius: z.number().min(30).max(45).nullable().optional(),
    symptoms: z.array(z.string().trim().min(1).max(200)).max(100).nullable().optional(),
    notes: z.string().trim().max(5000).nullable().optional(),
  })
  .strict();
export const updateCycleObservationSchema = createCycleObservationSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field.');
export type CreateCycleObservationInput = z.infer<typeof createCycleObservationSchema>;
export type UpdateCycleObservationInput = z.infer<typeof updateCycleObservationSchema>;

export const cycleSetupSchema = z
  .object({
    lastPeriodStartedAt: z.iso
      .date()
      .refine(
        (value) => value <= new Date().toISOString().slice(0, 10),
        'Choose today or an earlier date.',
      )
      .nullable(),
    typicalCycleLengthDays: z.number().int().min(10).max(180).nullable(),
    typicalPeriodLengthDays: z.number().int().min(1).max(30).nullable(),
    regularity: z.enum(['regular', 'irregular', 'unknown']),
  })
  .strict();
export type CycleSetupInput = z.infer<typeof cycleSetupSchema>;
