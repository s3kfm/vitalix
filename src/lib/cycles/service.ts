import { and, asc, eq, inArray } from 'drizzle-orm';
import { groupBy } from 'es-toolkit';
import { db } from '../../db';
import { patients } from '../../db/measurements';
import {
  cycleObservations,
  cycleStates,
  menstrualCycles,
  patientCycleProfiles,
} from '../../db/cycles';
import {
  calculateCycleState,
  deriveCycleStarts,
  learnProfile,
  predictCycle,
  profileFromPreferences,
  type Observation,
  type Preferences,
  type Profile,
} from './inference';
import type {
  CreateCycleObservationInput,
  UpdateCycleObservationInput,
  CycleSetupInput,
} from '../validations/cycles';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = typeof db | Transaction;
type Cycle = typeof menstrualCycles.$inferSelect;
type StoredObservation = typeof cycleObservations.$inferSelect;

export class CycleObservationNotFound extends Error {}

// Callers must authorize patient ownership first. Every query is patient-scoped.

// --- Loaders: the "everything for this patient" queries used throughout this file ---

const loadObservations = (executor: Executor, patientId: string) =>
  executor
    .select()
    .from(cycleObservations)
    .where(eq(cycleObservations.patientId, patientId))
    .orderBy(asc(cycleObservations.observedAt), asc(cycleObservations.id));

const loadCycles = (executor: Executor, patientId: string) =>
  executor
    .select()
    .from(menstrualCycles)
    .where(eq(menstrualCycles.patientId, patientId))
    .orderBy(asc(menstrualCycles.startedAt));

async function loadProfile(executor: Executor, patientId: string) {
  const [profile] = await executor
    .select()
    .from(patientCycleProfiles)
    .where(eq(patientCycleProfiles.patientId, patientId));
  return profile;
}

async function findObservation(executor: Executor, patientId: string, id: string) {
  const [row] = await executor
    .select()
    .from(cycleObservations)
    .where(and(eq(cycleObservations.patientId, patientId), eq(cycleObservations.id, id)));
  return row ?? null;
}

export const listCycleObservations = (patientId: string) => loadObservations(db, patientId);
export const getCycleObservation = (patientId: string, id: string) =>
  findObservation(db, patientId, id);

// --- Reconcile: rebuild everything derived from the observations ---

/** Learns the profile from the logged cycles and stores it. Setup answers seed the learning. */
async function saveLearnedProfile(
  tx: Transaction,
  patientId: string,
  starts: Date[],
  observations: Observation[],
  preferences: Preferences | null | undefined,
  now: Date,
): Promise<Profile> {
  const reported = preferences ? profileFromPreferences(preferences) : undefined;
  const profile = learnProfile(starts, observations, reported);
  await tx
    .insert(patientCycleProfiles)
    .values({ patientId, ...profile, lastCalculatedAt: now })
    .onConflictDoUpdate({
      target: patientCycleProfiles.patientId,
      set: { ...profile, lastCalculatedAt: now },
    });
  return profile;
}

/**
 * Makes the stored cycles match the derived start dates. Cycles whose start is still present keep
 * their id, so links from other rows stay valid. Returns every cycle, oldest first.
 */
async function syncCycles(
  tx: Transaction,
  patientId: string,
  starts: Date[],
  profile: Profile,
  now: Date,
): Promise<Cycle[]> {
  const existing = await loadCycles(tx, patientId);
  const startTimes = starts.map((start) => start.getTime());

  const isStillDerived = (cycle: Cycle) => startTimes.includes(cycle.startedAt.getTime());
  const vanished = existing.filter((cycle) => !isStillDerived(cycle));
  if (vanished.length)
    await tx.delete(menstrualCycles).where(
      and(
        eq(menstrualCycles.patientId, patientId),
        inArray(
          menstrualCycles.id,
          vanished.map((cycle) => cycle.id),
        ),
      ),
    );

  // Close cycles that now have a later start before upserting, so only one cycle is ever active.
  for (const cycle of existing.filter(isStillDerived)) {
    const nextStart = starts[startTimes.indexOf(cycle.startedAt.getTime()) + 1];
    if (nextStart)
      await tx
        .update(menstrualCycles)
        .set({ status: 'complete', endedAt: nextStart, updatedAt: now })
        .where(and(eq(menstrualCycles.patientId, patientId), eq(menstrualCycles.id, cycle.id)));
  }

  const cycles: Cycle[] = [];
  for (const [i, startedAt] of starts.entries()) {
    const endedAt = starts[i + 1] ?? null;
    const values = {
      patientId,
      startedAt,
      endedAt,
      status: endedAt ? ('complete' as const) : ('active' as const),
      ...predictCycle(startedAt, profile),
      updatedAt: now,
    };
    const [cycle] = await tx
      .insert(menstrualCycles)
      .values(values)
      .onConflictDoUpdate({
        target: [menstrualCycles.patientId, menstrualCycles.startedAt],
        set: values,
      })
      .returning();
    cycles.push(cycle!);
  }
  return cycles;
}

/** Points each observation at the cycle it falls in. Observations before the first cycle get none. */
async function linkObservationsToCycles(
  tx: Transaction,
  patientId: string,
  observations: StoredObservation[],
  cycles: Cycle[],
) {
  const cycleOf = (observedAt: Date) =>
    cycles.find((c) => observedAt >= c.startedAt && (!c.endedAt || observedAt < c.endedAt));
  const linked = observations.flatMap((observation) => {
    const cycle = cycleOf(observation.observedAt);
    return cycle ? [{ observationId: observation.id, cycleId: cycle.id }] : [];
  });
  for (const [cycleId, links] of Object.entries(groupBy(linked, (link) => link.cycleId)))
    await tx
      .update(cycleObservations)
      .set({ cycleId })
      .where(
        and(
          eq(cycleObservations.patientId, patientId),
          inArray(
            cycleObservations.id,
            links.map((link) => link.observationId),
          ),
        ),
      );
}

/** Recomputes cycles, profile, links and the current state from the raw observations. */
async function reconcile(tx: Transaction, patientId: string, now: Date) {
  const observations = await loadObservations(tx, patientId);
  const savedProfile = await loadProfile(tx, patientId);
  const starts = deriveCycleStarts(observations, now);
  const profile = await saveLearnedProfile(
    tx,
    patientId,
    starts,
    observations,
    savedProfile?.preferences,
    now,
  );

  // Detach derived references before changing cycle boundaries.
  await tx.delete(cycleStates).where(eq(cycleStates.patientId, patientId));
  await tx
    .update(cycleObservations)
    .set({ cycleId: null })
    .where(eq(cycleObservations.patientId, patientId));

  const cycles = await syncCycles(tx, patientId, starts, profile, now);
  await linkObservationsToCycles(tx, patientId, observations, cycles);
  return refreshState(tx, patientId, now);
}

/** Recalculates and stores the current cycle state, the one row per patient shown in the app. */
async function refreshState(tx: Transaction, patientId: string, now: Date) {
  const observations = await loadObservations(tx, patientId);
  const cycles = await loadCycles(tx, patientId);
  const profile = await loadProfile(tx, patientId);
  const active = cycles.find((cycle) => cycle.status === 'active');
  const state = calculateCycleState({
    observations,
    startedAt: active?.startedAt ?? null,
    profile:
      profile ??
      learnProfile(
        cycles.map((cycle) => cycle.startedAt),
        observations,
      ),
    historyCount: cycles.filter((cycle) => cycle.status === 'complete').length,
    now,
  });
  const values = { ...state, patientId, cycleId: active?.id ?? null };
  const [saved] = await tx
    .insert(cycleStates)
    .values(values)
    .onConflictDoUpdate({ target: cycleStates.patientId, set: values })
    .returning();
  return saved;
}

/** Runs `operation` in a transaction that holds the patient's row, so writes cannot interleave. */
async function withPatientLock<T>(patientId: string, operation: (tx: Transaction) => Promise<T>) {
  return db.transaction(async (tx) => {
    // Serializes concurrent writes AND current-state refreshes for the same patient.
    const [patient] = await tx
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.id, patientId))
      .for('update');
    if (!patient) throw new CycleObservationNotFound();
    return operation(tx);
  });
}

// --- Public operations ---

export async function createCycleObservation(
  patientId: string,
  input: CreateCycleObservationInput,
) {
  return withPatientLock(patientId, async (tx) => {
    const [created] = await tx
      .insert(cycleObservations)
      .values({ ...input, patientId, observedAt: new Date(input.observedAt) })
      .returning();
    await reconcile(tx, patientId, new Date());
    // Re-read: reconcile has just set the observation's cycleId.
    return findObservation(tx, patientId, created!.id);
  });
}

export async function updateCycleObservation(
  patientId: string,
  id: string,
  input: UpdateCycleObservationInput,
) {
  return withPatientLock(patientId, async (tx) => {
    const [updated] = await tx
      .update(cycleObservations)
      .set({
        ...input,
        observedAt: input.observedAt ? new Date(input.observedAt) : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(cycleObservations.patientId, patientId), eq(cycleObservations.id, id)))
      .returning();
    if (!updated) throw new CycleObservationNotFound();
    await reconcile(tx, patientId, new Date());
    return findObservation(tx, patientId, id);
  });
}

export async function deleteCycleObservation(patientId: string, id: string) {
  return withPatientLock(patientId, async (tx) => {
    const [deleted] = await tx
      .delete(cycleObservations)
      .where(and(eq(cycleObservations.patientId, patientId), eq(cycleObservations.id, id)))
      .returning({ id: cycleObservations.id });
    if (!deleted) throw new CycleObservationNotFound();
    await reconcile(tx, patientId, new Date());
  });
}

export async function getCurrentCycleState(patientId: string) {
  // Recalculate on reads: confidence must decay even when nobody logs new observations.
  return withPatientLock(patientId, (tx) => refreshState(tx, patientId, new Date()));
}

export async function getCycleOverview(patientId: string) {
  return withPatientLock(patientId, async (tx) => {
    const state = await refreshState(tx, patientId, new Date());
    return {
      state: state!,
      profile: (await loadProfile(tx, patientId)) ?? null,
      observations: await loadObservations(tx, patientId),
      cycles: await loadCycles(tx, patientId),
    };
  });
}

export async function setupCycleTracking(patientId: string, input: CycleSetupInput) {
  return withPatientLock(patientId, async (tx) => {
    const existing = await loadProfile(tx, patientId);
    // Retries cannot duplicate the initial period-start observation.
    if (existing?.preferences) return;
    const { lastPeriodStartedAt, ...preferences } = input;
    await tx
      .insert(patientCycleProfiles)
      .values({ patientId, preferences })
      .onConflictDoUpdate({ target: patientCycleProfiles.patientId, set: { preferences } });
    if (lastPeriodStartedAt) {
      await tx.insert(cycleObservations).values({
        patientId,
        observedAt: new Date(`${lastPeriodStartedAt}T00:00:00Z`),
        periodStarted: true,
      });
    }
    await reconcile(tx, patientId, new Date());
  });
}
