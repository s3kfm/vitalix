import { and, asc, eq } from 'drizzle-orm';
import { db } from '../../db';
import { patients } from '../../db/measurements';
import {
  cycleObservations,
  cycleStates,
  menstrualCycles,
  patientCycleProfiles,
} from '../../db/cycles';
import { calculateCycleState, deriveCycleStarts, learnProfile, predictCycle } from './inference';
import type {
  CreateCycleObservationInput,
  UpdateCycleObservationInput,
} from '../validations/cycles';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export class CycleObservationNotFound extends Error {}

// Callers must authorize patient ownership first. Every query is patient-scoped.
export async function listCycleObservations(patientId: string) {
  return db
    .select()
    .from(cycleObservations)
    .where(eq(cycleObservations.patientId, patientId))
    .orderBy(asc(cycleObservations.observedAt), asc(cycleObservations.id));
}
export async function getCycleObservation(patientId: string, id: string) {
  const [row] = await db
    .select()
    .from(cycleObservations)
    .where(and(eq(cycleObservations.patientId, patientId), eq(cycleObservations.id, id)));
  return row ?? null;
}

async function reconcile(tx: Transaction, patientId: string, now: Date) {
  const observations = await tx
    .select()
    .from(cycleObservations)
    .where(eq(cycleObservations.patientId, patientId))
    .orderBy(asc(cycleObservations.observedAt), asc(cycleObservations.id));
  const existing = await tx
    .select()
    .from(menstrualCycles)
    .where(eq(menstrualCycles.patientId, patientId));
  const starts = deriveCycleStarts(observations, now);
  const profile = learnProfile(starts, observations);
  await tx
    .insert(patientCycleProfiles)
    .values({ patientId, ...profile, lastCalculatedAt: now })
    .onConflictDoUpdate({
      target: patientCycleProfiles.patientId,
      set: { ...profile, lastCalculatedAt: now },
    });

  // Detach derived references before changing boundaries. Preserve IDs for unchanged starts.
  await tx.delete(cycleStates).where(eq(cycleStates.patientId, patientId));
  await tx
    .update(cycleObservations)
    .set({ cycleId: null })
    .where(eq(cycleObservations.patientId, patientId));
  for (const cycle of existing) {
    const index = starts.findIndex((start) => start.getTime() === cycle.startedAt.getTime());
    if (index < 0)
      await tx
        .delete(menstrualCycles)
        .where(and(eq(menstrualCycles.patientId, patientId), eq(menstrualCycles.id, cycle.id)));
    else if (starts[index + 1])
      await tx
        .update(menstrualCycles)
        .set({ status: 'complete', endedAt: starts[index + 1], updatedAt: now })
        .where(and(eq(menstrualCycles.patientId, patientId), eq(menstrualCycles.id, cycle.id)));
  }
  const cycles: (typeof menstrualCycles.$inferSelect)[] = [];
  for (let i = 0; i < starts.length; i++) {
    const values = {
      patientId,
      startedAt: starts[i]!,
      endedAt: starts[i + 1] ?? null,
      status: starts[i + 1] ? ('complete' as const) : ('active' as const),
      ...predictCycle(starts[i]!, profile),
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
  for (const observation of observations) {
    const cycle = cycles.find(
      (c) =>
        observation.observedAt >= c.startedAt && (!c.endedAt || observation.observedAt < c.endedAt),
    );
    if (cycle)
      await tx
        .update(cycleObservations)
        .set({ cycleId: cycle.id })
        .where(
          and(eq(cycleObservations.patientId, patientId), eq(cycleObservations.id, observation.id)),
        );
  }
  return refreshState(tx, patientId, now);
}

async function refreshState(tx: Transaction, patientId: string, now: Date) {
  const observations = await tx
    .select()
    .from(cycleObservations)
    .where(eq(cycleObservations.patientId, patientId));
  const cycles = await tx
    .select()
    .from(menstrualCycles)
    .where(eq(menstrualCycles.patientId, patientId))
    .orderBy(asc(menstrualCycles.startedAt));
  const [profile] = await tx
    .select()
    .from(patientCycleProfiles)
    .where(eq(patientCycleProfiles.patientId, patientId));
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
    const [row] = await tx
      .select()
      .from(cycleObservations)
      .where(
        and(eq(cycleObservations.patientId, patientId), eq(cycleObservations.id, created!.id)),
      );
    return row;
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
    const [row] = await tx
      .select()
      .from(cycleObservations)
      .where(and(eq(cycleObservations.patientId, patientId), eq(cycleObservations.id, id)));
    return row;
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
