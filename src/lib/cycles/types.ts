import type { cycleObservations, cycleStates, patientCycleProfiles } from '../../db/cycles';

export type Observation = Pick<
  typeof cycleObservations.$inferSelect,
  'id' | 'observedAt' | 'bleedingLevel' | 'cervicalMucus' | 'lhResult' | 'basalTemperatureCelsius'
> & { periodStarted?: boolean | null };
export type Profile = Omit<
  typeof patientCycleProfiles.$inferSelect,
  'patientId' | 'lastCalculatedAt' | 'preferences'
>;
export type State = Omit<typeof cycleStates.$inferInsert, 'id' | 'patientId' | 'cycleId'>;
